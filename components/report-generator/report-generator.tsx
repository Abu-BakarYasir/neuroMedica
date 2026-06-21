"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Loader2,
  Download,
  Printer,
  Save,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  AlertCircle,
  User,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  listReports,
  deleteReport,
  updateReport,
} from "@/lib/report/service";
import { reorder } from "@/lib/report/serialize";
import { listUnifiedPatients } from "@/lib/patients/service";
import { exportPdf, printNode } from "@/lib/report/pdf";
import type { ReportItem, ReportRow } from "@/lib/report/types";
import type { UnifiedPatient } from "@/lib/patients/types";
import {
  ReportDocument,
  type ReportDocumentData,
  type ReportPatient,
} from "./report-document";

const KIND_LABEL: Record<ReportItem["kind"], string> = {
  ecg: "ECG",
  cxr: "Chest X-ray",
  qa: "Medical Q&A",
  symptom: "Symptom Explorer",
  note: "Note",
};

function fmtDate(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report";
}

function normaliseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function ReportGenerator() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<UnifiedPatient[]>([]);
  const [doctorName, setDoctorName] = useState<string | null>(null);

  // Open report + its editable copy
  const [openId, setOpenId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editItems, setEditItems] = useState<ReportItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const docRef = useRef<HTMLDivElement>(null);

  const loadReports = useCallback(async () => {
    setSavedNote(null);
    try {
      setReports(await listReports());
    } catch (e) {
      setReports([]);
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
    void loadReports();
    listUnifiedPatients().then(setPatients).catch(() => {});
    createClient()
      .auth.getUser()
      .then(({ data }) => setDoctorName(data.user?.email ?? null))
      .catch(() => {});
  }, [loadReports]);

  const openReport = (r: ReportRow) => {
    setOpenId(r.id);
    setEditTitle(r.title);
    setEditNotes(r.notes ?? "");
    setEditItems(r.items ?? []);
    setDirty(false);
    setError(null);
  };

  const closeReport = () => {
    setOpenId(null);
    setDirty(false);
  };

  const openRow = useMemo(
    () => reports.find((r) => r.id === openId) ?? null,
    [reports, openId],
  );

  // Resolve full patient details (dob/sex/phone) for the open report.
  const resolvedPatient: ReportPatient = useMemo(() => {
    if (!openRow) return { name: null };
    const manual = openRow.patient_id
      ? patients.find((p) => p.source === "manual" && p.row.id === openRow.patient_id)
      : patients.find(
          (p) =>
            p.source === "manual" &&
            normaliseName(p.row.name) === normaliseName(openRow.patient_name ?? ""),
        );
    if (manual && manual.source === "manual") {
      return {
        name: manual.row.name,
        dob: manual.row.date_of_birth,
        sex: manual.row.sex,
        phone: manual.row.phone,
      };
    }
    return { name: openRow.patient_name };
  }, [openRow, patients]);

  const docData: ReportDocumentData | null = openRow
    ? {
        reportId: openRow.id.slice(0, 8).toUpperCase(),
        title: editTitle.trim() || "Untitled report",
        patient: resolvedPatient,
        items: editItems,
        impression: editNotes,
        createdAt: openRow.created_at,
        doctorName,
      }
    : null;

  const onReorder = (id: string, dir: "up" | "down") => {
    setEditItems((items) => reorder(items, id, dir));
    setDirty(true);
  };

  const onRemoveItem = (id: string) => {
    setEditItems((items) => items.filter((it) => it.id !== id));
    setDirty(true);
  };

  const onSave = async () => {
    if (!openRow || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateReport(openRow.id, {
        title: editTitle.trim() || "Untitled report",
        notes: editNotes,
        items: editItems,
      });
      setDirty(false);
      await loadReports();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    try {
      await deleteReport(id);
      if (openId === id) closeReport();
      await loadReports();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete report.");
    }
  };

  // ── List view ────────────────────────────────────────────────────────────
  if (!openRow || !docData) {
    return (
      <div className="w-full max-w-[1100px] mx-auto px-2 pb-10">
        <Header />
        {error && <ErrorBox text={error} />}

        <div className="mt-2">
          <h2 className="text-[15px] font-semibold text-[#212121] mb-3">Saved reports</h2>
          {savedNote ? (
            <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
              {savedNote}
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#E5E5E5] bg-[#FAFAFA] p-8 text-center text-[12px] text-[#767676]">
              No reports yet. Run an analysis in ECG, Chest X-ray, Medical Q&amp;A, or
              Symptom Explorer and click <strong>Add to report</strong> to assign it to a
              patient.
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-[12px] border border-[#EDEDED] bg-white p-3 hover:border-neuro-primary/40 transition-colors"
                >
                  <div className="h-9 w-9 rounded-[10px] bg-neuro-primary/10 text-neuro-primary flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#212121] truncate">
                      {r.title}
                    </div>
                    <div className="text-[11px] text-[#767676] flex items-center gap-1.5 flex-wrap">
                      {r.patient_name && (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {r.patient_name}
                        </span>
                      )}
                      <span>· {fmtDate(r.created_at)}</span>
                      <span>
                        · {(r.items?.length ?? 0)} section
                        {(r.items?.length ?? 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openReport(r)}>
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
      </div>
    );
  }

  // ── Editor / preview view ────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[1200px] mx-auto px-2 pb-10">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={closeReport} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => docRef.current && void exportPdf(docRef.current, `${slug(editTitle)}.pdf`)}
        >
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => docRef.current && printNode(docRef.current, editTitle)}
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={saving || !dirty}
          className="bg-neuro-primary text-white hover:bg-neuro-primary/90"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {dirty ? "Save changes" : "Saved"}
        </Button>
      </div>

      {error && <ErrorBox text={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* Edit controls */}
        <div className="space-y-4 lg:sticky lg:top-2 lg:self-start">
          <div className="rounded-[14px] border border-[#E5E5E5] bg-white p-4 space-y-3">
            <div>
              <label className="text-[12px] text-[#525252] mb-1 block">Report title</label>
              <Input
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
            <div>
              <label className="text-[12px] text-[#525252] mb-1 block">
                Impression / conclusion
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => {
                  setEditNotes(e.target.value);
                  setDirty(true);
                }}
                rows={5}
                placeholder="Summarize the impression, plan, or follow-up…"
                className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neuro-primary/30"
              />
            </div>
            <div className="text-[11px] text-[#767676] flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {resolvedPatient.name || "Unassigned"}
            </div>
          </div>

          <div className="rounded-[14px] border border-[#E5E5E5] bg-white p-4">
            <div className="text-[12px] text-[#525252] mb-2">
              Sections ({editItems.length})
            </div>
            {editItems.length === 0 ? (
              <p className="text-[12px] text-[#767676]">No sections.</p>
            ) : (
              <div className="space-y-2">
                {editItems.map((it, idx) => (
                  <div
                    key={it.id}
                    className="flex items-start gap-2 rounded-[10px] border border-[#EDEDED] bg-white p-2.5"
                  >
                    <span className="text-[9px] uppercase tracking-wide font-semibold text-neuro-primary bg-neuro-primary/10 rounded px-1.5 py-0.5 mt-0.5 flex-shrink-0">
                      {KIND_LABEL[it.kind]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-[#212121] truncate">
                        {it.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <IconBtn
                        label="Move up"
                        disabled={idx === 0}
                        onClick={() => onReorder(it.id, "up")}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn
                        label="Move down"
                        disabled={idx === editItems.length - 1}
                        onClick={() => onReorder(it.id, "down")}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn label="Remove" onClick={() => onRemoveItem(it.id)}>
                        <X className="h-4 w-4" />
                      </IconBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(openRow.id)}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 w-full justify-start"
          >
            <Trash2 className="h-4 w-4" />
            Delete report
          </Button>
        </div>

        {/* Live document preview */}
        <div className="min-w-0">
          <div className="rounded-[14px] border border-[#E5E5E5] bg-[#F3F4F6] p-3 sm:p-5 overflow-x-auto">
            <div
              className="shadow-lg rounded-sm overflow-hidden mx-auto"
              style={{ width: "fit-content" }}
            >
              <ReportDocument ref={docRef} data={docData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-neuro-primary/15 to-neuro-primary/5 flex items-center justify-center flex-shrink-0">
        <FileText className="h-5 w-5 text-neuro-primary" />
      </div>
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#212121]">Report Generator</h1>
        <p className="text-[13px] text-[#525252] mt-0.5">
          View, edit, and export the reports you&apos;ve assigned to patients. Add results
          from ECG, Chest X-ray, Medical Q&amp;A, and Symptom Explorer using
          <strong> Add to report</strong>.
        </p>
      </div>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-[14px] border border-rose-200 bg-rose-50 p-4">
      <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
      <p className="text-[12px] text-rose-700">{text}</p>
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
