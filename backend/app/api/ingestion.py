"""API endpoints for the ingestion pipeline."""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.ingestion.pubmed_fetcher import PubMedFetcher
from app.ingestion.openfda_fetcher import OpenFDAFetcher
from app.ingestion.rxnorm_fetcher import RxNormFetcher
from app.ingestion.chunker import DocumentChunker
from app.ingestion.embedder import PubMedBERTEmbedder
from app.ingestion.qdrant_store import QdrantStore
from app.ingestion.pipeline import (
    IngestionPipeline,
    GenericDocPipeline,
    OpenFDAIngestionPipeline,
    RxNormIngestionPipeline,
    GuidelineIngestionPipeline,
)
from app.ingestion.models import IngestionResult

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ingestion", tags=["ingestion"])


def _build_generic_pipeline() -> GenericDocPipeline:
    """Shared chunk -> embed -> Qdrant path for non-PubMed sources."""
    return GenericDocPipeline(
        chunker=DocumentChunker(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        ),
        embedder=PubMedBERTEmbedder(model_name=settings.embedding_model),
        store=QdrantStore(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            collection_name=settings.qdrant_collection,
        ),
    )


class IngestionRequest(BaseModel):
    query: str = Field(..., description="PubMed search query", min_length=1)
    max_results: int = Field(
        default=50, ge=1, le=500, description="Max articles to fetch"
    )


class OpenFDARequest(BaseModel):
    query: str = Field(
        ...,
        description=(
            "OpenFDA search expression. Examples: "
            "'atorvastatin', "
            "'openfda.generic_name:\"metformin\"', "
            "'indications_and_usage:\"hypertension\"'"
        ),
        min_length=1,
    )
    max_results: int = Field(default=50, ge=1, le=100)


class RxNormRequest(BaseModel):
    names: list[str] = Field(
        ...,
        description="Drug names to resolve via RxNav (e.g. ['atorvastatin', 'metformin'])",
        min_length=1,
    )


class GuidelineRequest(BaseModel):
    query: str = Field(
        ...,
        description="PubMed query (filter for Practice Guideline / Guideline pubtype is auto-applied).",
        min_length=1,
    )
    max_results: int = Field(default=50, ge=1, le=500)


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


@router.post("/openfda", response_model=IngestionResult)
async def ingest_openfda(request: OpenFDARequest):
    """Ingest FDA SPL drug labels matching the search query."""
    fetcher = OpenFDAFetcher(api_key=None)
    pipeline = OpenFDAIngestionPipeline(
        fetcher=fetcher,
        generic=_build_generic_pipeline(),
    )
    try:
        return await pipeline.run(
            query=request.query, max_results=request.max_results,
        )
    except Exception as e:
        logger.exception("OpenFDA ingestion failed")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await fetcher.close()


@router.post("/rxnorm", response_model=IngestionResult)
async def ingest_rxnorm(request: RxNormRequest):
    """Ingest RxNorm concept records for the given drug names."""
    fetcher = RxNormFetcher()
    pipeline = RxNormIngestionPipeline(
        fetcher=fetcher,
        generic=_build_generic_pipeline(),
    )
    try:
        return await pipeline.run(names=request.names)
    except Exception as e:
        logger.exception("RxNorm ingestion failed")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await fetcher.close()


@router.post("/guidelines", response_model=IngestionResult)
async def ingest_guidelines(request: GuidelineRequest):
    """Ingest clinical practice guidelines from PubMed (article-type filtered)."""
    fetcher = PubMedFetcher(
        email=settings.pubmed_email,
        api_key=settings.pubmed_api_key,
    )
    pipeline = GuidelineIngestionPipeline(
        fetcher=fetcher,
        generic=_build_generic_pipeline(),
    )
    try:
        return await pipeline.run(
            query=request.query, max_results=request.max_results,
        )
    except Exception as e:
        logger.exception("Guideline ingestion failed")
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
