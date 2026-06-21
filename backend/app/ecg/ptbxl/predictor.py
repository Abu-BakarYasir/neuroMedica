"""Run the PTB-XL model on a parsed record → multi-label diagnostic result.

The model outputs an independent sigmoid probability per diagnostic superclass
(NORM, MI, STTC, CD, HYP). We also estimate heart rate from lead II so the
interpretation can report a rate, since the diagnostic head doesn't.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

import numpy as np

from app.ecg.ptbxl import preprocess
from app.ecg.ptbxl.labels import SUPERCLASSES
from app.ecg.ptbxl.model_loader import get_model, get_norm
from app.ecg.ptbxl.parser import ParsedRecord

_logger = logging.getLogger(__name__)

# Default decision threshold for calling a superclass "present".
DEFAULT_THRESHOLD = 0.5

_LABEL_BY_CODE = {c.code: c.name for c in SUPERCLASSES}


@dataclass
class DiagnosisResult:
    probabilities: dict[str, float]  # superclass code -> probability
    positive: list[str]  # codes at/above threshold, severity-ordered
    top_code: str
    top_label: str
    threshold: float
    heart_rate_bpm: float | None = None
    rhythm_regularity: str | None = None
    meta: dict = field(default_factory=dict)


# Severity order for presenting multiple positive findings (most urgent first).
_SEVERITY = {"MI": 0, "CD": 1, "STTC": 2, "HYP": 3, "NORM": 4}


def _estimate_heart_rate(
    lead_ii: np.ndarray, rate: float
) -> tuple[float | None, str | None]:
    """Median heart rate + regularity from lead II. Best-effort, never raises."""
    try:
        import neurokit2 as nk

        cleaned = nk.ecg_clean(np.asarray(lead_ii, dtype=np.float64), sampling_rate=rate)
        _, info = nk.ecg_peaks(cleaned, sampling_rate=rate)
        peaks = np.asarray(info.get("ECG_R_Peaks", []), dtype=np.float64)
    except Exception:  # noqa: BLE001 - HR is a nice-to-have, not load-bearing
        return None, None
    if peaks.size < 3:
        return None, None
    rr = np.diff(peaks) / float(rate)
    rr = rr[(rr >= 0.25) & (rr <= 2.5)]
    if rr.size < 2:
        return None, None
    bpm = round(float(60.0 / np.median(rr)), 0)
    cv = float(np.std(rr) / np.mean(rr)) if np.mean(rr) else 0.0
    return bpm, ("Irregular" if cv > 0.15 else "Regular")


def predict(
    record: ParsedRecord, threshold: float = DEFAULT_THRESHOLD
) -> DiagnosisResult:
    norm = get_norm()
    batch = preprocess.prepare(
        record.signal,
        record.sampling_rate_hz,
        norm,
        standardize_per_lead=(record.source_format == "image"),
    )
    model = get_model()
    raw = model.predict(batch, verbose=0)
    probs_row = np.asarray(raw).reshape(-1)

    codes = list(norm.superclasses)
    if probs_row.shape[0] != len(codes):
        raise ValueError(
            f"Model emitted {probs_row.shape[0]} outputs but norm.json lists "
            f"{len(codes)} superclasses."
        )
    probabilities = {code: float(probs_row[i]) for i, code in enumerate(codes)}

    positive = sorted(
        (c for c, p in probabilities.items() if p >= threshold),
        key=lambda c: _SEVERITY.get(c, 99),
    )
    top_code = max(probabilities, key=probabilities.get)

    # Heart rate from lead II (index 1) at the record's native rate.
    hr_bpm, regularity = (None, None)
    if record.signal.ndim == 2 and record.signal.shape[1] >= 2:
        hr_bpm, regularity = _estimate_heart_rate(
            record.signal[:, 1], record.sampling_rate_hz
        )

    return DiagnosisResult(
        probabilities=probabilities,
        positive=positive,
        top_code=top_code,
        top_label=_LABEL_BY_CODE.get(top_code, top_code),
        threshold=threshold,
        heart_rate_bpm=hr_bpm,
        rhythm_regularity=regularity,
        meta={**record.meta, "source_format": record.source_format},
    )
