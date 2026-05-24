"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ChatbotPreviewWidgetProps {
  onExpand: () => void;
  isExpanded: boolean;
}

export function ChatbotPreviewWidget({
  onExpand,
  isExpanded,
}: ChatbotPreviewWidgetProps) {
  const [userName, setUserName] = useState("User");
  const [cost] = useState(1.0);

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

  return (
    <div className="w-[380px] bg-white dark:bg-[hsl(var(--surface-card))] rounded-lg shadow-lg border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3">
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

          {/* Name and Input Placeholder Container */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-neutral-100 truncate">
                {userName}
              </span>
              <span className="flex-shrink-0 text-[10px] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-neutral-300 px-1.5 py-0.5 rounded font-medium">
                AI
              </span>
            </div>
            <div className="text-sm text-gray-400 dark:text-neutral-400 font-normal">
              What are you looking for today?
            </div>
          </div>

          {/* Expand Button */}
          <button
            type="button"
            onClick={onExpand}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            aria-label="Expand chat"
          >
            <ChevronUp className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
          </button>
        </div>
      </div>
    </div>
  );
}




