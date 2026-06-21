"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  /** Text to write to the clipboard. */
  value: string;
  /** Accessible label / tooltip (also the visible text unless iconOnly). */
  label?: string;
  /** Render only the icon (no text) — used on compact surfaces like the user bubble. */
  iconOnly?: boolean;
  className?: string;
}

/**
 * Small copy-to-clipboard control with a transient "Copied" state.
 * Shared by both the user prompt and the assistant response.
 */
export function CopyButton({ value, label = "Copy", iconOnly = false, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (e.g. insecure context) — silently no-op */
    }
  };

  const Icon = copied ? Check : Copy;

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md text-[11px] font-medium transition-colors",
        "text-muted-foreground hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        iconOnly ? "p-1" : "px-2 py-1",
        className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", copied && "text-emerald-600 dark:text-emerald-400")} />
      {!iconOnly && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}
