"""Chest X-ray analysis routes.

POST /api/cxr/analyze   Upload a chest radiograph (PNG/JPEG) for multi-label
                        pathology classification + Normal/Abnormal screening.
"""

from __future__ import annotations

import logging
from typing import Dict

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.security import get_current_user
from app.cxr import predictor as cxr_predictor
from app.models.cxr import CxrAnalysisResponse, PathologyPredictionOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cxr", tags=["cxr"])

# Reject files larger than 20 MB — a chest radiograph PNG/JPEG is well under this.
_MAX_UPLOAD_BYTES = 20 * 1024 * 1024

# Content types we reject up front with a friendly message. Anything else
# (including image/* and the generic application/octet-stream that browsers
# emit when they can't infer a type) falls through to PIL, which is the
# authoritative validator and returns a clean 400 on undecodable bytes.
_REJECTED_CONTENT_PREFIXES = ("text/", "application/json", "application/pdf")


def _build_response(pred: cxr_predictor.CxrPrediction, notes: dict) -> CxrAnalysisResponse:
    return CxrAnalysisResponse(
        abnormal_probability=pred.abnormal_probability,
        predicted_abnormal=pred.predicted_abnormal,
        detected_count=pred.detected_count,
        top_finding=pred.top_finding,
        findings=[
            PathologyPredictionOut(
                code=f.code,
                name=f.name,
                probability=f.probability,
                detected=f.detected,
                description=f.description,
                clinical_significance=f.clinical_significance,
            )
            for f in pred.findings
        ],
        notes=notes,
    )


@router.post("/analyze", response_model=CxrAnalysisResponse)
async def analyze(
    file: UploadFile = File(..., description="Chest X-ray image (PNG/JPEG)"),
    user: Dict = Depends(get_current_user),
) -> CxrAnalysisResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided.",
        )
    if file.content_type and file.content_type.startswith(_REJECTED_CONTENT_PREFIXES):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not an image. Upload a PNG or JPEG radiograph.",
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
        prediction = cxr_predictor.predict(raw)
    except cxr_predictor.CxrImageError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except FileNotFoundError as e:
        logger.error("Chest X-ray model missing: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chest X-ray model is not available on this server.",
        )
    except Exception:
        logger.exception("Chest X-ray inference failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chest X-ray inference failed. Please try again.",
        )

    return _build_response(prediction, notes={"filename": file.filename})
