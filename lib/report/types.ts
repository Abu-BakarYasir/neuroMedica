export type ReportItemKind = "ecg" | "cxr" | "qa" | "symptom" | "note";

/** One diagnostic superclass row captured for the report. */
export interface EcgDiagnosisRow {
  code: string;
  name: string;
  probability: number; // 0..1
  positive: boolean;
}

/** Structured 12-lead diagnostic payload for rich report rendering. */
export interface EcgReportData {
  topLabel: string;
  topCode: string;
  reliable: boolean;
  reliability: string;
  urgent: boolean;
  headline: string;
  findings: string[];
  recommendation: string;
  positiveCodes: string[];
  diagnoses: EcgDiagnosisRow[];
  heartRateBpm: number | null;
  heartRateLabel: string | null;
  rhythmRegularity: string | null;
  sourceFormat: string;
}

/** Structured chest X-ray payload used to render the image + findings table. */
export interface CxrReportData {
  abnormalProbability: number; // 0..1
  predictedAbnormal: boolean;
  topFinding: string;
  detectedCount: number;
  /** Base64 data URL of the uploaded radiograph (persists inside JSONB). */
  imageDataUrl?: string | null;
  findings: { name: string; probability: number; detected: boolean }[];
}

/** Rich, kind-specific payload attached to a captured section (when available). */
export type ReportItemData = EcgReportData | CxrReportData;

/** A single captured section of a report (a module output or a free note). */
export interface ReportItem {
  id: string;
  kind: ReportItemKind;
  title: string;
  /** Markdown-ish body (headings, bullets, plain text) — back-compat fallback. */
  markdown: string;
  createdAt: string;
  /**
   * Optional structured payload for rich rendering (ECG waveforms, X-ray image
   * + findings). Absent on `qa`/`symptom`/`note` and on legacy saved reports,
   * which fall back to `markdown`.
   */
  data?: ReportItemData;
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
