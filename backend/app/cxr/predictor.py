"""Inference layer — turns an uploaded radiograph into per-pathology
probabilities, an overall Normal/Abnormal screen, and a ranked findings list."""

from __future__ import annotations

import io
from dataclasses import dataclass

import numpy as np
from PIL import Image

from app.cxr.labels import PATHOLOGIES
from app.cxr.model_loader import get_model
from app.cxr.transforms import get_eval_transforms

# A finding is surfaced as "detected" once its sigmoid probability clears this
# threshold. 0.5 is the natural multi-label cut; the UI still shows the full
# ranked list so borderline findings aren't hidden.
POSITIVE_THRESHOLD = 0.5

# 16-/32-bit PIL modes. Real chest radiographs exported from DICOM are usually
# 16-bit PNGs; PIL's direct ``.convert("RGB")`` saturates every value > 255 to
# white, destroying contrast — so we min-max rescale these to 8-bit first.
_HIGH_BIT_MODES = frozenset({"I", "I;16", "I;16B", "I;16L", "I;16N", "F"})

_TRANSFORM = get_eval_transforms()


class CxrImageError(ValueError):
    """Raised when the uploaded bytes can't be decoded as an image."""


@dataclass
class PathologyPrediction:
    code: str
    name: str
    probability: float  # [0, 1]
    detected: bool
    description: str
    clinical_significance: str


@dataclass
class CxrPrediction:
    abnormal_probability: float  # binary head, [0, 1]
    predicted_abnormal: bool
    findings: list[PathologyPrediction]  # all 14, ranked high→low probability
    detected_count: int
    top_finding: str  # name of the highest-probability pathology


def _rescale_high_bit(image: Image.Image) -> Image.Image:
    """Min-max rescale a 16-/32-bit image to an 8-bit grayscale image.

    A flat image (all-same value) collapses to black rather than producing NaNs.
    """
    arr = np.asarray(image).astype(np.float32)
    lo, hi = float(arr.min()), float(arr.max())
    if hi > lo:
        arr = (arr - lo) / (hi - lo) * 255.0
    else:
        arr = np.zeros_like(arr)
    return Image.fromarray(arr.astype(np.uint8), mode="L")


def _load_image(raw: bytes) -> Image.Image:
    try:
        image = Image.open(io.BytesIO(raw))
        image.load()
    except Exception as e:  # noqa: BLE001 — any decode failure is a bad upload
        raise CxrImageError(
            "Could not read the uploaded file as an image. "
            "Upload a PNG or JPEG chest radiograph."
        ) from e
    if image.mode in _HIGH_BIT_MODES:
        image = _rescale_high_bit(image)
    return image.convert("RGB")


def predict(raw: bytes) -> CxrPrediction:
    """Decode image bytes, run the model, and build the API payload shape."""
    import torch  # noqa: WPS433 — local import keeps torch off the hot path

    image = _load_image(raw)
    tensor = _TRANSFORM(image).unsqueeze(0)  # (1, 3, 320, 320)

    model = get_model()
    with torch.no_grad():
        out = model(tensor)
        probs = torch.sigmoid(out["multilabel_logits"])[0].tolist()
        abnormal = float(torch.sigmoid(out["binary_logits"]).item())

    findings = [
        PathologyPrediction(
            code=p.code,
            name=p.name,
            probability=float(probs[i]),
            detected=float(probs[i]) >= POSITIVE_THRESHOLD,
            description=p.description,
            clinical_significance=p.clinical_significance,
        )
        for i, p in enumerate(PATHOLOGIES)
    ]
    findings.sort(key=lambda f: f.probability, reverse=True)

    detected_count = sum(1 for f in findings if f.detected)
    return CxrPrediction(
        abnormal_probability=abnormal,
        predicted_abnormal=abnormal >= POSITIVE_THRESHOLD,
        findings=findings,
        detected_count=detected_count,
        top_finding=findings[0].name if findings else "",
    )
