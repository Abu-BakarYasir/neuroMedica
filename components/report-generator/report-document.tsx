import { forwardRef } from "react";

import { NeuroMedicaMark } from "@/components/neuromedica-logo";
import type { ReportItem } from "@/lib/report/types";
import { ReportSection } from "./report-sections";

const C = {
  primary: "#F47325",
  primaryDark: "#D85C18",
  ink: "#111827",
  body: "#374151",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E5E7EB",
  hair: "#EEF0F3",
  bg: "#F9FAFB",
};

const KIND_EXAM: Record<ReportItem["kind"], string> = {
  ecg: "Electrocardiogram (ECG) — AI heartbeat analysis",
  cxr: "Chest radiograph (X-ray) — AI screening",
  qa: "Medical literature Q&A",
  symptom: "Symptom differential analysis",
  note: "Clinical note",
};

const KIND_TAG: Record<ReportItem["kind"], string> = {
  ecg: "ECG",
  cxr: "RADIOLOGY",
  qa: "REFERENCE",
  symptom: "ASSESSMENT",
  note: "NOTE",
};

const CLINIC = {
  address: "1 Innovation Way, Lahore, Pakistan",
  phone: "+92 42 111 NEURO",
  email: "care@neuromedica.health",
  web: "neuromedica.health",
};

const DISCLAIMER =
  "This report is generated with AI assistance for educational and decision-support purposes only. " +
  "All findings must be independently reviewed and confirmed by a qualified clinician before any clinical action is taken.";

export interface ReportPatient {
  name: string | null;
  dob?: string | null;
  sex?: string | null;
  phone?: string | null;
}

export interface ReportDocumentData {
  reportId: string;
  title: string;
  patient: ReportPatient;
  items: ReportItem[];
  impression: string | null;
  createdAt: string;
  doctorName?: string | null;
}

function fmt(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString();
}

function fmtDate(v?: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString();
}

function ageFrom(dob?: string | null): string | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 150 ? `${age} yr` : null;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 8.5, textTransform: "uppercase", letterSpacing: 0.6, color: C.faint, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ width: 4, height: 14, background: C.primary, borderRadius: 2, display: "inline-block" }} />
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: C.ink,
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

/**
 * The printable medical report document. Rendered on screen (preview), captured
 * by html2canvas for PDF (per `data-block` for clean pagination), and cloned
 * into a print iframe — all from this one inline-styled tree so output is
 * identical everywhere.
 */
