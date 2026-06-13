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
          ? "border-rose-200 bg-rose-50/40"
          : "border-[#EDEDED] bg-white",
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#212121] truncate">
              {finding.name}
            </span>
            {detected && (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                Detected
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#767676] mt-0.5 leading-snug">
            {finding.description}
          </p>
        </div>
        <span
          className={cn(
            "text-[14px] font-semibold flex-shrink-0",
            detected ? "text-rose-600" : "text-[#525252]",
          )}
        >
          {pct}%
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-[#F5F5F5] overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            detected ? "bg-rose-500" : "bg-neuro-primary/50",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {detected && (
        <p className="text-[11px] text-[#525252] mt-2 leading-relaxed">
          {finding.clinical_significance}
        </p>
      )}
    </div>
  );
}
