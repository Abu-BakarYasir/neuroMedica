import { describe, it, expect } from "vitest";
import { splitSymptoms } from "@/lib/symptoms/parse";

describe("splitSymptoms", () => {
  it("splits on commas and trims", () => {
    expect(splitSymptoms("fever, cough , chest pain")).toEqual([
      "fever",
      "cough",
      "chest pain",
    ]);
  });

  it("splits on semicolons and newlines too", () => {
    expect(splitSymptoms("fever; cough\nchest pain")).toEqual([
      "fever",
      "cough",
      "chest pain",
    ]);
  });

  it("drops empties and trailing separators", () => {
    expect(splitSymptoms("fever,, ,cough,")).toEqual(["fever", "cough"]);
  });

  it("dedupes case-insensitively, keeping first form", () => {
    expect(splitSymptoms("Fever, fever, FEVER")).toEqual(["Fever"]);
  });

  it("returns [] for blank input", () => {
    expect(splitSymptoms("   ")).toEqual([]);
    expect(splitSymptoms("")).toEqual([]);
  });
});
