"""Tests for the chest X-ray (CheXVision) analysis module.

Covers labels, image preprocessing edge cases (grayscale, RGBA, palette,
16-bit DICOM-style radiographs, corrupt/empty uploads), the predictor contract,
the lazy model loader, the API route error mapping, and the Pydantic schemas.

Real-inference tests load the ~90 MB DenseNet checkpoint and are skipped
automatically when it isn't present on disk.
"""

from __future__ import annotations

import io

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.cxr.model_loader import model_path

MODEL_AVAILABLE = model_path().is_file()
requires_model = pytest.mark.skipif(
    not MODEL_AVAILABLE,
    reason="CheXVision checkpoint not present (backend/models/CheXVision-DenseNet_best.pth)",
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _encode(image: Image.Image, fmt: str = "PNG") -> bytes:
    buf = io.BytesIO()
    image.save(buf, format=fmt)
    return buf.getvalue()


def _rgb_png(size: int = 256) -> bytes:
    arr = (np.random.rand(size, size, 3) * 255).astype("uint8")
    return _encode(Image.fromarray(arr, mode="RGB"))


def _get_client() -> TestClient:
    from app.core.security import get_current_user
    from app.main import app

    app.dependency_overrides[get_current_user] = lambda: {"sub": "test-user-id"}
    return TestClient(app)


# ---------------------------------------------------------------------------
# Labels
# ---------------------------------------------------------------------------

class TestLabels:
    def test_fourteen_pathologies(self):
        from app.cxr.labels import NUM_CLASSES, PATHOLOGIES

        assert len(PATHOLOGIES) == 14
        assert NUM_CLASSES == 14

    def test_codes_are_unique(self):
        from app.cxr.labels import PATHOLOGIES

        codes = [p.code for p in PATHOLOGIES]
        assert len(set(codes)) == len(codes)

    def test_training_label_order_preserved(self):
        """Order MUST match the model's multi-label head (NIH ChestX-ray14)."""
        from app.cxr.labels import PATHOLOGIES

        codes = [p.code for p in PATHOLOGIES]
        assert codes == [
            "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", "Mass",
            "Nodule", "Pneumonia", "Pneumothorax", "Consolidation", "Edema",
            "Emphysema", "Fibrosis", "Pleural_Thickening", "Hernia",
        ]

    def test_pleural_thickening_machine_code_keeps_underscore(self):
        from app.cxr.labels import PATHOLOGIES

        pleural = next(p for p in PATHOLOGIES if p.code == "Pleural_Thickening")
        assert pleural.name == "Pleural Thickening"  # display name is humanized

    def test_every_pathology_has_clinical_text(self):
        from app.cxr.labels import PATHOLOGIES

        for p in PATHOLOGIES:
            assert p.description.strip()
            assert p.clinical_significance.strip()

    def test_pathology_at(self):
        from app.cxr.labels import PATHOLOGIES, pathology_at

        assert pathology_at(0) is PATHOLOGIES[0]
        assert pathology_at(13).code == "Hernia"


# ---------------------------------------------------------------------------
# Image preprocessing (no model needed)
# ---------------------------------------------------------------------------

class TestImageLoading:
    def test_grayscale_promoted_to_rgb(self):
        from app.cxr.predictor import _load_image

        g = Image.fromarray((np.random.rand(64, 64) * 255).astype("uint8"), mode="L")
        out = _load_image(_encode(g))
        assert out.mode == "RGB"

    def test_rgba_flattened_to_rgb(self):
        from app.cxr.predictor import _load_image

        rgba = Image.fromarray((np.random.rand(64, 64, 4) * 255).astype("uint8"), mode="RGBA")
        assert _load_image(_encode(rgba)).mode == "RGB"

    def test_palette_image(self):
        from app.cxr.predictor import _load_image

        p = Image.fromarray((np.random.rand(64, 64, 3) * 255).astype("uint8")).convert("P")
        assert _load_image(_encode(p)).mode == "RGB"

    def test_16bit_radiograph_is_rescaled_not_saturated(self):
        """Real DICOM-derived X-rays are 16-bit. A naive .convert('RGB')
        saturates everything > 255 to white; we must min-max rescale first."""
        from app.cxr.predictor import _load_image

        gradient = np.tile(np.linspace(0, 65535, 256).astype("uint16"), (256, 1))
        i16 = Image.fromarray(gradient)  # uint16 array -> 16-bit "I;16" image
        arr = np.asarray(_load_image(_encode(i16)))
        # A full-range gradient should map to the full 8-bit range with a
        # mid-gray mean — NOT collapse to ~255 (white).
        assert arr.min() == 0
        assert arr.max() == 255
        assert 100 < arr.mean() < 155

    def test_flat_16bit_does_not_crash(self):
        from app.cxr.predictor import _load_image

        flat = Image.fromarray(np.full((32, 32), 5000, dtype="uint16"))
        arr = np.asarray(_load_image(_encode(flat)))
        assert arr.max() == 0  # constant image collapses to black, no NaNs

    def test_corrupt_bytes_raise_image_error(self):
        from app.cxr.predictor import CxrImageError, _load_image

        with pytest.raises(CxrImageError):
            _load_image(b"\x89PNG\r\n\x1a\n total garbage not an image")

    def test_empty_bytes_raise_image_error(self):
        from app.cxr.predictor import CxrImageError, _load_image

        with pytest.raises(CxrImageError):
            _load_image(b"")

    def test_plain_text_raises_image_error(self):
        from app.cxr.predictor import CxrImageError, _load_image

        with pytest.raises(CxrImageError):
            _load_image(b"this is clearly not an image file")


# ---------------------------------------------------------------------------
# Transforms
# ---------------------------------------------------------------------------

class TestTransforms:
    def test_eval_transform_output_shape(self):
        from app.cxr.transforms import IMAGE_SIZE, get_eval_transforms

        out = get_eval_transforms()(Image.new("RGB", (50, 80)))
        assert tuple(out.shape) == (3, IMAGE_SIZE, IMAGE_SIZE)


# ---------------------------------------------------------------------------
# Predictor contract (real model)
# ---------------------------------------------------------------------------

@requires_model
class TestPredictContract:
    def test_returns_all_fourteen_findings(self):
        from app.cxr import predictor

        pred = predictor.predict(_rgb_png())
        assert len(pred.findings) == 14

    def test_findings_sorted_descending(self):
        from app.cxr import predictor

        probs = [f.probability for f in predictor.predict(_rgb_png()).findings]
        assert probs == sorted(probs, reverse=True)

    def test_probabilities_within_unit_interval(self):
        from app.cxr import predictor

        pred = predictor.predict(_rgb_png())
        assert 0.0 <= pred.abnormal_probability <= 1.0
        for f in pred.findings:
            assert 0.0 <= f.probability <= 1.0

    def test_detected_flag_matches_threshold(self):
        from app.cxr import predictor
        from app.cxr.predictor import POSITIVE_THRESHOLD

        for f in predictor.predict(_rgb_png()).findings:
            assert f.detected == (f.probability >= POSITIVE_THRESHOLD)

    def test_detected_count_and_top_finding_consistent(self):
        from app.cxr import predictor

        pred = predictor.predict(_rgb_png())
        assert pred.detected_count == sum(1 for f in pred.findings if f.detected)
        assert pred.top_finding == pred.findings[0].name

    def test_deterministic_in_eval_mode(self):
        """Dropout must be disabled — identical inputs give identical outputs."""
        from app.cxr import predictor

        raw = _rgb_png()
        a = predictor.predict(raw)
        b = predictor.predict(raw)
        assert a.abnormal_probability == b.abnormal_probability
        assert [f.probability for f in a.findings] == [f.probability for f in b.findings]

    def test_grayscale_input_produces_valid_prediction(self):
        from app.cxr import predictor

        g = Image.fromarray((np.random.rand(128, 128) * 255).astype("uint8"), mode="L")
        pred = predictor.predict(_encode(g))
        assert len(pred.findings) == 14


# ---------------------------------------------------------------------------
# Model loader
# ---------------------------------------------------------------------------

class TestModelLoader:
    def test_state_dict_from_wrapped_checkpoint(self):
        from app.cxr.model_loader import _state_dict_from_checkpoint

        sd = {"layer.weight": 1}
        assert _state_dict_from_checkpoint({"model_state_dict": sd}) is sd

    def test_state_dict_from_state_dict_key(self):
        from app.cxr.model_loader import _state_dict_from_checkpoint

        sd = {"layer.weight": 1}
        assert _state_dict_from_checkpoint({"state_dict": sd}) is sd

    def test_state_dict_from_raw_checkpoint(self):
        from app.cxr.model_loader import _state_dict_from_checkpoint

        raw = {"backbone.features.weight": 1}
        assert _state_dict_from_checkpoint(raw) is raw

    def test_model_path_env_override(self, monkeypatch, tmp_path):
        from app.cxr import model_loader

        custom = tmp_path / "custom.pth"
        monkeypatch.setenv("CXR_MODEL_PATH", str(custom))
        assert model_loader.model_path() == custom

    def test_get_model_missing_file_raises(self, monkeypatch, tmp_path):
        from app.cxr import model_loader

        saved = model_loader._MODEL
        model_loader._MODEL = None
        monkeypatch.setenv("CXR_MODEL_PATH", str(tmp_path / "does_not_exist.pth"))
        try:
            with pytest.raises(FileNotFoundError):
                model_loader.get_model()
        finally:
            model_loader._MODEL = saved

    def test_warmup_swallows_missing_file(self, monkeypatch, tmp_path):
        from app.cxr import model_loader

        saved = model_loader._MODEL
        model_loader._MODEL = None
        monkeypatch.setenv("CXR_MODEL_PATH", str(tmp_path / "nope.pth"))
        try:
            model_loader.warmup()  # must NOT raise
        finally:
            model_loader._MODEL = saved

    @requires_model
    def test_get_model_caches_singleton(self):
        from app.cxr import model_loader

        assert model_loader.get_model() is model_loader.get_model()


# ---------------------------------------------------------------------------
# API route
# ---------------------------------------------------------------------------

@requires_model
class TestRouteSuccess:
    def test_valid_png_returns_full_payload(self):
        client = _get_client()
        resp = client.post(
            "/api/cxr/analyze",
            files={"file": ("xray.png", _rgb_png(), "image/png")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert set(data) >= {
            "abnormal_probability", "predicted_abnormal", "detected_count",
            "top_finding", "findings", "disclaimer", "notes",
        }
        assert len(data["findings"]) == 14
        assert data["disclaimer"]
        assert data["notes"]["filename"] == "xray.png"

    def test_valid_jpeg_returns_200(self):
        client = _get_client()
        jpeg = _encode(Image.fromarray((np.random.rand(200, 200, 3) * 255).astype("uint8")), "JPEG")
        resp = client.post("/api/cxr/analyze", files={"file": ("x.jpg", jpeg, "image/jpeg")})
        assert resp.status_code == 200

    def test_octet_stream_image_is_accepted(self):
        """A valid image sent as application/octet-stream (browser couldn't
        infer the type) must NOT be falsely rejected — decode is the validator."""
        client = _get_client()
        resp = client.post(
            "/api/cxr/analyze",
            files={"file": ("scan", _rgb_png(), "application/octet-stream")},
        )
        assert resp.status_code == 200


class TestRouteValidation:
    def test_empty_file_rejected(self):
        client = _get_client()
        resp = client.post("/api/cxr/analyze", files={"file": ("x.png", b"", "image/png")})
        assert resp.status_code == 400
        assert "empty" in resp.json()["detail"].lower()

    def test_text_content_type_rejected(self):
        client = _get_client()
        resp = client.post(
            "/api/cxr/analyze",
            files={"file": ("notes.txt", b"hello", "text/plain")},
        )
        assert resp.status_code == 400

    def test_missing_file_part_returns_422(self):
        client = _get_client()
        resp = client.post("/api/cxr/analyze", data={"foo": "bar"})
        assert resp.status_code == 422

    def test_oversized_file_returns_413(self, monkeypatch):
        import app.api.cxr as cxr_api

        monkeypatch.setattr(cxr_api, "_MAX_UPLOAD_BYTES", 10)
        client = _get_client()
        resp = client.post(
            "/api/cxr/analyze",
            files={"file": ("big.png", _rgb_png(), "image/png")},
        )
        assert resp.status_code == 413

    def test_garbage_bytes_with_image_type_returns_400(self):
        client = _get_client()
        resp = client.post(
            "/api/cxr/analyze",
            files={"file": ("fake.png", b"not really a png", "image/png")},
        )
        assert resp.status_code == 400


class TestRouteErrorMapping:
    """Patch the predictor so we exercise the route's exception → status mapping
    without depending on the model being present."""

    def test_missing_model_returns_503(self):
        from unittest.mock import patch

        client = _get_client()
        with patch("app.api.cxr.cxr_predictor.predict", side_effect=FileNotFoundError("no model")):
            resp = client.post(
                "/api/cxr/analyze",
                files={"file": ("x.png", _rgb_png(), "image/png")},
            )
        assert resp.status_code == 503

    def test_undecodable_image_returns_400(self):
        from unittest.mock import patch

        from app.cxr.predictor import CxrImageError

        client = _get_client()
        with patch("app.api.cxr.cxr_predictor.predict", side_effect=CxrImageError("bad image")):
            resp = client.post(
                "/api/cxr/analyze",
                files={"file": ("x.png", _rgb_png(), "image/png")},
            )
        assert resp.status_code == 400
        assert "bad image" in resp.json()["detail"]

    def test_unexpected_error_returns_500(self):
        from unittest.mock import patch

        client = _get_client()
        with patch("app.api.cxr.cxr_predictor.predict", side_effect=RuntimeError("boom")):
            resp = client.post(
                "/api/cxr/analyze",
                files={"file": ("x.png", _rgb_png(), "image/png")},
            )
        assert resp.status_code == 500


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class TestSchemas:
    def test_pathology_prediction_serialization(self):
        from app.models.cxr import PathologyPredictionOut

        p = PathologyPredictionOut(
            code="Mass", name="Mass", probability=0.8, detected=True,
            description="d", clinical_significance="c",
        )
        assert p.model_dump()["probability"] == 0.8

    def test_probability_bounds_enforced(self):
        from pydantic import ValidationError

        from app.models.cxr import PathologyPredictionOut

        with pytest.raises(ValidationError):
            PathologyPredictionOut(
                code="Mass", name="Mass", probability=1.5, detected=True,
                description="d", clinical_significance="c",
            )

    def test_response_has_default_disclaimer(self):
        from app.models.cxr import CxrAnalysisResponse

        resp = CxrAnalysisResponse(
            abnormal_probability=0.5, predicted_abnormal=True,
            detected_count=0, top_finding="Nodule", findings=[],
        )
        assert "decision support" in resp.disclaimer
