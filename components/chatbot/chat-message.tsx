"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Message, CitationItem } from "@/lib/chatbot/types";
import { Sparkles, ExternalLink, BookOpen, FileText, AlertTriangle, ShieldCheck, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { citationLink, citationSourceMeta } from "@/lib/chatbot/citations";
import { MarkdownMessage } from "./markdown-message";
import { CopyButton } from "./copy-button";

interface ChatMessageProps {
  message: Message;
}

function formatTime(timestamp: Date) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ------------------------------------------------------------------ */
/*  Working / "thinking" indicator                                     */
/* ------------------------------------------------------------------ */

const RAG_PHASES = [
  "Searching the medical literature",
  "Retrieving relevant sources",
  "Reranking the best evidence",
  "Composing a grounded answer",
];
const PLAIN_PHASES = ["Thinking", "Composing a response"];

/**
 * Shown in place of an assistant bubble while its reply is still streaming
 * (content is empty). Cycles through the pipeline phases so the wait reads as
 * "searching → retrieving → …" instead of a bare spinner.
 */
function ThinkingIndicator({ usedRag }: { usedRag?: boolean }) {
  const phases = usedRag ? RAG_PHASES : PLAIN_PHASES;
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % phases.length), 1600);
    return () => clearInterval(id);
  }, [phases.length]);

  return (
    <div className="flex items-center gap-2 py-1.5" aria-live="polite">
      <span className="text-sm text-muted-foreground animate-pulse">{phases[i]}</span>
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-neuro-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-neuro-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-neuro-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Confidence badge                                                   */
/* ------------------------------------------------------------------ */

function confidenceBadgeVariant(confidence: string) {
  const c = confidence.toLowerCase();
  if (c === "high")
    return {
      cls: "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200",
      icon: ShieldCheck,
      label: "High confidence",
    };
  if (c === "medium")
    return {
      cls: "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
      icon: AlertTriangle,
      label: "Medium confidence",
    };
  return {
    cls: "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200",
    icon: AlertTriangle,
    label: c === "insufficient" ? "Insufficient evidence" : "Low confidence",
  };
}

/* ------------------------------------------------------------------ */
/*  Main message component                                             */
/* ------------------------------------------------------------------ */

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isError = message.error;
  const hasCitations = !isUser && message.citations && message.citations.length > 0;
  const hasRagMeta =
    !isUser &&
    message.usedRag &&
    (hasCitations || message.confidence || message.disclaimer);

  // User: compact right-aligned bubble.
  // Assistant: full-width, flat (no card), avatar to the left — Claude-style.
  if (isUser) {
    return (
      <div className="group flex flex-col items-end py-3">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-neuro-primary text-white px-4 py-2.5 shadow-sm">
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-1 pr-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {message.timestamp && (
            <span className="text-[10px] text-muted-foreground">{formatTime(message.timestamp)}</span>
          )}
          <CopyButton value={message.content} iconOnly label="Copy message" />
        </div>
      </div>
    );
  }

  // An assistant message with no content yet is still streaming — show a
  // single avatar + cycling status instead of empty badges/warnings (which
  // previously rendered alongside the separate loading dots → two avatars).
  const isWorking = !isError && !message.content;

  return (
    <div className="flex gap-3 py-4 group">
      {/* Assistant avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neuro-primary to-neuro-primary-dark flex items-center justify-center">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>

      {isWorking ? (
        <div className="flex-1 min-w-0">
          <ThinkingIndicator usedRag={message.usedRag} />
        </div>
      ) : (
      <div
        className={cn(
          "flex-1 min-w-0",
          isError &&
            "rounded-xl bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/40 px-4 py-3"
        )}
      >
        {/* RAG + Confidence badges */}
        {message.usedRag && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wide border-neuro-primary/40 text-neuro-primary bg-background font-semibold"
            >
              Evidence-Based
            </Badge>
            {message.confidence && (() => {
              const v = confidenceBadgeVariant(message.confidence);
              const Icon = v.icon;
              return (
                <Badge variant="outline" className={cn("text-[10px] font-medium gap-1", v.cls)}>
                  <Icon className="w-3 h-3" />
                  {v.label}
                </Badge>
              );
            })()}
          </div>
        )}

        {/* Assistant body — rich markdown on the page background */}
        {isError ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="text-foreground">
            <MarkdownMessage content={message.content} citations={message.citations} />
          </div>
        )}

        {/* Response actions */}
        {!isError && message.content && (
          <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <CopyButton value={message.content} label="Copy" />
          </div>
        )}

        {/* Citation cards — collapsed by default to keep replies compact */}
        {hasCitations && <SourcesPanel citations={message.citations!} />}

        {/* No sources warning */}
        {message.usedRag && !hasRagMeta && (
          <p className="mt-2 text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50/80 dark:bg-amber-900/20 rounded-md px-2.5 py-2 border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
            Evidence-based mode was on but no sources were attached. The index may be empty or retrieval
            confidence was too low. Try ingesting related PubMed articles or rephrasing your question.
          </p>
        )}

        {/* Timestamp — only shown on hover to keep the conversation clean */}
        {message.timestamp && (
          <p className="text-[10px] mt-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sources panel — collapsible, compact                               */
/* ------------------------------------------------------------------ */

function SourcesPanel({ citations }: { citations: CitationItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 pt-3 border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group/src inline-flex items-center gap-1.5 rounded-md text-xs font-semibold text-foreground/70 hover:text-foreground transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5 text-neuro-primary" />
        <span>Sources ({citations.length})</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="mt-2.5 space-y-1.5">
          {citations.map((c) => (
            <CitationRow key={`${c.pmid}-${c.index}`} citation={c} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One compact, single-row citation: index · type · title · link. */
function CitationRow({ citation }: { citation: CitationItem }) {
  const meta = citationSourceMeta(citation);
  const primaryUrl = citationLink(citation);
  const doiUrl = citation.doi ? `https://doi.org/${encodeURIComponent(citation.doi)}` : null;
  const SourceIcon = meta.icon;

  return (
    <a
      href={primaryUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group/row flex items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2 hover:border-neuro-primary/40 hover:bg-muted/40 transition-colors"
    >
      <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-neuro-primary text-white text-[10px] font-bold">
        {citation.index}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate group-hover/row:text-neuro-primary transition-colors">
          {citation.title || `${meta.idLabel} ${meta.idValue}`}
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <SourceIcon className="w-2.5 h-2.5 shrink-0 text-neuro-primary/70" />
          <span className="uppercase tracking-wide font-semibold text-neuro-primary/80">{meta.label}</span>
          {citation.journal && <span className="text-border">·</span>}
          {citation.journal && <span className="italic truncate">{citation.journal}</span>}
          <span className="text-border">·</span>
          <span className="shrink-0">{meta.idLabel} {meta.idValue}</span>
        </div>
      </div>

      {doiUrl && (
        <span
          role="link"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(doiUrl, "_blank", "noopener,noreferrer");
          }}
          className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0"
        >
          <FileText className="w-2.5 h-2.5" />
          DOI
        </span>
      )}
      <ExternalLink className="w-3 h-3 text-muted-foreground/60 shrink-0 group-hover/row:text-neuro-primary transition-colors" />
    </a>
  );
}
