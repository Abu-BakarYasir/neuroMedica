export type ReportItemKind = "ecg" | "cxr" | "qa" | "symptom" | "note";

/** A single captured section of a report (a module output or a free note). */
export interface ReportItem {
  id: string;
  kind: ReportItemKind;
  title: string;
  /** Markdown-ish body (headings, bullets, plain text). */
  markdown: string;
  createdAt: string;
}

/** A report row as stored in / returned from Supabase. */
export interface ReportRow {
  id: string;
  doctor_id: string;
  patient_id: string | null;
  patient_name: string | null;
  title: string;
  notes: string | null;
  items: ReportItem[];
  created_at: string;
  updated_at: string;
}

/** Payload for creating a report (doctor_id is set from the session). */
export interface ReportInput {
  title: string;
  patient_id?: string | null;
  patient_name?: string | null;
  notes?: string | null;
  items: ReportItem[];
}
