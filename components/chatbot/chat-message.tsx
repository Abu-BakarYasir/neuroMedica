"use client";

import { cn } from "@/lib/utils";
import type { Message, CitationItem } from "@/lib/chatbot/types";
import { Sparkles, ExternalLink, BookOpen, FileText, AlertTriangle, ShieldCheck } from "lucide-react";
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
/*  Citation card                                                      */
/* ------------------------------------------------------------------ */

function CitationCard({ citation }: { citation: CitationItem }) {
  const meta = citationSourceMeta(citation);
  const primaryUrl = citationLink(citation);
  const doiUrl = citation.doi ? `https://doi.org/${encodeURIComponent(citation.doi)}` : null;
  const SourceIcon = meta.icon;

  return (
    <div className="group relative flex gap-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[hsl(var(--surface-elevated))] p-3 hover:border-neuro-primary/40 hover:shadow-sm transition-all">
      {/* Index badge */}
      <div className="flex-shrink-0 flex items-start">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neuro-primary text-white text-xs font-bold">
          {citation.index}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Source-type badge */}
        <div className="mb-1 flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-wide border-neuro-primary/40 text-neuro-primary bg-card font-semibold gap-1"
          >
            <SourceIcon className="w-3 h-3" />
            {meta.label}
          </Badge>
        </div>

        {/* Title */}
        {citation.title && (
          <p className="text-xs font-medium text-gray-900 dark:text-neutral-100 leading-snug mb-1 line-clamp-2">
            {citation.title}
          </p>
        )}

        {/* Journal/manufacturer + ID row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500 dark:text-neutral-400">
          {citation.journal && (
            <span className="italic">{citation.journal}</span>
          )}
          {citation.journal && <span className="text-gray-300 dark:text-neutral-600">|</span>}
          <span>
            {meta.idLabel}: {meta.idValue}
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-2 mt-1.5">
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-neuro-primary hover:text-neuro-primary/80 hover:underline transition-colors"
          >
            <SourceIcon className="w-3 h-3" />
            {meta.linkLabel}
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
          {doiUrl && (
            <a
              href={doiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline transition-colors"
            >
              <FileText className="w-3 h-3" />
              Full Text (DOI)
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
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

  return (
    <div className="flex gap-3 py-4 group">
      {/* Assistant avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neuro-primary to-neuro-primary-dark flex items-center justify-center">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>

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

        {/* Citation cards */}
        {hasCitations && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 mb-2.5">
              <BookOpen className="w-3.5 h-3.5 text-neuro-primary" />
              <p className="text-xs font-semibold text-foreground/80">
                Sources ({message.citations!.length})
              </p>
            </div>
            <div className="space-y-2">
              {message.citations!.map((c) => (
                <CitationCard key={`${c.pmid}-${c.index}`} citation={c} />
              ))}
            </div>
          </div>
        )}

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
    </div>
  );
}
