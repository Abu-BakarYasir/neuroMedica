"""Digitize a photo/scan of a single-lead ECG rhythm strip into a 1-D signal.

The ECG model classifies the *morphology* of a heartbeat (per-beat min-max
normalized), so we don't need true mV calibration — we only need a clean
amplitude-vs-time trace plus an effective sampling rate. This module turns an
uploaded raster image into exactly that, after which ``parser.segment_signal``
runs the same R-peak → 187-sample-beat pipeline used for raw CSV signals.

Library-light on purpose: Pillow + NumPy + SciPy only (no OpenCV), to keep the
deploy image small. Best-effort by design — scanned/clean single-lead strips
digitize most reliably; noisy phone photos degrade gracefully and are flagged
via the returned ``quality`` score and ``warnings``.
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass, field
from fractions import Fraction

import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage, signal

_logger = logging.getLogger(__name__)

# Resample everything to this rate so parser's fixed beat window (pre=60/
# post=127 samples, tuned for 125 Hz) stays valid.
TARGET_RATE_HZ = 125
# Standard ECG paper speed (mm/s); used to convert px/mm -> px/s.
PAPER_SPEED_MM_S = 25.0
# Downscale guard: cap the long edge (speed + memory).
DEFAULT_MAX_PX = 2000
# A digitized strip must yield at least this many samples post-resample.
_MIN_SAMPLES = 250
# A connected ink component must span at least this fraction of the width to be
# considered part of the trace (drops text labels / isolated 12-lead cells).
_MIN_TRACE_WIDTH_FRAC = 0.35


class EcgImageError(ValueError):
    """Raised when no usable trace can be recovered from an image."""


@dataclass
class DigitizedSignal:
    signal: np.ndarray  # 1-D float32, baseline-removed, up = positive
    sampling_rate_hz: float  # effective rate after calibration / fallback
    quality: float  # 0..1 digitization confidence
    warnings: list[str] = field(default_factory=list)
    meta: dict = field(default_factory=dict)


# --------------------------------------------------------------------------- #
# Low-level helpers
# --------------------------------------------------------------------------- #
def _load_rgb(raw: bytes, max_px: int) -> np.ndarray:
    """Decode bytes → HxWx3 uint8, honoring EXIF orientation, downscaled."""
    try:
        img = Image.open(io.BytesIO(raw))
        img = ImageOps.exif_transpose(img)
        img = img.convert("RGB")
    except Exception as e:  # noqa: BLE001 - any decode failure is user-facing
        raise EcgImageError(
            "Could not read this image. Upload a PNG/JPG of a single-lead ECG "
            "strip, or a CSV of the signal."
        ) from e

    w, h = img.size
    if w == 0 or h == 0:
        raise EcgImageError("Image has no pixels.")
    longest = max(w, h)
    if longest > max_px:
        scale = max_px / longest
        img = img.resize((max(1, round(w * scale)), max(1, round(h * scale))))
    return np.asarray(img, dtype=np.uint8)


def _luminance(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (0.299 * r + 0.587 * g + 0.114 * b).astype(np.float32)


def _first_autocorr_peak(x: np.ndarray, lo: int, hi: int) -> tuple[int, float]:
    """Return (lag, normalized strength) of the strongest autocorr peak in
    [lo, hi]. Strength is the peak value relative to the zero-lag energy."""
    x = x - x.mean()
    if not np.any(x):
        return 0, 0.0
    ac = np.correlate(x, x, mode="full")[x.size - 1 :]
    zero = ac[0] if ac[0] != 0 else 1.0
    ac = ac / zero
    hi = min(hi, ac.size - 1)
    if hi <= lo:
        return 0, 0.0
    window = ac[lo : hi + 1]
    idx = int(np.argmax(window))
    return lo + idx, float(window[idx])


# --------------------------------------------------------------------------- #
# Pipeline stages
# --------------------------------------------------------------------------- #
def _ink_mask(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, bool]:
    """Binary trace mask + per-pixel ink weight + inverted flag.

    Non-inverted (dark trace on light paper): trace pixels are dark in *all*
    channels, so the per-pixel min channel separates the (usually red) grid —
    which stays bright in G/B — from the trace. Inverted (light trace on dark
    background, e.g. a monitor capture): fall back to luminance.

    Threshold = midpoint between the background mode (median, since paper
    dominates) and the trace extreme (1st/99th percentile). This is robust to
    the very imbalanced histogram of a thin trace, where Otsu degenerates.
    """
    gray = _luminance(rgb)
    inverted = bool(gray.mean() < 110)
    if inverted:
        metric = gray
        bg = float(np.median(metric))
        extreme = float(np.percentile(metric, 99))
        thr = (bg + extreme) / 2.0
        mask = metric > thr
        weight = np.clip(metric - thr, 0, None)
    else:
        metric = rgb.min(axis=2).astype(np.float32)  # dark-in-all => trace
        bg = float(np.median(metric))
        extreme = float(np.percentile(metric, 1))
        thr = (bg + extreme) / 2.0
        mask = metric < thr
        weight = np.clip(thr - metric, 0, None)
    # Despeckle salt noise without eroding the (often 1-2px) trace line: drop
    # only tiny connected components. Width-based band selection downstream
    # removes the rest (text labels, isolated 12-lead cells).
    labeled, n = ndimage.label(mask)
    if n > 0:
        sizes = np.bincount(labeled.ravel())
        too_small = sizes < 3
        too_small[0] = False  # never drop the background label
        mask = mask & ~too_small[labeled]
    return mask, weight.astype(np.float32), inverted


def _select_trace_band(mask: np.ndarray) -> tuple[np.ndarray, int]:
    """Keep only wide connected components (the rhythm strip); drop text and
    isolated 12-lead cells. Returns (filtered_mask, distinct_band_count)."""
    width = mask.shape[1]
    labeled, n = ndimage.label(mask)
    if n == 0:
        return mask, 0
    keep = np.zeros_like(mask)
    band_rows: list[int] = []
    for lab in range(1, n + 1):
        ys, xs = np.where(labeled == lab)
        if xs.size == 0:
            continue
        extent = (xs.max() - xs.min() + 1) / width
        if extent >= _MIN_TRACE_WIDTH_FRAC:
            keep[labeled == lab] = True
            band_rows.append(int(ys.mean()))
    if not keep.any():
        return mask, 0  # nothing wide enough; fall back to the raw mask
    # Count distinct horizontal bands (rows clustered > ~5% of height apart).
    band_rows.sort()
    bands = 1
    gap = max(8, mask.shape[0] // 20)
    for a, b in zip(band_rows, band_rows[1:]):
        if b - a > gap:
            bands += 1
    return keep, bands


def _extract_trace(mask: np.ndarray, weight: np.ndarray) -> tuple[np.ndarray, float]:
    """Intensity-weighted vertical centroid per column → y[x] (raw, in px).

    Empty columns are linearly interpolated. ``coverage`` is the fraction of
    columns that actually contained ink.
    """
    h, w = mask.shape
    rows = np.arange(h, dtype=np.float32)[:, None]
    col_w = np.where(mask, weight, 0.0)
    col_sum = col_w.sum(axis=0)
    has_ink = col_sum > 0
    coverage = float(has_ink.mean())
    if has_ink.sum() < 2:
        raise EcgImageError(
            "No ECG trace found in this image. Make sure it shows a clear "
            "single-lead waveform, or upload the signal as a CSV."
        )
    centroid = np.zeros(w, dtype=np.float32)
    centroid[has_ink] = (rows * col_w[:, has_ink]).sum(axis=0) / col_sum[has_ink]
    # Bridge gaps so segmentation sees a continuous signal.
    xs = np.arange(w)
    centroid = np.interp(xs, xs[has_ink], centroid[has_ink]).astype(np.float32)
    return centroid, coverage


def _detect_px_per_mm(rgb: np.ndarray) -> tuple[float | None, float]:
    """Estimate pixels-per-mm from the (red/orange) grid via autocorrelation of
    the vertical-gridline column profile. Returns (px_per_mm, confidence).

    The 1 mm minor grid is the autocorrelation *fundamental* (smallest strong
    period); the 5 mm major grid shows up as a harmonic at 5x. We take the
    smallest prominent period so faint-minor / strong-major images don't yield a
    5x-too-large spacing — and as a backstop, an implausibly large "1 mm"
    spacing is treated as the major grid and divided by 5.
    """
    r = rgb[..., 0].astype(np.int16)
    g = rgb[..., 1].astype(np.int16)
    b = rgb[..., 2].astype(np.int16)
    grid = (r > 110) & (r - np.maximum(g, b) > 18)
    if grid.mean() < 0.01:
        return None, 0.0
    col_profile = grid.sum(axis=0).astype(np.float32)
    col_profile = col_profile - col_profile.mean()
    if not np.any(col_profile):
        return None, 0.0
    ac = np.correlate(col_profile, col_profile, mode="full")[col_profile.size - 1 :]
    ac = ac / (ac[0] if ac[0] else 1.0)
    hi = min(90, ac.size - 1)
    if hi <= 3:
        return None, 0.0
    peaks, props = signal.find_peaks(ac[: hi + 1], height=0.2)
    peaks = peaks[peaks >= 3]
    if peaks.size == 0:
        lag, strength = _first_autocorr_peak(col_profile, lo=3, hi=hi)
        if lag <= 0 or strength < 0.15:
            return None, 0.0
        spacing, conf = float(lag), float(strength)
    else:
        spacing = float(peaks[0])  # smallest prominent period = 1 mm fundamental
        conf = float(ac[int(peaks[0])])
    # Backstop: a 1 mm square wider than ~16 px is implausible for an uploaded
    # strip — we actually locked onto the 5 mm major grid.
    if spacing > 16:
        spacing /= 5.0
    return spacing, float(min(1.0, conf))


def _resample(sig: np.ndarray, src_rate: float, dst_rate: float) -> np.ndarray:
    if abs(src_rate - dst_rate) < 1e-6:
        return sig.astype(np.float32)
    frac = Fraction(dst_rate / src_rate).limit_denominator(100)
    up, down = max(1, frac.numerator), max(1, frac.denominator)
    return signal.resample_poly(sig, up, down).astype(np.float32)


def _highpass_detrend(sig: np.ndarray, rate: float) -> np.ndarray:
    """Remove baseline wander with a 0.5 Hz high-pass (falls back to median
    subtraction for very short signals)."""
    if sig.size < 30:
        return (sig - np.median(sig)).astype(np.float32)
    try:
        sos = signal.butter(2, 0.5, btype="highpass", fs=rate, output="sos")
        return signal.sosfiltfilt(sos, sig).astype(np.float32)
    except Exception:  # noqa: BLE001 - degenerate signals
        win = max(3, int(rate * 0.8) | 1)
        return (sig - ndimage.median_filter(sig, size=win)).astype(np.float32)


# --------------------------------------------------------------------------- #
# Public entry point
# --------------------------------------------------------------------------- #
def digitize_ecg_image(raw: bytes, *, max_px: int = DEFAULT_MAX_PX) -> DigitizedSignal:
    """Turn ECG-strip image bytes into a 1-D signal ready for segmentation."""
    warnings: list[str] = []
    rgb = _load_rgb(raw, max_px)

    mask, weight, inverted = _ink_mask(rgb)
    if inverted:
        warnings.append("Detected a light trace on a dark background (inverted).")

    mask, bands = _select_trace_band(mask)
    if bands > 1:
        warnings.append(
            "Multiple traces detected — digitizing the widest strip. For a "
            "12-lead image, crop to a single rhythm lead for best results."
        )

    centroid, coverage = _extract_trace(mask, weight)
    # Image rows grow downward; flip so an upward deflection is positive.
    raw_signal = -centroid

    px_per_mm, grid_conf = _detect_px_per_mm(rgb)
    if px_per_mm:
        src_rate = px_per_mm * PAPER_SPEED_MM_S
    else:
        # No grid: infer rate from the dominant beat spacing so HR is plausible.
        grid_conf = 0.0
        warnings.append("Grid not detected — beat timing is approximate.")
        lag, _ = _first_autocorr_peak(
            raw_signal - raw_signal.mean(), lo=8, hi=max(10, raw_signal.size // 2)
        )
        # Assume ~75 bpm (RR ≈ 0.8 s) for the dominant period.
        rr_px = lag if lag > 0 else raw_signal.size
        src_rate = rr_px / 0.8
        # Clamp so a wildly off estimate can't explode the resample ratio.
        src_rate = float(np.clip(src_rate, 30.0, 600.0))

    resampled = _resample(raw_signal, src_rate, TARGET_RATE_HZ)
    if resampled.size < _MIN_SAMPLES:
        raise EcgImageError(
            "The recovered trace is too short to analyze. Upload a longer "
            "single-lead strip (a few seconds) or the signal as a CSV."
        )
    clean = _highpass_detrend(resampled, TARGET_RATE_HZ)

    quality = float(min(1.0, 0.6 * coverage + 0.4 * grid_conf))
    if coverage < 0.5:
        warnings.append("Sparse trace — parts of the waveform may be missing.")

    return DigitizedSignal(
        signal=clean,
        sampling_rate_hz=float(TARGET_RATE_HZ),
        quality=round(quality, 2),
        warnings=warnings,
        meta={
            "coverage": round(coverage, 3),
            "px_per_mm": round(px_per_mm, 2) if px_per_mm else None,
            "grid_detected": px_per_mm is not None,
            "inverted": inverted,
            "trace_bands": bands,
            "samples": int(clean.size),
        },
    )
