import { describe, it, expect } from "vitest";
import { isImageFile, validateEcgFiles } from "@/lib/ecg/validate";

describe("isImageFile", () => {
  it("detects images by MIME type", () => {
    expect(isImageFile({ name: "scan", type: "image/png" })).toBe(true);
    expect(isImageFile({ name: "x.csv", type: "image/jpeg" })).toBe(true);
  });

  it("detects images by extension when type is missing", () => {
    expect(isImageFile({ name: "ecg.PNG", type: "" })).toBe(true);
    expect(isImageFile({ name: "ecg.jpeg", type: "" })).toBe(true);
  });

  it("does not flag CSV/text files", () => {
    expect(isImageFile({ name: "ecg.csv", type: "text/csv" })).toBe(false);
    expect(isImageFile({ name: "ecg.txt", type: "text/plain" })).toBe(false);
  });
});

describe("isImageFile", () => {
  it("does not flag SVG as a (raster) image", () => {
    expect(isImageFile({ name: "ecg.svg", type: "image/svg+xml" })).toBe(false);
  });
});

describe("validateEcgFiles", () => {
  it("accepts a single raster image upload", () => {
    expect(validateEcgFiles([{ name: "ecg.png", type: "image/png" }])).toBeNull();
    expect(validateEcgFiles([{ name: "strip.JPG", type: "" }])).toBeNull();
  });

  it("accepts a single CSV upload", () => {
    expect(validateEcgFiles([{ name: "ecg.csv", type: "text/csv" }])).toBeNull();
  });

  it("accepts a WFDB .hea + .dat pair", () => {
    expect(
      validateEcgFiles([
        { name: "rec.hea", type: "" },
        { name: "rec.dat", type: "" },
      ]),
    ).toBeNull();
  });

  it("rejects a lone .hea without its .dat", () => {
    const err = validateEcgFiles([{ name: "rec.hea", type: "" }]);
    expect(err).toMatch(/\.dat/);
  });

  it("rejects PDF uploads with guidance", () => {
    const err = validateEcgFiles([{ name: "ecg.pdf", type: "application/pdf" }]);
    expect(err).toMatch(/PDF/);
  });

  it("rejects SVG uploads with guidance", () => {
    const err = validateEcgFiles([{ name: "ecg.svg", type: "image/svg+xml" }]);
    expect(err).toMatch(/SVG/);
  });

  it("rejects multiple non-WFDB files", () => {
    const err = validateEcgFiles([
      { name: "a.png", type: "image/png" },
      { name: "b.png", type: "image/png" },
    ]);
    expect(err).toMatch(/single/i);
  });

  it("errors on an empty selection", () => {
    expect(validateEcgFiles([])).toMatch(/Select/);
  });
});
