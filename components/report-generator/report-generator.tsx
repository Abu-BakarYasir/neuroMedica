"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Loader2,
  Download,
  Save,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getDraft,
  removeItem,
  moveItem,
  clearDraft,
  DRAFT_EVENT,
} from "@/lib/report/draft";
import { createReport, listReports, deleteReport } from "@/lib/report/service";
import { listUnifiedPatients } from "@/lib/patients/service";
import type { ReportItem, ReportRow } from "@/lib/report/types";
import type { UnifiedPatient } from "@/lib/patients/types";

const KIND_LABEL: Record<ReportItem["kind"], string> = {
  ecg: "ECG",
  cxr: "Chest X-ray",
  qa: "Medical Q&A",
  symptom: "Symptom Explorer",
  note: "Note",
};

const DISCLAIMER =
  "This report is for educational purposes only. AI-generated content must be verified by a qualified clinician.";

function fmtDate(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

/** Minimal markdown-lite → React (bold, bullets) for the printable report. */
function renderMd(text: string) {
  return text.split("\n").map((line, i) => {
    const bullet = /^\s*[-*]\s+/.test(line);
    const content = line.replace(/^\s*[-*]\s+/, "");
    const parts = content.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={j}>{p.slice(2, -2)}</strong>
      ) : (
        <span key={j}>{p}</span>
      ),
    );
    return (
      <div key={i} style={{ paddingLeft: bullet ? 16 : 0 }}>
        {bullet ? "• " : ""}
        {parts}
      </div>
    );
  });
}

async function exportPdf(node: HTMLElement, filename: string) {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pageW) / canvas.width;
  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(img, "PNG", 0, position, pageW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(img, "PNG", 0, position, pageW, imgH);
    heightLeft -= pageH;
  }
  pdf.save(filename);
}

interface ReportView {
  title: string;
  patientName: string | null;
  dateStr: string;
  items: ReportItem[];
  notes: string | null;
}

