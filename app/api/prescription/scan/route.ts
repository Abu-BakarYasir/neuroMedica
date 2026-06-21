import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Agent } from "undici";

/** The vision model on Colab can be slow on a cold start. */
const SCAN_FETCH_AGENT = new Agent({
  headersTimeout: 5 * 60 * 1000,
  bodyTimeout: 5 * 60 * 1000,
  connectTimeout: 60_000,
});

export const maxDuration = 300;

/**
 * Server-side proxy for the Colab/ngrok prescription scanner.
 *
 * The scan used to be called straight from the browser, which fails on the
 * ngrok free tier: the browser is subject to CORS (Colab's FastAPI must echo
 * Access-Control-Allow-Origin) and to ngrok's HTML interstitial on the CORS
 * preflight. Proxying server-to-server sidesteps both — there is no CORS and
 * no browser warning page for a server fetch carrying the skip header.
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

    // Resolve the current tunnel URL server-side (never trust a client value).
    const { data: configData, error: configError } = await supabase
      .from("system_config")
      .select("ngrok_url")
      .eq("id", 1)
      .single();

    if (
      configError ||
      !configData?.ngrok_url ||
      configData.ngrok_url === "waiting_for_colab"
    ) {
      return NextResponse.json(
        {
          error:
            "The AI processing server is currently offline. Please start the Colab notebook.",
        },
        { status: 503 },
      );
    }

    const base = String(configData.ngrok_url).trim().replace(/\/+$/, "");
    const scanUrl = base + (base.endsWith("/scan") ? "/" : "/scan/");

    // Forward the multipart body as-is (file + doctor_id) to Colab.
    const form = await request.formData();
    // Make sure a doctor id is present even if the client omitted it.
    if (!form.get("doctor_id")) {
      form.append("doctor_id", session.user.id);
    }

    let response: Response;
    try {
      response = await fetch(scanUrl, {
        method: "POST",
        body: form,
        headers: {
          // Bypass ngrok's free-tier browser interstitial. A non-browser
          // User-Agent is belt-and-suspenders for the same purpose.
          "ngrok-skip-browser-warning": "true",
          "User-Agent": "neuroMedica-scan-proxy",
        },
        dispatcher: SCAN_FETCH_AGENT,
      } as RequestInit & { dispatcher?: Agent });
    } catch {
      return NextResponse.json(
        {
          error:
            "Couldn't reach the AI scanning server. The Colab notebook may be stopped or its tunnel URL is out of date — restart it and refresh the saved URL.",
        },
        { status: 502 },
      );
    }

    if (!response.ok) {
      // Surface Colab's actual error so failures are diagnosable instead of
      // a generic "failed to process". FastAPI errors come back as
      // { detail: ... }; fall back to raw text for anything else.
      const rawBody = await response.text().catch(() => "");
      let detail = rawBody;
      try {
        const parsed = JSON.parse(rawBody);
        detail =
          typeof parsed?.detail === "string"
            ? parsed.detail
            : JSON.stringify(parsed?.detail ?? parsed);
      } catch {
        // not JSON — keep rawBody
      }
      console.error(
        `Prescription scan: Colab returned ${response.status}:`,
        detail?.slice?.(0, 1000) ?? detail,
      );
      return NextResponse.json(
        {
          error:
            `The AI server couldn't process the document (HTTP ${response.status})` +
            (detail ? `: ${String(detail).slice(0, 300)}` : "."),
        },
        { status: response.status },
      );
    }

    // Pass the scanner's JSON straight through ({ data: { ... } }).
    const result = await response.json().catch(() => null);
    if (!result || typeof result !== "object") {
      return NextResponse.json(
        { error: "The AI server returned an unexpected response." },
        { status: 502 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Prescription scan proxy error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
