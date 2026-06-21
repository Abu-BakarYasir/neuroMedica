// Inline-styled section renderers for a report section, dispatched by kind.
// Inline (plain-hex) styling keeps them identical on screen, in the html2canvas
// PDF, and in the print iframe — Tailwind/oklch colors don't rasterize reliably.

import type {
  CxrReportData,
  EcgReportData,
  ReportItem,
} from "@/lib/report/types";

const C = {
  primary: "#F47325",
  primarySoft: "#FEF0E8",
  ink: "#1A1A1A",
  body: "#374151",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E5E7EB",
  bg: "#F9FAFB",
  danger: "#DC2626",
  dangerSoft: "#FEF2F2",
  ok: "#059669",
  okSoft: "#ECFDF5",
};

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Minimal markdown-lite (bold + bullets) → React, for qa/symptom/note items. */
function MarkdownBlock({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 12, lineHeight: 1.6, color: C.body }}>
      {text.split("\n").map((line, i) => {
        const bullet = /^\s*[-*]\s+/.test(line);
        const content = line.replace(/^\s*[-*]\s+/, "");
        const parts = content.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={j} style={{ color: C.ink }}>
              {p.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{p}</span>
          ),
        );
        return (
          <div key={i} style={{ paddingLeft: bullet ? 14 : 0, minHeight: line ? undefined : 8 }}>
            {bullet ? "• " : ""}
            {parts}
          </div>
        );
      })}
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", background: "#fff" }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.4, color: C.faint }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Bar({ value, danger }: { value: number; danger?: boolean }) {
  return (
    <div style={{ height: 6, background: C.border, borderRadius: 4, overflow: "hidden", minWidth: 90 }}>
      <div
        style={{
          width: `${Math.round(value * 100)}%`,
          height: "100%",
          background: danger ? C.danger : C.primary,
          borderRadius: 4,
        }}
      />
    </div>
  );
}

function EcgReportSection({ data }: { data: EcgReportData }) {
  const abnormal = data.positiveCodes.some((c) => c !== "NORM");
  return (
    <div>
      <div
        style={{
          border: `1px solid ${data.reliable ? (data.urgent ? C.danger : C.border) : C.danger}`,
          background: data.reliable ? (data.urgent ? C.dangerSoft : C.bg) : C.dangerSoft,
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 0.4, color: C.faint, marginBottom: 4 }}>
          Clinical interpretation
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: data.urgent || !data.reliable ? C.danger : C.ink, marginBottom: 6 }}>
          {data.headline}
        </div>
        {(data.heartRateBpm != null || data.rhythmRegularity) && (
          <div style={{ fontSize: 11, color: C.body, marginBottom: 6 }}>
            {data.heartRateBpm != null && (
              <span>
                Heart rate: <strong style={{ color: C.ink }}>~{Math.round(data.heartRateBpm)} bpm</strong>
                {data.heartRateLabel ? ` (${data.heartRateLabel})` : ""}
              </span>
            )}
            {data.heartRateBpm != null && data.rhythmRegularity ? "  ·  " : ""}
            {data.rhythmRegularity && (
              <span>
                Rhythm: <strong style={{ color: C.ink }}>{data.rhythmRegularity}</strong>
              </span>
            )}
          </div>
        )}
        {data.findings.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 6 }}>
            {data.findings.map((f, i) => (
              <div key={i} style={{ fontSize: 11, color: C.body, paddingLeft: 12 }}>
                • {f}
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, color: C.body }}>
          <strong style={{ color: C.ink }}>Recommendation:</strong> {data.recommendation}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
        <MetricCell label="Top class" value={`${data.topLabel} (${data.topCode})`} />
        <MetricCell label="Reliability" value={cap(data.reliability)} />
        <MetricCell label="Source" value={data.sourceFormat} />
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
          Diagnostic superclass probabilities
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {data.diagnoses.map((d) => (
            <div key={d.code} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.ink, width: 44 }}>{d.code}</span>
              <div style={{ flex: 1 }}>
                <Bar value={d.probability} danger={d.positive && d.code !== "NORM"} />
              </div>
              <span style={{ fontSize: 11, color: C.muted, width: 40, textAlign: "right" }}>{pct(d.probability)}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: "8px 10px",
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 600,
          color: abnormal ? C.danger : C.ok,
          background: abnormal ? C.dangerSoft : C.okSoft,
        }}
      >
        {!data.reliable
          ? "Image-based diagnosis — approximate and unverified. Confirm with WFDB or a clinician-read ECG."
          : abnormal
            ? "Abnormal diagnostic findings detected. Correlate clinically."
            : "No diagnostic abnormality detected above threshold."}
      </div>
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function CxrReportSection({ data }: { data: CxrReportData }) {
  const ranked = [...data.findings].sort((a, b) => b.probability - a.probability);
  const shown = ranked.filter((f, i) => f.detected || i < 6);
  return (
    <div style={{ display: "grid", gridTemplateColumns: data.imageDataUrl ? "200px 1fr" : "1fr", gap: 16 }}>
      {data.imageDataUrl && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.imageDataUrl}
            alt="Chest radiograph"
            style={{ width: "100%", borderRadius: 8, border: `1px solid ${C.border}`, background: "#000", display: "block" }}
          />
          <div style={{ fontSize: 9, color: C.faint, textAlign: "center", marginTop: 4 }}>
            Submitted radiograph
          </div>
        </div>
      )}

      <div>
        <div
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            color: data.predictedAbnormal ? C.danger : C.ok,
            background: data.predictedAbnormal ? C.dangerSoft : C.okSoft,
            marginBottom: 10,
          }}
        >
          {data.predictedAbnormal ? "Abnormal" : "Normal"} · {pct(data.abnormalProbability)} abnormal probability
        </div>

        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
          Top finding: <span style={{ fontWeight: 700, color: C.ink }}>{data.topFinding}</span> ·{" "}
          {data.detectedCount} finding{data.detectedCount === 1 ? "" : "s"} flagged
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {shown.map((f) => (
            <div key={f.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  color: f.detected ? C.ink : C.muted,
                  fontWeight: f.detected ? 700 : 400,
                  width: 150,
                }}
              >
                {f.name}
                {f.detected ? " •" : ""}
              </span>
              <div style={{ flex: 1 }}>
                <Bar value={f.probability} danger={f.detected} />
              </div>
              <span style={{ fontSize: 11, color: C.muted, width: 40, textAlign: "right" }}>
                {pct(f.probability)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Render a captured section by kind, falling back to its markdown body. */
export function ReportSection({ item }: { item: ReportItem }) {
  if (item.kind === "ecg" && item.data && "diagnoses" in item.data) {
    return <EcgReportSection data={item.data} />;
  }
  if (item.kind === "cxr" && item.data && "detectedCount" in item.data) {
    return <CxrReportSection data={item.data} />;
  }
  return <MarkdownBlock text={item.markdown} />;
}
