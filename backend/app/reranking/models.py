"""Domain models for the reranking pipeline."""

from pydantic import BaseModel, Field

from app.retrieval.models import RetrievalResult


class RerankResult(BaseModel):
    """A reranked document with original and rerank scores."""
    chunk_id: str
    pmid: str
    text: str
    section: str = "abstract"
    rerank_score: float = Field(..., description="Reranker relevance score")
    original_score: float = Field(0.0, description="Pre-rerank score")
    original_source: str = Field("fused", description="Original retrieval source")
    rank: int = Field(..., description="Position after reranking (1-based)")
    metadata: dict = Field(default_factory=dict)

    @classmethod
    def from_retrieval_result(
        cls, result: RetrievalResult, rerank_score: float, rank: int
    ) -> "RerankResult":
        return cls(
            chunk_id=result.chunk_id,
            pmid=result.pmid,
            text=result.text,
            section=result.section,
            rerank_score=rerank_score,
            original_score=result.score,
            original_source=result.source,
            rank=rank,
            metadata=result.metadata,
        )


class RerankResponse(BaseModel):
    """Response from the reranking pipeline."""
    query: str
    results: list[RerankResult]
    model: str
    candidates_received: int
    candidates_returned: int
