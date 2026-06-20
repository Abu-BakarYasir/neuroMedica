"use client";

import { cn } from "@/lib/utils";
import type { PathologyPrediction } from "@/lib/cxr/types";

interface FindingRowProps {
  finding: PathologyPrediction;
}

/** A single pathology with its probability bar. Detected findings are accented. */
export function FindingRow({ finding }: FindingRowProps) {
  const pct = Math.round(finding.probability * 100);
  const { detected } = finding;

  return (
    <div
      className={cn(
        "rounded-[12px] border p-3.5 transition-colors",
        detected
          ? "border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/40"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground truncate">
              {finding.name}
            </span>
            {detected && (
              <span className="inline-flex items-center rounded-full bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300">
                Detected
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            {finding.description}
          </p>
        </div>
        <span
          className={cn(
            "text-[14px] font-semibold flex-shrink-0",
            detected ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground",
          )}
        >
          {pct}%
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            detected ? "bg-rose-500" : "bg-neuro-primary/50",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {detected && (
        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
          {finding.clinical_significance}
        </p>
      )}
    </div>
  );
}
