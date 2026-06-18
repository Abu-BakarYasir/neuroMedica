"""Turn an uploaded CSV into an (N, 187, 1) tensor of normalized heartbeats.

Two supported shapes:
  1. Wide  — one beat per row, 187+ columns (last column may be an int label
             from the Kaggle MIT-BIH dump; we drop it).
  2. Long  — single channel of raw samples (one column, many rows OR one row
             of many samples). We detect R-peaks with NeuroKit2, window each
             peak into a 187-sample beat, and normalize.
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass

import numpy as np

_logger = logging.getLogger(__name__)

BEAT_LEN = 187
# Sampling rate assumed for long-format uploads. MIT-BIH is 360 Hz; the
# Kaggle prep resampled to 125 Hz to produce the 187-sample beats. We expose
# this so callers can override per-upload if they know their device rate.
DEFAULT_SAMPLING_RATE_HZ = 125
# Skip detection on signals shorter than this; not enough context.
MIN_LONG_SAMPLES = 250


class EcgParseError(ValueError):
    """Raised when the uploaded file can't be turned into beats."""


@dataclass
class ParsedBeats:
    beats: np.ndarray  # shape (N, 187, 1), dtype float32
    source_format: str  # "wide" or "long"
    extra: dict


def _normalize_per_beat(beats: np.ndarray) -> np.ndarray:
    """Min-max normalize each beat into [0, 1] — matches Kaggle preprocessing.

    Flat beats (all-same value) collapse to zeros rather than NaN.
    """
    beats = beats.astype(np.float32, copy=False)
    mins = beats.min(axis=1, keepdims=True)
    maxs = beats.max(axis=1, keepdims=True)
    rng = maxs - mins
    safe = np.where(rng == 0, 1.0, rng)
    out = (beats - mins) / safe
    return np.where(rng == 0, 0.0, out).astype(np.float32)


def _read_numeric_matrix(raw: bytes) -> np.ndarray:
    """Parse CSV bytes into a 2D float matrix. Tolerates header rows.

    When numpy collapses a single-column-or-single-row input to 1-D, the
    original line layout is the tiebreaker: many lines → column vector,
    one line → row vector. Without that, a 1500-sample long signal in
    one column would get reshaped to a 1x1500 row and misclassified as
    a single wide beat by ``_looks_like_wide``.
    """
    text = raw.decode("utf-8", errors="replace").strip()
    if not text:
        raise EcgParseError("Uploaded file is empty.")

    buf = io.StringIO(text)
    # Try with no header first; if conversion blows up, retry skipping line 1.
    try:
        arr = np.genfromtxt(buf, delimiter=",", dtype=np.float64)
    except Exception as e:
        raise EcgParseError(f"Could not parse CSV: {e}")
    # genfromtxt returns a 0-d scalar when nothing parses (e.g. pure text).
    # Treat that the same as an empty result.
    if arr.ndim == 0 or arr.size == 0 or np.isnan(arr).all():
        buf.seek(0)
        arr = np.genfromtxt(buf, delimiter=",", dtype=np.float64, skip_header=1)
    if arr.ndim == 0 or arr.size == 0:
        raise EcgParseError("No numeric data found in CSV.")
    if arr.ndim == 1:
        nonempty_lines = sum(1 for line in text.splitlines() if line.strip())
        # >1 line of input → original was a column vector (long signal).
        if nonempty_lines > 1:
            arr = arr.reshape(-1, 1)
        else:
            arr = arr.reshape(1, -1)
    # Drop trailing all-NaN columns (Excel quirk) and any rows that are pure NaN.
    arr = arr[:, ~np.isnan(arr).all(axis=0)]
    arr = arr[~np.isnan(arr).all(axis=1)]
    if arr.size == 0:
        raise EcgParseError("CSV contained no usable numeric values.")
    return arr


def _looks_like_wide(matrix: np.ndarray) -> bool:
    """Wide = each row already a heartbeat (>= BEAT_LEN columns)."""
    return matrix.shape[1] >= BEAT_LEN


def _parse_wide(matrix: np.ndarray) -> ParsedBeats:
    # Take first BEAT_LEN columns; tolerate trailing label column.
    beats = matrix[:, :BEAT_LEN]
    # NaNs anywhere inside a beat → zero-fill (typically the tail-padded
    # beats from Kaggle that are already zero-extended).
    beats = np.nan_to_num(beats, nan=0.0)
    # Normalize defensively — the Kaggle CSV is already in [0,1] but
    # user-supplied wide CSVs often aren't.
    needs_norm = float(beats.min()) < 0.0 or float(beats.max()) > 1.0
    if needs_norm:
        beats = _normalize_per_beat(beats)
    return ParsedBeats(
        beats=beats.reshape(-1, BEAT_LEN, 1).astype(np.float32),
        source_format="wide",
        extra={"rows": int(matrix.shape[0])},
    )


