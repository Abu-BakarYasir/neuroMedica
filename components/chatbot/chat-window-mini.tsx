"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendMessage } from "@/lib/chatbot/api-client";
import { answerGuestMessage } from "@/lib/chatbot/guest";
import type { Message } from "@/lib/chatbot/types";

interface ChatWindowMiniProps {
  onClose: () => void;
  /**
   * When false (logged-out landing-page visitor) the window answers general
   * product questions locally and gates clinical questions behind sign-in,
   * instead of calling the auth-only backend.
   */
  isAuthenticated?: boolean;
}

/**
 * Lightweight self-contained chat window for the floating widget.
 * Messages are ephemeral (not persisted to DB).
 */
export function ChatWindowMini({
  onClose,
  isAuthenticated = true,
}: ChatWindowMiniProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useRag, setUseRag] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Logged-out visitors: answer general product questions locally and ask
      // them to sign in for anything clinical. Never hits the auth-only backend.
      if (!isAuthenticated) {
        const reply = answerGuestMessage(content.trim());
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: reply.content,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      try {
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const response = await sendMessage(
          content.trim(),
          conversationId || undefined,
          history,
          useRag
        );

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.message,
          timestamp: new Date(),
          usedRag: useRag,
          citations: response.citations,
          confidence: response.confidence,
          disclaimer: response.disclaimer,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setConversationId(response.conversationId);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date(),
            error: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, conversationId, useRag, isAuthenticated]
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[hsl(var(--surface-card))] rounded-lg overflow-hidden">
      {/* Mini header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neuro-primary to-neuro-primary-dark flex items-center justify-center">
            <span className="text-white text-xs font-semibold">MA</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-neutral-100">
              Med Assistant
            </h3>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7"
        >
          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-neutral-300" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              {isAuthenticated
                ? "How can I help you today?"
                : "Ask me about Neuro Medica — what it is, what it does, and how to get started."}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3 p-4 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neuro-primary/20 to-neuro-primary/10 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-neuro-primary animate-spin" />
                </div>
                <div className="bg-gray-100 dark:bg-white/10 rounded-lg px-4 py-2.5">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        useRag={useRag}
        onUseRagChange={isAuthenticated ? setUseRag : undefined}
        showAttachments={isAuthenticated}
      />
    </div>
  );
}
