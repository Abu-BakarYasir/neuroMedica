"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatbotHeader } from "./chatbot-header";
import { Loader2 } from "lucide-react";
import { useChat } from "@/lib/chatbot/hooks";

interface ChatWindowProps {
  onExpand?: () => void;
  onClose?: () => void;
  showExpandButton?: boolean;
  showInput?: boolean;
  showCloseButton?: boolean;
}

export function ChatWindow({ 
  onExpand,
  onClose, 
  showExpandButton = true, 
  showInput = true,
  showCloseButton = false 
}: ChatWindowProps) {
  const { messages, isLoading, sendMessage, useRag, setUseRag } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden">
      <ChatbotHeader 
        onExpand={onExpand}
        onClose={onClose}
        showExpandButton={showExpandButton}
        showCloseButton={showCloseButton}
      />
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
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
              I'm here to help you with medical questions, information, and assistance.
              How can I help you today?
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
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      {showInput && (
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          useRag={useRag}
          onUseRagChange={setUseRag}
        />
      )}
    </div>
  );
}