export const ReportDocument = forwardRef<HTMLDivElement, { data: ReportDocumentData }>(
  function ReportDocument({ data }, ref) {
    const age = ageFrom(data.patient.dob);
    const sex = data.patient.sex
      ? data.patient.sex.charAt(0).toUpperCase() + data.patient.sex.slice(1)
      : "—";

    return (
      <div
        ref={ref}
        style={{
          width: 760,
          maxWidth: "100%",
          margin: "0 auto",
          background: "#ffffff",
          color: C.ink,
          fontFamily: "Arial, Helvetica, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 6, background: `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})` }} />

        <div style={{ padding: "28px 36px 36px" }}>
          {/* Clinic header */}
          <div data-block>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                paddingBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <NeuroMedicaMark size={44} />
                <div>
                  <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.1 }}>
                    Neuro<span style={{ color: C.muted, fontWeight: 400 }}>Medica</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: C.muted, marginTop: 2 }}>
                    AI-Assisted Clinical Decision Support
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: 9.5, color: C.muted, lineHeight: 1.7 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.primary, letterSpacing: 1 }}>
                  MEDICAL REPORT
                </div>
                <div>
                  Report ID:{" "}
                  <span style={{ fontWeight: 700, color: C.ink, fontFamily: "monospace" }}>{data.reportId}</span>
                </div>
                <div>Generated: {fmt(data.createdAt)}</div>
              </div>
            </div>
            {/* Clinic contact strip */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                fontSize: 9,
                color: C.faint,
                borderTop: `1px solid ${C.hair}`,
                borderBottom: `2px solid ${C.primary}`,
                padding: "7px 0",
              }}
            >
              <span>{CLINIC.address}</span>
              <span>·</span>
              <span>{CLINIC.phone}</span>
              <span>·</span>
              <span>{CLINIC.email}</span>
              <span>·</span>
              <span>{CLINIC.web}</span>
            </div>

            {/* Report title */}
            <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, marginTop: 16 }}>{data.title}</div>
          </div>

          {/* Patient information */}
          <div data-block style={{ marginTop: 18 }}>
            <SectionTitle>Patient Information</SectionTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                rowGap: 12,
                columnGap: 12,
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.primary}`,
                borderRadius: 10,
                padding: 14,
              }}
            >
              <Field label="Patient name" value={data.patient.name || "Unassigned"} />
              <Field label="MRN" value={data.reportId} />
              <Field
                label="Date of birth"
                value={age ? `${fmtDate(data.patient.dob)} (${age})` : fmtDate(data.patient.dob)}
              />
              <Field label="Sex" value={sex} />
              <Field label="Phone" value={data.patient.phone || "—"} />
              <Field label="Report date" value={fmtDate(data.createdAt)} />
              <Field label="Referring physician" value={data.doctorName || "—"} />
              <Field label="Status" value="Final" />
            </div>
          </div>

          {/* Examination details */}
          <div data-block style={{ marginTop: 18 }}>
            <SectionTitle>Examination Details</SectionTitle>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              {data.items.map((it, i) => (
                <div
                  key={it.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 11,
                    color: C.body,
                    background: i % 2 ? "#fff" : C.bg,
                    borderBottom: i < data.items.length - 1 ? `1px solid ${C.hair}` : "none",
                    padding: "8px 12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      color: C.primary,
                      background: "#FEF0E8",
                      borderRadius: 4,
                      padding: "2px 6px",
                      minWidth: 64,
                      textAlign: "center",
                    }}
                  >
                    {KIND_TAG[it.kind]}
                  </span>
                  <span style={{ fontWeight: 600, color: C.ink, flex: 1 }}>{KIND_EXAM[it.kind]}</span>
                  <span style={{ color: C.muted }}>{fmt(it.createdAt)}</span>
                </div>
              ))}
              {data.items.length === 0 && (
                <div style={{ padding: 12, fontSize: 11, color: C.muted }}>No examinations recorded.</div>
              )}
            </div>
          </div>

          {/* Findings & AI analysis */}
          <div style={{ marginTop: 18 }}>
            <div data-block>
              <SectionTitle>Findings &amp; AI Analysis</SectionTitle>
            </div>
            {data.items.length === 0 ? (
              <div data-block style={{ fontSize: 12, color: C.muted }}>
                No sections in this report yet.
              </div>
            ) : (
              data.items.map((it) => (
                <div
                  key={it.id}
                  data-block
                  style={{
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      marginBottom: 12,
                      paddingBottom: 8,
                      borderBottom: `1px solid ${C.hair}`,
                    }}
                  >
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>{it.title}</div>
                  </div>
                  <ReportSection item={it} />
                </div>
              ))
            )}
          </div>

          {/* Impression / Conclusion */}
          <div data-block style={{ marginTop: 4 }}>
            <SectionTitle>Impression / Conclusion</SectionTitle>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.6,
                color: C.body,
                whiteSpace: "pre-wrap",
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${C.primary}`,
                borderRadius: 10,
                padding: 14,
                minHeight: 40,
              }}
            >
              {data.impression?.trim() || "No impression recorded."}
            </div>
          </div>

          {/* Signature & timestamp */}
          <div
            data-block
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 30,
              paddingBottom: 6,
            }}
          >
            <div style={{ fontSize: 9.5, color: C.muted, lineHeight: 1.6 }}>
              Generated electronically by NeuroMedica
              <br />
              {fmt(data.createdAt)}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ width: 210, borderTop: `1px solid ${C.ink}`, marginBottom: 5 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>
                {data.doctorName || "Reviewing Clinician"}
              </div>
              <div style={{ fontSize: 9, color: C.faint }}>Signature &amp; Date</div>
            </div>
          </div>

          {/* Disclaimer */}
          <div
            data-block
            style={{
              marginTop: 22,
              padding: "10px 12px",
              borderRadius: 8,
              background: C.bg,
              border: `1px solid ${C.hair}`,
              fontSize: 8.5,
              color: C.faint,
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: C.muted }}>Disclaimer.</strong> {DISCLAIMER}
          </div>
        </div>
      </div>
    );
  },
);
