"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Stethoscope, FileUp, Loader2, AlertCircle, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analyzeXray } from "@/lib/cxr/api-client";
import type { CxrAnalysisResponse } from "@/lib/cxr/types";

import { FindingsSummary } from "./findings-summary";
import { FindingRow } from "./finding-row";
import { AddToReportButton } from "@/components/report-generator/add-to-report-button";
import { cxrToItem } from "@/lib/report/serialize";

export function CxrAnalyzer() {
  const [result, setResult] = useState<CxrAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Persistent base64 copy of the image so it survives into the saved report.
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setShowAll(false);
    setFileName(file.name);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    // Capture a data URL in the background for the report payload.
    setImageDataUrl(null);
    const reader = new FileReader();
    reader.onload = () =>
      setImageDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setImageDataUrl(null);
    reader.readAsDataURL(file);
    try {
      const data = await analyzeXray(file);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
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

  const visibleFindings = result
    ? showAll
      ? result.findings
      : result.findings.filter((f, i) => f.detected || i < 5)
    : [];

  return (
    <div className="w-full max-w-[1100px] mx-auto px-2 pb-10">
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-neuro-primary/15 to-neuro-primary/5 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="h-5 w-5 text-neuro-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
            Chest X-ray Analysis
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Multi-label classification of 14 thoracic pathologies (NIH ChestX-ray14)
            with an overall Normal/Abnormal screen, powered by a fine-tuned DenseNet-121.
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
          Upload a chest X-ray
        </p>
        <p className="text-[12px] text-muted-foreground mb-5 max-w-[480px] mx-auto leading-relaxed">
          Drag and drop a frontal chest radiograph, or browse for a PNG or JPEG file.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            onClick={onPickFile}
            disabled={isLoading}
            className="bg-neuro-primary text-white hover:bg-neuro-primary/90"
          >
            <ImageIcon className="h-4 w-4" />
            Choose image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,.png,.jpg,.jpeg"
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
          Analyzing radiograph — this may take a few seconds on the first request
          while the model warms up.
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="mt-6 flex items-start gap-3 rounded-[14px] border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40 p-4">
          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[13px] font-semibold text-rose-800 dark:text-rose-300">
              Could not analyze this X-ray
            </div>
            <p className="text-[12px] text-rose-700 dark:text-rose-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Add to report */}
      {result && !isLoading && (
        <div className="mt-6 flex justify-end">
          <AddToReportButton build={() => cxrToItem(result, imageDataUrl)} />
        </div>
      )}

      {/* Results */}
      {result && !isLoading && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
          <div className="lg:sticky lg:top-2 lg:self-start">
            {previewUrl && (
              <div className="mb-4 rounded-[16px] border border-border bg-black overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Uploaded chest X-ray"
                  width={360}
                  height={360}
                  unoptimized
                  className="w-full h-auto object-contain max-h-[320px]"
                />
              </div>
            )}

            <FindingsSummary result={result} />

            {result.notes && Object.keys(result.notes).length > 0 && (
              <div className="mt-3 rounded-[12px] border border-border bg-card p-4 text-[11px] text-muted-foreground">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                  Source
                </div>
                <div className="space-y-1">
                  {Object.entries(result.notes).map(([k, v]) => (
                    <div key={k}>
                      {k}:{" "}
                      <span className="font-medium text-foreground">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-semibold text-foreground">
                Pathology predictions
              </div>
              <div className="text-[11px] text-muted-foreground">
                {visibleFindings.length} of {result.findings.length}
              </div>
            </div>

            <div className="space-y-2.5">
              {visibleFindings.map((finding) => (
                <FindingRow key={finding.code} finding={finding} />
              ))}
            </div>

            {!showAll && result.findings.length > visibleFindings.length && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="mt-4 w-full rounded-[12px] border border-border bg-card py-2.5 text-[12px] font-medium text-muted-foreground hover:border-neuro-primary/40 transition-colors"
              >
                Show all {result.findings.length} pathologies
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
