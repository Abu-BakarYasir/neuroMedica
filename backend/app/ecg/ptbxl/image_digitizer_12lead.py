"""Best-effort digitization of a printed 12-lead ECG chart image.

This is fundamentally approximate and is always flagged low-reliability
downstream. A standard 12-lead printout shows each lead in its own panel
(typically a 3-row × 4-column grid) covering only ~2.5 s, and the absolute
millivolt scale is unknown without grid calibration. We recover *morphology*
per panel, not a calibrated simultaneous 12-lead recording.

Approach:
  1. Split the image into a 3×4 grid of panels.
  2. Digitize each panel's trace (reusing the single-lead trace extractor).
  3. Map panels to leads in the conventional print order.
  4. Standardize each lead's shape and stack into (T, 12).

Reused from the single-lead digitizer: image loading, the ink mask, and the
column-centroid trace extractor.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

import numpy as np

from app.ecg.image_digitizer import (
    DEFAULT_MAX_PX,
    _extract_trace,
    _ink_mask,
    _load_rgb,
)

_logger = logging.getLogger(__name__)

# Output: 2.5 s per panel at 100 Hz (the per-lead window a 3×4 printout shows).
_PANEL_SAMPLES = 250
_PANEL_RATE_HZ = 100.0

# Standard 3×4 print layout → lead per (row, col).
_GRID_LAYOUT = (
    ("I", "aVR", "V1", "V4"),
    ("II", "aVL", "V2", "V5"),
    ("III", "aVF", "V3", "V6"),
)
_LEAD_INDEX = {
    "I": 0, "II": 1, "III": 2, "aVR": 3, "aVL": 4, "aVF": 5,
    "V1": 6, "V2": 7, "V3": 8, "V4": 9, "V5": 10, "V6": 11,
}


class Ecg12LeadImageError(ValueError):
    """Raised when no usable 12-lead layout can be recovered from an image."""


@dataclass
class Digitized12Lead:
    signal: np.ndarray  # (T, 12) float32 — per-lead standardized morphology
    sampling_rate_hz: float
    meta: dict = field(default_factory=dict)


def _digitize_panel(rgb_cell: np.ndarray) -> tuple[np.ndarray, float]:
    """Return (resampled trace of length _PANEL_SAMPLES, coverage) for a panel."""
    from scipy import signal as sp_signal

    mask, weight, _ = _ink_mask(rgb_cell)
    try:
        centroid, coverage = _extract_trace(mask, weight)
    except Exception:  # noqa: BLE001 - empty panels are expected sometimes
        return np.zeros(_PANEL_SAMPLES, dtype=np.float32), 0.0
    # Image rows grow downward; flip so an upward deflection is positive.
    trace = -centroid.astype(np.float64)
    trace = trace - np.median(trace)  # baseline removal
    if trace.size < 2:
        return np.zeros(_PANEL_SAMPLES, dtype=np.float32), coverage
    resampled = sp_signal.resample(trace, _PANEL_SAMPLES)
    return resampled.astype(np.float32), float(coverage)


def digitize_12lead_image(raw: bytes, *, max_px: int = DEFAULT_MAX_PX) -> Digitized12Lead:
    rgb = _load_rgb(raw, max_px)
    h, w = rgb.shape[:2]
    if h < 60 or w < 120:
        raise Ecg12LeadImageError("Image is too small to contain a 12-lead chart.")

    rows, cols = 3, 4
    row_h = h // rows
    col_w = w // cols

    leads = np.zeros((_PANEL_SAMPLES, 12), dtype=np.float32)
    coverages: list[float] = []
    for r in range(rows):
        for c in range(cols):
            cell = rgb[r * row_h : (r + 1) * row_h, c * col_w : (c + 1) * col_w]
            trace, coverage = _digitize_panel(cell)
            lead_name = _GRID_LAYOUT[r][c]
            leads[:, _LEAD_INDEX[lead_name]] = trace
            coverages.append(coverage)

    mean_coverage = float(np.mean(coverages)) if coverages else 0.0
    panels_with_trace = int(sum(1 for cov in coverages if cov > 0.3))
    if panels_with_trace < 6:
        raise Ecg12LeadImageError(
            "Could not find a 12-lead grid of waveforms in this image. Upload a "
            "standard 3×4 printout, or the record as WFDB (.hea/.dat)."
        )

    return Digitized12Lead(
        signal=leads,
        sampling_rate_hz=_PANEL_RATE_HZ,
        meta={
            "layout": "3x4",
            "panels_with_trace": panels_with_trace,
            "mean_coverage": round(mean_coverage, 3),
            # Per-panel windows aren't simultaneous and amplitude is uncalibrated.
            "approximate": True,
        },
    )
