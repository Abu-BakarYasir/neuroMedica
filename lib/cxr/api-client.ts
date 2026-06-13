import type { CxrAnalysisResponse } from "./types";

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`;
}

export async function analyzeXray(file: File): Promise<CxrAnalysisResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/cxr/analyze", {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as CxrAnalysisResponse;
}
