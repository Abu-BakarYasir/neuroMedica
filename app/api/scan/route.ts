import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
// Groq's free multimodal model — reads images, no GPU on our side.
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const PROMPT = `You are a medical OCR assistant. Read this prescription image and extract the patient's information. Return ONLY a JSON object — no prose, no markdown fences — with exactly this shape:
{
  "patient_name": "<full patient name, or empty string>",
  "date": "<prescription date as YYYY-MM-DD if readable, else empty string>",
  "medications": [
    {"medicine_name": "<drug name>", "dosage": "<e.g. 500mg>", "frequency": "<e.g. TID / twice daily>"}
  ]
}
If the image is not a prescription or is unreadable, return the object with an empty "patient_name" and an empty "medications" array. Never invent data.`;

/** Pull a JSON object out of the model's reply, tolerating ```json fences. */
function parseJson(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  const braced = text.match(/\{[\s\S]*\}/);
  const raw = fenced ? fenced[1] : braced ? braced[0] : text;
  return JSON.parse(raw);
}

/** Coerce the model output into the exact shape the dashboard expects. */
function normalize(data: Record<string, any>) {
  const medsIn = Array.isArray(data?.medications) ? data.medications : [];
  const medications = medsIn
    .map((m: any) => ({
      medicine_name: String(m?.medicine_name ?? m?.name ?? "").trim(),
      dosage: String(m?.dosage ?? "").trim(),
      frequency: String(m?.frequency ?? "").trim(),
    }))
    .filter((m: { medicine_name: string }) => m.medicine_name.length > 0);
  return {
    patient_name: String(data?.patient_name ?? "").trim(),
    date: String(data?.date ?? "").trim(),
    medications,
  };
}

/**
 * Prescription scanning. Calls Groq's vision model directly (no Python backend),
 * extracts patient name / date / medications, and returns them for review.
 * Does NOT write to the DB — the dashboard inserts the row after the doctor edits.
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

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Scanning is not configured (missing GROQ_API_KEY)." },
        { status: 503 },
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json(
        { error: "No image provided." },
        { status: 400 },
      );
    }
    if (file.type && !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Uploaded file is not an image. Upload a photo of the prescription." },
        { status: 400 },
      );
    }

    // Encode the image as a base64 data URL for the vision model.
    const bytes = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    const dataUrl = `data:${mime};base64,${bytes.toString("base64")}`;

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
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

    if (!groqRes.ok) {
      const detail = await groqRes.text().catch(() => "");
      console.error("Groq scan error:", groqRes.status, detail.slice(0, 500));
      return NextResponse.json(
        {
          error:
            groqRes.status === 413
              ? "Image is too large. Please upload a smaller photo."
              : "The AI scanning service failed. Please try again.",
        },
        { status: 502 },
      );
    }

    const completion = await groqRes.json();
    const content: string =
      completion?.choices?.[0]?.message?.content ?? "";

    let parsed: Record<string, unknown>;
    try {
      parsed = parseJson(content);
    } catch {
      console.error("Could not parse scan JSON:", content.slice(0, 500));
      return NextResponse.json(
        { error: "The AI scanning service returned an unreadable result." },
        { status: 502 },
      );
    }

    return NextResponse.json({ data: normalize(parsed as Record<string, any>) });
  } catch (error) {
    console.error("Scan route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
