"""ECG analysis routes — PTB-XL 12-lead diagnostic model.

POST /api/ecg/analyze         Upload a 12-lead recording and get diagnostic
                              superclass probabilities (NORM/MI/STTC/CD/HYP).
                              Accepts:
                                * WFDB: a .hea header + its .dat (send both files)
                                * CSV : 12 columns (one per lead)
                                * Image: a 12-lead chart photo/scan (best-effort)
POST /api/ecg/analyze-sample  Classify a built-in synthetic 12-lead record.
"""

from __future__ import annotations

import logging
from typing import Dict, List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.security import get_current_user
from app.ecg.ptbxl import interpretation as ptbxl_interp
from app.ecg.ptbxl import parser as ptbxl_parser
from app.ecg.ptbxl import predictor as ptbxl_predictor
from app.ecg.ptbxl import samples as ptbxl_samples
from app.ecg.ptbxl.labels import SUPERCLASSES
from app.models.ecg import (
    DiagnosisOut,
    EcgDiagnosisResponse,
    EcgDiagnosticInterpretationOut,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ecg", tags=["ecg"])

_MAX_TOTAL_BYTES = 25 * 1024 * 1024  # WFDB .dat or a phone photo can be a few MB

_IMAGE_MAGIC: tuple[bytes, ...] = (
    b"\x89PNG\r\n\x1a\n", b"\xff\xd8\xff", b"GIF87a", b"GIF89a", b"BM",
    b"II*\x00", b"MM\x00*",
)
_SUPER = {c.code: c for c in SUPERCLASSES}
_SEVERITY = {"MI": 0, "CD": 1, "STTC": 2, "HYP": 3, "NORM": 4}


def _looks_like_image(filename: str, content_type: str | None, raw: bytes) -> bool:
    if content_type and content_type.startswith("image/"):
        return True
    if (filename or "").lower().endswith(
        (".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tif", ".tiff", ".webp")
    ):
        return True
    if raw[:8].startswith(_IMAGE_MAGIC):
        return True
    return raw[:4] == b"RIFF" and raw[8:12] == b"WEBP"


def _is_pdf(filename: str, content_type: str | None, raw: bytes) -> bool:
    return (
        raw[:5] == b"%PDF-"
        or content_type == "application/pdf"
        or (filename or "").lower().endswith(".pdf")
    )


def _build_response(result, source_format: str) -> EcgDiagnosisResponse:
    interp = ptbxl_interp.build_interpretation(result)

    ordered_codes = sorted(
        result.probabilities, key=lambda c: _SEVERITY.get(c, 99)
    )
    diagnoses = [
        DiagnosisOut(
            code=c,
            name=_SUPER[c].name,
            description=_SUPER[c].description,
            clinical_significance=_SUPER[c].clinical_significance,
            probability=round(result.probabilities[c], 4),
            positive=c in result.positive,
        )
        for c in ordered_codes
    ]

    notes = {k: v for k, v in result.meta.items() if k != "source_format"}
    return EcgDiagnosisResponse(
        diagnoses=diagnoses,
        top_code=result.top_code,
        top_label=result.top_label,
        positive_codes=list(result.positive),
        threshold=result.threshold,
        interpretation=EcgDiagnosticInterpretationOut(
            reliable=interp.reliable,
            reliability=interp.reliability,
            urgent=interp.urgent,
            headline=interp.headline,
            findings=interp.findings,
            recommendation=interp.recommendation,
            caveats=interp.caveats,
            heart_rate_bpm=interp.heart_rate_bpm,
            heart_rate_label=interp.heart_rate_label,
            rhythm_regularity=interp.rhythm_regularity,
        ),
        source_format=source_format,
        notes=notes,
    )


def _predict_or_503(record):
    try:
        return ptbxl_predictor.predict(record)
    except FileNotFoundError as e:
        logger.error("PTB-XL model/norm missing: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The 12-lead diagnostic model is not available on this server.",
        )
    except Exception:
        logger.exception("PTB-XL inference failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ECG inference failed. Please try again.",
        )


@router.post("/analyze", response_model=EcgDiagnosisResponse)
async def analyze(
    files: List[UploadFile] = File(..., description="WFDB .hea+.dat, a 12-col CSV, or a 12-lead image"),
    sampling_rate_hz: float = Form(
        default=100.0, ge=10, le=2000,
        description="Sampling rate for CSV uploads (ignored for WFDB/image)",
    ),
    user: Dict = Depends(get_current_user),
) -> EcgDiagnosisResponse:
    if not files:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No file provided.")

    loaded: list[tuple[str, bytes, str | None]] = []
    total = 0
    for f in files:
        raw = await f.read()
        total += len(raw)
        if total > _MAX_TOTAL_BYTES:
            raise HTTPException(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                f"Upload too large (max {_MAX_TOTAL_BYTES // (1024 * 1024)} MB).",
            )
        if not raw:
            continue
        loaded.append((f.filename or "", raw, f.content_type))

    if not loaded:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded file was empty.")

    for name, raw, ctype in loaded:
        if _is_pdf(name, ctype, raw):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "PDF uploads aren't supported. Upload WFDB (.hea/.dat), a 12-column "
                "CSV, or a PNG/JPG image of the 12-lead chart.",
            )

    names_lower = [n.lower() for n, _, _ in loaded]
    is_wfdb = any(n.endswith((".hea", ".dat")) for n in names_lower)

    try:
        if is_wfdb:
            record = ptbxl_parser.parse_wfdb([(n, r) for n, r, _ in loaded])
        elif len(loaded) == 1 and _looks_like_image(*_first(loaded)):
            record = ptbxl_parser.parse_image_12lead(loaded[0][1])
        elif len(loaded) == 1:
            record = ptbxl_parser.parse_csv_12lead(loaded[0][1], sampling_rate_hz)
        else:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Unrecognized upload. Send a WFDB .hea+.dat pair, a single 12-column "
                "CSV, or a single 12-lead image.",
            )
    except ptbxl_parser.PtbxlParseError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

    result = _predict_or_503(record)
    return _build_response(result, record.source_format)


@router.post("/analyze-sample", response_model=EcgDiagnosisResponse)
async def analyze_sample(
    user: Dict = Depends(get_current_user),
) -> EcgDiagnosisResponse:
    record = ptbxl_samples.sample_record()
    result = _predict_or_503(record)
    return _build_response(result, record.source_format)


def _first(loaded: list[tuple[str, bytes, str | None]]):
    """(filename, content_type, raw) for the single-file image check."""
    name, raw, ctype = loaded[0]
    return name, ctype, raw
