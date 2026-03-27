"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { sendMessage } from "./api-client";
import {
  loadMessages,
  saveMessage,
  generateTitle,
} from "./conversation-service";
import type { Message, ChatState, DbMessage } from "./types";

function dbToMessage(db: DbMessage): Message {
  return {
    id: db.id,
    role: db.role,
    content: db.content,
    timestamp: new Date(db.created_at),
    usedRag: db.used_rag || undefined,
    citations: db.citations || undefined,
    confidence: db.confidence || undefined,
    disclaimer: db.disclaimer || undefined,
  };
}

interface UseChatOptions {
  conversationId: string | null;
  onTitleGenerated?: (id: string, title: string) => void;
}

export function useChat({ conversationId, onTitleGenerated }: UseChatOptions) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    conversationId: null,
    useRag: false,
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const titleGeneratedRef = useRef<Set<string>>(new Set());

  // Load messages when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setState((prev) => ({
        ...prev,
        messages: [],
        conversationId: null,
        error: null,
      }));
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoadingHistory(true);
      try {
        const dbMessages = await loadMessages(conversationId!);
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          messages: dbMessages.map(dbToMessage),
          conversationId,
          error: null,
        }));
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load messages:", err);
        setState((prev) => ({
          ...prev,
          error: "Failed to load conversation",
        }));
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const addMessageLocal = useCallback(
    (message: Omit<Message, "id" | "timestamp">) => {
      const newMessage: Message = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, newMessage],
      }));
      return newMessage;
    },
    []
  );

  const sendChatMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isLoading || !conversationId) return;

      // Add user message to UI immediately
      const userMessage = addMessageLocal({
        role: "user",
        content: content.trim(),
      });

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      // Save user message to DB
      try {
        await saveMessage(conversationId, "user", content.trim());
      } catch (err) {
        console.error("Failed to save user message:", err);
      }

      try {
        const history = state.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const useRag = state.useRag;
        const response = await sendMessage(
          content.trim(),
          conversationId,
          history,
          useRag
        );

        // Add assistant message to UI
        addMessageLocal({
          role: "assistant",
          content: response.message,
          usedRag: useRag,
          citations: response.citations,
          confidence: response.confidence,
          disclaimer: response.disclaimer,
        });

        // Save assistant message to DB
        try {
          await saveMessage(conversationId, "assistant", response.message, {
            used_rag: useRag,
            citations: response.citations,
            confidence: response.confidence,
            disclaimer: response.disclaimer,
          });
        } catch (err) {
          console.error("Failed to save assistant message:", err);
        }

        setState((prev) => ({
          ...prev,
          conversationId,
          isLoading: false,
          error: null,
        }));

        // Generate title after first user message (only once per conversation)
        if (
          state.messages.length === 0 &&
          !titleGeneratedRef.current.has(conversationId)
        ) {
          titleGeneratedRef.current.add(conversationId);
          generateTitle(conversationId, content.trim()).then((title) => {
            onTitleGenerated?.(conversationId, title);
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to send message";
        addMessageLocal({
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          error: true,
        });
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    },
    [
      state.messages,
      state.isLoading,
      state.useRag,
      conversationId,
      addMessageLocal,
      onTitleGenerated,
    ]
  );

  const clearChat = useCallback(() => {
    setState((prev) => ({
      messages: [],
      isLoading: false,
      error: null,
      conversationId: null,
      useRag: prev.useRag,
    }));
  }, []);

  const setUseRag = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, useRag: value }));
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isLoadingHistory,
    error: state.error,
    useRag: state.useRag,
    setUseRag,
    sendMessage: sendChatMessage,
    clearChat,
  };
}
