from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Message(BaseModel):
    role: str = Field(..., description="Message role: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message", min_length=1)
    conversation_id: Optional[str] = Field(None, description="Conversation ID for context")
    history: Optional[List[Message]] = Field(
        default_factory=list, description="Previous conversation history"
    )
    use_rag: bool = Field(default=False, description="Enable RAG pipeline for evidence-based answers")


class CitationItem(BaseModel):
    index: int
    pmid: str
    title: str = ""
    journal: str = ""
    doi: Optional[str] = None


class ChatResponse(BaseModel):
    message: str = Field(..., description="Assistant response")
    conversation_id: str = Field(..., description="Conversation ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    citations: Optional[List[CitationItem]] = Field(None, description="Source citations (RAG mode)")
    confidence: Optional[str] = Field(None, description="Answer confidence (RAG mode)")
    disclaimer: Optional[str] = Field(None, description="Medical disclaimer (RAG mode)")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")





