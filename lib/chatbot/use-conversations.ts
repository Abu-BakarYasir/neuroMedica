"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Conversation } from "./types";
import {
  listConversations,
  createConversation,
  deleteConversation,
  updateConversationTitle,
  searchConversations,
} from "./conversation-service";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    conversation: Conversation;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load conversations on mount
  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listConversations();
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Create new conversation and set it active
  const create = useCallback(async () => {
    try {
      const conv = await createConversation("New Chat");
      setConversations((prev) => [conv, ...prev]);
      setActiveId(conv.id);
      return conv;
    } catch (err) {
      console.error("Failed to create conversation:", err);
      return null;
    }
  }, []);

  // Select a conversation
  const select = useCallback((id: string | null) => {
    setActiveId(id);
  }, []);

  // Rename a conversation
  const rename = useCallback(async (id: string, title: string) => {
    try {
      await updateConversationTitle(id, title);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  }, []);

  // Delete with undo (5s grace period)
  const remove = useCallback(
    (id: string) => {
      const conversation = conversations.find((c) => c.id === id);
      if (!conversation) return;

      // If there's already a pending delete, execute it immediately
      if (pendingDelete) {
        clearTimeout(pendingDelete.timer);
        deleteConversation(pendingDelete.id).catch(console.error);
      }

      // Hide from list immediately
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) setActiveId(null);

      // Set timer for actual deletion
      const timer = setTimeout(() => {
        deleteConversation(id).catch(console.error);
        setPendingDelete(null);
      }, 5000);

      setPendingDelete({ id, conversation, timer });
    },
    [conversations, activeId, pendingDelete]
  );

  // Undo delete
  const undoDelete = useCallback(() => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timer);
    // Restore conversation to list
    setConversations((prev) => {
      const restored = [pendingDelete.conversation, ...prev];
      restored.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      return restored;
    });
    setPendingDelete(null);
  }, [pendingDelete]);

  // Search with debounce
  const search = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      if (!query.trim()) {
        load();
        return;
      }

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchConversations(query);
          setConversations(results);
        } catch (err) {
          console.error("Search failed:", err);
        }
      }, 300);
    },
    [load]
  );

  // Update conversation in local state (e.g., after title generation)
  const updateLocal = useCallback(
    (id: string, updates: Partial<Conversation>) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    []
  );

  return {
    conversations,
    activeId,
    isLoading,
    searchQuery,
    pendingDelete: pendingDelete
      ? { id: pendingDelete.id, title: pendingDelete.conversation.title }
      : null,
    create,
    select,
    rename,
    remove,
    undoDelete,
    search,
    updateLocal,
    reload: load,
  };
}
