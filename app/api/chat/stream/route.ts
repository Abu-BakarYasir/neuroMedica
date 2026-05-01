import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Agent } from "undici";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000";

const BACKEND_FETCH_AGENT = new Agent({
  headersTimeout: 25 * 60 * 1000,
  bodyTimeout: 25 * 60 * 1000,
  connectTimeout: 120_000,
});

export const maxDuration = 900;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

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

  const upstream = await fetch(`${BACKEND_URL}/api/chat/stream`, {
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

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      { error: text || "Backend stream failed" },
      { status: upstream.status }
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
