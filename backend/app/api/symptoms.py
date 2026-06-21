"""Symptom Explorer route.

POST /api/symptoms/explore  Take presenting symptoms, return a RAG-grounded
                            differential diagnosis with citations.
"""

from __future__ import annotations

import json
import logging
from typing import AsyncIterator, Dict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from app.core.security import get_current_user
from app.models.symptoms import SymptomExploreRequest, SymptomExploreResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/symptoms", tags=["symptoms"])


def _sse(event: dict) -> bytes:
    """Format a single SSE message: `data: {json}\\n\\n`."""
    return f"data: {json.dumps(event)}\n\n".encode("utf-8")


def _get_rag(http_request: Request):
    """Reuse the preloaded RAGService singleton; lazily build one if missing
    (mirrors the chat route)."""
    rag = getattr(http_request.app.state, "rag_service", None)
    if rag is None:
        from app.services.rag_service import RAGService

        rag = RAGService()
    return rag


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

    rag = _get_rag(http_request)

    try:
        result = await rag.explore_symptoms(symptoms)
    except Exception:
        logger.exception("Symptom exploration failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not analyze these symptoms. Please try again.",
        )

    return SymptomExploreResponse(**result)


@router.post("/explore/stream")
async def explore_stream(
    request: SymptomExploreRequest,
    http_request: Request,
    user: Dict = Depends(get_current_user),
):
    """Streaming variant of /explore. Returns Server-Sent Events so the UI can
    render citations + confidence the moment retrieval completes, then fill in
    the structured differential once generation finishes.

    Event envelope (JSON in each `data:` line):
        {"type": "meta", "citations": [...], "confidence": ..., "disclaimer": ...}
        {"type": "result", "differentials": [...], "summary": ..., ...}
        {"type": "done"}
        {"type": "error", "message": "..."}     on failure
    """
    symptoms = request.symptoms.strip()
    if not symptoms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide at least one symptom.",
        )

    rag = _get_rag(http_request)

    async def event_source() -> AsyncIterator[bytes]:
        try:
            async for event in rag.explore_symptoms_stream(symptoms):
                yield _sse(event)
        except Exception:
            logger.exception("Symptom exploration (stream) failed")
            yield _sse(
                {
                    "type": "error",
                    "message": "Could not analyze these symptoms. Please try again.",
                }
            )

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
