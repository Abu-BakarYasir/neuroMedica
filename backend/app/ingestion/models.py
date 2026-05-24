"""Domain models for the ingestion pipeline."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PubMedArticle(BaseModel):
    """Raw article fetched from PubMed."""
    pmid: str = Field(..., description="PubMed ID")
    title: str
    abstract: str
    authors: list[str] = Field(default_factory=list)
    journal: str = ""
    publication_date: Optional[datetime] = None
    mesh_terms: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    doi: Optional[str] = None


class GenericDocument(BaseModel):
    """Source-agnostic document used by non-PubMed fetchers (OpenFDA, RxNorm,
    guidelines). The chunker turns this into ``DocumentChunk``s that flow
    through the same embed -> Qdrant path as PubMed articles."""
    doc_id: str = Field(..., description="Unique document ID within its source")
    source_type: str = Field(
        ..., description="'pubmed', 'openfda', 'rxnorm', 'guideline'"
    )
    title: str = ""
    sections: list[tuple[str, str]] = Field(
        default_factory=list,
        description="Ordered (section_label, body_text) pairs. Each non-empty "
                    "section becomes one or more chunks.",
    )
    url: Optional[str] = Field(
        None, description="Canonical link for citations (DailyMed, RxNav, etc.)"
    )
    metadata: dict = Field(default_factory=dict)


class DocumentChunk(BaseModel):
    """A chunk of text ready for embedding.

    The ``pmid`` field is reused as a generic document ID across all sources to
    keep existing Qdrant payloads compatible: it holds the real PMID for
    PubMed articles, the SetID for FDA labels, the RXCUI for RxNorm, etc.
    ``source_type`` distinguishes them.
    """
    chunk_id: str = Field(..., description="Unique chunk identifier")
    pmid: str = Field(..., description="Source document ID (PMID, set_id, rxcui, ...)")
    source_type: str = Field(
        default="pubmed",
        description="'pubmed', 'openfda', 'rxnorm', 'guideline'",
    )
    text: str = Field(..., description="Chunk text content")
    section: str = Field(default="abstract", description="Source section")
    chunk_index: int = Field(..., description="Position within the document")
    url: Optional[str] = Field(None, description="Canonical link for citations")
    metadata: dict = Field(default_factory=dict)


class EmbeddedChunk(BaseModel):
    """A chunk with its embedding vector."""
    chunk_id: str
    pmid: str
    source_type: str = "pubmed"
    text: str
    section: str
    chunk_index: int
    url: Optional[str] = None
    embedding: list[float]
    metadata: dict = Field(default_factory=dict)


class IngestionResult(BaseModel):
    """Result of an ingestion run."""
    query: str
    articles_fetched: int
    chunks_created: int
    chunks_embedded: int
    chunks_stored: int
    errors: list[str] = Field(default_factory=list)
    duration_seconds: float = 0.0
