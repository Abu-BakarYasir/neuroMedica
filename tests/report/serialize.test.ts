import { describe, it, expect } from "vitest";
import {
  ecgToItem,
  cxrToItem,
  symptomToItem,
  qaToItem,
  reorder,
} from "@/lib/report/serialize";
import type { ReportItem } from "@/lib/report/types";

describe("ecgToItem", () => {
  it("summarizes the ECG result", () => {
    const item = ecgToItem({
      summary: {
        total_beats: 10,
        dominant_class: "N",
        dominant_label: "Normal",
        class_counts: { N: 10, S: 0, V: 0, F: 0, Q: 0 },
        class_percentages: { N: 100, S: 0, V: 0, F: 0, Q: 0 },
        abnormal_beats: 0,
        abnormal_percentage: 0,
        mean_confidence: 1,
      },
      beats: [],
      classes: [],
      source_format: "sample",
      notes: {},
      disclaimer: "",
    });
    expect(item.kind).toBe("ecg");
    expect(item.title).toMatch(/ECG/);
    expect(item.markdown).toMatch(/Normal \(N\)/);
    expect(item.markdown).toMatch(/100%/);
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
