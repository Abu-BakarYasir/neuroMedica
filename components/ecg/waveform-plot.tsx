"use client";

/** Inline SVG line plot of a single 187-sample beat. Dependency-free. */

interface WaveformPlotProps {
  samples: number[];
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}

export function WaveformPlot({
  samples,
  width = 320,
  height = 96,
  stroke = "#F47325",
  className,
}: WaveformPlotProps) {
  if (!samples.length) return null;

  const padX = 4;
  const padY = 6;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;
  const dx = plotW / (samples.length - 1);

  let min = samples[0];
  let max = samples[0];
  for (const v of samples) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;

  const points = samples
    .map((v, i) => {
      const x = padX + i * dx;
      const y = padY + plotH - ((v - min) / range) * plotH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className={className}
      role="img"
      aria-label="ECG beat waveform"
    >
      {/* baseline grid */}
      <line
        x1={padX}
        x2={width - padX}
        y1={height / 2}
        y2={height / 2}
        stroke="#F1F1F1"
        strokeWidth={1}
      />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
