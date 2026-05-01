from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
import json
from app.models.chat import ChatRequest, ChatResponse, CitationItem, ErrorResponse, Message
from app.services.chat_service import chat_service
from app.core.security import get_current_user
from app.core.config import settings
from typing import AsyncIterator, Dict, List
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


async def _load_db_history(
    conversation_id: str, user_id: str, limit: int = 20
) -> List[Message]:
    """Load recent messages for a conversation directly from Supabase.

    Used as a defensive fallback when the frontend posts an empty history
    alongside a conversation_id (e.g. after a page reload that wiped client
    state). Verifies the conversation belongs to the authenticated user before
    returning anything. Returns [] on any error so chat never blocks on this.
    """
    if not conversation_id or not user_id or user_id == "verified":
        return []
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            check = await client.get(
                f"{settings.supabase_url}/rest/v1/conversations",
                params={
                    "id": f"eq.{conversation_id}",
                    "user_id": f"eq.{user_id}",
                    "select": "id",
                },
                headers=headers,
            )
            if check.status_code != 200 or not check.json():
                return []
            res = await client.get(
                f"{settings.supabase_url}/rest/v1/messages",
                params={
                    "conversation_id": f"eq.{conversation_id}",
                    "order": "created_at.asc",
                    "select": "role,content",
                    "limit": str(limit),
                },
                headers=headers,
            )
            if res.status_code != 200:
                return []
            rows = res.json()
            return [
                Message(role=row["role"], content=row["content"])
                for row in rows
                if row.get("role") in ("user", "assistant") and row.get("content")
            ]
    except Exception as e:
        logger.warning("DB history fallback failed: %s", e)
        return []


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    http_request: Request,
    user: Dict = Depends(get_current_user),
) -> ChatResponse:
    """
    Send a message to the chatbot and get a response.
    Supports both standard chat (Groq) and RAG-enhanced mode (Claude + retrieval).
    """
    try:
        conversation_id = request.conversation_id or str(uuid.uuid4())

        # Convert history to Message objects if needed
        history = []
        if request.history:
            for msg in request.history:
                if isinstance(msg, dict):
                    history.append(Message(**msg))
                else:
                    history.append(msg)

        # Defensive fallback: if frontend sent no history but the conversation
        # already exists, pull recent messages from Supabase so the LLM keeps
        # context across page reloads / cleared client state.
        if not history and request.conversation_id:
            history = await _load_db_history(
                conversation_id=request.conversation_id,
                user_id=user.get("user_id", ""),
            )
            if history:
                logger.info(
                    "Loaded %d messages from DB for conversation %s",
                    len(history), request.conversation_id,
                )

        # RAG mode: full retrieval -> rerank -> CRAG -> generate (Claude or Groq)
        if request.use_rag:
            rag = http_request.app.state.rag_service
            return await _handle_rag_query(request.message, conversation_id, history, rag)

        # Standard mode: Groq chat
        response_text, conversation_id = chat_service.get_chat_response(
            message=request.message,
            conversation_id=conversation_id,
            history=history,
        )

        return ChatResponse(
            message=response_text,
            conversation_id=conversation_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat message: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}",
        )


class TitleRequest(BaseModel):
    message: str


class TitleResponse(BaseModel):
    title: str


@router.post("/generate-title", response_model=TitleResponse)
async def generate_title(
    request: TitleRequest,
    user: Dict = Depends(get_current_user),
) -> TitleResponse:
    """Generate a short title for a conversation from the first message."""
    try:
        title = chat_service.generate_title(request.message)
        return TitleResponse(title=title)
    except Exception as e:
        logger.error(f"Title generation error: {e}", exc_info=True)
        # Fallback to truncated message
        fallback = request.message[:50] + ("..." if len(request.message) > 50 else "")
        return TitleResponse(title=fallback)


def _sse(event: dict) -> bytes:
    """Format a single SSE message: `data: {json}\\n\\n`."""
    return f"data: {json.dumps(event)}\n\n".encode("utf-8")


@router.post("/stream")
async def stream_message(
    request: ChatRequest,
    http_request: Request,
    user: Dict = Depends(get_current_user),
):
    """Streaming chat endpoint. Returns Server-Sent Events with deltas.

    Event envelope (one per SSE message, JSON in `data:`):
        {"type": "meta", "conversation_id": "..."}                first
        {"type": "meta", "citations": [...], "confidence": ..., "disclaimer": ...}  RAG only
        {"type": "delta", "text": "..."}                          one per token chunk
        {"type": "done", "conversation_id": "..."}                last
        {"type": "error", "message": "..."}                       on failure
    """
    conversation_id = request.conversation_id or str(uuid.uuid4())

    # Build history (same as non-stream endpoint)
    history: List[Message] = []
    if request.history:
        for msg in request.history:
            if isinstance(msg, dict):
                history.append(Message(**msg))
            else:
                history.append(msg)
    if not history and request.conversation_id:
        history = await _load_db_history(
            conversation_id=request.conversation_id,
            user_id=user.get("user_id", ""),
        )
        if history:
            logger.info(
                "Loaded %d messages from DB for conversation %s (stream)",
                len(history), request.conversation_id,
            )

    use_rag = request.use_rag
    rag = http_request.app.state.rag_service if use_rag else None
    message = request.message

    async def event_source() -> AsyncIterator[bytes]:
        # First event: conversation id so client can persist the round-trip
        yield _sse({"type": "meta", "conversation_id": conversation_id})
        try:
            if use_rag:
                local_rag = rag
                if local_rag is None:
                    from app.services.rag_service import RAGService
                    local_rag = RAGService()
                conv_history = [
                    {"role": m.role, "content": m.content}
                    for m in history
                    if m.role in ("user", "assistant")
                ]
                async for event in local_rag.query_stream(
                    question=message, conversation_history=conv_history,
                ):
                    yield _sse(event)
                    if event.get("type") == "done":
                        return
                yield _sse({"type": "done", "conversation_id": conversation_id})
            else:
                async for delta in chat_service.stream_chat_response(
                    message=message,
                    conversation_id=conversation_id,
                    history=history,
                ):
                    yield _sse({"type": "delta", "text": delta})
                yield _sse({"type": "done", "conversation_id": conversation_id})
        except Exception as e:
            logger.error("Stream chat error: %s", e, exc_info=True)
            yield _sse({"type": "error", "message": str(e)})

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


async def _handle_rag_query(
    message: str,
    conversation_id: str,
    history: list[Message],
    rag=None,
) -> ChatResponse:
    """Handle a RAG-enhanced query through the full pipeline.

    Reuses the singleton RAGService stored on app.state when available;
    falls back to a per-request instance when preload is disabled.
    """
    if rag is None:
        from app.services.rag_service import RAGService
        rag = RAGService()

    # Convert chat history to Claude format
    conv_history = [
        {"role": msg.role, "content": msg.content}
        for msg in history
        if msg.role in ("user", "assistant")
    ]

    result = await rag.query(
        question=message,
        conversation_history=conv_history,
    )

    # Convert citations to response format
    citations = [
        CitationItem(
            index=c.index,
            pmid=c.pmid,
            title=c.title,
            journal=c.journal,
            doi=c.doi,
        )
        for c in result.citations
    ]

    return ChatResponse(
        message=result.answer,
        conversation_id=conversation_id,
        citations=citations if citations else None,
        confidence=result.confidence,
        disclaimer=result.disclaimer,
    )
