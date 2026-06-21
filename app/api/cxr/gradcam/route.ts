import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Agent } from "undici";

const BACKEND_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000";

/** Grad-CAM runs a backward pass and can be slow on a cold start. */
const BACKEND_FETCH_AGENT = new Agent({
  headersTimeout: 5 * 60 * 1000,
  bodyTimeout: 5 * 60 * 1000,
  connectTimeout: 60_000,
});

export const maxDuration = 300;

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

    // Re-stream the multipart body to FastAPI so the file never lands on disk.
    const form = await request.formData();

    const response = await fetch(`${BACKEND_URL}/api/cxr/gradcam`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: form,
      dispatcher: BACKEND_FETCH_AGENT,
    } as RequestInit & { dispatcher?: Agent });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Backend request failed" }));
      return NextResponse.json(
        { error: error.detail || error.message || "Grad-CAM generation failed" },
        { status: response.status },
      );
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("CXR gradcam proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
