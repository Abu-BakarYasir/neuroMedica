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


class DocumentChunk(BaseModel):
    """A chunk of text ready for embedding."""
    chunk_id: str = Field(..., description="Unique chunk identifier")
    pmid: str = Field(..., description="Source PubMed ID")
    text: str = Field(..., description="Chunk text content")
    section: str = Field(default="abstract", description="Source section")
    chunk_index: int = Field(..., description="Position within the document")
    metadata: dict = Field(default_factory=dict)


class EmbeddedChunk(BaseModel):
    """A chunk with its embedding vector."""
    chunk_id: str
    pmid: str
    text: str
    section: str
    chunk_index: int
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
