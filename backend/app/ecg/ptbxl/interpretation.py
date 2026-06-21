"""Turn the multi-label diagnosis into a clinician-readable interpretation.

Mirrors the philosophy of the single-lead interpreter: phrase the findings,
order them by urgency (MI first), and gate reliability — image uploads are
inherently uncalibrated/approximate for a diagnostic model, so they are never
presented as trustworthy.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.ecg.ptbxl.labels import SUPERCLASSES

_SIGNIFICANCE = {c.code: c.clinical_significance for c in SUPERCLASSES}
_NAME = {c.code: c.name for c in SUPERCLASSES}

# Time-critical superclass(es).
_URGENT_CODES = {"MI"}


@dataclass
class DiagnosticInterpretation:
    reliable: bool
    reliability: str  # "high" | "moderate" | "low"
    urgent: bool
    headline: str
    findings: list[str]
    recommendation: str
    caveats: list[str] = field(default_factory=list)
    heart_rate_bpm: float | None = None
    heart_rate_label: str | None = None
    rhythm_regularity: str | None = None


def _hr_label(bpm: float | None) -> str | None:
    if bpm is None:
        return None
    if bpm < 60:
        return "Bradycardia"
    if bpm > 100:
        return "Tachycardia"
    return "Normal"


def _pct(p: float) -> str:
    return f"{round(p * 100)}%"


def build_interpretation(result: Any) -> DiagnosticInterpretation:
    """``result`` is a predictor.DiagnosisResult."""
    probs = result.probabilities
    positive = list(result.positive)
    source_format = result.meta.get("source_format") or _infer_source(result)

    # ---- reliability gate ----
    if source_format == "image":
        reliability, reliable = "low", False
    else:
        reliability, reliable = "high", True

    bpm = result.heart_rate_bpm
    hr_label = _hr_label(bpm)

    caveats: list[str] = []
    if source_format == "image":
        caveats.append(
            "Digitized from an image — leads are non-simultaneous and amplitude "
            "is uncalibrated, so voltage-dependent findings (e.g. hypertrophy) "
            "are unreliable. Confirm against the source recording or upload WFDB."
        )

    abnormal_positive = [c for c in positive if c != "NORM"]

    # ---- headline + findings ----
    if not reliable:
        return DiagnosticInterpretation(
            reliable=False,
            reliability="low",
            urgent=False,
            headline="12-lead diagnosis from an image is approximate.",
            findings=[
                "The probabilities below are a rough estimate from a digitized "
                "image and should not be used for clinical decisions.",
            ],
            recommendation=(
                "Upload the recording as WFDB (.hea/.dat) for a reliable "
                "12-lead diagnosis."
            ),
            caveats=caveats,
            heart_rate_bpm=bpm,
            heart_rate_label=hr_label,
            rhythm_regularity=result.rhythm_regularity,
        )

    urgent = any(c in _URGENT_CODES for c in abnormal_positive)
    findings: list[str] = []
    if bpm is not None:
        findings.append(f"Ventricular rate ≈ {int(bpm)} bpm — {hr_label}.")
    if result.rhythm_regularity:
        findings.append(f"Rhythm appears {result.rhythm_regularity.lower()}.")

    if not abnormal_positive:
        norm_p = probs.get("NORM", 0.0)
        headline = f"Normal ECG (NORM {_pct(norm_p)})."
        findings.append(
            f"No diagnostic abnormality reached the decision threshold "
            f"({_pct(result.threshold)}). Highest abnormal class: "
            f"{_top_abnormal_phrase(probs)}."
        )
        recommendation = (
            "Within normal limits on automated analysis. Routine clinical "
            "correlation."
        )
    else:
        named = ", ".join(_NAME[c] for c in abnormal_positive)
        headline = f"Abnormal ECG — {named} detected."
        for c in abnormal_positive:
            findings.append(
                f"{_NAME[c]} ({c}) — probability {_pct(probs[c])}. "
                f"{_SIGNIFICANCE[c]}"
            )
        if urgent:
            recommendation = (
                "Findings suggest myocardial infarction. If this is an acute "
                "presentation, seek urgent cardiology review immediately. "
                "Confirm with a clinician-read 12-lead ECG and serial troponins."
            )
        else:
            recommendation = (
                "Abnormal automated findings. Recommend a clinician-read 12-lead "
                "ECG and clinical correlation; further workup per the specific "
                "abnormality."
            )

    return DiagnosticInterpretation(
        reliable=True,
        reliability=reliability,
        urgent=urgent,
        headline=headline,
        findings=findings,
        recommendation=recommendation,
        caveats=caveats,
        heart_rate_bpm=bpm,
        heart_rate_label=hr_label,
        rhythm_regularity=result.rhythm_regularity,
    )


def _top_abnormal_phrase(probs: dict) -> str:
    abnormal = {c: p for c, p in probs.items() if c != "NORM"}
    if not abnormal:
        return "none"
    top = max(abnormal, key=abnormal.get)
    return f"{_NAME[top]} ({_pct(abnormal[top])})"


def _infer_source(result: Any) -> str:
    # predictor copies record.meta; source_format is added by the route. Fall
    # back to meta hints if absent.
    if result.meta.get("approximate"):
        return "image"
    return result.meta.get("source_format", "wfdb")
