"use client";

import {
  Activity,
  AlertTriangle,
  HeartPulse,
  Siren,
  Stethoscope,
  Waves,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { EcgDiagnosticInterpretation } from "@/lib/ecg/types";

/**
 * Clinical interpretation card for the 12-lead diagnosis.
 *
 *  - reliable=false (image uploads) → a prominent warning shown INSTEAD of
 *    presenting the probabilities as trustworthy.
 *  - urgent=true (MI present) → a red "urgent" banner above the findings.
 */
export function ClinicalInterpretation({
  interpretation,
}: {
  interpretation: EcgDiagnosticInterpretation;
}) {
  if (!interpretation.reliable) {
    return <UnreliableNotice interpretation={interpretation} />;
  }

  const { heart_rate_bpm, heart_rate_label, rhythm_regularity } = interpretation;

  return (
    <div
      className={cn(
        "rounded-[16px] border bg-card p-5",
        interpretation.urgent
          ? "border-rose-300 dark:border-rose-900/60"
          : "border-border",
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope className="h-4 w-4 text-neuro-primary" />
        <h2 className="text-[14px] font-semibold text-foreground">
          Clinical interpretation
        </h2>
        <ReliabilityBadge reliability={interpretation.reliability} />
      </div>

      {interpretation.urgent && (
        <div className="flex items-center gap-2 mb-3 rounded-[10px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-3 py-2">
          <Siren className="h-4 w-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <span className="text-[12px] font-semibold text-rose-700 dark:text-rose-300">
            Time-critical finding — if acute, seek urgent cardiology review.
          </span>
        </div>
      )}

      <p className="text-[15px] font-medium text-foreground leading-snug mb-4">
        {interpretation.headline}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        <Metric
          icon={<HeartPulse className="h-4 w-4" />}
          label="Heart rate"
          value={heart_rate_bpm != null ? `${Math.round(heart_rate_bpm)} bpm` : "—"}
          sub={heart_rate_label ?? undefined}
          tone={heart_rate_label && heart_rate_label !== "Normal" ? "warn" : "normal"}
        />
        <Metric
          icon={<Waves className="h-4 w-4" />}
          label="Rhythm"
          value={rhythm_regularity ?? "—"}
          tone={rhythm_regularity === "Irregular" ? "warn" : "normal"}
        />
        <Metric
          icon={<Activity className="h-4 w-4" />}
          label="Reliability"
          value={cap(interpretation.reliability)}
          tone={interpretation.reliability === "high" ? "normal" : "warn"}
        />
      </div>

      {interpretation.findings.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {interpretation.findings.map((f, i) => (
            <li key={i} className="flex gap-2 text-[13px] text-foreground/90 leading-relaxed">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-neuro-primary flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-[10px] bg-neuro-primary/5 border border-neuro-primary/15 p-3">
        <div className="text-[10px] uppercase tracking-wide text-neuro-primary font-semibold mb-1">
          Recommendation
        </div>
        <p className="text-[13px] text-foreground/90 leading-relaxed">
          {interpretation.recommendation}
        </p>
      </div>

      {interpretation.caveats.length > 0 && (
        <ul className="mt-3 space-y-1">
          {interpretation.caveats.map((c, i) => (
            <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0 text-amber-500" />
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UnreliableNotice({
  interpretation,
}: {
  interpretation: EcgDiagnosticInterpretation;
}) {
  return (
    <div className="rounded-[16px] border-2 border-rose-300 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-rose-800 dark:text-rose-200">
            {interpretation.headline}
          </h2>
          {interpretation.findings.map((f, i) => (
            <p key={i} className="text-[13px] text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
              {f}
            </p>
          ))}

          {interpretation.caveats.length > 0 && (
            <ul className="mt-3 space-y-1">
              {interpretation.caveats.map((c, i) => (
                <li key={i} className="text-[12px] text-rose-700/90 dark:text-rose-300/90 flex gap-1.5">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-rose-500 flex-shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 rounded-[10px] bg-white/60 dark:bg-black/20 border border-rose-200 dark:border-rose-900/50 p-3">
            <div className="text-[10px] uppercase tracking-wide text-rose-600 dark:text-rose-400 font-semibold mb-1">
              What to do
            </div>
            <p className="text-[13px] text-rose-800 dark:text-rose-200 leading-relaxed">
              {interpretation.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReliabilityBadge({ reliability }: { reliability: string }) {
  const tone =
    reliability === "high"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
      : reliability === "moderate"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
        : "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300";
  return (
    <span className={cn("ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full", tone)}>
      {cap(reliability)} confidence
    </span>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  tone = "normal",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "normal" | "warn";
}) {
  return (
    <div className="rounded-[10px] border border-border bg-background/40 p-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        <span className={tone === "warn" ? "text-amber-500" : "text-neuro-primary"}>
          {icon}
        </span>
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div
        className={cn(
          "text-[15px] font-semibold leading-none",
          tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-foreground",
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
