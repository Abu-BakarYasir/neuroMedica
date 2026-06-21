"""Turn a raw (timesteps, 12) recording into the exact tensor the PTB-XL model
expects: resampled to the training rate, fit to the training length, and
per-lead z-scored with the saved train-set statistics.

Keeping this separate from the parsers means every input format (WFDB, CSV,
image) converges on one preprocessing path — identical to what training did.
"""

from __future__ import annotations

import numpy as np
from scipy import signal as sp_signal

from app.ecg.ptbxl.model_loader import NormStats


def _resample_rate(sig: np.ndarray, src_rate: float, dst_rate: float) -> np.ndarray:
    """Resample (T, 12) from src_rate to dst_rate along the time axis."""
    if abs(src_rate - dst_rate) < 1e-6:
        return sig
    n_target = max(1, int(round(sig.shape[0] * dst_rate / src_rate)))
    return sp_signal.resample(sig, n_target, axis=0)


def _fit_length(sig: np.ndarray, timesteps: int) -> np.ndarray:
    """Center-crop or edge-pad (T, 12) to exactly ``timesteps`` rows."""
    t = sig.shape[0]
    if t == timesteps:
        return sig
    if t > timesteps:
        start = (t - timesteps) // 2
        return sig[start : start + timesteps]
    # Shorter than a full window: pad symmetrically by repeating edge samples so
    # we don't inject a hard zero step that the model never saw in training.
    pad_total = timesteps - t
    pad_before = pad_total // 2
    pad_after = pad_total - pad_before
    return np.pad(sig, ((pad_before, pad_after), (0, 0)), mode="edge")


def prepare(
    sig: np.ndarray,
    src_rate: float,
    norm: NormStats,
    *,
    standardize_per_lead: bool = False,
) -> np.ndarray:
    """Return a model-ready (1, timesteps, 12) float32 batch.

    Args:
        sig: (T, 12) raw signal (lead order = PTB-XL LEAD_ORDER).
        src_rate: sampling rate of ``sig`` in Hz.
        norm: training normalization stats + target rate/length.
        standardize_per_lead: when True, standardize each lead to zero-mean /
            unit-variance from the signal itself instead of applying the saved
            train statistics. Used for digitized images, whose pixel amplitude
            is uncalibrated (mV stats would put it on the wrong scale).
    """
    sig = np.asarray(sig, dtype=np.float32)
    if sig.ndim != 2 or sig.shape[1] != 12:
        raise ValueError(f"Expected (T, 12) signal; got {sig.shape}")

    # Replace non-finite samples (dead leads / decode gaps) before filtering.
    sig = np.nan_to_num(sig, nan=0.0, posinf=0.0, neginf=0.0)

    sig = _resample_rate(sig, src_rate, float(norm.sampling_rate))
    sig = _fit_length(sig, norm.timesteps)

    if standardize_per_lead:
        mean = sig.mean(axis=0, keepdims=True)
        std = sig.std(axis=0, keepdims=True)
        std[std < 1e-6] = 1.0
        sig = (sig - mean) / std
    else:
        # Per-lead z-score with the saved train stats (std already guarded > 0).
        sig = (sig - norm.lead_mean) / norm.lead_std
    return sig.reshape(1, norm.timesteps, 12).astype(np.float32)
