"""Deterministic synthetic heartbeats for the demo button.

We build PQRST-shaped 187-sample beats from a sum of Gaussians so the
endpoint stays self-contained — no need to bundle a CSV slice. The
synthetic beats are designed to be recognizable enough that the trained
model produces meaningful (though not necessarily perfect) predictions
on them, giving users a working "Try sample" path end to end.
"""

from __future__ import annotations

import numpy as np

from app.ecg.parser import BEAT_LEN

# (center_sample, amplitude, width) for each PQRST wave.
# Designed for a 187-sample beat at ~125 Hz, with the R-peak at sample 60.
_NORMAL_WAVES = (
    (40, 0.10, 6),   # P wave
    (55, -0.15, 2),  # Q
    (60, 1.00, 2),   # R (peak)
    (66, -0.25, 3),  # S
    (95, 0.30, 12),  # T wave
)


def _gaussian(t: np.ndarray, center: float, amp: float, width: float) -> np.ndarray:
    return amp * np.exp(-((t - center) ** 2) / (2 * width**2))


def _normalize(beat: np.ndarray) -> np.ndarray:
    mn, mx = float(beat.min()), float(beat.max())
    if mx - mn == 0:
        return np.zeros_like(beat, dtype=np.float32)
    return ((beat - mn) / (mx - mn)).astype(np.float32)


def _build(waves) -> np.ndarray:
    t = np.arange(BEAT_LEN, dtype=np.float64)
    beat = np.zeros(BEAT_LEN, dtype=np.float64)
    for center, amp, width in waves:
        beat += _gaussian(t, center, amp, width)
    return _normalize(beat)


def normal_beat() -> np.ndarray:
    """A canonical sinus beat — used by the 'Try sample' demo button."""
    return _build(_NORMAL_WAVES)


def sample_batch() -> np.ndarray:
    """One (1, 187, 1) batch ready for the model."""
    return normal_beat().reshape(1, BEAT_LEN, 1)
