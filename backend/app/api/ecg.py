"""ECG analysis routes.

POST /api/ecg/analyze        Upload a CSV (wide: one beat per row, or long: raw signal)
POST /api/ecg/analyze-sample Classify a built-in synthetic beat — useful for demos / smoke tests
"""

from __future__ import annotations

import logging
from typing import Dict

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.security import get_current_user
from app.ecg import parser as ecg_parser
from app.ecg import predictor as ecg_predictor
from app.ecg import samples as ecg_samples
from app.ecg.labels import CLASSES
from app.models.ecg import (
    AnalysisSummaryOut,
    BeatPredictionOut,
    ClassInfoOut,
    EcgAnalysisResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ecg", tags=["ecg"])

# Reject files larger than 5 MB — anything bigger is almost certainly not
# a single-lead segment we want to handle.
_MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def _classes_payload() -> list[ClassInfoOut]:
    return [
        ClassInfoOut(
            code=c.code,
            name=c.name,
            description=c.description,
            clinical_significance=c.clinical_significance,
        )
        for c in CLASSES
    ]


def _build_response(
    predictions, summary, source_format: str, notes: dict
) -> EcgAnalysisResponse:
    return EcgAnalysisResponse(
        summary=AnalysisSummaryOut(
            total_beats=summary.total_beats,
            dominant_class=summary.dominant_class,
            dominant_label=summary.dominant_label,
            class_counts=summary.class_counts,
            class_percentages=summary.class_percentages,
            abnormal_beats=summary.abnormal_beats,
            abnormal_percentage=summary.abnormal_percentage,
            mean_confidence=summary.mean_confidence,
        ),
        beats=[
            BeatPredictionOut(
                index=p.index,
                predicted_class=p.predicted_class,
                predicted_label=p.predicted_label,
                confidence=p.confidence,
                probabilities=p.probabilities,
                waveform=p.waveform,
            )
            for p in predictions
        ],
        classes=_classes_payload(),
        source_format=source_format,
        notes=notes,
    )


@router.post("/analyze", response_model=EcgAnalysisResponse)
async def analyze(
    file: UploadFile = File(..., description="CSV of ECG samples"),
    sampling_rate_hz: int = Form(
        default=ecg_parser.DEFAULT_SAMPLING_RATE_HZ,
        ge=50,
        le=2000,
        description="Sampling rate for long-format uploads (ignored for wide-format)",
    ),
    user: Dict = Depends(get_current_user),
) -> EcgAnalysisResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided.",
        )
    raw = await file.read()
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file was empty.",
        )
    if len(raw) > _MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large (max {_MAX_UPLOAD_BYTES // (1024 * 1024)} MB).",
        )

    try:
        parsed = ecg_parser.parse_csv_upload(
            raw=raw, sampling_rate_hz=sampling_rate_hz
        )
    except ecg_parser.EcgParseError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )

    try:
        predictions, summary = ecg_predictor.predict(parsed.beats)
    except FileNotFoundError as e:
        # Model file missing on disk — surface a clean 503.
        logger.error("ECG model missing: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ECG model is not available on this server.",
        )
    except Exception:
        logger.exception("ECG inference failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ECG inference failed. Please try again.",
        )

    notes: dict = {"filename": file.filename, **parsed.extra}
    return _build_response(
        predictions=predictions,
        summary=summary,
        source_format=parsed.source_format,
        notes=notes,
    )


@router.post("/analyze-sample", response_model=EcgAnalysisResponse)
async def analyze_sample(
    user: Dict = Depends(get_current_user),
) -> EcgAnalysisResponse:
    """Classify a built-in synthetic sinus beat. Useful for the 'Try sample'
    button and as a smoke test that the model + pipeline are wired up."""
    beats = ecg_samples.sample_batch()
    try:
        predictions, summary = ecg_predictor.predict(beats)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ECG model is not available on this server.",
        )
    return _build_response(
        predictions=predictions,
        summary=summary,
        source_format="sample",
        notes={"source": "synthetic_sinus_beat"},
    )
