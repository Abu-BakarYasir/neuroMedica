"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface ChatbotInputBarProps {
  onExpand: () => void;
  isExpanded: boolean;
  onSend?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatbotInputBar({
  onExpand,
  isExpanded,
  onSend,
  placeholder = "What are you looking for today?",
  disabled = false,
}: ChatbotInputBarProps) {
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState("User");
  const [cost, setCost] = useState(1.0);

  useEffect(() => {
    const getUserInfo = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User";
        setUserName(name);
      }
    };
    getUserInfo();
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && onSend && !disabled) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && onSend && !disabled) {
        onSend(message);
        setMessage("");
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-2px_8px_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden relative bg-gradient-to-br from-purple-400 to-purple-600">
            <Image
              src="/assets/icons/Memoji Boys 2-21.png"
              alt="User Avatar"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Name and Input Container */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground truncate">
                {userName}
              </span>
              <span className="flex-shrink-0 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                AI
              </span>
            </div>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="border-0 bg-transparent px-0 py-0.5 h-auto text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground font-normal"
            />
          </div>

          {/* Expand/Collapse Button */}
          <button
            type="button"
            onClick={onExpand}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
            aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </form>

        {/* Cost Counter */}
        <div className="mt-2 ml-[52px]">
          <div className="bg-muted rounded-md px-2.5 py-1 inline-block">
            <span className="text-xs text-muted-foreground font-medium">
              {cost.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

