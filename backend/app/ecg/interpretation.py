"""Turn raw per-beat classifications into a clinician-readable interpretation.

Two jobs:

1. **Clinical interpretation** — derive heart rate, rhythm regularity, and
   arrhythmia burden from the beat sequence + R-peak timing, then phrase it as a
   short headline, a list of findings, and a recommendation.

2. **Reliability gate** — decide whether the analysis can be trusted. This is
   the safeguard for the #1 failure mode: a user uploads a random ECG *image*
   from the web (usually a 12-lead chart, or a screenshot with no calibration
   grid). The lightweight digitizer always recovers *some* trace, the CNN then
   classifies it with high softmax confidence, and the user sees confident but
   meaningless labels. Here we detect those conditions and mark the result
   ``reliable=False`` so the UI can refuse to present the per-beat labels as
   fact.

Pure NumPy + stdlib — deterministic and offline (no LLM), so it is safe to run
on every request and easy to unit-test.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Sequence

import numpy as np

# Adult resting heart-rate bands (bpm).
_BRADY_BPM = 60.0
_TACHY_BPM = 100.0
# RR-interval coefficient of variation above this reads as an irregular rhythm.
_IRREGULAR_CV = 0.15
# Ectopy burden thresholds (% of beats) for qualifying language.
_OCCASIONAL_PCT = 5.0
_FREQUENT_PCT = 15.0


@dataclass
class EcgInterpretation:
    reliable: bool
    reliability: str  # "high" | "moderate" | "low"
    headline: str
    findings: list[str]
    recommendation: str
    caveats: list[str] = field(default_factory=list)
    heart_rate_bpm: float | None = None
    heart_rate_label: str | None = None  # "Bradycardia" | "Normal" | "Tachycardia"
    rhythm_regularity: str | None = None  # "Regular" | "Irregular"
    heart_rate_approximate: bool = False


# --------------------------------------------------------------------------- #
# Heart rate / rhythm from R-peak timing
# --------------------------------------------------------------------------- #
def compute_heart_rate(
    r_peak_samples: Sequence[int] | None, sampling_rate_hz: float | None
) -> tuple[float | None, str | None]:
    """Median heart rate (bpm) and regularity from R-peak sample indices.

    Returns (bpm, regularity) — either may be None when there isn't enough
    timing information (e.g. wide-format Kaggle CSVs have no inter-beat timing).
    """
    if not r_peak_samples or not sampling_rate_hz or sampling_rate_hz <= 0:
        return None, None
    peaks = np.asarray(sorted(int(p) for p in r_peak_samples), dtype=np.float64)
    if peaks.size < 3:
        return None, None
    rr_sec = np.diff(peaks) / float(sampling_rate_hz)
    # Drop physiologically impossible intervals (<0.25 s ≈ 240 bpm, >2.5 s ≈ 24
    # bpm) which usually mean a missed or doubled detection rather than a beat.
    rr_sec = rr_sec[(rr_sec >= 0.25) & (rr_sec <= 2.5)]
    if rr_sec.size < 2:
        return None, None
    bpm = float(60.0 / np.median(rr_sec))
    cv = float(np.std(rr_sec) / np.mean(rr_sec)) if np.mean(rr_sec) else 0.0
    regularity = "Irregular" if cv > _IRREGULAR_CV else "Regular"
    return round(bpm, 0), regularity


def _hr_label(bpm: float | None) -> str | None:
    if bpm is None:
        return None
    if bpm < _BRADY_BPM:
        return "Bradycardia"
    if bpm > _TACHY_BPM:
        return "Tachycardia"
    return "Normal"


# --------------------------------------------------------------------------- #
# Reliability gate
# --------------------------------------------------------------------------- #
def assess_reliability(
    *, source_format: str, summary: Any, notes: dict
) -> tuple[str, list[str]]:
    """Return ("high"|"moderate"|"low", reasons).

    CSV / sample uploads are trusted (the signal is given directly). Digitized
    *images* are where we get cautious, because that path reconstructs a signal
    from pixels and degrades silently on the kinds of images people grab online.
    """
    reasons: list[str] = []

    if source_format != "image":
        # CSV / sample / wide uploads give us the signal directly, so we trust
        # them. A long signal with only a couple of detected beats is thin but
        # still genuine data — flag it as a caveat, not unreliable.
        if source_format == "long" and summary.total_beats < 3:
            reasons.append("Only a couple of beats were detected.")
            return "moderate", reasons
        return "high", reasons

    # ---- image path ----
    quality = _as_float(notes.get("digitization_quality"))
    coverage = _as_float(notes.get("coverage"))
    grid = bool(notes.get("grid_detected"))
    bands = _as_int(notes.get("trace_bands"))
    mean_conf = _as_float(getattr(summary, "mean_confidence", None))

    level = "high"

    def demote(to: str, reason: str) -> None:
        nonlocal level
        order = {"high": 2, "moderate": 1, "low": 0}
        if order[to] < order[level]:
            level = to
        reasons.append(reason)

    if bands and bands > 1:
        # The digitizer found several stacked traces — almost always a 12-lead
        # chart. We can only digitize one strip, so morphology is unreliable.
        demote("low", "Multiple traces detected (looks like a 12-lead chart).")
    if quality is not None and quality < 0.4:
        demote("low", "Low digitization quality.")
    if coverage is not None and coverage < 0.5:
        demote("low", "The trace was sparse or partially missing.")
    if summary.total_beats < 3:
        demote("low", "Too few heartbeats were recovered.")
    if mean_conf is not None and mean_conf < 0.6:
        demote("low", "The model was not confident on the recovered beats.")
    if not grid:
        # No calibration grid: morphology can still be okay but timing (HR) is a
        # guess. Cap at moderate unless already lower.
        demote("moderate", "No calibration grid found — heart rate is approximate.")

    return level, reasons


# --------------------------------------------------------------------------- #
# Arrhythmia burden phrasing
# --------------------------------------------------------------------------- #
_ECTOPY_NAMES = {
    "S": "supraventricular ectopic beats",
    "V": "ventricular ectopic beats (PVCs)",
    "F": "fusion beats",
    "Q": "unclassifiable / paced beats",
}


def _qualifier(pct: float) -> str:
    if pct >= _FREQUENT_PCT:
        return "very frequent"
    if pct >= _OCCASIONAL_PCT:
        return "frequent"
    return "occasional"


def _ectopy_findings(summary: Any) -> list[str]:
    out: list[str] = []
    total = summary.total_beats or 1
    for code in ("V", "S", "F", "Q"):
        count = summary.class_counts.get(code, 0)
        if count <= 0:
            continue
        pct = round(count / total * 100.0, 1)
        out.append(
            f"{count} of {summary.total_beats} beats ({pct}%) classified as "
            f"{_ECTOPY_NAMES[code]} — {_qualifier(pct)}."
        )
    return out


# --------------------------------------------------------------------------- #
# Public entry point
# --------------------------------------------------------------------------- #
def build_interpretation(
    *, source_format: str, summary: Any, notes: dict
) -> EcgInterpretation:
    reliability, reasons = assess_reliability(
        source_format=source_format, summary=summary, notes=notes
    )

    bpm, regularity = compute_heart_rate(
        notes.get("r_peak_samples"), _as_float(notes.get("sampling_rate_hz"))
    )
    hr_label = _hr_label(bpm)
    hr_approx = source_format == "image" and not bool(notes.get("grid_detected"))

    # ---- unreliable image: refuse to present labels as clinical fact ----
    if reliability == "low":
        caveats = reasons or ["The image could not be read reliably."]
        return EcgInterpretation(
            reliable=False,
            reliability="low",
            headline="Could not reliably read this ECG image.",
            findings=[
                "The automated classifications below are unlikely to be accurate "
                "for this upload and should not be used clinically.",
            ],
            recommendation=(
                "Upload a clear single-lead rhythm strip (crop a 12-lead image to "
                "one lead), or upload the raw signal as a CSV, for a reliable "
                "analysis."
            ),
            caveats=caveats,
            heart_rate_bpm=bpm,
            heart_rate_label=hr_label,
            rhythm_regularity=regularity,
            heart_rate_approximate=hr_approx,
        )

    # ---- reliable enough: build a real interpretation ----
    findings: list[str] = []
    if bpm is not None:
        approx = " (approximate)" if hr_approx else ""
        findings.append(f"Ventricular rate ≈ {int(bpm)} bpm{approx} — {hr_label}.")
    if regularity is not None:
        findings.append(f"Rhythm appears {regularity.lower()}.")
    findings.append(
        f"Predominant beat morphology: {summary.dominant_label} "
        f"({summary.dominant_class})."
    )
    findings.extend(_ectopy_findings(summary))

    abnormal_pct = summary.abnormal_percentage
    headline = _headline(summary, bpm, hr_label, regularity)
    recommendation = _recommendation(summary, abnormal_pct)

    caveats: list[str] = []
    if reliability == "moderate":
        caveats.extend(reasons)
    if source_format == "image":
        caveats.append(
            "Digitized from an image — verify against the original recording."
        )

    return EcgInterpretation(
        reliable=True,
        reliability=reliability,
        headline=headline,
        findings=findings,
        recommendation=recommendation,
        caveats=caveats,
        heart_rate_bpm=bpm,
        heart_rate_label=hr_label,
        rhythm_regularity=regularity,
        heart_rate_approximate=hr_approx,
    )


def _headline(summary: Any, bpm: float | None, hr_label: str | None, regularity: str | None) -> str:
    rate = f"≈{int(bpm)} bpm" if bpm is not None else "rate undetermined"
    if summary.abnormal_beats == 0:
        return f"Predominantly normal sinus beats, {rate}."
    # Name the most common abnormal class.
    abnormal_codes = {
        c: n for c, n in summary.class_counts.items() if c != "N" and n > 0
    }
    top = max(abnormal_codes, key=abnormal_codes.get) if abnormal_codes else None
    burden = summary.abnormal_percentage
    top_name = _ECTOPY_NAMES.get(top, "abnormal beats") if top else "abnormal beats"
    return (
        f"{summary.dominant_label}-predominant rhythm, {rate}, with "
        f"{_qualifier(burden)} {top_name} ({burden}%)."
    )


def _recommendation(summary: Any, abnormal_pct: float) -> str:
    if summary.abnormal_beats == 0:
        return (
            "No ectopy in the analyzed segment. Routine clinical correlation; no "
            "specific follow-up indicated by this strip alone."
        )
    if abnormal_pct >= _FREQUENT_PCT:
        return (
            "Significant ectopy burden. Recommend a full 12-lead ECG and "
            "consider ambulatory (Holter) monitoring to quantify and characterize "
            "the arrhythmia. Correlate clinically."
        )
    return (
        "Some ectopy present. Correlate with symptoms; a 12-lead ECG is advised "
        "to confirm and characterize the beats."
    )


# --------------------------------------------------------------------------- #
# Small coercion helpers (notes values arrive as Any / JSON-ish)
# --------------------------------------------------------------------------- #
def _as_float(v: Any) -> float | None:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def _as_int(v: Any) -> int | None:
    try:
        return int(v) if v is not None else None
    except (TypeError, ValueError):
        return None
