"""A bundled real 12-lead record for the 'Try sample' demo button.

Ships one normal (NORM) PTB-XL record (record 00001_lr, 10 s @ 100 Hz, CC-BY
4.0) so the demo classifies correctly end-to-end without the user supplying any
data. Falls back to a synthetic record if the bundled file is missing.

PTB-XL: Wagner et al., Sci Data 2020; PhysioNet, CC-BY 4.0.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

from app.ecg.ptbxl.parser import ParsedRecord

_RATE = 100
_DURATION_S = 10
_SAMPLE_NPY = Path(__file__).resolve().parent / "sample_norm.npy"
# Rough typical R-wave polarity/scale per lead, for the synthetic fallback.
_LEAD_GAIN = np.array(
    [0.7, 1.0, 0.5, -0.6, 0.4, 0.7, -0.4, -0.2, 0.4, 0.9, 1.0, 0.8],
    dtype=np.float32,
)


def sample_record() -> ParsedRecord:
    if _SAMPLE_NPY.is_file():
        signal = np.load(_SAMPLE_NPY).astype(np.float32)
        if signal.shape == (_RATE * _DURATION_S, 12):
            return ParsedRecord(
                signal=signal,
                sampling_rate_hz=float(_RATE),
                source_format="sample",
                meta={"source": "ptbxl_record_00001_lr (NORM)", "native_rate_hz": float(_RATE)},
            )

    # Fallback: a crude synthetic record (used only if the bundled file is absent).
    t = np.arange(_RATE * _DURATION_S, dtype=np.float32)
    base = 0.6 * np.sin(2 * np.pi * 1.2 * t / _RATE)
    base = base / (float(np.max(np.abs(base))) or 1.0) * 1.2
    signal = (base[:, None] * _LEAD_GAIN[None, :]).astype(np.float32)
    return ParsedRecord(
        signal=signal,
        sampling_rate_hz=float(_RATE),
        source_format="sample",
        meta={"source": "synthetic_12lead", "native_rate_hz": float(_RATE)},
    )
