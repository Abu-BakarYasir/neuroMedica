"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Stethoscope,
  Loader2,
  AlertCircle,
  X,
  Plus,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exploreSymptoms } from "@/lib/symptoms/api-client";
import { splitSymptoms } from "@/lib/symptoms/parse";
import type {
  Differential,
  Likelihood,
  SymptomExploreResponse,
} from "@/lib/symptoms/types";
import type { CitationItem } from "@/lib/chatbot/types";
import { AddToReportButton } from "@/components/report-generator/add-to-report-button";
import { symptomToItem } from "@/lib/report/serialize";

const EXAMPLE_SETS: { label: string; symptoms: string[] }[] = [
  { label: "Respiratory", symptoms: ["fever", "productive cough", "pleuritic chest pain"] },
  { label: "Cardiac", symptoms: ["crushing chest pain", "diaphoresis", "left arm radiation"] },
  { label: "Neuro", symptoms: ["sudden severe headache", "neck stiffness", "photophobia"] },
  { label: "Abdominal", symptoms: ["right lower quadrant pain", "nausea", "low-grade fever"] },
];

const LIKELIHOOD_STYLE: Record<Likelihood, string> = {
  high: "bg-rose-100 text-rose-700 border-rose-200",
  moderate: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export function SymptomExplorer() {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<SymptomExploreResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addDraft = useCallback(() => {
    const tokens = splitSymptoms(draft);
    if (tokens.length) {
      setSymptoms((prev) => {
        const seen = new Set(prev.map((s) => s.toLowerCase()));
        return [...prev, ...tokens.filter((t) => !seen.has(t.toLowerCase()))];
      });
    }
    setDraft("");
  }, [draft]);

  const removeSymptom = (s: string) =>
    setSymptoms((prev) => prev.filter((x) => x !== s));

  const explore = useCallback(async () => {
    // Fold any half-typed draft into the chip list first.
    const tokens = splitSymptoms([...symptoms, draft].join(", "));
    if (!tokens.length || isLoading) return;
    setSymptoms(tokens);
    setDraft("");
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await exploreSymptoms(tokens.join(", "));
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze symptoms");
    } finally {
      setIsLoading(false);
    }
  }, [symptoms, draft, isLoading]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addDraft();
    } else if (e.key === "Backspace" && !draft && symptoms.length) {
      setSymptoms((prev) => prev.slice(0, -1));
    }
  };

  const applyExample = (set: string[]) => {
    setSymptoms(set);
    setDraft("");
    inputRef.current?.focus();
  };

  const citationsByIndex = useMemo(() => {
    const map = new Map<number, CitationItem>();
    result?.citations.forEach((c) => map.set(c.index, c));
    return map;
  }, [result]);

  const canExplore = (symptoms.length > 0 || draft.trim().length > 0) && !isLoading;

  return (
    <div className="w-full max-w-[1100px] mx-auto px-2 pb-10">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-neuro-primary/15 to-neuro-primary/5 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="h-5 w-5 text-neuro-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#212121]">
            Symptom Explorer
          </h1>
          <p className="text-[13px] text-[#525252] mt-0.5">
            Enter presenting symptoms to get an evidence-grounded differential
            diagnosis with citations. Educational use only — not a diagnosis.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="rounded-[16px] border border-[#E5E5E5] bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 px-1 py-1">
          {symptoms.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-neuro-primary/10 text-neuro-primary text-[12px] font-medium pl-2.5 pr-1.5 py-1"
            >
              {s}
              <button
                type="button"
                onClick={() => removeSymptom(s)}
                className="rounded-full hover:bg-neuro-primary/20 p-0.5"
                aria-label={`Remove ${s}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={addDraft}
            placeholder={symptoms.length ? "Add another symptom…" : "Type a symptom and press Enter (or use commas)…"}
            disabled={isLoading}
            className="flex-1 min-w-[180px] bg-transparent px-2 py-1.5 text-[14px] text-[#212121] placeholder:text-[#9a9a9a] focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-[#F0F0F0] pt-2 mt-1">
          <span className="text-[11px] text-[#9a9a9a]">
            Evidence-grounded · codes are AI-suggested · educational use only
          </span>
          <Button
            type="button"
            onClick={explore}
            disabled={!canExplore}
            className="bg-neuro-primary text-white hover:bg-neuro-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Explore
          </Button>
        </div>
      </div>

      {/* Example sets (empty state) */}
      {!result && !isLoading && (
        <div className="mt-6">
          <div className="text-[12px] text-[#767676] mb-3">Try a preset</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXAMPLE_SETS.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => applyExample(ex.symptoms)}
                className="text-left rounded-[12px] border border-[#E5E5E5] bg-white px-4 py-3 hover:border-neuro-primary/40 hover:bg-neuro-primary/5 transition-colors"
              >
                <div className="text-[13px] font-medium text-[#212121]">{ex.label}</div>
                <div className="text-[12px] text-[#767676] mt-0.5">
                  {ex.symptoms.join(", ")}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="mt-6 flex items-center gap-3 rounded-[14px] border border-[#EDEDED] bg-white p-6 text-[13px] text-[#525252]">
          <Loader2 className="h-4 w-4 animate-spin text-neuro-primary" />
          Analyzing symptoms against the literature — this may take a moment.
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="mt-6 flex items-start gap-3 rounded-[14px] border border-rose-200 bg-rose-50 p-4">
          <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[13px] font-semibold text-rose-800">
              Could not analyze these symptoms
            </div>
            <p className="text-[12px] text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isLoading && (
        <Results result={result} citationsByIndex={citationsByIndex} />
      )}
    </div>
  );
}

function Results({
  result,
  citationsByIndex,
}: {
  result: SymptomExploreResponse;
  citationsByIndex: Map<number, CitationItem>;
}) {
  const confidence = result.confidence;
  return (
    <div className="mt-6 space-y-5">
      {/* Confidence + summary */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide font-semibold rounded-full border border-neuro-primary/40 text-neuro-primary bg-neuro-primary/5 px-2 py-0.5">
          {confidence} confidence
        </span>
        <span className="text-[11px] text-[#9a9a9a]">
          Differential diagnosis for: {result.symptoms}
        </span>
        <AddToReportButton
          build={() => symptomToItem(result)}
          className="ml-auto h-8"
        />
      </div>

      {result.summary && (
        <p className="text-[13px] text-[#374151] leading-relaxed">{result.summary}</p>
      )}

      {/* Prose fallback (model didn't return structured JSON) */}
      {!result.structured && (
        <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
          Showing a narrative summary — a structured differential wasn&apos;t available
          for this query.
        </div>
      )}

      {/* Differential cards */}
      {result.differentials.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {result.differentials.map((d, i) => (
            <DifferentialCard
              key={`${d.condition}-${i}`}
              d={d}
              citationsByIndex={citationsByIndex}
            />
          ))}
        </div>
      )}

      {result.structured && result.differentials.length === 0 && (
        <div className="rounded-[14px] border border-[#EDEDED] bg-white p-6 text-center text-[13px] text-[#767676]">
          No differential could be grounded in the available evidence. Try adding
          more specific symptoms.
        </div>
      )}

      {/* Recommended workup */}
      {result.recommended_workup.length > 0 && (
        <div className="rounded-[14px] border border-[#EDEDED] bg-white p-4">
          <div className="text-[13px] font-semibold text-[#212121] mb-2">
            Recommended workup
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[13px] text-[#374151]">
            {result.recommended_workup.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      {result.citations.length > 0 && (
        <div className="rounded-[14px] border border-[#EDEDED] bg-white p-4">
          <div className="text-[13px] font-semibold text-[#212121] mb-3">
            Sources ({result.citations.length})
          </div>
          <div className="space-y-2">
            {result.citations.map((c) => (
              <SourceRow key={c.index} c={c} />
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-[#838383]">{result.disclaimer}</p>
    </div>
  );
}

function DifferentialCard({
  d,
  citationsByIndex,
}: {
  d: Differential;
  citationsByIndex: Map<number, CitationItem>;
}) {
  return (
    <div className="rounded-[14px] border border-[#EDEDED] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-[#212121]">{d.condition}</h3>
        <span
          className={cn(
            "text-[10px] uppercase tracking-wide font-semibold rounded-full border px-2 py-0.5 flex-shrink-0",
            LIKELIHOOD_STYLE[d.likelihood] ?? LIKELIHOOD_STYLE.moderate,
          )}
        >
          {d.likelihood}
        </span>
      </div>

      {/* AI-suggested codes */}
      {(d.icd10 || d.snomed) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {d.icd10 && <CodeChip label="ICD-10" value={d.icd10} />}
          {d.snomed && <CodeChip label="SNOMED" value={d.snomed} />}
          <span className="text-[10px] text-[#9a9a9a]" title="Codes are AI-suggested from general knowledge and may be inaccurate — verify against an authoritative source.">
            AI-suggested · verify
          </span>
        </div>
      )}

      {d.rationale && (
        <p className="text-[13px] text-[#374151] leading-relaxed mt-2.5">{d.rationale}</p>
      )}

      {d.red_flags && (
        <div className="mt-2.5 flex items-start gap-2 rounded-[10px] bg-rose-50 border border-rose-200 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-600 mt-0.5 flex-shrink-0" />
          <span className="text-[12px] text-rose-800">{d.red_flags}</span>
        </div>
      )}

      {/* Supporting sources */}
      {d.supporting_citations.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="text-[11px] text-[#9a9a9a]">Sources:</span>
          {d.supporting_citations.map((idx) => {
            const c = citationsByIndex.get(idx);
            const href = c?.url;
            return href ? (
              <a
                key={idx}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-[11px] text-neuro-primary hover:underline"
                title={c?.title}
              >
                [{idx}]
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ) : (
              <span key={idx} className="text-[11px] text-[#767676]">
                [{idx}]
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CodeChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] px-2 py-0.5 text-[11px]">
      <span className="text-[#9a9a9a]">{label}</span>
      <span className="font-medium text-[#212121]">{value}</span>
    </span>
  );
}

function SourceRow({ c }: { c: CitationItem }) {
  const label = (c.source_type ?? "pubmed").toUpperCase();
  return (
    <div className="flex items-start gap-2 text-[12px]">
      <span className="text-[#9a9a9a] flex-shrink-0">{c.index}.</span>
      <div className="min-w-0">
        <span className="inline-block text-[9px] uppercase tracking-wide font-semibold text-[#767676] bg-[#F2F2F2] rounded px-1.5 py-0.5 mr-1.5 align-middle">
          {label}
        </span>
        <span className="text-[#212121]">{c.title || c.pmid}</span>
        {c.journal && <span className="text-[#9a9a9a]"> · {c.journal}</span>}
        {c.url && (
          <a
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-neuro-primary hover:underline ml-1.5"
          >
            open
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}
