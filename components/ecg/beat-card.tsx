"use client";

import { cn } from "@/lib/utils";
import { WaveformPlot } from "./waveform-plot";
import type { BeatPrediction } from "@/lib/ecg/types";

const CLASS_COLOR: Record<string, { bg: string; text: string; stroke: string }> = {
  N: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", stroke: "#10B981" },
  S: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", stroke: "#F59E0B" },
  V: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", stroke: "#F43F5E" },
  F: { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", stroke: "#8B5CF6" },
  Q: { bg: "bg-slate-100 dark:bg-slate-800/60", text: "text-slate-700 dark:text-slate-300", stroke: "#64748B" },
};

interface BeatCardProps {
  beat: BeatPrediction;
}

export function BeatCard({ beat }: BeatCardProps) {
  const color = CLASS_COLOR[beat.predicted_class] ?? CLASS_COLOR.Q;
  const confidencePct = Math.round(beat.confidence * 100);

  return (
    <div className="rounded-[14px] border border-border bg-card p-4 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold",
              color.bg,
              color.text,
            )}
            title={beat.predicted_label}
          >
            {beat.predicted_class}
          </span>
          <div>
            <div className="text-[13px] font-semibold text-foreground">
              Beat #{beat.index + 1}
            </div>
            <div className="text-[11px] text-muted-foreground">{beat.predicted_label}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-muted-foreground">Confidence</div>
          <div className="text-[13px] font-semibold text-foreground">{confidencePct}%</div>
        </div>
      </div>

      <WaveformPlot samples={beat.waveform} stroke={color.stroke} height={84} />

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(Object.keys(beat.probabilities) as Array<keyof typeof beat.probabilities>)
          .sort((a, b) => beat.probabilities[b] - beat.probabilities[a])
          .map((code) => {
            const pct = Math.round(beat.probabilities[code] * 100);
            const isTop = code === beat.predicted_class;
            return (
              <span
                key={code}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  isTop
                    ? "bg-[#F47325]/10 text-[#F47325]"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {code} · {pct}%
              </span>
            );
          })}
      </div>
    </div>
  );
}
