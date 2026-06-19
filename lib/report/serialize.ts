// Pure helpers that turn module results into report items, plus list reordering.
// No DOM / network — unit-testable.

import type { EcgAnalysisResponse } from "@/lib/ecg/types";
import type { CxrAnalysisResponse } from "@/lib/cxr/types";
import type { SymptomExploreResponse } from "@/lib/symptoms/types";
import type { CitationItem } from "@/lib/chatbot/types";
import type { ReportItem, ReportItemKind } from "./types";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeItem(kind: ReportItemKind, title: string, markdown: string): ReportItem {
  return { id: newId(), kind, title, markdown: markdown.trim(), createdAt: nowIso() };
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function ecgToItem(result: EcgAnalysisResponse): ReportItem {
  const s = result.summary;
  const dist = Object.entries(s.class_percentages)
    .filter(([, p]) => p > 0)
    .map(([code, p]) => `- ${code}: ${p}%`)
    .join("\n");
  const md = [
    `**Dominant rhythm:** ${s.dominant_label} (${s.dominant_class})`,
    `**Beats analyzed:** ${s.total_beats}`,
    `**Abnormal beats:** ${s.abnormal_beats} (${s.abnormal_percentage}%)`,
    `**Mean confidence:** ${pct(s.mean_confidence)}`,
    `**Source:** ${result.source_format}`,
    "",
    "Class distribution:",
    dist,
  ].join("\n");
  return makeItem("ecg", "ECG Signal Analysis", md);
}

export function cxrToItem(result: CxrAnalysisResponse): ReportItem {
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
  return makeItem("cxr", "Chest X-ray Analysis", md);
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
