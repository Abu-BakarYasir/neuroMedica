import type { EcgDiagnosisResponse } from "./types";

export interface AnalyzeOptions {
  /** Sampling rate for a 12-column CSV upload (ignored for WFDB/image). */
  samplingRateHz?: number;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`;
}

/**
 * Analyze a 12-lead recording. Accepts one or more files:
 *  - WFDB: pass both the .hea and .dat files
 *  - CSV : a single 12-column file
 *  - Image: a single 12-lead chart image
 */
export async function analyzeFiles(
  files: File[],
  options: AnalyzeOptions = {},
): Promise<EcgDiagnosisResponse> {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  if (options.samplingRateHz) {
    form.append("sampling_rate_hz", String(options.samplingRateHz));
  }
  const res = await fetch("/api/ecg/analyze", { method: "POST", body: form });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as EcgDiagnosisResponse;
}

export async function analyzeSample(): Promise<EcgDiagnosisResponse> {
  const res = await fetch("/api/ecg/analyze?sample=1", { method: "POST" });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as EcgDiagnosisResponse;
}
