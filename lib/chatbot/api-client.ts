import { createClient } from "@/lib/supabase/client";
import type { ChatRequest, ChatResponse, ChatApiError, CitationItem } from "./types";

/** FastAPI returns snake_case; normalize to our ChatResponse shape */
function normalizeChatResponse(raw: Record<string, unknown>): ChatResponse {
  const cid = raw.conversation_id ?? raw.conversationId;
  const citationsRaw = raw.citations;
  let citations: CitationItem[] | undefined;
  if (Array.isArray(citationsRaw)) {
    citations = citationsRaw.map((c: Record<string, unknown>) => ({
      index: Number(c.index) || 0,
      pmid: String(c.pmid ?? ""),
      title: String(c.title ?? ""),
      journal: c.journal != null ? String(c.journal) : undefined,
      doi: c.doi != null ? String(c.doi) : null,
    }));
  }

  return {
    message: String(raw.message ?? ""),
    conversationId: typeof cid === "string" ? cid : String(cid ?? ""),
    citations,
    confidence:
      raw.confidence != null && raw.confidence !== ""
        ? String(raw.confidence)
        : undefined,
    disclaimer:
      raw.disclaimer != null && raw.disclaimer !== ""
        ? String(raw.disclaimer)
        : undefined,
  };
}

export async function sendMessage(
  message: string,
  conversationId?: string,
  history?: Array<{ role: string; content: string }>,
  useRag?: boolean
): Promise<ChatResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

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
      useRag: Boolean(useRag),
    } as ChatRequest),
  });

  if (!response.ok) {
    const error: ChatApiError = await response.json().catch(() => ({
      message: "Failed to send message",
      status: response.status,
    }));
    throw new Error(error.message || "Failed to send message");
  }

  const raw: Record<string, unknown> = await response.json();
  return normalizeChatResponse(raw);
}
