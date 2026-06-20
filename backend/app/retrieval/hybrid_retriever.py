"""Hybrid retriever: orchestrates dense + sparse search with RRF fusion."""

import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from app.retrieval.dense_retriever import DenseRetriever
from app.retrieval.sparse_retriever import BM25Index
from app.retrieval.rrf_fusion import reciprocal_rank_fusion
from app.retrieval.models import RetrievalResult, RetrievalResponse

logger = logging.getLogger(__name__)


class HybridRetriever:
    """Combines dense (Qdrant) and sparse (BM25) retrieval with RRF fusion.

    Per ADR-001: Dense-only retrieval misses exact medical terminology.
    BM25 catches exact term matches (drug names, ICD codes).
    RRF merges both for best-of-both-worlds retrieval.
    """

    def __init__(
        self,
        dense_retriever: DenseRetriever,
        bm25_index: BM25Index,
        rrf_k: int = 60,
        dense_weight: float = 1.0,
        sparse_weight: float = 1.0,
    ):
        self.dense = dense_retriever
        self.bm25 = bm25_index
        self.rrf_k = rrf_k
        self.dense_weight = dense_weight
        self.sparse_weight = sparse_weight

    def _safe_dense_search(self, query: str, top_k: int) -> list:
        """Dense retrieval guarded so a transient/unavailable vector DB degrades
        to sparse-only instead of failing the whole request."""
        try:
            return self.dense.search(query=query, top_k=top_k)
        except Exception as e:
            logger.warning("Dense retrieval failed, continuing without it: %s", e)
            return []

    def _safe_sparse_search(self, query: str, top_k: int) -> list:
        """Sparse (BM25) retrieval guarded so a missing/failed index degrades to
        dense-only instead of failing the whole request."""
        try:
            return self.bm25.search(query=query, top_k=top_k)
        except Exception as e:
            logger.warning("Sparse retrieval failed, continuing without it: %s", e)
            return []

    def search(
        self,
        query: str,
        top_k: int = 20,
        dense_top_k: Optional[int] = None,
        sparse_top_k: Optional[int] = None,
    ) -> RetrievalResponse:
        """Run hybrid search: dense + sparse -> RRF fusion.

        Args:
            query: Search query string.
            top_k: Number of final fused results to return.
            dense_top_k: Override top-k for dense search (defaults to 2x top_k).
            sparse_top_k: Override top-k for sparse search (defaults to 2x top_k).

        Returns:
            RetrievalResponse with fused results.
        """
        # Fetch more candidates from each retriever than final top_k
        # to give RRF enough signal for good fusion
        d_top_k = dense_top_k or top_k * 2
        s_top_k = sparse_top_k or top_k * 2

        # 1-2. Dense (PubMedBERT → Qdrant) and sparse (BM25) retrieval run
        # concurrently. They're fully independent — dense is dominated by the
        # Qdrant network round-trip, sparse by an in-memory BM25 scan — so
        # overlapping them roughly halves retrieval latency vs. back-to-back.
        # Each is wrapped so a transient/unavailable backend degrades to the
        # other (and ultimately the CRAG live-PubMed fallback) instead of
        # failing the whole request.
        logger.info(
            "Running dense + sparse retrieval in parallel (dense_top_k=%d, sparse_top_k=%d)",
            d_top_k, s_top_k,
        )
        with ThreadPoolExecutor(max_workers=2) as executor:
            dense_future = executor.submit(self._safe_dense_search, query, d_top_k)
            sparse_future = executor.submit(self._safe_sparse_search, query, s_top_k)
            dense_results = dense_future.result()
            sparse_results = sparse_future.result()

        # 3. Fuse with RRF
        fused = reciprocal_rank_fusion(
            result_lists=[dense_results, sparse_results],
            k=self.rrf_k,
            top_n=top_k,
            weights=[self.dense_weight, self.sparse_weight],
        )

        return RetrievalResponse(
            query=query,
            results=fused,
            total_dense=len(dense_results),
            total_sparse=len(sparse_results),
            total_fused=len(fused),
        )

    def search_dense_only(self, query: str, top_k: int = 20) -> RetrievalResponse:
        """Run dense-only retrieval (useful for fallback or comparison)."""
        results = self.dense.search(query=query, top_k=top_k)
        return RetrievalResponse(
            query=query,
            results=results,
            total_dense=len(results),
        )

    def search_sparse_only(self, query: str, top_k: int = 20) -> RetrievalResponse:
        """Run sparse-only retrieval (useful for exact term matching)."""
        results = self.bm25.search(query=query, top_k=top_k)
        return RetrievalResponse(
            query=query,
            results=results,
            total_sparse=len(results),
        )
