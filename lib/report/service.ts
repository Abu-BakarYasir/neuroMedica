"use client";

import { createClient } from "@/lib/supabase/client";
import type { ReportInput, ReportItem, ReportRow } from "./types";
import type {
  PatientReportSummary,
  PatientReportItemSummary,
} from "@/lib/chatbot/attachments";

/** Max characters of an item body embedded into a patient context block. */
const MAX_REPORT_ITEM_CHARS = 600;

function normaliseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function truncate(text: string, max = MAX_REPORT_ITEM_CHARS): string {
  const t = text.trim();
  return t.length > max ? t.slice(0, max) + " …[truncated]" : t;
}

/**
 * Condense one captured report section into a short, model-friendly line.
 * Prefers the structured ECG/X-ray payload when present, otherwise falls back
 * to the markdown body that every item carries.
 */
function summariseReportItem(item: ReportItem): PatientReportItemSummary {
  let body = "";

  if (item.kind === "ecg" && item.data && "topLabel" in item.data) {
    const d = item.data;
    const parts = [
      d.headline || d.topLabel,
      d.heartRateLabel ? `HR: ${d.heartRateLabel}` : null,
      d.urgent ? "⚠ flagged urgent" : null,
      d.recommendation ? `Recommendation: ${d.recommendation}` : null,
    ].filter(Boolean);
    body = parts.join(" · ");
  } else if (item.kind === "cxr" && item.data && "topFinding" in item.data) {
    const d = item.data;
    const pct = Math.round((d.abnormalProbability ?? 0) * 100);
    const detected = d.findings
      .filter((f) => f.detected)
      .map((f) => f.name)
      .join(", ");
    const parts = [
      `${d.predictedAbnormal ? "Abnormal" : "Normal"} (${pct}%)`,
      d.topFinding ? `top finding: ${d.topFinding}` : null,
      detected ? `detected: ${detected}` : null,
    ].filter(Boolean);
    body = parts.join(" · ");
  }

  // Fall back to (or supplement with) the markdown body for everything else.
  if (!body) body = item.markdown || "(no details recorded)";

  return {
    kind: item.kind,
    title: item.title,
    body: truncate(body),
  };
}

/**
 * Fetch the saved reports for a patient and condense them for the chat context
 * block. Matches manual patients by `patient_id` and prescription-derived
 * patients (synthetic `rx:<name>` ids) by normalised name — mirroring how the
 * Patients view unifies the two sources.
 */
export async function listPatientReportSummaries(
  patientId: string,
  name: string,
  limit = 12,
): Promise<PatientReportSummary[]> {
  const all = await listReports();
  const target = normaliseName(name);
  const isManual = !patientId.startsWith("rx:");

  return all
    .filter((r) => {
      if (isManual && r.patient_id && r.patient_id === patientId) return true;
      return normaliseName(r.patient_name ?? "") === target;
    })
    .slice(0, limit)
    .map((r) => ({
      title: r.title,
      createdAt: r.created_at,
      notes: r.notes,
      items: (r.items ?? []).map(summariseReportItem),
    }));
}

export async function listReports(): Promise<ReportRow[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ReportRow[];
}

export async function createReport(input: ReportInput): Promise<ReportRow> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to save a report.");

  const payload = {
    doctor_id: user.id,
    title: input.title.trim(),
    patient_id: input.patient_id ?? null,
    patient_name: input.patient_name?.trim() || null,
    notes: input.notes?.trim() || null,
    items: input.items,
  };

  const { data, error } = await supabase
    .from("reports")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as ReportRow;
}

export async function updateReport(
  id: string,
  patch: Partial<Pick<ReportInput, "title" | "notes" | "items">>,
): Promise<ReportRow> {
  const supabase = createClient();

  const payload: Record<string, unknown> = {};
  if (patch.title !== undefined) payload.title = patch.title.trim();
  if (patch.notes !== undefined) payload.notes = patch.notes?.trim() || null;
  if (patch.items !== undefined) payload.items = patch.items;

  const { data, error } = await supabase
    .from("reports")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as ReportRow;
}

export async function deleteReport(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
