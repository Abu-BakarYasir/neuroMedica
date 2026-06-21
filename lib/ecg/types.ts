/** PTB-XL diagnostic superclass codes returned by the backend. */
export type SuperclassCode = "NORM" | "MI" | "STTC" | "CD" | "HYP";

export interface Diagnosis {
  code: SuperclassCode;
  name: string;
  description: string;
  clinical_significance: string;
  probability: number; // 0..1
  positive: boolean; // probability >= threshold
}

/** Clinician-readable interpretation + a trust gate for the probabilities. */
export interface EcgDiagnosticInterpretation {
  /** False for image uploads (12-lead digitization is approximate). */
  reliable: boolean;
  reliability: "high" | "moderate" | "low";
  /** True when a time-critical finding (MI) is present. */
  urgent: boolean;
  headline: string;
  findings: string[];
  recommendation: string;
  caveats: string[];
  heart_rate_bpm: number | null;
  heart_rate_label: string | null; // "Bradycardia" | "Normal" | "Tachycardia"
  rhythm_regularity: string | null; // "Regular" | "Irregular"
}

export interface EcgDiagnosisResponse {
  diagnoses: Diagnosis[]; // all 5 superclasses, severity-ordered
  top_code: SuperclassCode;
  top_label: string;
  positive_codes: SuperclassCode[];
  threshold: number;
  interpretation: EcgDiagnosticInterpretation;
  source_format: "wfdb" | "csv" | "image" | "sample";
  notes: Record<string, unknown>;
  disclaimer: string;
}

export interface EcgApiError {
  error: string;
  status?: number;
}
