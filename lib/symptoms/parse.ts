// Pure helpers for the Symptom Explorer input.

/**
 * Split free text into a deduped list of trimmed symptom tokens.
 * Accepts commas, semicolons, and newlines as separators.
 */
export function splitSymptoms(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of text.split(/[,;\n]+/)) {
    const s = part.trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}
