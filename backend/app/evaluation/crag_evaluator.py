"""CRAG (Corrective RAG) self-evaluation loop.

Per ADR-006: Medical RAG cannot afford hallucination. CRAG scores retrieval
relevance before generation. Low-confidence retrievals trigger fallback
(knowledge graph expansion, query decomposition). This adds latency but
is non-negotiable for clinical safety.
"""

import logging
from typing import Optional

import httpx

from app.reranking.models import RerankResult
from app.evaluation.models import (
    CRAGResult,
    DocumentEvaluation,
    RelevanceLevel,
)

logger = logging.getLogger(__name__)

# Thresholds for CRAG decision making
HIGH_CONFIDENCE_THRESHOLD = 0.7
LOW_CONFIDENCE_THRESHOLD = 0.3

# Minimum absolute reranker score to consider a doc potentially relevant.
# Below this, even the best-scoring doc is treated as irrelevant regardless
# of relative normalization. BGE-reranker-base outputs logits where scores
# above ~0.5 indicate likely relevance; well below that means no match.
MIN_ABSOLUTE_RERANKER_SCORE = 0.1


class CRAGEvaluator:
    """Evaluates retrieval quality and decides whether to proceed, refine, or fallback.

    Decision logic:
    - HIGH: majority of top docs score above HIGH threshold -> proceed to generation
    - AMBIGUOUS: mixed scores -> decompose query and re-retrieve
    - LOW: majority below LOW threshold -> trigger fallback (graph search, web)
    """

    def __init__(
        self,
        high_threshold: float = HIGH_CONFIDENCE_THRESHOLD,
        low_threshold: float = LOW_CONFIDENCE_THRESHOLD,
        min_accepted_docs: int = 2,
        min_absolute_score: float = MIN_ABSOLUTE_RERANKER_SCORE,
    ):
        self.high_threshold = high_threshold
        self.low_threshold = low_threshold
        self.min_accepted_docs = min_accepted_docs
        self.min_absolute_score = min_absolute_score

    def evaluate(
        self,
        query: str,
        reranked_results: list[RerankResult],
        top_n_to_evaluate: int = 5,
    ) -> CRAGResult:
        """Evaluate the quality of reranked retrieval results.

        Uses reranker scores as proxy for relevance (normalized to 0-1).
        """
        if not reranked_results:
            return CRAGResult(
                query=query,
                original_query=query,
                action_taken="fallback",
                avg_confidence=0.0,
            )

        # Evaluate top-N documents
        top_docs = reranked_results[:top_n_to_evaluate]
        evaluations = self._evaluate_documents(top_docs)

        # Calculate aggregate confidence
        avg_confidence = (
            sum(e.confidence for e in evaluations) / len(evaluations)
            if evaluations else 0.0
        )

        # Classify results by relevance
        high_count = sum(1 for e in evaluations if e.relevance == RelevanceLevel.HIGH)
        low_count = sum(1 for e in evaluations if e.relevance == RelevanceLevel.LOW)

        # Decide action
        action, accepted, refinements = self._decide_action(
            query, evaluations, reranked_results, high_count, low_count, avg_confidence
        )

        return CRAGResult(
            query=query,
            original_query=query,
            action_taken=action,
            evaluations=evaluations,
            accepted_chunks=accepted,
            avg_confidence=round(avg_confidence, 4),
            refinement_queries=refinements,
        )

    def _evaluate_documents(
        self, docs: list[RerankResult]
    ) -> list[DocumentEvaluation]:
        """Score each document's relevance using reranker scores.

        Uses a combination of absolute and relative scoring:
        - If the best reranker score is below min_absolute_score, ALL docs
          are treated as low confidence (the corpus simply doesn't have relevant results).
        - Otherwise, scores are normalized relative to each other.
        """
        evaluations = []

        scores = [d.rerank_score for d in docs]
        max_score = max(scores) if scores else 0.0
        min_score = min(scores) if scores else 0.0
        score_range = max_score - min_score

        # If the best absolute reranker score is very low, nothing is relevant
        all_irrelevant = max_score < self.min_absolute_score

        for doc in docs:
            if all_irrelevant:
                # Absolute score too low — corpus doesn't contain relevant results
                confidence = max_score  # Use raw score as confidence (will be < 0.1)
            elif score_range == 0:
                # All scores identical — use absolute score as guide
                confidence = min(1.0, max_score) if max_score > self.min_absolute_score else 0.0
            else:
                normalized = (doc.rerank_score - min_score) / score_range
                confidence = max(0.0, min(1.0, normalized))

            # Classify relevance
            if confidence >= self.high_threshold:
                relevance = RelevanceLevel.HIGH
            elif confidence <= self.low_threshold:
                relevance = RelevanceLevel.LOW
            else:
                relevance = RelevanceLevel.AMBIGUOUS

            evaluations.append(DocumentEvaluation(
                chunk_id=doc.chunk_id,
                relevance=relevance,
                confidence=round(confidence, 4),
                reasoning=f"Rerank score {doc.rerank_score:.4f} -> confidence {confidence:.4f}"
                          + (" [below absolute threshold]" if all_irrelevant else ""),
            ))

        return evaluations

    def _decide_action(
        self,
        query: str,
        evaluations: list[DocumentEvaluation],
        all_results: list[RerankResult],
        high_count: int,
        low_count: int,
        avg_confidence: float,
    ) -> tuple[str, list[RerankResult], list[str]]:
        """Decide whether to proceed, refine, or fallback."""
        total = len(evaluations)

        # HIGH: Majority of docs are highly relevant
        if high_count >= self.min_accepted_docs and high_count > total / 2:
            accepted_ids = {
                e.chunk_id for e in evaluations
                if e.relevance in (RelevanceLevel.HIGH, RelevanceLevel.AMBIGUOUS)
            }
            accepted = [r for r in all_results if r.chunk_id in accepted_ids]
            logger.info(
                "CRAG: PROCEED (avg_conf=%.2f, high=%d/%d)",
                avg_confidence, high_count, total,
            )
            return "proceed", accepted, []

        # LOW: Majority of docs are irrelevant
        if low_count > total / 2 or avg_confidence < self.low_threshold:
            logger.info(
                "CRAG: FALLBACK (avg_conf=%.2f, low=%d/%d)",
                avg_confidence, low_count, total,
            )
            return "fallback", [], []

        # AMBIGUOUS: Mixed results -> suggest query refinements
        refinements = self._generate_refinements(query)
        # Still accept high-confidence docs
        accepted_ids = {
            e.chunk_id for e in evaluations
            if e.relevance == RelevanceLevel.HIGH
        }
        accepted = [r for r in all_results if r.chunk_id in accepted_ids]
        logger.info(
            "CRAG: REFINE (avg_conf=%.2f, high=%d, amb=%d, low=%d)",
            avg_confidence, high_count, total - high_count - low_count, low_count,
        )
        return "refine", accepted, refinements

    def _generate_refinements(self, query: str) -> list[str]:
        """Generate refined sub-queries for ambiguous results.

        Uses simple heuristic decomposition. In production, this could
        call an LLM for intelligent query reformulation.
        """
        words = query.split()
        refinements = []

        # Strategy 1: Add specificity
        refinements.append(f"{query} clinical evidence")

        # Strategy 2: If query has multiple concepts, split them
        if len(words) > 4:
            mid = len(words) // 2
            refinements.append(" ".join(words[:mid]))
            refinements.append(" ".join(words[mid:]))

        return refinements[:3]
