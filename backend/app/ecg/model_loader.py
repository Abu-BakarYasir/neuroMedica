"""Lazy, thread-safe loader for the heartbeat CNN.

The model is small (~4.5 MB) but TensorFlow's import is expensive (~3-5s),
so we hide it behind a lock and only import inside the loader.
"""

from __future__ import annotations

import logging
import os
import threading
import zipfile
from pathlib import Path
from typing import Any

_logger = logging.getLogger(__name__)

# Resolve once. Path is anchored at the backend/ directory so it works
# both in dev (uvicorn from backend/) and in the Railway container.
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_MODEL_PATH = _BACKEND_ROOT / "models" / "neuroMedica_ecg_model.keras"

_MODEL_LOCK = threading.Lock()
_MODEL: Any | None = None


def model_path() -> Path:
    """Allow override via ECG_MODEL_PATH for tests or alternative deployments."""
    override = os.environ.get("ECG_MODEL_PATH")
    return Path(override) if override else _DEFAULT_MODEL_PATH


# Files that distinguish a Keras 3 unpacked-archive directory from any
# random folder a user might point us at.
_UNPACKED_KERAS_MARKERS = ("config.json", "model.weights.h5")


def _resolve_loadable_path(path: Path) -> Path:
    """Return a path Keras can actually load.

    Keras 3's ``load_model()`` opens the ``.keras`` file directly with
    ``open()``, which fails when the path is an unpacked directory
    (PermissionError on Windows, IsADirectoryError elsewhere). Some
    sources — including the Colab artifact this model ships from — emit
    that unpacked layout. We auto-zip such directories into a sibling
    cache file the first time we see them so the loader Just Works.
    """
    if path.is_file():
        return path
    if not path.is_dir():
        raise FileNotFoundError(
            f"ECG model not found at {path}. "
            "Drop neuroMedica_ecg_model.keras into backend/models/ "
            "or set ECG_MODEL_PATH."
        )
    present = {p.name for p in path.iterdir()}
    if not all(m in present for m in _UNPACKED_KERAS_MARKERS):
        raise FileNotFoundError(
            f"{path} is a directory but doesn't look like an unpacked "
            f"Keras 3 model (expected {list(_UNPACKED_KERAS_MARKERS)})."
        )
    cache = path.with_name(f"{path.stem}.packed.keras")
    members = [p for p in path.iterdir() if p.is_file()]
    needs_repack = (
        not cache.exists()
        or cache.stat().st_mtime < max(p.stat().st_mtime for p in members)
    )
    if needs_repack:
        _logger.info("Auto-zipping unpacked Keras model %s -> %s", path, cache)
        with zipfile.ZipFile(cache, "w", zipfile.ZIP_STORED) as z:
            for p in members:
                z.write(p, arcname=p.name)
    return cache


def get_model() -> Any:
    """Return the loaded Keras model, loading on first call."""
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    with _MODEL_LOCK:
        if _MODEL is not None:
            return _MODEL
        loadable = _resolve_loadable_path(model_path())
        _logger.info("Loading ECG model from %s ...", loadable)
        # Local import so unrelated routes never pay the TF import cost.
        import keras  # noqa: WPS433

        _MODEL = keras.models.load_model(str(loadable), compile=False)
        _logger.info(
            "ECG model loaded — input %s, output %s",
            _MODEL.input_shape,
            _MODEL.output_shape,
        )
        return _MODEL


def warmup() -> None:
    """Force-load the model. Safe to call from FastAPI lifespan."""
    try:
        get_model()
    except FileNotFoundError as e:
        # Don't crash the whole app if the model is missing — the
        # /api/ecg/analyze route will return a clean 503 instead.
        _logger.warning("ECG warmup skipped: %s", e)
    except Exception:
        _logger.exception("ECG warmup failed")
