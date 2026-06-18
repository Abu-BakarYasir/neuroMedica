"""Reliability tests for ECG-image digitization.

We render a *known* synthetic single-lead waveform onto ECG-style paper, then
assert the digitizer recovers it: high shape correlation, correct-ish beat
count, and graceful handling of inverted / rotated / low-res / no-grid / blank
inputs. No TensorFlow model is needed — these stop at the segmented-beats stage.
"""

from __future__ import annotations

import io

import numpy as np
import pytest
from PIL import Image, ImageDraw

from app.ecg import image_digitizer as digi
from app.ecg import parser as ecg_parser

# Render so that 1 image column == 1 sample at 125 Hz:
#   px_per_mm = 5  ->  px_per_sec = 5 * 25 = 125  ->  digitizer resamples 125->125 (no-op)
PX_PER_MM = 5
MINOR_PX = PX_PER_MM           # 1 mm minor grid
MAJOR_PX = PX_PER_MM * 5       # 5 mm major grid
HEIGHT = 240
RATE_HZ = 125


def _synth_signal(num_beats: int = 12, rr: int = 104) -> np.ndarray:
    """A clean PQRST train at 125 Hz (~72 bpm with rr=104). R-peak is a tall
    narrow spike so R-peak detection is unambiguous."""
    t = np.arange(rr, dtype=np.float64)

    def g(center, amp, width):
        return amp * np.exp(-((t - center) ** 2) / (2 * width**2))

    beat = g(30, 0.10, 4) + g(48, -0.15, 2) + g(52, 1.0, 1.6) + g(57, -0.25, 2.5) + g(80, 0.30, 8)
    return np.tile(beat, num_beats).astype(np.float64)


def _render(
    sig: np.ndarray,
    *,
    grid: bool = True,
    invert: bool = False,
    rotate_deg: float = 0.0,
    scale: float = 1.0,
) -> bytes:
    """Render a 1-D signal onto an ECG-paper-like image and return PNG bytes."""
    width = sig.size
    bg = (10, 10, 12) if invert else (255, 255, 255)
    trace_color = (235, 235, 235) if invert else (15, 15, 20)
    img = Image.new("RGB", (width, HEIGHT), bg)
    draw = ImageDraw.Draw(img)

    if grid:
        minor = (90, 40, 40) if invert else (255, 200, 200)
        major = (140, 60, 60) if invert else (240, 150, 150)
        for x in range(0, width, MINOR_PX):
            draw.line([(x, 0), (x, HEIGHT)], fill=minor)
        for y in range(0, HEIGHT, MINOR_PX):
            draw.line([(0, y), (width, y)], fill=minor)
        for x in range(0, width, MAJOR_PX):
            draw.line([(x, 0), (x, HEIGHT)], fill=major)
        for y in range(0, HEIGHT, MAJOR_PX):
            draw.line([(0, y), (width, y)], fill=major)

    # Map amplitude -> pixel row (center the baseline, leave headroom).
    amp = sig - sig.min()
    amp = amp / (amp.max() if amp.max() else 1.0)
    ys = HEIGHT - 40 - amp * (HEIGHT - 80)
    pts = [(x, float(ys[x])) for x in range(width)]
    draw.line(pts, fill=trace_color, width=2)

    if rotate_deg:
        img = img.rotate(rotate_deg, expand=False, fillcolor=bg)
    if scale != 1.0:
        img = img.resize((max(1, int(width * scale)), max(1, int(HEIGHT * scale))))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _best_corr(a: np.ndarray, b: np.ndarray, max_lag: int = 8) -> float:
    """Best Pearson r over small integer lags (tolerates filter/resample shift)."""
    n = min(a.size, b.size)
    a = a[:n] - a[:n].mean()
    b = b[:n] - b[:n].mean()
    best = -1.0
    for lag in range(-max_lag, max_lag + 1):
        if lag >= 0:
            x, y = a[lag:], b[: b.size - lag]
        else:
            x, y = a[: a.size + lag], b[-lag:]
        m = min(x.size, y.size)
        if m < 50:
            continue
        denom = np.linalg.norm(x[:m]) * np.linalg.norm(y[:m])
        if denom == 0:
            continue
        best = max(best, float(np.dot(x[:m], y[:m]) / denom))
    return best


# --------------------------------------------------------------------------- #
def test_clean_strip_recovers_signal_and_grid():
    src = _synth_signal(num_beats=12)
    out = digi.digitize_ecg_image(_render(src))

    assert out.meta["grid_detected"] is True
    assert out.meta["px_per_mm"] == pytest.approx(PX_PER_MM, abs=1.0)
    assert out.sampling_rate_hz == pytest.approx(RATE_HZ, abs=1.0)
    assert out.quality >= 0.5
    # The recovered trace should match the source shape closely.
    assert _best_corr(out.signal, src) > 0.85


def test_clean_strip_beat_count():
    src = _synth_signal(num_beats=12)
    out = digi.digitize_ecg_image(_render(src))
    parsed = ecg_parser.segment_signal(out.signal, out.sampling_rate_hz)
    # Edge beats (no full pre/post window) are dropped — allow a small shortfall.
    assert 9 <= parsed.beats.shape[0] <= 12
    assert parsed.beats.shape[1:] == (187, 1)


def test_parse_image_upload_shape_and_notes():
    raw = _render(_synth_signal(num_beats=10))
    parsed = ecg_parser.parse_image_upload(raw)
    assert parsed.source_format == "image"
    assert parsed.beats.ndim == 3 and parsed.beats.shape[1:] == (187, 1)
    assert "digitization_quality" in parsed.extra
    assert "coverage" in parsed.extra
    assert parsed.extra["grid_detected"] is True


def test_inverted_image():
    src = _synth_signal(num_beats=10)
    out = digi.digitize_ecg_image(_render(src, invert=True))
    assert out.meta["inverted"] is True
    assert _best_corr(out.signal, src) > 0.7


def test_rotated_image_still_digitizes():
    src = _synth_signal(num_beats=10)
    out = digi.digitize_ecg_image(_render(src, rotate_deg=3.0))
    parsed = ecg_parser.segment_signal(out.signal, out.sampling_rate_hz)
    assert parsed.beats.shape[0] >= 6


def test_low_resolution_image():
    src = _synth_signal(num_beats=12)
    out = digi.digitize_ecg_image(_render(src, scale=0.5))
    parsed = ecg_parser.segment_signal(out.signal, out.sampling_rate_hz)
    assert parsed.beats.shape[0] >= 6


def test_no_grid_fallback():
    src = _synth_signal(num_beats=12)
    out = digi.digitize_ecg_image(_render(src, grid=False))
    assert out.meta["grid_detected"] is False
    assert any("Grid not detected" in w for w in out.warnings)
    parsed = ecg_parser.segment_signal(out.signal, out.sampling_rate_hz)
    assert parsed.beats.shape[0] >= 6


def test_blank_image_raises():
    blank = Image.new("RGB", (600, HEIGHT), (255, 255, 255))
    buf = io.BytesIO()
    blank.save(buf, format="PNG")
    with pytest.raises(digi.EcgImageError):
        digi.digitize_ecg_image(buf.getvalue())


def test_undecodable_bytes_raise():
    with pytest.raises(digi.EcgImageError):
        digi.digitize_ecg_image(b"this is not an image")
