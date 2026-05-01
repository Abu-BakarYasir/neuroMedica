"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatbotHeader } from "./chatbot-header";
import { Loader2 } from "lucide-react";
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
  // Track whether to follow new messages. Flips off when the user scrolls
  // away from the bottom and back on when they return — so streaming deltas
  // don't yank them out of mid-conversation reading.
  const [followBottom, setFollowBottom] = useState(true);
  const lastMessageCountRef = useRef(0);
  const lastUserMessageCountRef = useRef(0);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const prevTotal = lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    const userCount = messages.filter((m) => m.role === "user").length;
    const userJustSent = userCount > lastUserMessageCountRef.current;
    lastUserMessageCountRef.current = userCount;

    // Loading a conversation OR the user just sent a message: jump to
    // bottom and re-engage follow mode.
    const isInitialLoad = prevTotal === 0 && messages.length > 0;
    if (isInitialLoad || userJustSent) {
      el.scrollTop = el.scrollHeight;
      setFollowBottom(true);
      return;
    }
    // Streaming deltas / assistant messages: only follow if the user is
    // already near the bottom; otherwise leave them where they're reading.
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

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden">
      <ChatbotHeader onToggleSidebar={onToggleSidebar} />
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto"
      >
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-neuro-primary animate-spin" />
            <p className="text-sm text-gray-500 mt-2">
              Loading conversation...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neuro-primary/20 to-neuro-primary/10 flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neuro-primary to-neuro-primary-dark flex items-center justify-center">
                <span className="text-white text-lg font-semibold">MA</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome to Med Assistant
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              I&apos;m here to help you with medical questions, information, and
              assistance. How can I help you today?
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
                <div className="bg-gray-100 rounded-lg px-4 py-2.5">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {showInput && (
        <ChatInput
          onSend={onSendMessage}
          isLoading={isLoading}
          useRag={useRag}
          onUseRagChange={onUseRagChange}
        />
      )}
    </div>
  );
}
