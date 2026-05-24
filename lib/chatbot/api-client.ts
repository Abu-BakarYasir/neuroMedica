import { createClient } from "@/lib/supabase/client";
import type { ChatRequest, ChatResponse, ChatApiError, CitationItem } from "./types";

export interface StreamCallbacks {
  onMeta?: (meta: {
    conversation_id?: string;
    citations?: CitationItem[];
    confidence?: string;
    disclaimer?: string;
  }) => void;
  onDelta?: (text: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

export interface StreamFinalState {
  fullText: string;
  conversationId: string;
  citations?: CitationItem[];
  confidence?: string;
  disclaimer?: string;
}

/** FastAPI returns snake_case; normalize to our ChatResponse shape */
function normalizeChatResponse(raw: Record<string, unknown>): ChatResponse {
  const cid = raw.conversation_id ?? raw.conversationId;
  const citationsRaw = raw.citations;
  let citations: CitationItem[] | undefined;
  if (Array.isArray(citationsRaw)) {
    citations = citationsRaw.map((c: Record<string, unknown>) => ({
      index: Number(c.index) || 0,
      pmid: String(c.pmid ?? ""),
      source_type: (c.source_type as CitationItem["source_type"]) ?? "pubmed",
      title: String(c.title ?? ""),
      journal: c.journal != null ? String(c.journal) : undefined,
      doi: c.doi != null ? String(c.doi) : null,
      url: c.url != null ? String(c.url) : null,
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

function normalizeCitations(raw: unknown): CitationItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((c: Record<string, unknown>) => ({
    index: Number(c.index) || 0,
    pmid: String(c.pmid ?? ""),
    source_type: (c.source_type as CitationItem["source_type"]) ?? "pubmed",
    title: String(c.title ?? ""),
    journal: c.journal != null ? String(c.journal) : undefined,
    doi: c.doi != null ? String(c.doi) : null,
    url: c.url != null ? String(c.url) : null,
  }));
}

/**
 * Stream a chat reply token-by-token via SSE. Calls back as deltas arrive
 * and resolves with the final aggregate when the stream closes.
 */
export async function sendMessageStreaming(
  message: string,
  conversationId: string | undefined,
  history: Array<{ role: string; content: string }> | undefined,
  useRag: boolean | undefined,
  callbacks: StreamCallbacks
): Promise<StreamFinalState> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Authentication required");
  }

  const response = await fetch("/api/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      message,
      conversationId,
      history: history?.map((m) => ({ role: m.role, content: m.content })),
      useRag: Boolean(useRag),
    } as ChatRequest),
  });

  if (!response.ok || !response.body) {
    const err: ChatApiError = await response.json().catch(() => ({
      message: "Stream failed",
      status: response.status,
    }));
    throw new Error(err.message || "Stream failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let fullText = "";
  let finalConvId = conversationId || "";
  let finalCitations: CitationItem[] | undefined;
  let finalConfidence: string | undefined;
  let finalDisclaimer: string | undefined;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE messages are separated by \n\n
    let sepIdx: number;
    while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, sepIdx);
      buffer = buffer.slice(sepIdx + 2);
      if (!raw.startsWith("data:")) continue;
      const json = raw.slice(5).trim();
      if (!json) continue;

      let event: Record<string, unknown>;
      try {
        event = JSON.parse(json);
      } catch {
        continue;
      }

      const type = event.type;
      if (type === "meta") {
        if (typeof event.conversation_id === "string") {
          finalConvId = event.conversation_id;
        }
        const cits = normalizeCitations(event.citations);
        if (cits) finalCitations = cits;
        if (typeof event.confidence === "string")
          finalConfidence = event.confidence;
        if (typeof event.disclaimer === "string")
          finalDisclaimer = event.disclaimer;
        callbacks.onMeta?.({
          conversation_id: finalConvId,
          citations: finalCitations,
          confidence: finalConfidence,
          disclaimer: finalDisclaimer,
        });
      } else if (type === "delta") {
        const text = String(event.text ?? "");
        if (text) {
          fullText += text;
          callbacks.onDelta?.(text);
        }
      } else if (type === "done") {
        callbacks.onDone?.();
      } else if (type === "error") {
        const msg = String(event.message ?? "stream error");
        callbacks.onError?.(msg);
        throw new Error(msg);
      }
    }
  }

  return {
    fullText,
    conversationId: finalConvId,
    citations: finalCitations,
    confidence: finalConfidence,
    disclaimer: finalDisclaimer,
  };
}
