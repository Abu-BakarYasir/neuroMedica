import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
// Groq's free multimodal model — primary OCR path.
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Claude vision — fallback when Groq is unavailable or fails.
const CLAUDE_MODEL = "claude-opus-4-8";

const PROMPT = `You are a medical OCR assistant. Read this prescription image and extract the patient's information. Return ONLY a JSON object — no prose, no markdown fences — with exactly this shape:
{
  "patient_name": "<full patient name, or empty string>",
  "date": "<prescription date as YYYY-MM-DD if readable, else empty string>",
  "medications": [
    {"medicine_name": "<drug name>", "dosage": "<e.g. 500mg>", "frequency": "<e.g. TID / twice daily>"}
  ]
}
If the image is not a prescription or is unreadable, return the object with an empty "patient_name" and an empty "medications" array. Never invent data.`;

const SUPPORTED_MEDIA = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/** Pull a JSON object out of the model's reply, tolerating ```json fences. */
function parseJson(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  const braced = text.match(/\{[\s\S]*\}/);
  const raw = fenced ? fenced[1] : braced ? braced[0] : text;
  return JSON.parse(raw);
}

/** Coerce the model output into the exact shape the dashboard expects. */
function normalize(data: Record<string, unknown>) {
  const medsIn = Array.isArray(data?.medications) ? data.medications : [];
  const medications = medsIn
    .map((entry: unknown) => {
      const m = (entry ?? {}) as Record<string, unknown>;
      return {
        medicine_name: String(m.medicine_name ?? m.name ?? "").trim(),
        dosage: String(m.dosage ?? "").trim(),
        frequency: String(m.frequency ?? "").trim(),
      };
    })
    .filter((m) => m.medicine_name.length > 0);
  return {
    patient_name: String(data?.patient_name ?? "").trim(),
    date: String(data?.date ?? "").trim(),
    medications,
  };
}

/** Primary path: Groq Llama 4 vision. Throws on any failure so we can fall back. */
async function extractWithGroq(dataUrl: string): Promise<Record<string, unknown>> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      temperature: 0,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${detail.slice(0, 300)}`);
  }
  const completion = await res.json();
  const content: string = completion?.choices?.[0]?.message?.content ?? "";
  return parseJson(content);
}

/** Fallback path: Claude vision via the Anthropic SDK. Throws on failure. */
async function extractWithClaude(
  base64: string,
  mediaType: string,
): Promise<Record<string, unknown>> {
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as
                | "image/jpeg"
                | "image/png"
                | "image/gif"
                | "image/webp",
              data: base64,
            },
          },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });
  const textBlock = message.content.find((b) => b.type === "text");
  const content = textBlock && textBlock.type === "text" ? textBlock.text : "";
  return parseJson(content);
}

/**
 * Prescription scanning. Tries Groq's vision model first, then falls back to
 * Claude vision if Groq is unavailable or fails. Extracts patient name / date /
 * medications and returns them for review. Does NOT write to the DB — the
 * dashboard inserts the row after the doctor edits the extracted fields.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!GROQ_API_KEY && !ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Scanning is not configured (no GROQ_API_KEY or ANTHROPIC_API_KEY)." },
        { status: 503 },
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }
    if (file.type && !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Uploaded file is not an image. Upload a photo of the prescription." },
        { status: 400 },
      );
    }

    // Encode the image once for both providers.
    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString("base64");
    const mediaType = SUPPORTED_MEDIA.includes(file.type) ? file.type : "image/jpeg";
    const dataUrl = `data:${mediaType};base64,${base64}`;

    let parsed: Record<string, unknown> | null = null;

    // 1) Primary: Groq.
    if (GROQ_API_KEY) {
      try {
        parsed = await extractWithGroq(dataUrl);
      } catch (e) {
        console.error("Groq scan failed, falling back to Claude:", e);
      }
    }

    // 2) Fallback: Claude vision.
    if (!parsed && ANTHROPIC_API_KEY) {
      try {
        parsed = await extractWithClaude(base64, mediaType);
      } catch (e) {
        console.error("Claude scan fallback failed:", e);
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: "The AI scanning service failed. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ data: normalize(parsed) });
  } catch (error) {
    console.error("Prescription scan route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
