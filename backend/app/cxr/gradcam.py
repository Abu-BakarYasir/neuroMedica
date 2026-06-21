"""Grad-CAM explainability for the chest X-ray model.

Produces a class-activation heatmap that highlights the image regions the
DenseNet-121 backbone weighted most heavily for its top pathology prediction,
composited over the radiograph as a colour overlay.

This is an *additive* explainability layer: it re-decodes the uploaded bytes and
runs an independent forward/backward pass. It never touches the prediction path
in ``predictor.py`` — the existing ``/api/cxr/analyze`` behaviour is unchanged.

Kept dependency-light (numpy + PIL only, no OpenCV/matplotlib): the Jet colormap
and the overlay compositing are implemented directly.
"""

from __future__ import annotations

import base64
import io
import threading
from dataclasses import dataclass

import numpy as np
from PIL import Image

from app.cxr.labels import PATHOLOGIES
from app.cxr.model_loader import get_model
from app.cxr.predictor import _load_image  # reuse the exact decode path
from app.cxr.transforms import IMAGE_SIZE, get_eval_transforms

# Grad-CAM needs a backward pass, which writes .grad onto the shared singleton
# model and registers hooks on a shared module. Serialise to keep concurrent
# requests from cross-contaminating each other's gradients/activations.
_GRADCAM_LOCK = threading.Lock()

_TRANSFORM = get_eval_transforms()

# Blend weight for the heatmap over the grayscale radiograph.
_OVERLAY_ALPHA = 0.45


@dataclass
class GradCamResult:
    overlay_data_url: str  # "data:image/png;base64,..." heatmap overlay
    target_code: str       # pathology the CAM was computed for
    target_name: str
    target_probability: float  # [0, 1]


def _jet_colormap(values: np.ndarray) -> np.ndarray:
    """Map a HxW array in [0, 1] to an HxWx3 uint8 RGB array (Jet colormap)."""
    x = np.clip(values, 0.0, 1.0)
    four = 4.0 * x
    r = np.clip(np.minimum(four - 1.5, -four + 4.5), 0.0, 1.0)
    g = np.clip(np.minimum(four - 0.5, -four + 3.5), 0.0, 1.0)
    b = np.clip(np.minimum(four + 0.5, -four + 2.5), 0.0, 1.0)
    rgb = np.stack([r, g, b], axis=-1)
    return (rgb * 255.0).astype(np.uint8)


def generate(raw: bytes) -> GradCamResult:
    """Decode the image, run Grad-CAM for the top pathology, return an overlay."""
    import torch  # noqa: WPS433 — keep torch off the hot path for unrelated routes
    import torch.nn.functional as F  # noqa: WPS433

    image = _load_image(raw)
    tensor = _TRANSFORM(image).unsqueeze(0)  # (1, 3, 320, 320)

    model = get_model()

    with _GRADCAM_LOCK:
        # The last spatial feature maps of the DenseNet backbone (before global
        # pooling) are the standard Grad-CAM target layer.
        target_layer = model.backbone.features

        activations: dict[str, "torch.Tensor"] = {}
        gradients: dict[str, "torch.Tensor"] = {}

        def _forward_hook(_module, _inp, output):
            activations["value"] = output
            output.register_hook(lambda grad: gradients.__setitem__("value", grad))

        handle = target_layer.register_forward_hook(_forward_hook)
        try:
            model.zero_grad(set_to_none=True)
            out = model(tensor)
            logits = out["multilabel_logits"][0]  # (14,)
            target_idx = int(torch.argmax(logits).item())
            target_prob = float(torch.sigmoid(logits[target_idx]).item())

            score = out["multilabel_logits"][0, target_idx]
            score.backward()

            acts = activations["value"][0]   # (C, h, w)
            grads = gradients["value"][0]    # (C, h, w)
        finally:
            handle.remove()
            model.zero_grad(set_to_none=True)

        # Grad-CAM: channel weights = global-average-pooled gradients.
        weights = grads.mean(dim=(1, 2))                         # (C,)
        cam = torch.relu((weights[:, None, None] * acts).sum(0))  # (h, w)

        cam_up = F.interpolate(
            cam[None, None],
            size=(IMAGE_SIZE, IMAGE_SIZE),
            mode="bilinear",
            align_corners=False,
        )[0, 0]
        cam_np = cam_up.detach().cpu().numpy().astype(np.float32)

    # Normalise to [0, 1] (guard a flat map so it collapses to zero, not NaN).
    cam_min, cam_max = float(cam_np.min()), float(cam_np.max())
    if cam_max > cam_min:
        cam_np = (cam_np - cam_min) / (cam_max - cam_min)
    else:
        cam_np = np.zeros_like(cam_np)

    overlay = _composite(image, cam_np)
    pathology = PATHOLOGIES[target_idx]
    return GradCamResult(
        overlay_data_url=_to_data_url(overlay),
        target_code=pathology.code,
        target_name=pathology.name,
        target_probability=target_prob,
    )


def _composite(image: Image.Image, cam: np.ndarray) -> Image.Image:
    """Blend the Jet heatmap over the grayscale radiograph (model-input size)."""
    base = image.convert("L").resize((IMAGE_SIZE, IMAGE_SIZE), Image.BILINEAR)
    base_rgb = np.asarray(base.convert("RGB")).astype(np.float32)
    heat = _jet_colormap(cam).astype(np.float32)
    blended = (1.0 - _OVERLAY_ALPHA) * base_rgb + _OVERLAY_ALPHA * heat
    return Image.fromarray(np.clip(blended, 0, 255).astype(np.uint8), mode="RGB")


def _to_data_url(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"
