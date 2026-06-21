import { describe, it, expect } from "vitest";
import {
  ecgToItem,
  cxrToItem,
  symptomToItem,
  qaToItem,
  reorder,
} from "@/lib/report/serialize";
import type { ReportItem } from "@/lib/report/types";

import type { EcgDiagnosisResponse } from "@/lib/ecg/types";

const NORMAL_DIAGNOSIS: EcgDiagnosisResponse = {
  diagnoses: [
    { code: "MI", name: "Myocardial Infarction", description: "", clinical_significance: "", probability: 0.05, positive: false },
    { code: "CD", name: "Conduction Disturbance", description: "", clinical_significance: "", probability: 0.04, positive: false },
    { code: "STTC", name: "ST/T Change", description: "", clinical_significance: "", probability: 0.06, positive: false },
    { code: "HYP", name: "Hypertrophy", description: "", clinical_significance: "", probability: 0.03, positive: false },
    { code: "NORM", name: "Normal ECG", description: "", clinical_significance: "", probability: 0.95, positive: true },
  ],
  top_code: "NORM",
  top_label: "Normal ECG",
  positive_codes: ["NORM"],
  threshold: 0.5,
  interpretation: {
    reliable: true,
    reliability: "high",
    urgent: false,
    headline: "Normal ECG (NORM 95%).",
    findings: ["Ventricular rate ≈ 72 bpm — Normal.", "Rhythm appears regular."],
    recommendation: "Within normal limits on automated analysis.",
    caveats: [],
    heart_rate_bpm: 72,
    heart_rate_label: "Normal",
    rhythm_regularity: "Regular",
  },
  source_format: "wfdb",
  notes: {},
  disclaimer: "",
};

describe("ecgToItem", () => {
  it("summarizes the diagnostic result", () => {
    const item = ecgToItem(NORMAL_DIAGNOSIS);
    expect(item.kind).toBe("ecg");
    expect(item.title).toMatch(/ECG/);
    expect(item.markdown).toMatch(/Interpretation:/);
    expect(item.markdown).toMatch(/NORM/);
    expect(item.markdown).toMatch(/72 bpm/);
  });

  it("captures structured diagnoses in data", () => {
    const item = ecgToItem(NORMAL_DIAGNOSIS);
    expect(item.data && "diagnoses" in item.data).toBe(true);
    if (item.data && "diagnoses" in item.data) {
      expect(item.data.diagnoses).toHaveLength(5);
      expect(item.data.topCode).toBe("NORM");
    }
  });

  it("flags an urgent MI finding", () => {
    const mi: EcgDiagnosisResponse = {
      ...NORMAL_DIAGNOSIS,
      top_code: "MI",
      top_label: "Myocardial Infarction",
      positive_codes: ["MI"],
      interpretation: {
        ...NORMAL_DIAGNOSIS.interpretation,
        urgent: true,
        headline: "Abnormal ECG — Myocardial Infarction detected.",
      },
    };
    const item = ecgToItem(mi);
    expect(item.data && "diagnoses" in item.data && item.data.urgent).toBe(true);
  });
});

describe("cxrToItem", () => {
  it("lists detected findings", () => {
    const item = cxrToItem({
      abnormal_probability: 0.9,
      predicted_abnormal: true,
      detected_count: 1,
      top_finding: "Pneumonia",
      findings: [
        {
          code: "pna",
          name: "Pneumonia",
          probability: 0.9,
          detected: true,
          description: "",
          clinical_significance: "",
        },
      ],
      notes: {},
      disclaimer: "",
    });
    expect(item.kind).toBe("cxr");
    expect(item.markdown).toMatch(/Abnormal/);
    expect(item.markdown).toMatch(/Pneumonia: 90%/);
  });
});

describe("symptomToItem", () => {
  it("includes differentials and workup", () => {
    const item = symptomToItem({
      symptoms: "fever, cough",
      differentials: [
        {
          condition: "Pneumonia",
          icd10: "J18.9",
          snomed: null,
          likelihood: "high",
          rationale: "classic",
          supporting_citations: [1],
          red_flags: null,
        },
      ],
      summary: "Likely pneumonia.",
      recommended_workup: ["Chest X-ray"],
      structured: true,
      citations: [],
      confidence: "high",
      disclaimer: "",
    });
    expect(item.kind).toBe("symptom");
    expect(item.markdown).toMatch(/Pneumonia/);
    expect(item.markdown).toMatch(/ICD-10 J18\.9/);
    expect(item.markdown).toMatch(/Chest X-ray/);
  });
});

describe("qaToItem", () => {
  it("formats Q, answer, and sources", () => {
    const item = qaToItem("What is metformin?", "A biguanide.", [
      { index: 1, pmid: "123", title: "Metformin review", source_type: "pubmed", url: "u" },
    ]);
    expect(item.kind).toBe("qa");
    expect(item.markdown).toMatch(/\*\*Q:\*\* What is metformin\?/);
    expect(item.markdown).toMatch(/A biguanide\./);
    expect(item.markdown).toMatch(/Metformin review/);
  });
});

describe("reorder", () => {
  const items: ReportItem[] = [
    { id: "a", kind: "note", title: "A", markdown: "", createdAt: "" },
    { id: "b", kind: "note", title: "B", markdown: "", createdAt: "" },
    { id: "c", kind: "note", title: "C", markdown: "", createdAt: "" },
  ];
  it("moves an item up", () => {
    expect(reorder(items, "b", "up").map((i) => i.id)).toEqual(["b", "a", "c"]);
  });
  it("moves an item down", () => {
    expect(reorder(items, "b", "down").map((i) => i.id)).toEqual(["a", "c", "b"]);
  });
  it("clamps at the top", () => {
    expect(reorder(items, "a", "up").map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
  it("clamps at the bottom", () => {
    expect(reorder(items, "c", "down").map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
  it("is a no-op for unknown id", () => {
    expect(reorder(items, "z", "up").map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
});
