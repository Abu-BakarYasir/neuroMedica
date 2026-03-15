from fastapi import APIRouter, Depends, HTTPException, status
from app.models.chat import ChatRequest, ChatResponse, CitationItem, ErrorResponse, Message
from app.services.chat_service import chat_service
from app.core.security import get_current_user
from app.core.config import settings
from typing import Dict
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
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

        # RAG mode: full retrieval -> rerank -> CRAG -> generate (Claude or Groq)
        if request.use_rag:
            return await _handle_rag_query(request.message, conversation_id, history)

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


async def _handle_rag_query(
    message: str, conversation_id: str, history: list[Message]
) -> ChatResponse:
    """Handle a RAG-enhanced query through the full pipeline."""
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
