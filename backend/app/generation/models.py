"""Domain models for the generation pipeline."""

from pydantic import BaseModel, Field


class Citation(BaseModel):
    """A citation to a source document."""
    index: int = Field(..., description="Citation number (1-based)")
    pmid: str = Field(..., description="Source document ID (PMID, set_id, rxcui, ...)")
    source_type: str = Field(
        default="pubmed",
        description="'pubmed', 'openfda', 'rxnorm', 'guideline'",
    )
    title: str = ""
    text_excerpt: str = Field("", description="Relevant excerpt from source")
    journal: str = ""
    doi: str | None = None
    url: str | None = Field(None, description="Canonical link for the citation")


class GenerationResult(BaseModel):
    """Result from the Claude API generation pipeline."""
    answer: str = Field(..., description="Generated answer with inline citations")
    citations: list[Citation] = Field(default_factory=list)
    query: str
    confidence: str = Field(
        default="medium",
        description="Confidence level: 'high', 'medium', 'low', 'insufficient'",
    )
    disclaimer: str = Field(
        default="This information is for educational purposes only. Always consult qualified healthcare professionals for clinical decisions.",
    )
