"""Lazy, thread-safe loader for the CheXVision DenseNet-121 checkpoint.

The checkpoint is ~90 MB and torch's import is heavy, so we hide both behind a
lock and only touch them on first use. Mirrors the ECG model_loader pattern.
"""

from __future__ import annotations

import logging
import os
import threading
from pathlib import Path
from typing import Any

_logger = logging.getLogger(__name__)

# Anchored at backend/ so it resolves both in dev (uvicorn from backend/) and
# in the Railway container.
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_MODEL_PATH = _BACKEND_ROOT / "models" / "CheXVision-DenseNet_best.pth"

_MODEL_LOCK = threading.Lock()
_MODEL: Any | None = None


def model_path() -> Path:
    """Allow override via CXR_MODEL_PATH for tests or alternative deployments."""
    override = os.environ.get("CXR_MODEL_PATH")
    return Path(override) if override else _DEFAULT_MODEL_PATH


def _state_dict_from_checkpoint(ckpt: Any) -> dict:
    """Extract a state_dict whether the checkpoint is raw weights or a wrapped dict."""
    if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
        return ckpt["model_state_dict"]
    if isinstance(ckpt, dict) and "state_dict" in ckpt:
        return ckpt["state_dict"]
    return ckpt  # assume the checkpoint *is* the state_dict


def get_model() -> Any:
    """Return the loaded eval-mode model, loading on first call."""
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    with _MODEL_LOCK:
        if _MODEL is not None:
            return _MODEL
        path = model_path()
        if not path.is_file():
            raise FileNotFoundError(
                f"Chest X-ray model not found at {path}. "
                "Drop CheXVision-DenseNet_best.pth into backend/models/ "
                "or set CXR_MODEL_PATH."
            )
        _logger.info("Loading chest X-ray model from %s ...", path)
        # Local imports so unrelated routes never pay the torch import cost.
        import torch  # noqa: WPS433

        from app.cxr.model import CheXVisionDenseNet  # noqa: WPS433

        ckpt = torch.load(str(path), map_location="cpu")
        model = CheXVisionDenseNet()
        model.load_state_dict(_state_dict_from_checkpoint(ckpt))
        model.eval()
        _MODEL = model
        _logger.info("Chest X-ray model loaded — DenseNet-121 dual-head")
        return _MODEL


def warmup() -> None:
    """Force-load the model. Safe to call from FastAPI lifespan."""
    try:
        get_model()
    except FileNotFoundError as e:
        # Don't crash the app if the model is missing — the /api/cxr/analyze
        # route returns a clean 503 instead.
        _logger.warning("Chest X-ray warmup skipped: %s", e)
    except Exception:
        _logger.exception("Chest X-ray warmup failed")
