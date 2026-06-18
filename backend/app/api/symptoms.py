"""Symptom Explorer route.

POST /api/symptoms/explore  Take presenting symptoms, return a RAG-grounded
                            differential diagnosis with citations.
"""

from __future__ import annotations

import logging
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import get_current_user
from app.models.symptoms import SymptomExploreRequest, SymptomExploreResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/symptoms", tags=["symptoms"])


@router.post("/explore", response_model=SymptomExploreResponse)
async def explore(
    request: SymptomExploreRequest,
    http_request: Request,
    user: Dict = Depends(get_current_user),
) -> SymptomExploreResponse:
    symptoms = request.symptoms.strip()
    if not symptoms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide at least one symptom.",
        )

    # Reuse the preloaded RAGService singleton; lazily build one if missing
    # (mirrors the chat route).
    rag = getattr(http_request.app.state, "rag_service", None)
    if rag is None:
        from app.services.rag_service import RAGService

        rag = RAGService()

    try:
        result = await rag.explore_symptoms(symptoms)
    except Exception:
        logger.exception("Symptom exploration failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not analyze these symptoms. Please try again.",
        )

    return SymptomExploreResponse(**result)
