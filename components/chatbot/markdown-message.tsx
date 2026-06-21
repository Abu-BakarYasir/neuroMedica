"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { CitationItem } from "@/lib/chatbot/types";
import { citationLink, citationSourceMeta } from "@/lib/chatbot/citations";

/**
 * Convert bare `[12]` citation tokens into markdown links (`[12](#cite-12)`)
 * so react-markdown hands them to our <a> renderer, which swaps in a real
 * source link + badge. Code spans/fences are left untouched.
 */
function linkifyCitations(md: string): string {
  const segments = md.split(/(```[\s\S]*?```|`[^`]*`)/g);
  return segments
    .map((seg, i) => (i % 2 === 1 ? seg : seg.replace(/\[(\d{1,3})\]/g, "[$1](#cite-$1)")))
    .join("");
}

function CitationRef({ num, citations }: { num: number; citations?: CitationItem[] }) {
  const citation = citations?.find((c) => c.index === num);
  if (!citation) {
    return <sup className="text-[10px] font-medium text-muted-foreground">[{num}]</sup>;
  }
  const meta = citationSourceMeta(citation);
  return (
    <a
      href={citationLink(citation)}
      target="_blank"
      rel="noopener noreferrer"
      title={citation.title || `${meta.idLabel}: ${meta.idValue}`}
      className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-neuro-primary px-1 align-text-top text-[10px] font-bold leading-none text-white no-underline transition-colors hover:bg-neuro-primary-dark"
    >
      {num}
    </a>
  );
}

/**
 * Renders an assistant message as rich markdown (GFM): headings, tables,
 * blockquotes, lists, code, and inline citation badges — styled for the
 * neuroMedica theme (no `prose` plugin, so every element is styled here).
 */
export function MarkdownMessage({
  content,
  citations,
}: {
  content: string;
  citations?: CitationItem[];
}) {
  const components: Components = {
    h1: ({ children }) => (
      <h2 className="mb-2 mt-5 text-base font-bold tracking-tight text-foreground first:mt-0">{children}</h2>
    ),
    h2: ({ children }) => (
      <h2 className="mb-2 mt-5 text-[15px] font-bold tracking-tight text-foreground first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-1.5 mt-4 text-sm font-semibold text-foreground first:mt-0">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="mb-1 mt-3 text-sm font-semibold text-foreground/90 first:mt-0">{children}</h4>
    ),
    p: ({ children }) => (
      <p className="mb-3 text-sm leading-7 text-foreground/90 last:mb-0">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 ml-1 list-disc space-y-1.5 pl-4 text-sm marker:text-neuro-primary/70 last:mb-0">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 ml-1 list-decimal space-y-1.5 pl-4 text-sm marker:font-semibold marker:text-neuro-primary/70 last:mb-0">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="pl-1 text-sm leading-7 text-foreground/90 [&>ul]:mt-1.5 [&>ol]:mt-1.5">{children}</li>
    ),
    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => <hr className="my-5 border-border" />,
    blockquote: ({ children }) => (
      <blockquote className="my-3 rounded-r-md border-l-[3px] border-neuro-primary/50 bg-neuro-primary/5 py-1.5 pl-3.5 pr-3 text-sm text-foreground/85 [&>p]:mb-0 [&>p]:leading-7">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => {
      if (href?.startsWith("#cite-")) {
        const num = Number.parseInt(href.slice("#cite-".length), 10);
        return <CitationRef num={num} citations={citations} />;
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-neuro-primary underline-offset-2 hover:underline"
        >
          {children}
        </a>
      );
    },
    code: ({ className, children, ...props }) => {
      const isBlock = /language-/.test(className ?? "");
      if (isBlock) {
        return (
          <code className={cn("font-mono text-xs", className)} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.8em] text-foreground">
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="my-3 overflow-x-auto rounded-lg border border-border bg-muted/60 p-3 text-xs leading-relaxed">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="my-3 overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-xs">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
    th: ({ children }) => (
      <th className="border-b border-border px-3 py-2 text-left font-semibold text-foreground">{children}</th>
    ),
    td: ({ children }) => (
      <td className="border-b border-border/60 px-3 py-2 align-top text-foreground/90">{children}</td>
    ),
  };

  return (
    <div className="break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {linkifyCitations(content)}
      </ReactMarkdown>
    </div>
  );
}
