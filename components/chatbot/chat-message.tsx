"use client";

import { cn } from "@/lib/utils";
import type { Message, CitationItem } from "@/lib/chatbot/types";
import { Bot, User, ExternalLink, BookOpen, FileText, AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChatMessageProps {
  message: Message;
}

/* ------------------------------------------------------------------ */
/*  Confidence badge                                                   */
/* ------------------------------------------------------------------ */

function confidenceBadgeVariant(confidence: string) {
  const c = confidence.toLowerCase();
  if (c === "high")
    return { cls: "border-emerald-300 bg-emerald-50 text-emerald-800", icon: ShieldCheck, label: "High confidence" };
  if (c === "medium")
    return { cls: "border-amber-300 bg-amber-50 text-amber-800", icon: AlertTriangle, label: "Medium confidence" };
  return { cls: "border-red-300 bg-red-50 text-red-800", icon: AlertTriangle, label: c === "insufficient" ? "Insufficient evidence" : "Low confidence" };
}

/* ------------------------------------------------------------------ */
/*  Simple markdown-like renderer                                      */
/*  Supports: **bold**, headings (##), bullet lists (- / *),           */
/*  numbered lists, inline citations [1], and line breaks.             */
/* ------------------------------------------------------------------ */

function renderFormattedText(text: string, citations?: CitationItem[]) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const Tag = listType;
      elements.push(
        <Tag
          key={`list-${key++}`}
          className={cn(
            "my-1.5 space-y-0.5 text-sm",
            listType === "ul" ? "list-disc pl-5" : "list-decimal pl-5"
          )}
        >
          {listItems}
        </Tag>
      );
      listItems = [];
      listType = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Heading: ## or ### or ####
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const cls =
        level <= 2
          ? "text-sm font-bold text-gray-900 mt-3 mb-1"
          : "text-sm font-semibold text-gray-800 mt-2 mb-0.5";
      elements.push(
        <p key={`h-${key++}`} className={cls}>
          {renderInline(headingText, citations)}
        </p>
      );
      continue;
    }

    // Unordered list item: - or *
    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(
        <li key={`li-${key++}`} className="text-sm text-gray-800 leading-relaxed">
          {renderInline(ulMatch[1], citations)}
        </li>
      );
      continue;
    }

    // Ordered list item: 1. or 1)
    const olMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (olMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(
        <li key={`li-${key++}`} className="text-sm text-gray-800 leading-relaxed">
          {renderInline(olMatch[1], citations)}
        </li>
      );
      continue;
    }

    // Bold-only line (like **Key Takeaways:**)
    const boldLineMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (boldLineMatch) {
      flushList();
      elements.push(
        <p key={`b-${key++}`} className="text-sm font-semibold text-gray-900 mt-2 mb-0.5">
          {boldLineMatch[1]}
        </p>
      );
      continue;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p key={`p-${key++}`} className="text-sm text-gray-800 leading-relaxed mb-1.5">
        {renderInline(trimmed, citations)}
      </p>
    );
  }
  flushList();
  return elements;
}

/** Render inline formatting: **bold** and citation references [1] */
function renderInline(text: string, citations?: CitationItem[]): React.ReactNode[] {
  // Split on **bold** and [N] citation patterns
  const parts = text.split(/(\*\*[^*]+?\*\*|\[\d+\])/g);
  return parts.map((part, i) => {
    // Bold
    const boldMatch = part.match(/^\*\*(.+?)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {boldMatch[1]}
        </strong>
      );
    }
    // Citation reference [N]
    const citeMatch = part.match(/^\[(\d+)\]$/);
    if (citeMatch && citations?.length) {
      const num = parseInt(citeMatch[1], 10);
      const citation = citations.find((c) => c.index === num);
      if (citation) {
        return (
          <a
            key={i}
            href={`https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(citation.pmid)}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-4.5 h-4.5 text-[10px] font-bold text-white bg-neuro-primary rounded-full mx-0.5 hover:bg-neuro-primary/80 transition-colors cursor-pointer align-text-top leading-none"
            style={{ minWidth: "18px", minHeight: "18px", padding: "2px 4px" }}
            title={citation.title || `PMID: ${citation.pmid}`}
          >
            {num}
          </a>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}

/* ------------------------------------------------------------------ */
/*  Citation card                                                      */
/* ------------------------------------------------------------------ */

function CitationCard({ citation }: { citation: CitationItem }) {
  const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(citation.pmid)}/`;
  const doiUrl = citation.doi ? `https://doi.org/${encodeURIComponent(citation.doi)}` : null;

  return (
    <div className="group relative flex gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-neuro-primary/40 hover:shadow-sm transition-all">
      {/* Index badge */}
      <div className="flex-shrink-0 flex items-start">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neuro-primary text-white text-xs font-bold">
          {citation.index}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Title */}
        {citation.title && (
          <p className="text-xs font-medium text-gray-900 leading-snug mb-1 line-clamp-2">
            {citation.title}
          </p>
        )}

        {/* Journal + PMID row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
          {citation.journal && (
            <span className="italic">{citation.journal}</span>
          )}
          <span className="text-gray-300">|</span>
          <span>PMID: {citation.pmid}</span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-2 mt-1.5">
          <a
            href={pubmedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-neuro-primary hover:text-neuro-primary/80 hover:underline transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            PubMed
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
          {doiUrl && (
            <a
              href={doiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors"
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

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neuro-primary/20 to-neuro-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-neuro-primary" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-xl",
          isUser
            ? "bg-neuro-primary text-white px-4 py-2.5"
            : isError
              ? "bg-red-50 text-red-800 border border-red-200 px-4 py-2.5"
              : "bg-gray-50 border border-gray-200/80 px-4 py-3"
        )}
      >
        {/* RAG + Confidence badges */}
        {!isUser && message.usedRag && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wide border-neuro-primary/40 text-neuro-primary bg-white font-semibold"
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

        {/* Message body - formatted for assistant, plain for user */}
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="space-y-0">
            {renderFormattedText(message.content, message.citations)}
          </div>
        )}

        {/* Citation cards */}
        {hasCitations && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1.5 mb-2.5">
              <BookOpen className="w-3.5 h-3.5 text-neuro-primary" />
              <p className="text-xs font-semibold text-gray-700">
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

        {/* Disclaimer */}
        {!isUser && message.usedRag && message.disclaimer && (
          <div className="mt-3 pt-2.5 border-t border-gray-200/80">
            <p className="text-[11px] text-gray-500 leading-snug flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-gray-400" />
              {message.disclaimer}
            </p>
          </div>
        )}

        {/* No sources warning */}
        {!isUser && message.usedRag && !hasRagMeta && (
          <p className="mt-2 text-[11px] text-amber-800 bg-amber-50/80 rounded-md px-2.5 py-2 border border-amber-200/60 flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
            Evidence-based mode was on but no sources were attached. The index may be empty or retrieval
            confidence was too low. Try ingesting related PubMed articles or rephrasing your question.
          </p>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <p
            className={cn(
              "text-[11px] mt-2",
              isUser ? "text-white/70" : "text-gray-400"
            )}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neuro-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-neuro-primary" />
        </div>
      )}
    </div>
  );
}
