"use client";

import {
  useRef,
  useEffect,
  KeyboardEvent,
  useState,
  ChangeEvent,
} from "react";
import {
  Send,
  Loader2,
  BookOpen,
  Paperclip,
  Upload,
  FileText,
  X,
  Pill,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  composeMessageWithAttachments,
  readFileAttachment,
  type ChatAttachment,
} from "@/lib/chatbot/attachments";
import { PrescriptionPicker } from "./prescription-picker";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  useRag?: boolean;
  onUseRagChange?: (value: boolean) => void;
}

export function ChatInput({
  onSend,
  isLoading = false,
  disabled = false,
  useRag = false,
  onUseRagChange,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [prescriptionPickerOpen, setPrescriptionPickerOpen] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [message]);

  // Close attach menu when clicking outside
  useEffect(() => {
    if (!attachMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        attachMenuRef.current &&
        !attachMenuRef.current.contains(e.target as Node)
      ) {
        setAttachMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [attachMenuOpen]);

  const handleSend = () => {
    const trimmed = message.trim();
    if ((!trimmed && attachments.length === 0) || isLoading || disabled) return;

    const composed = composeMessageWithAttachments(
      trimmed || "(See attached context.)",
      attachments
    );
    onSend(composed);
    setMessage("");
    setAttachments([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- attachment handlers ---

  const handleFilePick = () => {
    setAttachMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setAttachError(null);
    setIsReadingFile(true);
    try {
      const additions: ChatAttachment[] = [];
      for (const file of Array.from(files)) {
        const att = await readFileAttachment(file);
        additions.push(att);
      }
      setAttachments((prev) => [...prev, ...additions]);
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      setIsReadingFile(false);
      // reset so re-picking the same file fires onChange again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePrescriptionPick = () => {
    setAttachMenuOpen(false);
    setPrescriptionPickerOpen(true);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const canSend =
    (message.trim().length > 0 || attachments.length > 0) &&
    !isLoading &&
    !disabled;

  const attachedPrescriptionIds = attachments
    .filter((a): a is Extract<ChatAttachment, { kind: "prescription" }> => a.kind === "prescription")
    .map((a) => a.recordId);

  return (
    <div>
      {/* Attached items */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 px-1">
          {attachments.map((a) => (
            <AttachmentChip
              key={a.id}
              attachment={a}
              onRemove={() => removeAttachment(a.id)}
            />
          ))}
        </div>
      )}

      {attachError && (
        <p className="text-[11px] text-red-600 dark:text-red-400 mb-1.5 px-1">
          {attachError}
        </p>
      )}

      {/* Composer */}
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border border-border bg-card",
          "shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)]",
          "px-2 py-2 transition-colors focus-within:border-neuro-primary/50"
        )}
      >
        {/* Attach button + dropdown */}
        <div className="relative shrink-0" ref={attachMenuRef}>
          <button
            type="button"
            onClick={() => setAttachMenuOpen((o) => !o)}
            disabled={isLoading || disabled || isReadingFile}
            aria-label="Attach context"
            title="Attach context"
            className={cn(
              "inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isReadingFile ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </button>

          {attachMenuOpen && (
            <div
              role="menu"
              className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden z-20"
            >
              <button
                type="button"
                onClick={handlePrescriptionPick}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-muted"
              >
                <Pill className="w-4 h-4 mt-0.5 text-neuro-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium">Saved prescription</p>
                  <p className="text-[11px] text-muted-foreground">
                    Pick from your scanned records
                  </p>
                </div>
              </button>
              <div className="h-px bg-border" />
              <button
                type="button"
                onClick={handleFilePick}
                className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-muted"
              >
                <Upload className="w-4 h-4 mt-0.5 text-neuro-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium">Upload document</p>
                  <p className="text-[11px] text-muted-foreground">
                    Text, PDF or images
                  </p>
                </div>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.csv,.tsv,.json,.yaml,.yml,.xml,.html,.htm,.log,.sql,.pdf,image/*,text/*"
            className="hidden"
            onChange={handleFilesSelected}
          />
        </div>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Med Assistant…"
          disabled={isLoading || disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent text-sm leading-6 text-foreground placeholder:text-muted-foreground",
            "outline-none border-0 max-h-[200px] py-2 px-1",
            "disabled:opacity-50"
          )}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            "shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all",
            canSend
              ? "bg-neuro-primary text-white hover:bg-neuro-primary-dark"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Footer: RAG toggle + hint */}
      <div className="flex items-center justify-between gap-2 mt-2 px-1">
        {onUseRagChange ? (
          <button
            type="button"
            onClick={() => onUseRagChange(!useRag)}
            disabled={isLoading || disabled}
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2.5 py-1 border transition-colors",
              useRag
                ? "bg-neuro-primary/10 text-neuro-primary border-neuro-primary/30"
                : "bg-transparent text-muted-foreground border-border hover:border-neuro-primary/30 hover:text-foreground"
            )}
            title="Toggle evidence-based answers (RAG)"
          >
            <BookOpen className="w-3 h-3" />
            <span>Evidence-based</span>
            <span
              className={cn(
                "ml-0.5 inline-block w-1.5 h-1.5 rounded-full",
                useRag ? "bg-neuro-primary" : "bg-muted-foreground/50"
              )}
            />
          </button>
        ) : (
          <span />
        )}
        <p className="text-[10px] text-muted-foreground hidden sm:block">
          Med Assistant can make mistakes. Verify important information.
        </p>
      </div>

      <PrescriptionPicker
        open={prescriptionPickerOpen}
        onOpenChange={setPrescriptionPickerOpen}
        alreadyAttachedIds={attachedPrescriptionIds}
        onSelect={(att) => setAttachments((prev) => [...prev, att])}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Attachment chip                                                    */
/* ------------------------------------------------------------------ */

function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: ChatAttachment;
  onRemove: () => void;
}) {
  if (attachment.kind === "prescription") {
    const medCount = attachment.medications.length;
    return (
      <div className="inline-flex items-center gap-1.5 max-w-full rounded-full border border-neuro-primary/30 bg-neuro-primary/10 text-neuro-primary px-2.5 py-1">
        <Pill className="w-3 h-3 shrink-0" />
        <span className="text-[11px] font-medium truncate">
          Rx · {attachment.patientName}
          <span className="text-neuro-primary/70 font-normal">
            {" "}
            ({medCount} med{medCount === 1 ? "" : "s"})
          </span>
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove attachment"
          className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-neuro-primary/20"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // file
  const sizeLabel =
    attachment.size > 1024 * 1024
      ? `${(attachment.size / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(attachment.size / 1024))} KB`;

  return (
    <div className="inline-flex items-center gap-1.5 max-w-full rounded-full border border-border bg-muted text-foreground px-2.5 py-1">
      <FileText className="w-3 h-3 shrink-0 text-muted-foreground" />
      <span className="text-[11px] font-medium truncate" title={attachment.name}>
        {attachment.name}
        <span className="text-muted-foreground font-normal"> · {sizeLabel}</span>
        {attachment.isBinary && (
          <span className="text-muted-foreground font-normal"> · ref only</span>
        )}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove attachment"
        className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-foreground/10"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
