"""Domain models for the CRAG evaluation pipeline."""

from enum import Enum
from pydantic import BaseModel, Field

from app.reranking.models import RerankResult


class RelevanceLevel(str, Enum):
    """CRAG relevance classification for retrieved documents."""
    HIGH = "high"
    AMBIGUOUS = "ambiguous"
    LOW = "low"


class DocumentEvaluation(BaseModel):
    """Evaluation of a single retrieved document's relevance."""
    chunk_id: str
    relevance: RelevanceLevel
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str = ""


class CRAGResult(BaseModel):
    """Result of the CRAG self-evaluation loop."""
    query: str
    original_query: str
    action_taken: str = Field(
        ..., description="Action: 'proceed', 'refine', 'fallback'"
    )
    evaluations: list[DocumentEvaluation] = Field(default_factory=list)
    accepted_chunks: list[RerankResult] = Field(default_factory=list)
    avg_confidence: float = 0.0
    refinement_queries: list[str] = Field(default_factory=list)
