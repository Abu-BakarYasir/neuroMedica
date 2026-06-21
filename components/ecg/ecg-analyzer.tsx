"use client";

import { useCallback, useRef, useState } from "react";
import { Activity, FileUp, Loader2, Sparkles, AlertCircle, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analyzeFiles, analyzeSample } from "@/lib/ecg/api-client";
import { validateEcgFiles } from "@/lib/ecg/validate";
import type { Diagnosis, EcgDiagnosisResponse } from "@/lib/ecg/types";

import { ClinicalInterpretation } from "./clinical-interpretation";
import { AddToReportButton } from "@/components/report-generator/add-to-report-button";
import { ecgToItem } from "@/lib/report/serialize";

export function EcgAnalyzer() {
  const [result, setResult] = useState<EcgDiagnosisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runFiles = useCallback(async (files: File[]) => {
    const validationError = validateEcgFiles(files);
    const label = files.map((f) => f.name).join(" + ");
    if (validationError) {
      setResult(null);
      setFileLabel(label);
      setError(validationError);
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    setFileLabel(label);
    try {
      const data = await analyzeFiles(files);
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
    setFileLabel(null);
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
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) void runFiles(files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (files.length) void runFiles(files);
  };

  return (
    <div className="w-full max-w-[1100px] mx-auto px-2 pb-10">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-neuro-primary/15 to-neuro-primary/5 flex items-center justify-center flex-shrink-0">
          <Activity className="h-5 w-5 text-neuro-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
            12-Lead ECG Diagnosis
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            PTB-XL diagnostic superclasses — Normal, Myocardial Infarction,
            ST/T Change, Conduction Disturbance, and Hypertrophy.
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
          isDragging ? "border-neuro-primary bg-neuro-primary/5" : "border-border",
        )}
      >
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileUp className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-[14px] font-medium text-foreground mb-1">
          Upload a 12-lead recording
        </p>
        <p className="text-[12px] text-muted-foreground mb-5 max-w-[560px] mx-auto leading-relaxed">
          <span className="font-medium text-foreground">WFDB</span> — select both
          the <code>.hea</code> and <code>.dat</code> files (PTB-XL native, most
          reliable). <span className="font-medium text-foreground">CSV</span> — 12
          columns, one per lead. <span className="font-medium text-foreground">Image</span> —
          a photo/scan of a 12-lead chart (best-effort; flagged as approximate).
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            onClick={onPickFile}
            disabled={isLoading}
            className="bg-neuro-primary text-white hover:bg-neuro-primary/90"
          >
            <FileText className="h-4 w-4" />
            Choose files
          </Button>
          <Button onClick={runSample} disabled={isLoading} variant="outline">
            <Sparkles className="h-4 w-4" />
            Try a sample
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".hea,.dat,.csv,text/csv,text/plain,.png,.jpg,.jpeg,.bmp,.gif,.tif,.tiff,.webp,image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
        {fileLabel && !isLoading && (
          <p className="text-[11px] text-muted-foreground mt-4">Loaded: {fileLabel}</p>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-[14px] border border-border bg-card p-6 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-neuro-primary" />
          Analyzing the 12-lead recording — this may take a few seconds on the
          first request while the model warms up.
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

      {/* Interpretation */}
      {result && !isLoading && (
        <div className="mt-6">
          <ClinicalInterpretation interpretation={result.interpretation} />
        </div>
      )}

      {/* Add to report */}
      {result && !isLoading && (
        <div className="mt-6 flex justify-end">
          <AddToReportButton build={() => ecgToItem(result)} />
        </div>
      )}

      {/* Diagnosis probabilities */}
      {result && !isLoading && (
        <div
          className={cn(
            "mt-4 rounded-[16px] border border-border bg-card p-5",
            !result.interpretation.reliable && "opacity-60",
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-semibold text-foreground">
              Diagnostic superclass probabilities
            </div>
            <div className="text-[11px] text-muted-foreground">
              threshold {Math.round(result.threshold * 100)}% · source {result.source_format}
            </div>
          </div>
          {!result.interpretation.reliable && (
            <div className="mb-3 text-[11px] font-medium text-rose-600 dark:text-rose-400">
              Unverified — shown for reference only.
            </div>
          )}
          <div className="space-y-3">
            {result.diagnoses.map((d) => (
              <DiagnosisRow key={d.code} d={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DiagnosisRow({ d }: { d: Diagnosis }) {
  const urgent = d.code === "MI" && d.positive;
  const barColor = d.code === "NORM"
    ? "bg-emerald-500"
    : urgent
      ? "bg-rose-500"
      : d.positive
        ? "bg-amber-500"
        : "bg-neuro-primary/40";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[12px] font-semibold text-foreground w-10">{d.code}</span>
          <span className="text-[12px] text-muted-foreground truncate">{d.name}</span>
          {d.positive && (
            <span
              className={cn(
                "text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0",
                urgent
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                  : d.code === "NORM"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
              )}
            >
              {d.code === "NORM" ? "NORMAL" : "DETECTED"}
            </span>
          )}
        </div>
        <span className="text-[12px] font-semibold text-foreground tabular-nums">
          {Math.round(d.probability * 100)}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${Math.round(d.probability * 100)}%` }}
        />
      </div>
      {d.positive && (
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          {d.clinical_significance}
        </p>
      )}
    </div>
  );
}
