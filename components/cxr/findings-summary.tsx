"use client";

import { cn } from "@/lib/utils";
import type { CxrAnalysisResponse } from "@/lib/cxr/types";

interface FindingsSummaryProps {
  result: CxrAnalysisResponse;
}

export function FindingsSummary({ result }: FindingsSummaryProps) {
  const abnormalPct = Math.round(result.abnormal_probability * 100);
  const isAbnormal = result.predicted_abnormal;

  return (
    <div className="rounded-[16px] border border-[#EDEDED] bg-white p-5 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02)]">
      <div className="flex flex-col gap-1 mb-4">
        <div className="text-[11px] uppercase tracking-wide text-[#838383]">
          Screening result
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-[24px] font-semibold",
              isAbnormal ? "text-rose-600" : "text-emerald-600",
            )}
          >
            {isAbnormal ? "Abnormal" : "Likely Normal"}
          </span>
        </div>
        <p className="text-[12px] text-[#525252] leading-relaxed">
          {isAbnormal
            ? "One or more thoracic findings were flagged. Review the ranked pathologies below."
            : "No pathology cleared the detection threshold. Corroborate with clinical context."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <SummaryStat
          label="Abnormal probability"
          value={`${abnormalPct}%`}
          tone={abnormalPct >= 50 ? "warn" : "ok"}
        />
        <SummaryStat
          label="Findings detected"
          value={`${result.detected_count} of ${result.findings.length}`}
          tone={result.detected_count > 0 ? "warn" : "ok"}
        />
      </div>

      <div className="space-y-1">
        <div className="text-[11px] uppercase tracking-wide text-[#838383] mb-2">
          Top finding
        </div>
        <div className="text-[14px] font-semibold text-[#212121]">
          {result.top_finding}
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone = "ok",
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="rounded-[10px] bg-[#FAFAFA] border border-[#EDEDED] p-3">
      <div className="text-[10px] uppercase tracking-wide text-[#838383] mb-1">
        {label}
      </div>
      <div
        className={cn(
          "text-[16px] font-semibold",
          tone === "warn" ? "text-amber-700" : "text-[#212121]",
        )}
      >
        {value}
      </div>
    </div>
  );
}
