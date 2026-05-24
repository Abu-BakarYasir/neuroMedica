"use client";

import Link from "next/link";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@/components/icons/arrow-left-icon";

interface ChatbotHeaderProps {
  onToggleSidebar?: () => void;
}

export function ChatbotHeader({ onToggleSidebar }: ChatbotHeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-4 sm:px-6 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
      {/* Left: sidebar toggle + back link */}
      <div className="flex items-center gap-1">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Open sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </Button>
        )}
        <Link
          href="/protected/doctors"
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
      </div>

      {/* Right: title + AI badge + avatar (Claude-style: identity sits on the right) */}
      <div className="flex items-center gap-2.5">
        <div className="flex flex-col items-end leading-tight">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-foreground">
              Med Assistant
            </h3>
            <span className="text-[10px] font-medium uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              AI
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Evidence-aware clinical assistant
          </p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neuro-primary/25 to-neuro-primary/10 flex items-center justify-center ring-1 ring-neuro-primary/20">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neuro-primary to-neuro-primary-dark flex items-center justify-center">
            <span className="text-white text-[11px] font-semibold">MA</span>
          </div>
        </div>
      </div>
    </header>
  );
}
