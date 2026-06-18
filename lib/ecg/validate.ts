// Validation for ECG uploads.
//
// The ECG analyzer accepts a numeric signal (CSV of samples) OR a raster image
// of a single-lead rhythm strip (PNG/JPG/…), which the backend digitizes into a
// signal before classification. Vector/document formats (SVG, PDF) can't be
// digitized, so we reject those up front with a clear, actionable message.

/** Minimal shape we need from a File (keeps this unit-testable). */
export interface FileLike {
  name: string;
  type: string;
}

const RASTER_IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".bmp",
  ".webp",
  ".heic",
  ".heif",
  ".tif",
  ".tiff",
];

// Image-ish formats we explicitly cannot digitize.
const UNSUPPORTED_EXTENSIONS = [".svg", ".pdf"];

function hasExtension(name: string, exts: string[]): boolean {
  const lower = name.toLowerCase();
  return exts.some((ext) => lower.endsWith(ext));
}

/** True when the file looks like a raster image (by MIME type or extension). */
export function isImageFile(file: FileLike): boolean {
  if (file.type && file.type.startsWith("image/") && file.type !== "image/svg+xml") {
    return true;
  }
  return hasExtension(file.name, RASTER_IMAGE_EXTENSIONS);
}

/**
 * Validate an ECG upload. Returns an error message, or null when acceptable.
 * Raster images and CSV/text pass through (the backend does the authoritative
 * parsing/digitization). SVG and PDF are rejected with guidance.
 */
export function validateEcgFile(file: FileLike): string | null {
  const isPdf =
    file.type === "application/pdf" || hasExtension(file.name, [".pdf"]);
  const isSvg =
    file.type === "image/svg+xml" || hasExtension(file.name, [".svg"]);
  if (isPdf || isSvg || hasExtension(file.name, UNSUPPORTED_EXTENSIONS)) {
    return "PDF and SVG files aren't supported. Upload a PNG/JPG image of a single-lead ECG strip, or the signal as a CSV.";
  }
  return null;
}
