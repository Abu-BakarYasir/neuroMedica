import { createClient } from "@/lib/supabase/client";
import type { CitationItem } from "@/lib/chatbot/types";
import type { Differential, SymptomExploreResponse } from "./types";

export async function exploreSymptoms(
  symptoms: string,
): Promise<SymptomExploreResponse> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Authentication required");

  const res = await fetch("/api/symptoms/explore", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ symptoms }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return (await res.json()) as SymptomExploreResponse;
}

/** Citations + confidence, available the moment retrieval completes. */
export interface SymptomMeta {
  citations: CitationItem[];
  confidence: string;
  disclaimer: string;
}

/** The structured differential, available once generation completes. */
export interface SymptomResult {
  symptoms: string;
  differentials: Differential[];
  summary: string;
  recommended_workup: string[];
  structured: boolean;
}

export interface SymptomStreamHandlers {
  /** Fired once, as soon as retrieval finishes — render source cards early. */
  onMeta?: (meta: SymptomMeta) => void;
  /** Fired once, when the differential is ready. */
  onResult?: (result: SymptomResult) => void;
}

/**
 * Streaming variant of {@link exploreSymptoms}. Consumes the SSE response so
 * citations + confidence render seconds before the differential lands.
 * Resolves when the stream ends; rejects on transport/backend error.
 */
export async function exploreSymptomsStream(
  symptoms: string,
  handlers: SymptomStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Authentication required");

  const res = await fetch("/api/symptoms/explore/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ symptoms }),
    signal,
  });

  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const dispatch = (raw: string) => {
    const line = raw.trim();
    if (!line.startsWith("data:")) return;
    const json = line.slice(5).trim();
    if (!json) return;
    let event: { type?: string; message?: string } & Record<string, unknown>;
    try {
      event = JSON.parse(json);
    } catch {
      return; // ignore malformed frame
    }
    switch (event.type) {
      case "meta":
        handlers.onMeta?.({
          citations: (event.citations as CitationItem[]) ?? [],
          confidence: (event.confidence as string) ?? "medium",
          disclaimer: (event.disclaimer as string) ?? "",
        });
        break;
      case "result":
        handlers.onResult?.({
          symptoms: (event.symptoms as string) ?? symptoms,
          differentials: (event.differentials as Differential[]) ?? [],
          summary: (event.summary as string) ?? "",
          recommended_workup: (event.recommended_workup as string[]) ?? [],
          structured: (event.structured as boolean) ?? true,
        });
        break;
      case "error":
        throw new Error(event.message || "Could not analyze these symptoms.");
    }
  };

  // SSE frames are separated by a blank line (\n\n).
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      dispatch(frame);
    }
  }
  if (buffer.trim()) dispatch(buffer);
}
