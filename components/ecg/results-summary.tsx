"use client";

import { cn } from "@/lib/utils";
import type {
  AnalysisSummary,
  BeatClassCode,
  ClassInfo,
} from "@/lib/ecg/types";

const CLASS_DOT: Record<BeatClassCode, string> = {
  N: "bg-emerald-500",
  S: "bg-amber-500",
  V: "bg-rose-500",
  F: "bg-violet-500",
  Q: "bg-slate-500",
};

interface ResultsSummaryProps {
  summary: AnalysisSummary;
  classes: ClassInfo[];
}

export function ResultsSummary({ summary, classes }: ResultsSummaryProps) {
  const dominantClass = classes.find((c) => c.code === summary.dominant_class);
  const meanConfPct = Math.round(summary.mean_confidence * 100);
  const abnormalPct = summary.abnormal_percentage;
  const isMostlyNormal = summary.dominant_class === "N";

  return (
    <div className="rounded-[16px] border border-[#EDEDED] bg-white p-5 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02)]">
      <div className="flex flex-col gap-1 mb-4">
        <div className="text-[11px] uppercase tracking-wide text-[#838383]">
          Analysis summary
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[24px] font-semibold text-[#212121]">
            {summary.dominant_label}
          </span>
          <span className="text-[13px] text-[#525252]">
            ({summary.dominant_class})
          </span>
        </div>
        {dominantClass && (
          <p className="text-[12px] text-[#525252] leading-relaxed">
            {dominantClass.clinical_significance}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <SummaryStat label="Beats analyzed" value={summary.total_beats.toString()} />
        <SummaryStat
          label="Abnormal beats"
          value={`${summary.abnormal_beats} (${abnormalPct}%)`}
          tone={abnormalPct > 10 ? "warn" : "ok"}
        />
        <SummaryStat
          label="Mean confidence"
          value={`${meanConfPct}%`}
          tone={meanConfPct < 60 ? "warn" : "ok"}
        />
      </div>

      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wide text-[#838383] mb-1">
          Class distribution
        </div>
        {classes.map((cls) => {
          const count = summary.class_counts[cls.code] ?? 0;
          const pct = summary.class_percentages[cls.code] ?? 0;
          return (
            <div key={cls.code} className="flex items-center gap-3">
              <span
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  CLASS_DOT[cls.code],
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-[#212121] truncate">
                    <span className="font-semibold mr-1">{cls.code}</span>
                    <span className="text-[#525252]">{cls.name}</span>
                  </span>
                  <span className="text-[#525252] flex-shrink-0">
                    {count} · {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F5F5F5] overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", CLASS_DOT[cls.code])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isMostlyNormal && (
        <div className="mt-5 rounded-[10px] bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
          Non-normal beats detected. Review individual beats below and corroborate
          with the patient&apos;s clinical context before acting on these findings.
        </div>
      )}
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