def segment_signal(
    signal: np.ndarray,
    sampling_rate: float,
    *,
    source_format: str = "long",
    extra: dict | None = None,
) -> ParsedBeats:
    """Detect R-peaks on a 1-D single-lead signal and crop fixed-length beats.

    Shared by the long-CSV path and the image-digitization path — both reduce
    to "here is a 1-D signal at a known sampling rate, give me beats".
    """
    signal = np.asarray(signal).flatten().astype(np.float64)
    if signal.size < MIN_LONG_SAMPLES:
        raise EcgParseError(
            f"Signal too short for segmentation ({signal.size} samples). "
            f"Need at least {MIN_LONG_SAMPLES}, or upload one beat per row."
        )

    try:
        import neurokit2 as nk  # noqa: WPS433
    except ImportError as e:
        raise EcgParseError(
            "Long-format ECG requires neurokit2; install it or upload "
            "one beat per row (187 columns)."
        ) from e

    try:
        cleaned = nk.ecg_clean(signal, sampling_rate=sampling_rate)
        _, info = nk.ecg_peaks(cleaned, sampling_rate=sampling_rate)
        peaks = info.get("ECG_R_Peaks", [])
    except Exception as e:
        raise EcgParseError(f"R-peak detection failed: {e}") from e

    peaks = [int(p) for p in peaks if 0 <= int(p) < cleaned.size]
    if not peaks:
        raise EcgParseError("No R-peaks detected in signal.")

    # Center each beat on the R-peak. The Kaggle preprocessing windows
    # ~60 samples before and ~127 after — close to a 0.5s + 1.0s split at 125 Hz.
    pre, post = 60, BEAT_LEN - 60
    beats: list[np.ndarray] = []
    for p in peaks:
        start = p - pre
        end = p + post
        if start < 0 or end > cleaned.size:
            continue  # drop incomplete edge beats
        beats.append(cleaned[start:end])
    if not beats:
        raise EcgParseError(
            "All detected beats fell outside the signal window."
        )
    stacked = np.stack(beats, axis=0)
    stacked = _normalize_per_beat(stacked)
    merged = {
        "signal_length": int(signal.size),
        "sampling_rate_hz": round(float(sampling_rate), 2),
        "r_peaks_detected": len(peaks),
    }
    if extra:
        merged.update(extra)
    return ParsedBeats(
        beats=stacked.reshape(-1, BEAT_LEN, 1).astype(np.float32),
        source_format=source_format,
        extra=merged,
    )


def _segment_long(matrix: np.ndarray, sampling_rate: int) -> ParsedBeats:
    """Adapter: long-format CSV matrix → 1-D signal → shared segmentation."""
    return segment_signal(matrix.flatten(), sampling_rate, source_format="long")


def parse_csv_upload(
    raw: bytes,
    sampling_rate_hz: int = DEFAULT_SAMPLING_RATE_HZ,
    max_beats: int = 200,
) -> ParsedBeats:
    """Entry point used by the API route. Auto-detects wide vs long format."""
    matrix = _read_numeric_matrix(raw)
    parsed = (
        _parse_wide(matrix)
        if _looks_like_wide(matrix)
        else _segment_long(matrix, sampling_rate=sampling_rate_hz)
    )
    if parsed.beats.shape[0] > max_beats:
        # Cap so the UI doesn't choke and inference stays snappy.
        parsed.beats = parsed.beats[:max_beats]
        parsed.extra["truncated_to"] = max_beats
    return parsed


def parse_image_upload(raw: bytes, max_beats: int = 200) -> ParsedBeats:
    """Digitize an ECG-strip image into a signal, then segment into beats.

    Imported lazily so the CSV path never pays the Pillow/SciPy import cost.
    """
    from app.ecg import image_digitizer as digi  # noqa: WPS433

    try:
        digitized = digi.digitize_ecg_image(raw)
    except digi.EcgImageError as e:
        raise EcgParseError(str(e)) from e

    parsed = segment_signal(
        digitized.signal,
        digitized.sampling_rate_hz,
        source_format="image",
        extra={
            "digitization_quality": digitized.quality,
            "warnings": digitized.warnings,
            **digitized.meta,
        },
    )
    if parsed.beats.shape[0] > max_beats:
        parsed.beats = parsed.beats[:max_beats]
        parsed.extra["truncated_to"] = max_beats
    return parsed
