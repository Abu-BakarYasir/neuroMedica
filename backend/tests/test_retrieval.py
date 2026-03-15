"""Tests for the hybrid retrieval pipeline."""

from app.retrieval.models import RetrievalResult
from app.retrieval.rrf_fusion import reciprocal_rank_fusion
from app.retrieval.sparse_retriever import BM25Index, _tokenize


def _make_result(chunk_id: str, score: float, source: str = "dense") -> RetrievalResult:
    return RetrievalResult(
        chunk_id=chunk_id,
        pmid="12345",
        text=f"Text for {chunk_id}",
        score=score,
        source=source,
    )


class TestRRFFusion:
    def test_single_list_preserves_order(self):
        """RRF with a single list should preserve ranking order."""
        results = [
            _make_result("a", 0.9),
            _make_result("b", 0.7),
            _make_result("c", 0.5),
        ]
        fused = reciprocal_rank_fusion([results], k=60, top_n=10)

        assert len(fused) == 3
        assert fused[0].chunk_id == "a"
        assert fused[1].chunk_id == "b"
        assert fused[2].chunk_id == "c"
        assert all(r.source == "fused" for r in fused)

    def test_overlapping_results_get_boosted(self):
        """Documents appearing in both lists should rank higher."""
        dense = [
            _make_result("a", 0.9, "dense"),
            _make_result("b", 0.8, "dense"),
            _make_result("c", 0.7, "dense"),
        ]
        sparse = [
            _make_result("b", 5.0, "sparse"),  # "b" in both
            _make_result("d", 4.0, "sparse"),
            _make_result("a", 3.0, "sparse"),  # "a" in both
        ]

        fused = reciprocal_rank_fusion([dense, sparse], k=60, top_n=10)

        # Both "a" and "b" appear in both lists, so they should be top-ranked
        fused_ids = [r.chunk_id for r in fused]
        # "a" and "b" should be in top 2 positions (in some order)
        assert set(fused_ids[:2]) == {"a", "b"}

    def test_weights_affect_ranking(self):
        """Higher weight on a list should boost its results."""
        dense = [_make_result("dense_only", 0.9, "dense")]
        sparse = [_make_result("sparse_only", 5.0, "sparse")]

        # With equal weights
        fused_equal = reciprocal_rank_fusion(
            [dense, sparse], k=60, weights=[1.0, 1.0]
        )
        # Both have same rank (1) in their lists, so scores should be equal
        assert len(fused_equal) == 2

        # With heavy sparse weight
        fused_sparse = reciprocal_rank_fusion(
            [dense, sparse], k=60, weights=[0.1, 10.0]
        )
        assert fused_sparse[0].chunk_id == "sparse_only"

    def test_top_n_limits_output(self):
        """top_n should limit the number of returned results."""
        results = [_make_result(f"r{i}", 1.0 - i * 0.1) for i in range(10)]
        fused = reciprocal_rank_fusion([results], k=60, top_n=3)
        assert len(fused) == 3

    def test_empty_lists(self):
        """Empty input should return empty output."""
        assert reciprocal_rank_fusion([]) == []
        assert reciprocal_rank_fusion([[], []]) == []

    def test_rrf_scores_are_positive(self):
        """All RRF scores should be positive."""
        results = [_make_result(f"r{i}", float(i)) for i in range(5)]
        fused = reciprocal_rank_fusion([results], k=60)
        assert all(r.score > 0 for r in fused)

    def test_rrf_scores_decrease(self):
        """Fused scores should decrease monotonically."""
        dense = [_make_result(f"d{i}", 1.0 - i * 0.1, "dense") for i in range(5)]
        sparse = [_make_result(f"s{i}", 5.0 - i, "sparse") for i in range(5)]
        fused = reciprocal_rank_fusion([dense, sparse], k=60)
        scores = [r.score for r in fused]
        assert scores == sorted(scores, reverse=True)


class TestBM25Index:
    def _build_test_index(self) -> BM25Index:
        index = BM25Index()
        docs = [
            {"chunk_id": "c1", "pmid": "1", "text": "diabetes mellitus type 2 treatment with metformin", "section": "abstract", "metadata": {}},
            {"chunk_id": "c2", "pmid": "2", "text": "hypertension management with ACE inhibitors", "section": "abstract", "metadata": {}},
            {"chunk_id": "c3", "pmid": "3", "text": "diabetes insulin resistance and metabolic syndrome", "section": "abstract", "metadata": {}},
            {"chunk_id": "c4", "pmid": "4", "text": "cardiovascular risk factors in diabetes patients", "section": "abstract", "metadata": {}},
            {"chunk_id": "c5", "pmid": "5", "text": "oncology immunotherapy checkpoint inhibitors", "section": "abstract", "metadata": {}},
        ]
        index.build_from_documents(docs)
        return index

    def test_build_index(self):
        index = self._build_test_index()
        assert index.is_built
        assert index.size == 5

    def test_search_returns_relevant_results(self):
        index = self._build_test_index()
        results = index.search("diabetes treatment", top_k=5)

        assert len(results) > 0
        assert results[0].source == "sparse"
        # Diabetes-related docs should rank highest
        top_pmids = {r.pmid for r in results[:3]}
        assert "1" in top_pmids or "3" in top_pmids or "4" in top_pmids

    def test_exact_term_match_ranks_high(self):
        """BM25 should rank exact term matches highly."""
        index = self._build_test_index()
        results = index.search("metformin", top_k=5)

        # Only doc c1 contains "metformin"
        assert results[0].chunk_id == "c1"

    def test_search_unrelated_query(self):
        """Unrelated query should return low or zero scores."""
        index = self._build_test_index()
        results = index.search("quantum computing algorithms", top_k=5)
        # Should return no or very few results (all scores 0)
        assert len(results) == 0

    def test_empty_index_returns_empty(self):
        index = BM25Index()
        results = index.search("test query")
        assert results == []


class TestTokenizer:
    def test_basic_tokenization(self):
        tokens = _tokenize("Hello World! Test-case 123")
        assert tokens == ["hello", "world", "test", "case", "123"]

    def test_medical_terms(self):
        tokens = _tokenize("COVID-19 SARS-CoV-2 ACE2 receptor")
        assert "covid" in tokens
        assert "19" in tokens
        assert "ace2" in tokens
