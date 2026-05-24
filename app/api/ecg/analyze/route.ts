import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Agent } from "undici";

const BACKEND_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000";

/** TF inference + R-peak detection on a long signal can be slow on cold start. */
const BACKEND_FETCH_AGENT = new Agent({
  headersTimeout: 5 * 60 * 1000,
  bodyTimeout: 5 * 60 * 1000,
  connectTimeout: 60_000,
});

export const maxDuration = 300;

async function forward(
  request: NextRequest,
  endpoint: string,
  forwardForm: boolean,
) {
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

  const init: RequestInit & { dispatcher?: Agent } = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    dispatcher: BACKEND_FETCH_AGENT,
  };

  if (forwardForm) {
    // Re-stream the multipart body to FastAPI so the file never lands on disk.
    const form = await request.formData();
    init.body = form;
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, init);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Backend request failed" }));
    return NextResponse.json(
      { error: error.detail || error.message || "ECG analysis failed" },
      { status: response.status },
    );
  }
  const data = await response.json();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const useSample = url.searchParams.get("sample") === "1";
    return await forward(
      request,
      useSample ? "/api/ecg/analyze-sample" : "/api/ecg/analyze",
      !useSample,
    );
  } catch (error) {
    console.error("ECG analyze proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
