import { createClient } from "@/lib/supabase/client";
import type { Conversation, DbMessage, CitationItem } from "./types";

const supabase = () => createClient();

// ── Conversations ──

export async function createConversation(
  title = "New Chat"
): Promise<Conversation> {
  const client = supabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await client
    .from("conversations")
    .insert({ user_id: user.id, title })
    .select()
    .single();

  if (error) throw error;
  return data as Conversation;
}

export async function listConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase()
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data as Conversation[]) || [];
}

export async function updateConversationTitle(
  id: string,
  title: string
): Promise<void> {
  const { error } = await supabase()
    .from("conversations")
    .update({ title })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase()
    .from("conversations")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ── Messages ──

export async function loadMessages(
  conversationId: string
): Promise<DbMessage[]> {
  const { data, error } = await supabase()
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as DbMessage[]) || [];
}

export async function saveMessage(
  conversationId: string,
  role: string,
  content: string,
  extra?: {
    used_rag?: boolean;
    citations?: CitationItem[];
    confidence?: string;
    disclaimer?: string;
  }
): Promise<DbMessage> {
  const { data, error } = await supabase()
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      used_rag: extra?.used_rag ?? false,
      citations: extra?.citations ?? null,
      confidence: extra?.confidence ?? null,
      disclaimer: extra?.disclaimer ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DbMessage;
}

// ── Search ──

export async function searchConversations(
  query: string
): Promise<Conversation[]> {
  const client = supabase();

  // Search by title match
  const { data: titleMatches, error: titleErr } = await client
    .from("conversations")
    .select("*")
    .ilike("title", `%${query}%`)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (titleErr) throw titleErr;

  // Search by message content (full-text)
  const { data: contentMatches, error: contentErr } = await client
    .from("messages")
    .select("conversation_id")
    .textSearch("content", query, { type: "websearch" })
    .limit(50);

  if (contentErr) {
    // Fallback to ilike if full-text search fails
    const { data: fallback } = await client
      .from("messages")
      .select("conversation_id")
      .ilike("content", `%${query}%`)
      .limit(50);

    const contentIds = new Set(
      (fallback || []).map((m: { conversation_id: string }) => m.conversation_id)
    );
    const titleIds = new Set((titleMatches || []).map((c) => c.id));

    // Fetch conversations for content matches not already in title results
    const extraIds = [...contentIds].filter((id) => !titleIds.has(id));
    if (extraIds.length > 0) {
      const { data: extra } = await client
        .from("conversations")
        .select("*")
        .in("id", extraIds)
        .order("updated_at", { ascending: false });

      return [...(titleMatches || []), ...(extra || [])] as Conversation[];
    }
    return (titleMatches || []) as Conversation[];
  }

  const contentIds = new Set(
    (contentMatches || []).map(
      (m: { conversation_id: string }) => m.conversation_id
    )
  );
  const titleIds = new Set((titleMatches || []).map((c) => c.id));
  const extraIds = [...contentIds].filter((id) => !titleIds.has(id));

  if (extraIds.length > 0) {
    const { data: extra } = await client
      .from("conversations")
      .select("*")
      .in("id", extraIds)
      .order("updated_at", { ascending: false });

    return [...(titleMatches || []), ...(extra || [])] as Conversation[];
  }

  return (titleMatches || []) as Conversation[];
}

// ── Title generation ──

export async function generateTitle(
  conversationId: string,
  firstMessage: string
): Promise<string> {
  try {
    const res = await fetch("/api/chat/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: firstMessage }),
    });

    if (!res.ok) throw new Error("Title generation failed");

    const { title } = await res.json();
    if (title) {
      await updateConversationTitle(conversationId, title);
      return title;
    }
  } catch {
    // Fallback: use first 50 chars of message
    const fallback =
      firstMessage.length > 50
        ? firstMessage.slice(0, 50) + "..."
        : firstMessage;
    await updateConversationTitle(conversationId, fallback);
    return fallback;
  }

  return firstMessage.slice(0, 50);
}
