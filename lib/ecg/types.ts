/** AAMI EC57 5-class heartbeat codes returned by the backend. */
export type BeatClassCode = "N" | "S" | "V" | "F" | "Q";

export interface ClassInfo {
  code: BeatClassCode;
  name: string;
  description: string;
  clinical_significance: string;
}

export interface BeatPrediction {
  index: number;
  predicted_class: BeatClassCode;
  predicted_label: string;
  confidence: number; // 0..1
  probabilities: Record<BeatClassCode, number>;
  waveform: number[]; // 187 normalized samples
}

export interface AnalysisSummary {
  total_beats: number;
  dominant_class: BeatClassCode;
  dominant_label: string;
  class_counts: Record<BeatClassCode, number>;
  class_percentages: Record<BeatClassCode, number>;
  abnormal_beats: number;
  abnormal_percentage: number;
  mean_confidence: number;
}

export interface EcgAnalysisResponse {
  summary: AnalysisSummary;
  beats: BeatPrediction[];
  classes: ClassInfo[];
  source_format: "wide" | "long" | "sample";
  notes: Record<string, unknown>;
  disclaimer: string;
}

export interface EcgApiError {
  error: string;
  status?: number;
}
