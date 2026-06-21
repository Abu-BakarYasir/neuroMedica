"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, AlertCircle, ScanEye } from "lucide-react";

import { gradcamXray } from "@/lib/cxr/api-client";
import type { CxrGradCamResponse } from "@/lib/cxr/types";

interface GradCamPanelProps {
  /** The radiograph currently displayed in the results section. */
  file: File | null;
}

/**
 * Additive Grad-CAM explainability panel rendered at the end of the results
 * section. It runs its own request against /api/cxr/gradcam and is fully
 * self-contained — it does not touch the existing analysis state or flow.
 */
export function GradCamPanel({ file }: GradCamPanelProps) {
  const [data, setData] = useState<CxrGradCamResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guard against a stale response overwriting a newer upload's result.
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!file) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setData(null);
    setError(null);
    setIsLoading(true);

    gradcamXray(file)
      .then((res) => {
        if (requestIdRef.current === requestId) setData(res);
      })
      .catch((e: unknown) => {
        if (requestIdRef.current === requestId) {
          setError(e instanceof Error ? e.message : "Grad-CAM generation failed");
        }
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setIsLoading(false);
      });
  }, [file]);

  if (!file) return null;

  const targetPct = data ? Math.round(data.target_probability * 100) : 0;

  return (
    <div className="mt-6 rounded-[16px] border border-border bg-card p-5 shadow-[0px_3px_16px_0px_rgba(30,37,75,0.02)]">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-neuro-primary/15 to-neuro-primary/5 flex items-center justify-center flex-shrink-0">
          <ScanEye className="h-4 w-4 text-neuro-primary" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">
            Grad-CAM Visualization
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
            Heatmap of the regions that most influenced the model&apos;s top
            prediction. Warmer colors indicate stronger contribution.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-3 rounded-[14px] border border-border bg-muted/40 p-6 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-neuro-primary" />
          Generating activation heatmap…
        </div>
      )}

      {error && !isLoading && (
        <div className="flex items-start gap-3 rounded-[14px] border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40 p-4">
          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[13px] font-semibold text-rose-800 dark:text-rose-300">
              Could not generate Grad-CAM
            </div>
            <p className="text-[12px] text-rose-700 dark:text-rose-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {data && !isLoading && (
        <div className="space-y-4">
          <div className="rounded-[14px] border border-border bg-black overflow-hidden mx-auto max-w-[360px]">
            <Image
              src={data.overlay_data_url}
              alt={`Grad-CAM heatmap highlighting ${data.target_name}`}
              width={320}
              height={320}
              unoptimized
              className="w-full h-auto object-contain"
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-[12px]">
            <span className="text-muted-foreground">Localized for</span>
            <span className="font-semibold text-foreground">{data.target_name}</span>
            <span className="rounded-full bg-neuro-primary/10 text-neuro-primary px-2 py-0.5 font-medium">
              {targetPct}%
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
            {data.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
