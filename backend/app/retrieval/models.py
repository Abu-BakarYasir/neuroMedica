"""Domain models for the retrieval pipeline."""

from pydantic import BaseModel, Field


class RetrievalResult(BaseModel):
    """A single retrieved document chunk with relevance score."""
    chunk_id: str
    pmid: str
    text: str
    section: str = "abstract"
    score: float = Field(..., description="Relevance score (higher is better)")
    source: str = Field(..., description="Retrieval source: 'dense', 'sparse', or 'fused'")
    metadata: dict = Field(default_factory=dict)


class RetrievalResponse(BaseModel):
    """Response from the hybrid retrieval pipeline."""
    query: str
    results: list[RetrievalResult]
    total_dense: int = 0
    total_sparse: int = 0
    total_fused: int = 0
