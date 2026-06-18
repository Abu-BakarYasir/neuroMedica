import type { CitationItem } from "@/lib/chatbot/types";

export type Likelihood = "high" | "moderate" | "low";

export interface Differential {
  condition: string;
  icd10?: string | null;
  snomed?: string | null;
  likelihood: Likelihood;
  rationale: string;
  supporting_citations: number[];
  red_flags?: string | null;
}

export interface SymptomExploreResponse {
  symptoms: string;
  differentials: Differential[];
  summary: string;
  recommended_workup: string[];
  /** False when the model returned prose instead of structured JSON (summary holds it). */
  structured: boolean;
  citations: CitationItem[];
  confidence: string;
  disclaimer: string;
}
