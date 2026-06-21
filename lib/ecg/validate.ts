// Validation for 12-lead ECG uploads.
//
// The analyzer accepts:
//   * WFDB — a .hea header + its .dat signal file (the PTB-XL native format)
//   * CSV  — a single 12-column file (one column per lead)
//   * Image — a single 12-lead chart photo/scan (best-effort digitization)
// SVG/PDF can't be used, so we reject those up front with a clear message.

/** Minimal shape we need from a File (keeps this unit-testable). */
export interface FileLike {
  name: string;
  type: string;
}

const RASTER_IMAGE_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".heic", ".heif", ".tif", ".tiff",
];

function hasExtension(name: string, exts: string[]): boolean {
  const lower = name.toLowerCase();
  return exts.some((ext) => lower.endsWith(ext));
}

export function isImageFile(file: FileLike): boolean {
  if (file.type && file.type.startsWith("image/") && file.type !== "image/svg+xml") {
    return true;
  }
  return hasExtension(file.name, RASTER_IMAGE_EXTENSIONS);
}

function isUnsupported(file: FileLike): boolean {
  return (
    file.type === "application/pdf" ||
    file.type === "image/svg+xml" ||
    hasExtension(file.name, [".pdf", ".svg"])
  );
}

/**
 * Validate the selected file set. Returns an error message, or null when
 * acceptable. The backend does the authoritative parsing.
 */
export function validateEcgFiles(files: FileLike[]): string | null {
  if (!files.length) return "Select a file to analyze.";
  if (files.some(isUnsupported)) {
    return "PDF and SVG files aren't supported. Upload WFDB (.hea/.dat), a 12-column CSV, or a PNG/JPG image of the 12-lead chart.";
  }

  const hea = files.filter((f) => hasExtension(f.name, [".hea"]));
  const dat = files.filter((f) => hasExtension(f.name, [".dat"]));
  const isWfdb = hea.length > 0 || dat.length > 0;

  if (isWfdb) {
    if (hea.length !== 1 || dat.length < 1) {
      return "For WFDB, select both the .hea header and its matching .dat file.";
    }
    return null;
  }

  if (files.length > 1) {
    return "Upload a single CSV or image, or a WFDB .hea + .dat pair.";
  }
  return null; // single CSV or image
}
