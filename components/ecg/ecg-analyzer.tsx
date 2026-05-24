"use client";

import { useCallback, useRef, useState } from "react";
import { Activity, FileUp, Loader2, Sparkles, AlertCircle, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analyzeFile, analyzeSample } from "@/lib/ecg/api-client";
import type { BeatClassCode, EcgAnalysisResponse } from "@/lib/ecg/types";

import { BeatCard } from "./beat-card";
import { ResultsSummary } from "./results-summary";

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
          <h1 className="text-xl sm:text-2xl font-semibold text-[#212121]">
            ECG Signal Analysis
          </h1>
          <p className="text-[13px] text-[#525252] mt-0.5">
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
          "rounded-[16px] border-2 border-dashed bg-white p-8 text-center transition-colors",
          isDragging
            ? "border-neuro-primary bg-neuro-primary/5"
            : "border-[#E5E5E5]",
        )}
      >
        <div className="mx-auto w-12 h-12 rounded-full bg-[#FAFAFA] flex items-center justify-center mb-4">
          <FileUp className="h-5 w-5 text-[#525252]" />
        </div>
        <p className="text-[14px] font-medium text-[#212121] mb-1">
          Upload an ECG CSV
        </p>
        <p className="text-[12px] text-[#767676] mb-5 max-w-[480px] mx-auto leading-relaxed">
          One beat per row (187 columns, matches the Kaggle MIT-BIH layout),
          or a single-column raw signal — we&apos;ll detect R-peaks and segment it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            onClick={onPickFile}
            disabled={isLoading}
            className="bg-neuro-primary text-white hover:bg-neuro-primary/90"
          >
            <FileText className="h-4 w-4" />
            Choose CSV
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
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
        {fileName && !isLoading && (
          <p className="text-[11px] text-[#838383] mt-4">Loaded: {fileName}</p>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-[14px] border border-[#EDEDED] bg-white p-6 text-[13px] text-[#525252]">
          <Loader2 className="h-4 w-4 animate-spin text-neuro-primary" />
          Analyzing heartbeats — this may take a few seconds on the first request
          while the model warms up.
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="mt-6 flex items-start gap-3 rounded-[14px] border border-rose-200 bg-rose-50 p-4">
          <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[13px] font-semibold text-rose-800">
              Could not analyze this ECG
            </div>
            <p className="text-[12px] text-rose-700 mt-0.5">{error}</p>
          </div>
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
              <div className="mt-3 rounded-[12px] border border-[#EDEDED] bg-white p-4 text-[11px] text-[#525252]">
                <div className="text-[10px] uppercase tracking-wide text-[#838383] mb-2">
                  Source
                </div>
                <div className="space-y-1">
                  <div>
                    Format:{" "}
                    <span className="font-medium text-[#212121]">
                      {result.source_format}
                    </span>
                  </div>
                  {Object.entries(result.notes).map(([k, v]) => (
                    <div key={k}>
                      {k}:{" "}
                      <span className="font-medium text-[#212121]">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-3 text-[10px] leading-relaxed text-[#838383]">
              {result.disclaimer}
            </p>
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-semibold text-[#212121]">
                Per-beat classifications
              </div>
              <div className="text-[11px] text-[#767676]">
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
              <div className="rounded-[14px] border border-[#EDEDED] bg-white p-8 text-center text-[13px] text-[#767676]">
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
          : "bg-white text-[#525252] border-[#E5E5E5] hover:border-neuro-primary/40",
      )}
    >
      {label}
    </button>
  );
}
