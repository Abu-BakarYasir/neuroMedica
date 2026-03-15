from fastapi import APIRouter, Depends, HTTPException, status
from app.models.chat import ChatRequest, ChatResponse, ErrorResponse, Message
from app.services.chat_service import chat_service
from app.core.security import get_current_user
from typing import Dict
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
    Requires authentication.
    """
    try:
        # Convert history to Message objects if needed
        history = []
        if request.history:
            for msg in request.history:
                if isinstance(msg, dict):
                    history.append(Message(**msg))
                else:
                    history.append(msg)
        
        # Get response from chat service
        response_text, conversation_id = chat_service.get_chat_response(
            message=request.message,
            conversation_id=request.conversation_id,
            history=history,
        )
        
        return ChatResponse(
            message=response_text,
            conversation_id=conversation_id,
        )
    except HTTPException:
        # Re-raise HTTP exceptions (like auth errors)
        raise
    except Exception as e:
        # Log the full error for debugging
        logger.error(f"Error processing chat message: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}",
        )

