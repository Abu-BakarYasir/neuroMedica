import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Agent } from "undici";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000";

/** RAG + LLM can exceed Node's default Undici timeouts on a cold start. */
const BACKEND_FETCH_AGENT = new Agent({
  headersTimeout: 25 * 60 * 1000,
  bodyTimeout: 25 * 60 * 1000,
  connectTimeout: 120_000,
});

export const maxDuration = 900;

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

    const body = await request.json();
    const { symptoms } = body;
    if (!symptoms || typeof symptoms !== "string") {
      return NextResponse.json(
        { error: "Symptoms are required" },
        { status: 400 },
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/symptoms/explore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ symptoms }),
      dispatcher: BACKEND_FETCH_AGENT,
    } as RequestInit);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Backend request failed" }));
      return NextResponse.json(
        { error: error.detail || error.message || "Failed to analyze symptoms" },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("Symptom explore API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