export function ReportGenerator() {
  const [draft, setDraft] = useState<ReportItem[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patients, setPatients] = useState<UnifiedPatient[]>([]);

  const [saved, setSaved] = useState<ReportRow[]>([]);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ReportRow | null>(null);

  const draftPrintRef = useRef<HTMLDivElement>(null);
  const viewPrintRef = useRef<HTMLDivElement>(null);

  // Offscreen printable nodes use new Date() and localStorage — render them
  // only after mount to avoid SSR/client hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Live-sync the draft from localStorage.
  useEffect(() => {
    const sync = () => setDraft(getDraft());
    sync();
    window.addEventListener(DRAFT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DRAFT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    listUnifiedPatients().then(setPatients).catch(() => {});
  }, []);

  const loadSaved = useCallback(async () => {
    setSavedNote(null);
    try {
      setSaved(await listReports());
    } catch (e) {
      setSaved([]);
      setSavedNote(
        e instanceof Error && /reports/.test(e.message)
          ? "Saved reports are unavailable — the reports table hasn't been created yet."
          : e instanceof Error
            ? e.message
            : "Could not load saved reports.",
      );
    }
  }, []);

  useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  const patientNames = useMemo(
    () =>
      patients.map((p) => (p.source === "manual" ? p.row.name : p.name)),
    [patients],
  );

  const canSave = title.trim().length > 0 && draft.length > 0 && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const manual = patients.find(
        (p) => p.source === "manual" && p.row.name === patientName,
      );
      await createReport({
        title: title.trim(),
        patient_name: patientName || null,
        patient_id: manual && manual.source === "manual" ? manual.row.id : null,
        notes: notes || null,
        items: draft,
      });
      clearDraft();
      setTitle("");
      setNotes("");
      setPatientName("");
      await loadSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save report.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    try {
      await deleteReport(id);
      if (viewing?.id === id) setViewing(null);
      await loadSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete report.");
    }
  };

  const draftView: ReportView = {
    title: title.trim() || "Untitled report",
    patientName: patientName || null,
    dateStr: new Date().toLocaleString(),
    items: draft,
    notes: notes || null,
  };

  const viewingView: ReportView | null = viewing
    ? {
        title: viewing.title,
        patientName: viewing.patient_name,
        dateStr: fmtDate(viewing.created_at),
        items: viewing.items ?? [],
        notes: viewing.notes,
      }
    : null;

  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report";

  return (
    <div className="w-full max-w-[1100px] mx-auto px-2 pb-10">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-neuro-primary/15 to-neuro-primary/5 flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-neuro-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#212121]">
            Report Generator
          </h1>
          <p className="text-[13px] text-[#525252] mt-0.5">
            Assemble outputs captured from ECG, Chest X-ray, Medical Q&amp;A, and
            Symptom Explorer into a structured report, then save or export to PDF.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-[14px] border border-rose-200 bg-rose-50 p-4">
          <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <p className="text-[12px] text-rose-700">{error}</p>
        </div>
      )}

      {/* Compose */}
      <div className="rounded-[16px] border border-[#E5E5E5] bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[12px] text-[#525252] mb-1 block">Report title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cardiopulmonary workup — J. Doe"
            />
          </div>
          <div>
            <label className="text-[12px] text-[#525252] mb-1 block">Patient (optional)</label>
            <select
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Unassigned</option>
              {patientNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[12px] text-[#525252] mb-1 block">Clinical notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add context, impression, or plan…"
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neuro-primary/30"
          />
        </div>

        {/* Draft items */}
        <div>
          <div className="text-[12px] text-[#525252] mb-2">
            Captured sections ({draft.length})
          </div>
          {draft.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#E5E5E5] bg-[#FAFAFA] p-5 text-center text-[12px] text-[#767676]">
              No sections yet. Open ECG, Chest X-ray, Medical Q&amp;A, or Symptom
              Explorer, run an analysis, and click <strong>Add to report</strong>.
            </div>
          ) : (
            <div className="space-y-2">
              {draft.map((it, idx) => (
                <div
                  key={it.id}
                  className="flex items-start gap-2 rounded-[12px] border border-[#EDEDED] bg-white p-3"
                >
                  <span className="text-[10px] uppercase tracking-wide font-semibold text-neuro-primary bg-neuro-primary/10 rounded px-1.5 py-0.5 mt-0.5 flex-shrink-0">
                    {KIND_LABEL[it.kind]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#212121] truncate">
                      {it.title}
                    </div>
                    <div className="text-[11px] text-[#767676] line-clamp-2 whitespace-pre-wrap">
                      {it.markdown.replace(/\*\*/g, "")}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <IconBtn
                      label="Move up"
                      disabled={idx === 0}
                      onClick={() => moveItem(it.id, "up")}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn
                      label="Move down"
                      disabled={idx === draft.length - 1}
                      onClick={() => moveItem(it.id, "down")}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Remove" onClick={() => removeItem(it.id)}>
                      <X className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          {draft.length > 0 && (
            <Button variant="ghost" onClick={() => clearDraft()} className="text-[#767676]">
              <Trash2 className="h-4 w-4" />
              Clear draft
            </Button>
          )}
          <Button
            variant="outline"
            disabled={draft.length === 0}
            onClick={() =>
              draftPrintRef.current &&
              exportPdf(draftPrintRef.current, `${slug(draftView.title)}.pdf`)
            }
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            onClick={onSave}
            disabled={!canSave}
            className="bg-neuro-primary text-white hover:bg-neuro-primary/90"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save report
          </Button>
        </div>
      </div>

      {/* Saved reports */}
      <div className="mt-6">
        <h2 className="text-[15px] font-semibold text-[#212121] mb-3">Saved reports</h2>
        {savedNote ? (
          <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
            {savedNote}
          </div>
        ) : saved.length === 0 ? (
          <p className="text-[12px] text-[#767676]">No saved reports yet.</p>
        ) : (
          <div className="space-y-2">
            {saved.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-[12px] border border-[#EDEDED] bg-white p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#212121] truncate">
                    {r.title}
                  </div>
                  <div className="text-[11px] text-[#767676]">
                    {fmtDate(r.created_at)}
                    {r.patient_name ? ` · ${r.patient_name}` : ""} ·{" "}
                    {(r.items?.length ?? 0)} section
                    {(r.items?.length ?? 0) === 1 ? "" : "s"}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setViewing(r)}>
                  Open
                </Button>
                <IconBtn label="Delete report" onClick={() => onDelete(r.id)}>
                  <Trash2 className="h-4 w-4 text-rose-600" />
                </IconBtn>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Viewing a saved report */}
      {viewingView && (
        <div className="mt-6 rounded-[16px] border border-[#E5E5E5] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#212121]">{viewingView.title}</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  viewPrintRef.current &&
                  exportPdf(viewPrintRef.current, `${slug(viewingView.title)}.pdf`)
                }
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              <IconBtn label="Close" onClick={() => setViewing(null)}>
                <X className="h-4 w-4" />
              </IconBtn>
            </div>
          </div>
          <ReportBody view={viewingView} />
        </div>
      )}

      {/* Offscreen printable nodes for PDF capture (client-only) */}
      {mounted && (
        <div style={{ position: "fixed", left: -10000, top: 0 }} aria-hidden>
          <Printable innerRef={draftPrintRef} view={draftView} />
          {viewingView && <Printable innerRef={viewPrintRef} view={viewingView} />}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-md text-[#767676] hover:bg-[#F2F2F2] disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** On-screen report body (used in the "Open" panel). */
function ReportBody({ view }: { view: ReportView }) {
  return (
    <div className="space-y-4">
      <div className="text-[12px] text-[#767676]">
        {view.patientName ? `Patient: ${view.patientName} · ` : ""}
        {view.dateStr}
      </div>
      {view.items.map((it) => (
        <div key={it.id}>
          <div className="text-[13px] font-semibold text-[#212121] mb-1">{it.title}</div>
          <div className="text-[12px] text-[#374151] leading-relaxed">
            {renderMd(it.markdown)}
          </div>
        </div>
      ))}
      {view.notes && (
        <div>
          <div className="text-[13px] font-semibold text-[#212121] mb-1">Clinical notes</div>
          <div className="text-[12px] text-[#374151] whitespace-pre-wrap">{view.notes}</div>
        </div>
      )}
      <p className="text-[10px] text-[#838383] pt-2 border-t border-[#EEE]">{DISCLAIMER}</p>
    </div>
  );
}

/** Print-styled node (plain colors) captured by html2canvas. */
function Printable({
  innerRef,
  view,
}: {
  innerRef: React.RefObject<HTMLDivElement | null>;
  view: ReportView;
}) {
  return (
    <div
      ref={innerRef}
      style={{
        width: 760,
        padding: 40,
        background: "#ffffff",
        color: "#111111",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <div style={{ borderBottom: "2px solid #111", paddingBottom: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{view.title}</div>
        <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
          Neuro Medica · {view.patientName ? `Patient: ${view.patientName} · ` : ""}
          {view.dateStr}
        </div>
      </div>
      {view.items.map((it) => (
        <div key={it.id} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{it.title}</div>
          <div>{renderMd(it.markdown)}</div>
        </div>
      ))}
      {view.notes && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Clinical notes</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{view.notes}</div>
        </div>
      )}
      <div style={{ fontSize: 10, color: "#777", borderTop: "1px solid #ccc", paddingTop: 8 }}>
        {DISCLAIMER}
      </div>
    </div>
  );
}
