"""API endpoints for the reranking pipeline."""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.ingestion.embedder import PubMedBERTEmbedder
from app.retrieval.dense_retriever import DenseRetriever
from app.retrieval.sparse_retriever import BM25Index
from app.retrieval.hybrid_retriever import HybridRetriever
from app.reranking.reranker import ColBERTReranker
from app.reranking.models import RerankResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reranking", tags=["reranking"])

# Module-level singletons
_bm25_index = BM25Index()
_reranker = ColBERTReranker(model_name=settings.reranker_model)


class RerankSearchRequest(BaseModel):
    query: str = Field(..., description="Search query", min_length=1)
    top_k: int = Field(default=10, ge=1, le=100, description="Final results after reranking")
    retrieval_top_k: int = Field(default=40, ge=1, le=200, description="Candidates from retrieval")


@router.post("/search", response_model=RerankResponse)
async def rerank_search(request: RerankSearchRequest):
    """Hybrid retrieval + ColBERT reranking pipeline."""
    try:
        # Build BM25 index if needed
        if not _bm25_index.is_built:
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
        hybrid = HybridRetriever(
            dense_retriever=dense,
            bm25_index=_bm25_index,
            rrf_k=settings.rrf_k,
        )

        # Step 1: Retrieve candidates via hybrid search
        retrieval = hybrid.search(query=request.query, top_k=request.retrieval_top_k)

        # Step 2: Rerank candidates
        reranked = _reranker.rerank(
            query=request.query,
            candidates=retrieval.results,
            top_n=request.top_k,
        )
        return reranked

    except Exception as e:
        logger.exception("Rerank search failed")
        raise HTTPException(status_code=500, detail=str(e))
