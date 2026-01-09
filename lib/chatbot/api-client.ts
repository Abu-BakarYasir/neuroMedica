import { createClient } from "@/lib/supabase/client";
import type { ChatRequest, ChatResponse, ChatApiError } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8000";

export async function sendMessage(
  message: string,
  conversationId?: string,
  history?: Array<{ role: string; content: string }>
): Promise<ChatResponse> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Authentication required");
  }

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      message,
      conversationId,
      history: history?.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    } as ChatRequest),
  });

  if (!response.ok) {
    const error: ChatApiError = await response.json().catch(() => ({
      message: "Failed to send message",
      status: response.status,
    }));
    throw new Error(error.message || "Failed to send message");
  }

  const data: ChatResponse = await response.json();
  return data;
}



