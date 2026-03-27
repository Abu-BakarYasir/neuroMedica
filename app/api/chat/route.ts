import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Agent } from "undici";

const BACKEND_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000";

/** RAG can exceed Node's default ~5min Undici headers timeout (model load + Qdrant + LLM). */
const BACKEND_FETCH_AGENT = new Agent({
  headersTimeout: 25 * 60 * 1000,
  bodyTimeout: 25 * 60 * 1000,
  connectTimeout: 120_000,
});

export const maxDuration = 900;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, conversationId, history, useRag } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        history: history || [],
        use_rag: Boolean(useRag),
      }),
      dispatcher: BACKEND_FETCH_AGENT,
    } as RequestInit);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: "Backend request failed",
      }));
      // FastAPI returns errors as { detail: "..." }
      return NextResponse.json(
        { error: error.detail || error.message || "Failed to get response" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}




