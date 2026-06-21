"""Lazy, thread-safe loader for the PTB-XL 12-lead diagnostic model.

Loads two artifacts that ship together:
  * ``ptbxl_12lead.keras``      — the trained ResNet1D (multi-label sigmoid head)
  * ``ptbxl_12lead.norm.json``  — per-lead z-score stats + sampling_rate/timesteps
                                  + the superclass label order

Both paths are overridable via env vars so tests can point at a stand-in model
and CI/deploys can relocate the weights.
"""

from __future__ import annotations

import json
import logging
import os
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np

_logger = logging.getLogger(__name__)

# backend/app/ecg/ptbxl/model_loader.py -> parents[3] == backend/
_BACKEND_ROOT = Path(__file__).resolve().parents[3]
_DEFAULT_MODEL_PATH = _BACKEND_ROOT / "models" / "ptbxl_12lead.keras"
_DEFAULT_NORM_PATH = _BACKEND_ROOT / "models" / "ptbxl_12lead.norm.json"

_LOCK = threading.Lock()
_MODEL: Any | None = None
_NORM: NormStats | None = None


@dataclass(frozen=True)
class NormStats:
    sampling_rate: int
    timesteps: int
    lead_mean: np.ndarray  # (12,) float32
    lead_std: np.ndarray  # (12,) float32
    superclasses: tuple[str, ...]


def model_path() -> Path:
    override = os.environ.get("PTBXL_MODEL_PATH")
    return Path(override) if override else _DEFAULT_MODEL_PATH


def norm_path() -> Path:
    override = os.environ.get("PTBXL_NORM_PATH")
    return Path(override) if override else _DEFAULT_NORM_PATH


def get_norm() -> NormStats:
    """Load (and cache) the normalization/label-order sidecar."""
    global _NORM
    if _NORM is not None:
        return _NORM
    path = norm_path()
    if not path.is_file():
        raise FileNotFoundError(
            f"PTB-XL norm stats not found at {path}. Place ptbxl_12lead.norm.json "
            "in backend/models/ or set PTBXL_NORM_PATH."
        )
    payload = json.loads(path.read_text(encoding="utf-8"))
    _NORM = NormStats(
        sampling_rate=int(payload["sampling_rate"]),
        timesteps=int(payload["timesteps"]),
        lead_mean=np.asarray(payload["lead_mean"], dtype=np.float32),
        lead_std=np.asarray(payload["lead_std"], dtype=np.float32),
        superclasses=tuple(payload["superclasses"]),
    )
    return _NORM


def get_model() -> Any:
    """Return the loaded Keras model, loading on first call."""
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    with _LOCK:
        if _MODEL is not None:
            return _MODEL
        path = model_path()
        if not path.is_file():
            raise FileNotFoundError(
                f"PTB-XL model not found at {path}. Place ptbxl_12lead.keras in "
                "backend/models/ or set PTBXL_MODEL_PATH."
            )
        _logger.info("Loading PTB-XL 12-lead model from %s ...", path)
        import keras  # local import: keep TF cost off unrelated import paths

        _MODEL = keras.models.load_model(str(path), compile=False)
        _logger.info(
            "PTB-XL model loaded — input %s, output %s",
            _MODEL.input_shape,
            _MODEL.output_shape,
        )
        return _MODEL


def warmup() -> None:
    """Force-load model + norm stats. Safe to call from FastAPI lifespan."""
    try:
        get_norm()
        get_model()
    except FileNotFoundError as e:
        # Don't crash the app if artifacts are missing — the analyze route
        # returns a clean 503 instead.
        _logger.warning("PTB-XL warmup skipped: %s", e)
    except Exception:
        _logger.exception("PTB-XL warmup failed")


def reset_cache() -> None:
    """Clear cached model/norm — used by tests that swap artifacts."""
    global _MODEL, _NORM
    with _LOCK:
        _MODEL = None
        _NORM = None
