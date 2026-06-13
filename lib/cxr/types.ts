/** Per-pathology prediction returned by the chest X-ray backend. */
export interface PathologyPrediction {
  code: string;
  name: string;
  probability: number; // 0..1
  detected: boolean;
  description: string;
  clinical_significance: string;
}

export interface CxrAnalysisResponse {
  abnormal_probability: number; // 0..1
  predicted_abnormal: boolean;
  detected_count: number;
  top_finding: string;
  findings: PathologyPrediction[]; // all 14, ranked high→low
  notes: Record<string, unknown>;
  disclaimer: string;
}

export interface CxrApiError {
  error: string;
  status?: number;
}
