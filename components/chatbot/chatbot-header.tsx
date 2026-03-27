"use client";

import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatbotHeaderProps {
  onToggleSidebar?: () => void;
}

export function ChatbotHeader({ onToggleSidebar }: ChatbotHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-8 w-8 hover:bg-gray-100"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="w-4 h-4 text-gray-600" />
          </Button>
        )}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neuro-primary/20 to-neuro-primary/10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neuro-primary to-neuro-primary-dark flex items-center justify-center">
            <span className="text-white text-xs font-semibold">MA</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Med Assistant</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              AI
            </span>
          </div>
          <p className="text-xs text-gray-500">
            What are you looking for today?
          </p>
        </div>
      </div>
    </div>
  );
}
