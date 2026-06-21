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

/** A single normalized beat drawn as an SVG line graph on gridded ECG paper. */
function Waveform({ samples }: { samples: number[] }) {
  const W = 220;
  const H = 90;
  const pad = 6;
  if (!samples.length) return null;
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const span = max - min || 1;
  const pts = samples
    .map((v, i) => {
      const x = pad + (i / (samples.length - 1)) * (W - 2 * pad);
      const y = pad + (1 - (v - min) / span) * (H - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: "block", height: 90, background: "#FFF7F3", borderRadius: 6 }}
    >
      {/* faint ECG-paper grid */}
      {Array.from({ length: Math.floor(W / 11) + 1 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 11} y1={0} x2={i * 11} y2={H} stroke="#FBD9C6" strokeWidth={0.5} />
      ))}
      {Array.from({ length: Math.floor(H / 11) + 1 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 11} x2={W} y2={i * 11} stroke="#FBD9C6" strokeWidth={0.5} />
      ))}
      <polyline points={pts} fill="none" stroke={C.primary} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
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
  const abnormal = data.abnormalPercentage > 0;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        <MetricCell label="Dominant rhythm" value={`${data.dominantLabel} (${data.dominantCode})`} />
        <MetricCell label="Beats analyzed" value={String(data.totalBeats)} />
        <MetricCell label="Abnormal beats" value={`${data.abnormalBeats} (${data.abnormalPercentage}%)`} />
        <MetricCell label="Mean confidence" value={pct(data.meanConfidence)} />
      </div>

      {data.waveforms.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
            Representative waveforms
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {data.waveforms.map((w) => (
              <div key={w.code} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 8, background: "#fff" }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: C.ink }}>{w.code}</span> — {w.label}
                </div>
                <Waveform samples={w.samples} />
              </div>
            ))}
          </div>
        </div>
      )}

      {data.classDistribution.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
            Rhythm class distribution
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {data.classDistribution.map((d) => (
              <div key={d.code} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.ink, width: 24 }}>{d.code}</span>
                <div style={{ flex: 1 }}>
                  <Bar value={d.pct / 100} danger={d.code !== "N"} />
                </div>
                <span style={{ fontSize: 11, color: C.muted, width: 40, textAlign: "right" }}>{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
        {abnormal
          ? `Abnormal beats detected (${data.abnormalPercentage}%). Correlate clinically.`
          : "No abnormal beats detected in the analyzed segment."}
      </div>
    </div>
  );
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
  if (item.kind === "ecg" && item.data && "waveforms" in item.data) {
    return <EcgReportSection data={item.data} />;
  }
  if (item.kind === "cxr" && item.data && "findings" in item.data) {
    return <CxrReportSection data={item.data} />;
  }
  return <MarkdownBlock text={item.markdown} />;
}
