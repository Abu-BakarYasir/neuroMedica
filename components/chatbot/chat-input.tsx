"use client";

import { useState, KeyboardEvent } from "react";
import { Send, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  useRag?: boolean;
  onUseRagChange?: (value: boolean) => void;
}

export function ChatInput({
  onSend,
  isLoading = false,
  disabled = false,
  useRag = false,
  onUseRagChange,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {onUseRagChange && (
        <div className="flex items-start gap-2 mb-3 px-0.5">
          <Checkbox
            id="use-rag-chat"
            checked={useRag}
            onCheckedChange={(v) => onUseRagChange(v === true)}
            disabled={isLoading || disabled}
            className="mt-0.5 border-neuro-primary data-[state=checked]:bg-neuro-primary data-[state=checked]:text-white"
          />
          <div className="flex-1 min-w-0">
            <Label
              htmlFor="use-rag-chat"
              className="text-sm font-medium text-gray-800 cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-neuro-primary shrink-0" />
              Evidence-based answers (RAG)
            </Label>
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">
              Uses PubMed-indexed sources when available; response may include citations and
              confidence.
            </p>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isLoading || disabled}
          className="flex-1 rounded-lg"
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading || disabled}
          size="icon"
          className="rounded-lg bg-neuro-primary hover:bg-neuro-primary/90"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Med Assistant may make mistakes. Please verify important information.
      </p>
    </div>
  );
}





