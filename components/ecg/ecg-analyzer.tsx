"use client";

import { useCallback, useRef, useState } from "react";
import { Activity, FileUp, Loader2, Sparkles, AlertCircle, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analyzeFile, analyzeSample } from "@/lib/ecg/api-client";
import { validateEcgFile } from "@/lib/ecg/validate";
import type { BeatClassCode, EcgAnalysisResponse } from "@/lib/ecg/types";

import { BeatCard } from "./beat-card";
import { ResultsSummary } from "./results-summary";
import { AddToReportButton } from "@/components/report-generator/add-to-report-button";
import { ecgToItem } from "@/lib/report/serialize";

const ALL_CLASSES: BeatClassCode[] = ["N", "S", "V", "F", "Q"];

export function EcgAnalyzer() {
  const [result, setResult] = useState<EcgAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<BeatClassCode | "ALL">("ALL");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runFile = useCallback(async (file: File) => {
    // Reject images (and other non-signal files) before hitting the backend.
    const validationError = validateEcgFile(file);
    if (validationError) {
      setResult(null);
      setFileName(file.name);
      setError(validationError);
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    setFileName(file.name);
    setActiveFilter("ALL");
    try {
      const data = await analyzeFile(file);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runSample = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setFileName(null);
    setActiveFilter("ALL");
    try {
      const data = await analyzeSample();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sample analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void runFile(file);
    e.target.value = ""; // allow re-uploading the same file
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void runFile(file);
  };

  const filteredBeats = result?.beats.filter(
    (b) => activeFilter === "ALL" || b.predicted_class === activeFilter,
  );

  return (
    <div className="w-full max-w-[1100px] mx-auto px-2 pb-10">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-neuro-primary/15 to-neuro-primary/5 flex items-center justify-center flex-shrink-0">
          <Activity className="h-5 w-5 text-neuro-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
            ECG Signal Analysis
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Heartbeat classification into AAMI EC57 classes — Normal, Supraventricular
            ectopic, Ventricular ectopic, Fusion, and Unknown/Paced.
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-[16px] border-2 border-dashed bg-card p-8 text-center transition-colors",
          isDragging
            ? "border-neuro-primary bg-neuro-primary/5"
            : "border-border",
        )}
      >
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileUp className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-[14px] font-medium text-foreground mb-1">
          Upload an ECG CSV or an image of a single-lead strip
        </p>
        <p className="text-[12px] text-muted-foreground mb-5 max-w-[520px] mx-auto leading-relaxed">
          CSV: one beat per row (187 columns, Kaggle MIT-BIH layout) or a
          single-column raw signal. Image: a PNG/JPG photo or scan of a
          single-lead rhythm strip — we&apos;ll digitize the trace, detect
          R-peaks, and segment it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            onClick={onPickFile}
            disabled={isLoading}
            className="bg-neuro-primary text-white hover:bg-neuro-primary/90"
          >
            <FileText className="h-4 w-4" />
            Choose CSV or image
          </Button>
          <Button
            onClick={runSample}
            disabled={isLoading}
            variant="outline"
          >
            <Sparkles className="h-4 w-4" />
            Try a sample beat
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain,.png,.jpg,.jpeg,.bmp,.gif,.tif,.tiff,.webp,image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
        {fileName && !isLoading && (
          <p className="text-[11px] text-muted-foreground mt-4">Loaded: {fileName}</p>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-[14px] border border-border bg-card p-6 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-neuro-primary" />
          Analyzing heartbeats — this may take a few seconds on the first request
          while the model warms up.
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="mt-6 flex items-start gap-3 rounded-[14px] border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40 p-4">
          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[13px] font-semibold text-rose-800 dark:text-rose-300">
              Could not analyze this ECG
            </div>
            <p className="text-[12px] text-rose-700 dark:text-rose-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Digitization confidence (image uploads only) */}
      {result && !isLoading && result.source_format === "image" && (
        <DigitizationNotice notes={result.notes} />
      )}

      {/* Add to report */}
      {result && !isLoading && (
        <div className="mt-6 flex justify-end">
          <AddToReportButton build={() => ecgToItem(result)} />
        </div>
      )}

      {/* Results */}
      {result && !isLoading && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
          <div className="lg:sticky lg:top-2 lg:self-start">
            <ResultsSummary
              summary={result.summary}
              classes={result.classes}
            />

            {result.notes && Object.keys(result.notes).length > 0 && (
              <div className="mt-3 rounded-[12px] border border-border bg-card p-4 text-[11px] text-muted-foreground">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                  Source
                </div>
                <div className="space-y-1">
                  <div>
                    Format:{" "}
                    <span className="font-medium text-foreground">
                      {result.source_format}
                    </span>
                  </div>
                  {Object.entries(result.notes).map(([k, v]) => (
                    <div key={k}>
                      {k}:{" "}
                      <span className="font-medium text-foreground">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-semibold text-foreground">
                Per-beat classifications
              </div>
              <div className="text-[11px] text-muted-foreground">
                {filteredBeats?.length ?? 0} of {result.beats.length}
              </div>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <FilterChip
                label="All"
                active={activeFilter === "ALL"}
                onClick={() => setActiveFilter("ALL")}
              />
              {ALL_CLASSES.map((code) => {
                const count = result.summary.class_counts[code] ?? 0;
                if (count === 0) return null;
                return (
                  <FilterChip
                    key={code}
                    label={`${code} (${count})`}
                    active={activeFilter === code}
                    onClick={() => setActiveFilter(code)}
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredBeats?.map((beat) => (
                <BeatCard key={beat.index} beat={beat} />
              ))}
            </div>

            {filteredBeats?.length === 0 && (
              <div className="rounded-[14px] border border-border bg-card p-8 text-center text-[13px] text-muted-foreground">
                No beats match this filter.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-full text-[11px] font-medium border transition-colors",
        active
          ? "bg-neuro-primary text-white border-neuro-primary"
          : "bg-card text-muted-foreground border-border hover:border-neuro-primary/40",
      )}
    >
      {label}
    </button>
  );
}

function DigitizationNotice({ notes }: { notes: Record<string, unknown> }) {
  const quality =
    typeof notes.digitization_quality === "number"
      ? notes.digitization_quality
      : null;
  const warnings = Array.isArray(notes.warnings)
    ? (notes.warnings as string[])
    : [];
  const coverage =
    typeof notes.coverage === "number" ? notes.coverage : null;
  const lowConfidence = quality !== null && quality < 0.6;

  return (
    <div
      className={cn(
        "mt-6 flex items-start gap-3 rounded-[14px] border p-4",
        lowConfidence
          ? "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/40"
          : "border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/40",
      )}
    >
      <AlertCircle
        className={cn(
          "h-4 w-4 mt-0.5 flex-shrink-0",
          lowConfidence ? "text-amber-600 dark:text-amber-400" : "text-sky-600 dark:text-sky-400",
        )}
      />
      <div className="min-w-0">
        <div
          className={cn(
            "text-[13px] font-semibold",
            lowConfidence ? "text-amber-800 dark:text-amber-300" : "text-sky-800 dark:text-sky-300",
          )}
        >
          Digitized from an image
          {quality !== null && ` — confidence ${Math.round(quality * 100)}%`}
        </div>
        <p className="text-[12px] mt-0.5 text-muted-foreground">
          The waveform was reconstructed from your image
          {coverage !== null && ` (trace coverage ${Math.round(coverage * 100)}%)`}.
          Verify the classifications against the original recording.
        </p>
        {warnings.length > 0 && (
          <ul className="mt-2 list-disc pl-4 space-y-0.5 text-[12px] text-muted-foreground">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
