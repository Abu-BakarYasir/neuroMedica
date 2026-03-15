"""Cross-encoder reranker using BAAI/bge-reranker-base.

Per ADR-005: ColBERT-style reranking provides token-level matching with
better latency than full cross-encoders at comparable quality for medical queries.
BGE-reranker-base uses a cross-encoder architecture that scores query-document
pairs directly, providing fine-grained relevance assessment.
"""

import logging
from typing import Optional

from app.retrieval.models import RetrievalResult
from app.reranking.models import RerankResult, RerankResponse

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "BAAI/bge-reranker-base"


class ColBERTReranker:
    """Reranks retrieval results using a cross-encoder model.

    Uses BAAI/bge-reranker-base which scores (query, document) pairs
    to produce fine-grained relevance scores for reordering candidates.
    """

    def __init__(
        self,
        model_name: Optional[str] = None,
        batch_size: int = 32,
        max_length: int = 512,
    ):
        self.model_name = model_name or DEFAULT_MODEL
        self.batch_size = batch_size
        self.max_length = max_length
        self._model = None

    def _load_model(self):
        """Lazy-load the cross-encoder model."""
        if self._model is None:
            from sentence_transformers import CrossEncoder
            logger.info("Loading reranker model: %s", self.model_name)
            self._model = CrossEncoder(
                self.model_name,
                max_length=self.max_length,
            )
            logger.info("Reranker model loaded")

    def rerank(
        self,
        query: str,
        candidates: list[RetrievalResult],
        top_n: Optional[int] = None,
    ) -> RerankResponse:
        """Rerank candidate results using the cross-encoder.

        Args:
            query: The search query.
            candidates: Retrieved results to rerank.
            top_n: Number of top results to return. Defaults to all.

        Returns:
            RerankResponse with reordered results.
        """
        if not candidates:
            return RerankResponse(
                query=query,
                results=[],
                model=self.model_name,
                candidates_received=0,
                candidates_returned=0,
            )

        self._load_model()

        # Build query-document pairs for the cross-encoder
        pairs = [[query, c.text] for c in candidates]

        # Score all pairs
        logger.info(
            "Reranking %d candidates (batch_size=%d)",
            len(pairs), self.batch_size,
        )
        scores = self._model.predict(
            pairs,
            batch_size=self.batch_size,
            show_progress_bar=False,
        )

        # Pair candidates with scores and sort descending
        scored = sorted(
            zip(candidates, scores),
            key=lambda x: x[1],
            reverse=True,
        )

        # Apply top_n limit
        if top_n is not None:
            scored = scored[:top_n]

        # Build reranked results with 1-based ranking
        results = [
            RerankResult.from_retrieval_result(candidate, float(score), rank=i + 1)
            for i, (candidate, score) in enumerate(scored)
        ]

        logger.info(
            "Reranked %d -> %d results (top score: %.4f)",
            len(candidates), len(results),
            results[0].rerank_score if results else 0.0,
        )

        return RerankResponse(
            query=query,
            results=results,
            model=self.model_name,
            candidates_received=len(candidates),
            candidates_returned=len(results),
        )
