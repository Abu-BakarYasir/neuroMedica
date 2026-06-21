// Pure helpers that turn module results into report items, plus list reordering.
// No DOM / network — unit-testable.

import type { EcgDiagnosisResponse } from "@/lib/ecg/types";
import type { CxrAnalysisResponse } from "@/lib/cxr/types";
import type { SymptomExploreResponse } from "@/lib/symptoms/types";
import type { CitationItem } from "@/lib/chatbot/types";
import type {
  CxrReportData,
  EcgReportData,
  ReportItem,
  ReportItemData,
  ReportItemKind,
} from "./types";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeItem(
  kind: ReportItemKind,
  title: string,
  markdown: string,
  data?: ReportItemData,
): ReportItem {
  return {
    id: newId(),
    kind,
    title,
    markdown: markdown.trim(),
    createdAt: nowIso(),
    ...(data ? { data } : {}),
  };
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function ecgToItem(result: EcgDiagnosisResponse): ReportItem {
  const interp = result.interpretation;
  const probLines = result.diagnoses
    .map((d) => `- ${d.code} (${d.name}): ${pct(d.probability)}${d.positive ? " — detected" : ""}`)
    .join("\n");

  const md = [
    `**Interpretation:** ${interp.headline}`,
    interp.heart_rate_bpm != null
      ? `**Heart rate:** ~${Math.round(interp.heart_rate_bpm)} bpm${
          interp.heart_rate_label ? ` (${interp.heart_rate_label})` : ""
        }`
      : "",
    interp.rhythm_regularity ? `**Rhythm:** ${interp.rhythm_regularity}` : "",
    ...interp.findings.map((f) => `- ${f}`),
    `**Recommendation:** ${interp.recommendation}`,
    interp.reliable ? "" : "**Note:** Image-based diagnosis is approximate and unverified.",
    `**Source:** ${result.source_format}`,
    "",
    "Diagnostic superclass probabilities:",
    probLines,
  ]
    .filter(Boolean)
    .join("\n");

  const data: EcgReportData = {
    topLabel: result.top_label,
    topCode: result.top_code,
    reliable: interp.reliable,
    reliability: interp.reliability,
    urgent: interp.urgent,
    headline: interp.headline,
    findings: interp.findings,
    recommendation: interp.recommendation,
    positiveCodes: result.positive_codes,
    diagnoses: result.diagnoses.map((d) => ({
      code: d.code,
      name: d.name,
      probability: d.probability,
      positive: d.positive,
    })),
    heartRateBpm: interp.heart_rate_bpm,
    heartRateLabel: interp.heart_rate_label,
    rhythmRegularity: interp.rhythm_regularity,
    sourceFormat: result.source_format,
  };
  return makeItem("ecg", "12-Lead ECG Diagnosis", md, data);
}

export function cxrToItem(
  result: CxrAnalysisResponse,
  imageDataUrl?: string | null,
): ReportItem {
  const detected = result.findings.filter((f) => f.detected);
  const lines = (detected.length ? detected : result.findings.slice(0, 3))
    .map((f) => `- ${f.name}: ${pct(f.probability)}${f.detected ? " (detected)" : ""}`)
    .join("\n");
  const md = [
    `**Overall:** ${result.predicted_abnormal ? "Abnormal" : "Normal"} (${pct(result.abnormal_probability)} abnormal probability)`,
    `**Top finding:** ${result.top_finding}`,
    `**Findings detected:** ${result.detected_count}`,
    "",
    lines,
  ].join("\n");
  const data: CxrReportData = {
    abnormalProbability: result.abnormal_probability,
    predictedAbnormal: result.predicted_abnormal,
    topFinding: result.top_finding,
    detectedCount: result.detected_count,
    imageDataUrl: imageDataUrl ?? null,
    findings: result.findings.map((f) => ({
      name: f.name,
      probability: f.probability,
      detected: f.detected,
    })),
  };
  return makeItem("cxr", "Chest X-ray Analysis", md, data);
}

export function symptomToItem(result: SymptomExploreResponse): ReportItem {
  const diffs = result.differentials
    .map(
      (d) =>
        `- **${d.condition}** (${d.likelihood}${d.icd10 ? `, ICD-10 ${d.icd10}` : ""})` +
        (d.rationale ? `\n  ${d.rationale}` : ""),
    )
    .join("\n");
  const workup = result.recommended_workup.map((w) => `- ${w}`).join("\n");
  const md = [
    `**Presenting symptoms:** ${result.symptoms}`,
    result.summary ? `\n${result.summary}` : "",
    diffs ? `\n**Differential:**\n${diffs}` : "",
    workup ? `\n**Recommended workup:**\n${workup}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return makeItem("symptom", "Symptom Explorer — Differential", md);
}

export function qaToItem(
  question: string,
  answer: string,
  citations: CitationItem[] = [],
): ReportItem {
  const sources = citations.length
    ? "\n\n**Sources:**\n" +
      citations
        .map((c) => `- [${c.index}] ${c.title || c.pmid}${c.url ? ` (${c.url})` : ""}`)
        .join("\n")
    : "";
  const md = `**Q:** ${question}\n\n${answer}${sources}`;
  const title = `Medical Q&A — ${question.length > 60 ? question.slice(0, 57) + "…" : question}`;
  return makeItem("qa", title, md);
}

export function noteToItem(text: string): ReportItem {
  return makeItem("note", "Clinical note", text);
}

/** Move an item up/down within the list. Out-of-range moves are no-ops. */
export function reorder(
  items: ReportItem[],
  id: string,
  dir: "up" | "down",
): ReportItem[] {
  const idx = items.findIndex((it) => it.id === id);
  if (idx === -1) return items;
  const target = dir === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[idx], next[target]] = [next[target], next[idx]];
  return next;
}
