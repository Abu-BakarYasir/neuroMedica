"""API endpoints for the hybrid retrieval pipeline."""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.ingestion.embedder import PubMedBERTEmbedder
from app.retrieval.dense_retriever import DenseRetriever
from app.retrieval.sparse_retriever import BM25Index
from app.retrieval.hybrid_retriever import HybridRetriever
from app.retrieval.models import RetrievalResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/retrieval", tags=["retrieval"])

# Module-level BM25 index (loaded once, reused across requests)
_bm25_index = BM25Index()


def _get_hybrid_retriever() -> HybridRetriever:
    """Build the hybrid retriever, loading BM25 index if needed."""
    if not _bm25_index.is_built:
        logger.info("Building BM25 index from Qdrant...")
        _bm25_index.build_from_qdrant(
            qdrant_url=settings.qdrant_url,
            qdrant_api_key=settings.qdrant_api_key,
            collection_name=settings.qdrant_collection,
        )

    embedder = PubMedBERTEmbedder(model_name=settings.embedding_model)
    dense = DenseRetriever(
        qdrant_url=settings.qdrant_url,
        qdrant_api_key=settings.qdrant_api_key,
        collection_name=settings.qdrant_collection,
        embedder=embedder,
    )
    return HybridRetriever(
        dense_retriever=dense,
        bm25_index=_bm25_index,
        rrf_k=settings.rrf_k,
        dense_weight=settings.dense_weight,
        sparse_weight=settings.sparse_weight,
    )


class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query", min_length=1)
    top_k: int = Field(default=10, ge=1, le=100, description="Number of results")
    mode: str = Field(
        default="hybrid",
        description="Search mode: 'hybrid', 'dense', or 'sparse'",
    )


@router.post("/search", response_model=RetrievalResponse)
async def search(request: SearchRequest):
    """Run hybrid, dense-only, or sparse-only retrieval."""
    try:
        retriever = _get_hybrid_retriever()
    except Exception as e:
        logger.exception("Failed to initialize retriever")
        raise HTTPException(status_code=503, detail=f"Retriever unavailable: {e}")

    try:
        if request.mode == "dense":
            return retriever.search_dense_only(request.query, top_k=request.top_k)
        elif request.mode == "sparse":
            return retriever.search_sparse_only(request.query, top_k=request.top_k)
        else:
            return retriever.search(request.query, top_k=request.top_k)
    except Exception as e:
        logger.exception("Search failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rebuild-index")
async def rebuild_bm25_index():
    """Force rebuild the BM25 index from Qdrant."""
    global _bm25_index
    _bm25_index = BM25Index()
    count = _bm25_index.build_from_qdrant(
        qdrant_url=settings.qdrant_url,
        qdrant_api_key=settings.qdrant_api_key,
        collection_name=settings.qdrant_collection,
    )
    return {"status": "rebuilt", "documents_indexed": count}
