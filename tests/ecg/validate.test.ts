import { describe, it, expect } from "vitest";
import { isImageFile, validateEcgFile } from "@/lib/ecg/validate";

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

describe("validateEcgFile", () => {
  it("accepts raster image uploads (digitized by the backend)", () => {
    expect(validateEcgFile({ name: "ecg.png", type: "image/png" })).toBeNull();
    expect(validateEcgFile({ name: "strip.JPG", type: "" })).toBeNull();
  });

  it("rejects PDF uploads with guidance", () => {
    const err = validateEcgFile({ name: "ecg.pdf", type: "application/pdf" });
    expect(err).toMatch(/PDF/);
    expect(err).toMatch(/CSV/);
  });

  it("rejects SVG uploads with guidance", () => {
    const err = validateEcgFile({ name: "ecg.svg", type: "image/svg+xml" });
    expect(err).toMatch(/SVG/);
  });

  it("accepts CSV uploads", () => {
    expect(validateEcgFile({ name: "ecg.csv", type: "text/csv" })).toBeNull();
  });

  it("accepts unknown non-image types (backend validates)", () => {
    expect(validateEcgFile({ name: "data", type: "" })).toBeNull();
  });
});
