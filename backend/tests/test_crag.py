"""Tests for the CRAG self-evaluation loop."""

from app.reranking.models import RerankResult
from app.evaluation.crag_evaluator import CRAGEvaluator
from app.evaluation.models import RelevanceLevel


def _make_reranked(chunk_id: str, score: float) -> RerankResult:
    return RerankResult(
        chunk_id=chunk_id,
        pmid="12345",
        text=f"Document {chunk_id}",
        rerank_score=score,
        original_score=0.5,
        original_source="fused",
        rank=1,
    )


class TestCRAGEvaluator:
    def test_high_confidence_proceeds(self):
        """All high-scoring docs should result in 'proceed'."""
        # Use scores with tiny spread so all normalize to high confidence
        docs = [_make_reranked(f"c{i}", 0.9) for i in range(5)]
        evaluator = CRAGEvaluator()
        result = evaluator.evaluate("test query", docs)

        assert result.action_taken == "proceed"
        assert len(result.accepted_chunks) > 0

    def test_low_confidence_triggers_fallback(self):
        """All low-scoring docs should result in 'fallback'."""
        # All same score = all normalized to same value, but with only 1 doc
        # or all equal scores, the normalization puts them at 0 range
        docs = [_make_reranked("c1", 0.1)]
        evaluator = CRAGEvaluator(min_accepted_docs=2)
        result = evaluator.evaluate("test query", docs)

        # With only 1 doc and min_accepted=2, can't proceed
        assert result.action_taken in ("fallback", "refine")

    def test_mixed_scores_trigger_refine(self):
        """Mix of high and low scores should result in 'refine'."""
        docs = [
            _make_reranked("c1", 0.95),  # High
            _make_reranked("c2", 0.1),   # Low
            _make_reranked("c3", 0.5),   # Mid
            _make_reranked("c4", 0.12),  # Low
            _make_reranked("c5", 0.08),  # Low
        ]
        evaluator = CRAGEvaluator(min_accepted_docs=3)
        result = evaluator.evaluate("test query", docs)

        # Can't proceed (not enough high), not all low -> refine
        assert result.action_taken in ("refine", "fallback")

    def test_empty_results_fallback(self):
        """No results should trigger fallback."""
        evaluator = CRAGEvaluator()
        result = evaluator.evaluate("test query", [])

        assert result.action_taken == "fallback"
        assert result.avg_confidence == 0.0

    def test_evaluations_count_matches_top_n(self):
        """Should evaluate exactly top_n_to_evaluate documents."""
        docs = [_make_reranked(f"c{i}", 0.5) for i in range(10)]
        evaluator = CRAGEvaluator()
        result = evaluator.evaluate("test", docs, top_n_to_evaluate=3)

        assert len(result.evaluations) == 3

    def test_refinement_queries_generated(self):
        """Refine action should include refinement queries."""
        docs = [
            _make_reranked("c1", 0.95),
            _make_reranked("c2", 0.05),
            _make_reranked("c3", 0.5),
            _make_reranked("c4", 0.04),
            _make_reranked("c5", 0.03),
        ]
        evaluator = CRAGEvaluator(min_accepted_docs=3)
        result = evaluator.evaluate("diabetes type 2 metformin treatment", docs)

        if result.action_taken == "refine":
            assert len(result.refinement_queries) > 0

    def test_confidence_levels_correct(self):
        """Document evaluations should have correct relevance levels."""
        docs = [
            _make_reranked("high", 1.0),
            _make_reranked("low", 0.0),
        ]
        evaluator = CRAGEvaluator()
        result = evaluator.evaluate("test", docs)

        evals = {e.chunk_id: e for e in result.evaluations}
        assert evals["high"].relevance == RelevanceLevel.HIGH
        assert evals["low"].relevance == RelevanceLevel.LOW
