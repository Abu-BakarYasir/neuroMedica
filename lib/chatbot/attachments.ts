/**
 * Attachment model for the chat composer.
 *
 * Two sources are supported today:
 *  - A saved prescription record from the doctor's own `prescriptions` table.
 *  - A document the doctor uploads from disk (text, image, or PDF).
 *
 * For text-like files we extract the contents in the browser and embed them
 * into the outgoing prompt. For binary formats we attach the filename and
 * metadata so the model at least knows a document was referenced.
 */

export type AttachmentKind = "prescription" | "file";

export interface PrescriptionAttachment {
  id: string;                 // local UI id
  kind: "prescription";
  recordId: string;           // supabase row id
  patientName: string;
  prescriptionDate: string | null;
  createdAt: string;
  medications: Array<{
    medicine_name?: string | null;
    dosage?: string | null;
    frequency?: string | null;
  }>;
}

export interface FileAttachment {
  id: string;                 // local UI id
  kind: "file";
  name: string;
  size: number;               // bytes
  mimeType: string;
  /** Extracted text content for plain-text-ish files. Empty for binary. */
  textContent: string;
  /** True when textContent could not be read (binary / too large). */
  isBinary: boolean;
}

export type ChatAttachment = PrescriptionAttachment | FileAttachment;

// ---------------------------------------------------------------------------
//  Limits
// ---------------------------------------------------------------------------

/** Max size we'll try to read as text (1 MB). */
export const MAX_FILE_TEXT_BYTES = 1_000_000;

/** Cap a single file's embedded text so a giant log doesn't blow the prompt. */
export const MAX_EMBED_CHARS_PER_FILE = 20_000;

/** Mime types we treat as plain-text and try to extract. */
const TEXT_MIME_PREFIXES = ["text/"];
const TEXT_MIME_EXACT = new Set([
  "application/json",
  "application/xml",
  "application/x-yaml",
  "application/yaml",
  "application/javascript",
  "application/sql",
]);
const TEXT_EXTENSIONS = new Set([
  "txt", "md", "csv", "tsv", "json", "yaml", "yml",
  "xml", "html", "htm", "log", "sql",
]);

export function isTextLike(file: File): boolean {
  if (TEXT_MIME_PREFIXES.some((p) => file.type.startsWith(p))) return true;
  if (TEXT_MIME_EXACT.has(file.type)) return true;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return Boolean(ext && TEXT_EXTENSIONS.has(ext));
}

// ---------------------------------------------------------------------------
//  Reading files
// ---------------------------------------------------------------------------

export async function readFileAttachment(file: File): Promise<FileAttachment> {
  const id = crypto.randomUUID();
  const base: Omit<FileAttachment, "textContent" | "isBinary"> = {
    id,
    kind: "file",
    name: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
  };

  if (!isTextLike(file) || file.size > MAX_FILE_TEXT_BYTES) {
    return { ...base, textContent: "", isBinary: true };
  }

  const text = await file.text();
  const truncated =
    text.length > MAX_EMBED_CHARS_PER_FILE
      ? text.slice(0, MAX_EMBED_CHARS_PER_FILE) + "\n…[truncated]"
      : text;
  return { ...base, textContent: truncated, isBinary: false };
}

// ---------------------------------------------------------------------------
//  Formatting attachments into a prompt context block
// ---------------------------------------------------------------------------

function formatPrescription(p: PrescriptionAttachment): string {
  const meds =
    p.medications.length > 0
      ? p.medications
          .map((m, i) => {
            const parts = [
              m.medicine_name ?? "(unnamed)",
              m.dosage ? `dose: ${m.dosage}` : null,
              m.frequency ? `freq: ${m.frequency}` : null,
            ].filter(Boolean);
            return `  ${i + 1}. ${parts.join(" — ")}`;
          })
          .join("\n")
      : "  (no medications recorded)";

  return [
    `### Saved prescription`,
    `- Patient: ${p.patientName || "Unknown"}`,
    `- Prescription date: ${p.prescriptionDate || "Unknown"}`,
    `- Digitized: ${new Date(p.createdAt).toLocaleString()}`,
    `- Medications:`,
    meds,
  ].join("\n");
}

function formatFile(f: FileAttachment): string {
  const sizeKb = (f.size / 1024).toFixed(1);
  const header = `### Attached file: ${f.name} (${f.mimeType || "unknown"}, ${sizeKb} KB)`;
  if (f.isBinary || !f.textContent) {
    return [
      header,
      "_(binary or non-text file — contents not extracted; the doctor expects you to take the filename as a reference only.)_",
    ].join("\n");
  }
  return [
    header,
    "```",
    f.textContent,
    "```",
  ].join("\n");
}

/**
 * Build a single prompt that prepends attached context to the user's message.
 * Returns the original message unchanged when nothing is attached.
 */
export function composeMessageWithAttachments(
  userMessage: string,
  attachments: ChatAttachment[]
): string {
  if (attachments.length === 0) return userMessage;

  const blocks = attachments.map((a) =>
    a.kind === "prescription" ? formatPrescription(a) : formatFile(a)
  );

  return [
    "The doctor has shared the following context with you. Use it when relevant to answer the question.",
    "",
    blocks.join("\n\n"),
    "",
    "---",
    "",
    userMessage,
  ].join("\n");
}
