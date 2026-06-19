"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatbotHeader } from "./chatbot-header";
import { Loader2, Sparkles } from "lucide-react";
import type { Message } from "@/lib/chatbot/types";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  isLoadingHistory?: boolean;
  useRag: boolean;
  onSendMessage: (content: string) => void;
  onUseRagChange: (value: boolean) => void;
  onToggleSidebar?: () => void;
  showInput?: boolean;
}

export function ChatWindow({
  messages,
  isLoading,
  isLoadingHistory = false,
  useRag,
  onSendMessage,
  onUseRagChange,
  onToggleSidebar,
  showInput = true,
}: ChatWindowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [followBottom, setFollowBottom] = useState(true);
  const lastMessageCountRef = useRef(0);
  const lastUserMessageCountRef = useRef(0);

  // Suggestion clicks fill the composer (don't auto-send) so doctors can edit.
  const [inputPrefill, setInputPrefill] = useState<
    { text: string; nonce: number } | undefined
  >(undefined);
  const prefillNonceRef = useRef(0);
  const fillInput = (text: string) => {
    prefillNonceRef.current += 1;
    setInputPrefill({ text, nonce: prefillNonceRef.current });
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const prevTotal = lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    const userCount = messages.filter((m) => m.role === "user").length;
    const userJustSent = userCount > lastUserMessageCountRef.current;
    lastUserMessageCountRef.current = userCount;

    const isInitialLoad = prevTotal === 0 && messages.length > 0;
    if (isInitialLoad || userJustSent) {
      el.scrollTop = el.scrollHeight;
      setFollowBottom(true);
      return;
    }
    if (followBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, followBottom]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setFollowBottom(distanceFromBottom < 80);
  };

  const suggestionPrompts = [
    "What are the latest guidelines for hypertension management?",
    "Summarize evidence for SGLT2 inhibitors in heart failure.",
    "Differential diagnosis for chronic fatigue in adults.",
    "First-line antibiotics for community-acquired pneumonia.",
  ];

  return (
    <div className="flex flex-col h-full">
      <ChatbotHeader onToggleSidebar={onToggleSidebar} />

      {/* Scrollable conversation area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto"
      >
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-neuro-primary animate-spin" />
            <p className="text-sm text-muted-foreground mt-2">
              Loading conversation...
            </p>
          </div>
        ) : messages.length === 0 ? (
          // Empty state — centered welcome with prompt suggestions
          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neuro-primary to-neuro-primary-dark flex items-center justify-center mx-auto mb-5 shadow-lg shadow-neuro-primary/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2 tracking-tight">
                How can I help you today?
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Ask about clinical guidelines, differentials, drug interactions, or recent evidence.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                {suggestionPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => fillInput(prompt)}
                    className="group rounded-xl border border-border bg-card hover:bg-muted/60 hover:border-neuro-primary/40 px-4 py-3 text-sm text-foreground transition-all text-left"
                  >
                    <span className="line-clamp-2">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Messages — centered column matching the input width
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6">
            <div className="space-y-2">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex gap-3 py-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neuro-primary to-neuro-primary-dark flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex items-center gap-1 pt-2">
                    <span
                      className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating input — pinned to bottom, same max-width as messages */}
      {showInput && (
        <div className="shrink-0 bg-gradient-to-t from-background via-background to-background/0 pb-3 pt-2">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <ChatInput
              onSend={onSendMessage}
              isLoading={isLoading}
              useRag={useRag}
              onUseRagChange={onUseRagChange}
              prefill={inputPrefill}
            />
          </div>
        </div>
      )}
    </div>
  );
}
