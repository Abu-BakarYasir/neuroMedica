"""API endpoints for the ingestion pipeline."""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.ingestion.pubmed_fetcher import PubMedFetcher
from app.ingestion.chunker import DocumentChunker
from app.ingestion.embedder import PubMedBERTEmbedder
from app.ingestion.qdrant_store import QdrantStore
from app.ingestion.pipeline import IngestionPipeline
from app.ingestion.models import IngestionResult

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ingestion", tags=["ingestion"])


class IngestionRequest(BaseModel):
    query: str = Field(..., description="PubMed search query", min_length=1)
    max_results: int = Field(
        default=50, ge=1, le=500, description="Max articles to fetch"
    )


@router.post("/ingest", response_model=IngestionResult)
async def ingest_pubmed(request: IngestionRequest):
    """Run the PubMed ingestion pipeline for a given search query."""
    fetcher = PubMedFetcher(
        email=settings.pubmed_email,
        api_key=settings.pubmed_api_key,
    )
    chunker = DocumentChunker(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )
    embedder = PubMedBERTEmbedder(model_name=settings.embedding_model)
    store = QdrantStore(
        url=settings.qdrant_url,
        api_key=settings.qdrant_api_key,
        collection_name=settings.qdrant_collection,
    )

    pipeline = IngestionPipeline(fetcher, chunker, embedder, store)

    try:
        result = await pipeline.run(
            query=request.query,
            max_results=request.max_results,
        )
        return result
    except Exception as e:
        logger.exception("Ingestion pipeline failed")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await fetcher.close()


@router.get("/status")
async def ingestion_status():
    """Get the status of the Qdrant collection."""
    try:
        store = QdrantStore(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            collection_name=settings.qdrant_collection,
        )
        info = store.get_collection_info()
        return {"status": "connected", "collection": info}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
