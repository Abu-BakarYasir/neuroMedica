import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * NeuroMedica "Synapse" brand mark — a two-lobe brain built from synapse nodes,
 * grounded by an ECG pulse line, in the coral/orange brand gradient.
 *
 * <NeuroMedicaMark /> renders the icon tile only.
 * <NeuroMedicaLogo /> renders the icon + "NeuroMedica" wordmark lockup.
 */

export function NeuroMedicaMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  // useId keeps the gradient id unique when several marks render on one page.
  const gradId = useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="NeuroMedica logo"
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFA8C8" />
          <stop offset="42%" stopColor="#F58947" />
          <stop offset="78%" stopColor="#F47325" />
          <stop offset="100%" stopColor="#FF4F34" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="96" height="96" rx="24" fill={`url(#${gradId})`} />
      <g
        fill="none"
        stroke="#fff"
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M50 23 C44 18 35 19 32 25 C24 22 18 29 23 35 C17 39 19 47 26 48 C22 54 27 61 34 58 C38 63 46 62 50 57 C54 62 62 63 66 58 C73 61 78 54 74 48 C81 47 83 39 77 35 C82 29 76 22 68 25 C65 19 56 18 50 23 Z" />
        <path d="M50 24 V57" />
        <path d="M33 30 C39 33 38 39 32 41" />
        <path d="M67 30 C61 33 62 39 68 41" />
      </g>
      <g fill="#fff">
        <circle cx="32" cy="25" r="2.6" />
        <circle cx="68" cy="25" r="2.6" />
        <circle cx="26" cy="48" r="2.4" />
        <circle cx="74" cy="48" r="2.4" />
      </g>
      <path
        d="M14 73 H40 l3 -9 4 18 4 -12 3 7 H86"
        fill="none"
        stroke="#fff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NeuroMedicaLogo({
  size = 32,
  className,
  wordmarkClassName,
  textSize = "text-xl",
}: {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
  textSize?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <NeuroMedicaMark size={size} />
      <span
        className={cn(
          "font-extrabold tracking-tight text-[#212121] dark:text-white",
          textSize,
          wordmarkClassName
        )}
      >
        Neuro<span className="font-normal text-[#6B7280] dark:text-neutral-400">Medica</span>
      </span>
    </span>
  );
}
