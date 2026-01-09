"use client";

import { useState, useCallback } from "react";
import { sendMessage } from "./api-client";
import type { Message, ChatState } from "./types";

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    conversationId: null,
  });

  const addMessage = useCallback((message: Omit<Message, "id" | "timestamp">) => {
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
  }, []);

  const sendChatMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isLoading) return;

      const userMessage = addMessage({
        role: "user",
        content: content.trim(),
      });

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const history = state.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await sendMessage(
          content.trim(),
          state.conversationId || undefined,
          history
        );

        addMessage({
          role: "assistant",
          content: response.message,
        });

        setState((prev) => ({
          ...prev,
          conversationId: response.conversationId,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to send message";
        addMessage({
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
    [state.messages, state.conversationId, state.isLoading, addMessage]
  );

  const clearChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null,
      conversationId: null,
    });
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage: sendChatMessage,
    clearChat,
  };
}



