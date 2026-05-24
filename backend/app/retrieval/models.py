"""Domain models for the retrieval pipeline."""

from pydantic import BaseModel, Field
from typing import Optional


class RetrievalResult(BaseModel):
    """A single retrieved document chunk with relevance score."""
    chunk_id: str
    pmid: str
    source_type: str = Field(
        default="pubmed",
        description="Origin corpus: 'pubmed', 'openfda', 'rxnorm', 'guideline'",
    )
    text: str
    section: str = "abstract"
    url: Optional[str] = Field(None, description="Canonical source URL")
    score: float = Field(..., description="Relevance score (higher is better)")
    source: str = Field(..., description="Retriever channel: 'dense', 'sparse', 'graph', or 'fused'")
    metadata: dict = Field(default_factory=dict)


class RetrievalResponse(BaseModel):
    """Response from the hybrid retrieval pipeline."""
    query: str
    results: list[RetrievalResult]
    total_dense: int = 0
    total_sparse: int = 0
    total_fused: int = 0
