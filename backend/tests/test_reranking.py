"""Tests for the reranking pipeline."""

from unittest.mock import MagicMock, patch
import numpy as np

from app.retrieval.models import RetrievalResult
from app.reranking.models import RerankResult, RerankResponse
from app.reranking.reranker import ColBERTReranker


def _make_candidate(chunk_id: str, score: float, text: str = "") -> RetrievalResult:
    return RetrievalResult(
        chunk_id=chunk_id,
        pmid="12345",
        text=text or f"Document text for {chunk_id}",
        score=score,
        source="fused",
    )


class TestRerankResult:
    def test_from_retrieval_result(self):
        candidate = _make_candidate("c1", 0.8, "test text")
        result = RerankResult.from_retrieval_result(candidate, rerank_score=0.95, rank=1)

        assert result.chunk_id == "c1"
        assert result.rerank_score == 0.95
        assert result.original_score == 0.8
        assert result.original_source == "fused"
        assert result.rank == 1
        assert result.text == "test text"


class TestColBERTReranker:
    def _mock_reranker(self, scores: list[float]) -> ColBERTReranker:
        """Create a reranker with a mocked cross-encoder model."""
        reranker = ColBERTReranker(model_name="BAAI/bge-reranker-base")
        mock_model = MagicMock()
        mock_model.predict.return_value = np.array(scores)
        reranker._model = mock_model
        return reranker

    def test_rerank_reorders_by_score(self):
        """Candidates should be reordered by reranker score."""
        candidates = [
            _make_candidate("c1", 0.5, "less relevant doc"),
            _make_candidate("c2", 0.9, "most relevant doc"),
            _make_candidate("c3", 0.7, "somewhat relevant doc"),
        ]
        # Reranker scores: c1=0.2, c2=0.95, c3=0.6
        reranker = self._mock_reranker([0.2, 0.95, 0.6])

        response = reranker.rerank("test query", candidates)

        assert response.results[0].chunk_id == "c2"
        assert response.results[0].rerank_score == 0.95
        assert response.results[0].rank == 1
        assert response.results[1].chunk_id == "c3"
        assert response.results[1].rank == 2
        assert response.results[2].chunk_id == "c1"
        assert response.results[2].rank == 3

    def test_rerank_preserves_original_scores(self):
        """Original retrieval scores should be preserved."""
        candidates = [_make_candidate("c1", 0.85)]
        reranker = self._mock_reranker([0.7])

        response = reranker.rerank("query", candidates)

        assert response.results[0].original_score == 0.85
        assert response.results[0].rerank_score == 0.7

    def test_rerank_top_n(self):
        """top_n should limit output."""
        candidates = [_make_candidate(f"c{i}", 0.5) for i in range(10)]
        scores = [float(i) for i in range(10)]
        reranker = self._mock_reranker(scores)

        response = reranker.rerank("query", candidates, top_n=3)

        assert response.candidates_received == 10
        assert response.candidates_returned == 3
        assert len(response.results) == 3
        # Top 3 should have highest scores (9, 8, 7)
        assert response.results[0].rerank_score == 9.0

    def test_rerank_empty_candidates(self):
        """Empty candidates should return empty response."""
        reranker = ColBERTReranker()
        response = reranker.rerank("query", [])

        assert response.results == []
        assert response.candidates_received == 0
        assert response.candidates_returned == 0

    def test_rerank_model_name_in_response(self):
        """Response should include the model name."""
        candidates = [_make_candidate("c1", 0.5)]
        reranker = self._mock_reranker([0.9])

        response = reranker.rerank("query", candidates)

        assert response.model == "BAAI/bge-reranker-base"

    def test_rerank_passes_correct_pairs(self):
        """Cross-encoder should receive [query, doc_text] pairs."""
        candidates = [
            _make_candidate("c1", 0.5, "document one"),
            _make_candidate("c2", 0.5, "document two"),
        ]
        reranker = self._mock_reranker([0.5, 0.5])

        reranker.rerank("my query", candidates)

        call_args = reranker._model.predict.call_args
        pairs = call_args[0][0]
        assert pairs == [
            ["my query", "document one"],
            ["my query", "document two"],
        ]

    def test_rerank_metadata_preserved(self):
        """Metadata from retrieval results should carry through."""
        candidate = RetrievalResult(
            chunk_id="c1",
            pmid="999",
            text="test",
            score=0.5,
            source="fused",
            metadata={"journal": "Nature", "doi": "10.1234/test"},
        )
        reranker = self._mock_reranker([0.8])

        response = reranker.rerank("query", [candidate])

        assert response.results[0].metadata["journal"] == "Nature"
        assert response.results[0].metadata["doi"] == "10.1234/test"
