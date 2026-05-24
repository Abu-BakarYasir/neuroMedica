import type { EcgAnalysisResponse } from "./types";

export interface AnalyzeOptions {
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

export async function analyzeFile(
  file: File,
  options: AnalyzeOptions = {},
): Promise<EcgAnalysisResponse> {
  const form = new FormData();
  form.append("file", file);
  if (options.samplingRateHz) {
    form.append("sampling_rate_hz", String(options.samplingRateHz));
  }
  const res = await fetch("/api/ecg/analyze", {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as EcgAnalysisResponse;
}

export async function analyzeSample(): Promise<EcgAnalysisResponse> {
  const res = await fetch("/api/ecg/analyze?sample=1", { method: "POST" });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as EcgAnalysisResponse;
}
