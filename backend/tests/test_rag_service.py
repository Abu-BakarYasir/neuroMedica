"""Tests for the RAG service end-to-end pipeline orchestration."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.reranking.models import RerankResult, RerankResponse
from app.retrieval.models import RetrievalResult, RetrievalResponse
from app.evaluation.models import CRAGResult, DocumentEvaluation, RelevanceLevel
from app.generation.models import Citation, GenerationResult
from app.services.rag_service import RAGService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_retrieval_result(chunk_id: str, score: float, pmid: str = "111") -> RetrievalResult:
    return RetrievalResult(
        chunk_id=chunk_id,
        pmid=pmid,
        text=f"Text for {chunk_id}",
        section="abstract",
        score=score,
        source="fused",
        metadata={"title": f"Title {pmid}", "journal": "Test Journal", "doi": f"10.1234/{pmid}"},
    )


def _make_rerank_result(chunk_id: str, score: float, pmid: str = "111") -> RerankResult:
    return RerankResult(
        chunk_id=chunk_id,
        pmid=pmid,
        text=f"Text for {chunk_id}",
        section="abstract",
        rerank_score=score,
        original_score=0.5,
        original_source="fused",
        rank=1,
        metadata={"title": f"Title {pmid}", "journal": "Test Journal", "doi": f"10.1234/{pmid}"},
    )


def _make_generation_result(answer: str = "Test answer [1].", confidence: str = "high") -> GenerationResult:
    return GenerationResult(
        answer=answer,
        citations=[
            Citation(index=1, pmid="111", title="Title 111", journal="Test Journal", doi="10.1234/111"),
        ],
        query="test question",
        confidence=confidence,
    )


def _stub_rag_service() -> RAGService:
    """Build a RAGService with all heavy dependencies mocked out."""
    with (
        patch("app.services.rag_service.PubMedBERTEmbedder"),
        patch("app.services.rag_service.ColBERTReranker") as MockReranker,
        patch("app.services.rag_service._build_generator") as mock_gen_factory,
        patch("app.services.rag_service.MeSHResolver"),
    ):
        mock_reranker = MagicMock()
        MockReranker.return_value = mock_reranker

        mock_generator = MagicMock()
        mock_gen_factory.return_value = mock_generator

        service = RAGService()
        service._reranker = mock_reranker
        service._generator = mock_generator
        # Mock MeSH resolution to avoid network calls in tests
        service._resolve_mesh_term = AsyncMock(return_value=None)
        return service


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestRAGServiceQuery:
    """Tests for the full RAG query pipeline."""

    @pytest.mark.asyncio
    async def test_query_proceed_action(self):
        """When CRAG says 'proceed', should generate with full context."""
        service = _stub_rag_service()

        reranked_results = [_make_rerank_result("c1", 0.95), _make_rerank_result("c2", 0.90, "222")]
        retrieval_resp = RetrievalResponse(
            query="test", results=[_make_retrieval_result("c1", 0.9)],
            total_dense=1, total_sparse=1, total_fused=1,
        )
        rerank_resp = RerankResponse(
            query="test", results=reranked_results, model="test", candidates_received=2, candidates_returned=2,
        )

        # Mock hybrid retriever
        mock_hybrid = MagicMock()
        mock_hybrid.search.return_value = retrieval_resp
        with patch("app.services.rag_service.HybridRetriever", return_value=mock_hybrid):
            service._reranker.rerank.return_value = rerank_resp

            # Make CRAG return "proceed"
            with patch.object(service._crag, "evaluate") as mock_eval:
                mock_eval.return_value = CRAGResult(
                    query="test", original_query="test", action_taken="proceed",
                    accepted_chunks=reranked_results, avg_confidence=0.92,
                )

                gen_result = _make_generation_result(confidence="high")
                service._generator.generate.return_value = gen_result

                result = await service.query("test question")

        assert result.answer == "Test answer [1]."
        assert result.confidence == "high"
        assert len(result.citations) == 1
        service._generator.generate.assert_called_once()
        call_kwargs = service._generator.generate.call_args
        assert call_kwargs.kwargs["confidence"] == "high"

    @pytest.mark.asyncio
    async def test_query_fallback_action_no_pubmed(self):
        """When CRAG says 'fallback' and live PubMed also fails, should generate with empty context."""
        service = _stub_rag_service()

        retrieval_resp = RetrievalResponse(
            query="test", results=[_make_retrieval_result("c1", 0.1)],
            total_dense=1, total_sparse=0, total_fused=1,
        )
        rerank_resp = RerankResponse(
            query="test", results=[_make_rerank_result("c1", 0.1)],
            model="test", candidates_received=1, candidates_returned=1,
        )

        mock_hybrid = MagicMock()
        mock_hybrid.search.return_value = retrieval_resp
        with patch("app.services.rag_service.HybridRetriever", return_value=mock_hybrid):
            service._reranker.rerank.return_value = rerank_resp

            with patch.object(service._crag, "evaluate") as mock_eval:
                mock_eval.return_value = CRAGResult(
                    query="test", original_query="test", action_taken="fallback",
                    accepted_chunks=[], avg_confidence=0.1,
                )

                # Mock live PubMed fallback to return nothing
                with patch.object(service, "_live_pubmed_fallback", new_callable=AsyncMock, return_value=[]):
                    gen_result = _make_generation_result(answer="Insufficient sources.", confidence="insufficient")
                    service._generator.generate.return_value = gen_result

                    result = await service.query("obscure question")

        assert result.confidence == "insufficient"
        call_kwargs = service._generator.generate.call_args
        assert call_kwargs.kwargs["context_chunks"] == []
        assert call_kwargs.kwargs["confidence"] == "insufficient"

    @pytest.mark.asyncio
    async def test_query_fallback_action_pubmed_succeeds(self):
        """When CRAG says 'fallback' but live PubMed finds results, should generate with those."""
        service = _stub_rag_service()

        retrieval_resp = RetrievalResponse(
            query="test", results=[_make_retrieval_result("c1", 0.1)],
            total_dense=1, total_sparse=0, total_fused=1,
        )
        rerank_resp = RerankResponse(
            query="test", results=[_make_rerank_result("c1", 0.1)],
            model="test", candidates_received=1, candidates_returned=1,
        )

        mock_hybrid = MagicMock()
        mock_hybrid.search.return_value = retrieval_resp
        with patch("app.services.rag_service.HybridRetriever", return_value=mock_hybrid):
            service._reranker.rerank.return_value = rerank_resp

            with patch.object(service._crag, "evaluate") as mock_eval:
                mock_eval.return_value = CRAGResult(
                    query="test", original_query="test", action_taken="fallback",
                    accepted_chunks=[], avg_confidence=0.1,
                )

                live_results = [_make_rerank_result("live1", 0.85, "999")]
                with patch.object(service, "_live_pubmed_fallback", new_callable=AsyncMock, return_value=live_results):
                    gen_result = _make_generation_result(confidence="medium")
                    service._generator.generate.return_value = gen_result

                    result = await service.query("what is paracetamol")

        assert result.confidence == "medium"
        call_kwargs = service._generator.generate.call_args
        assert len(call_kwargs.kwargs["context_chunks"]) == 1
        assert call_kwargs.kwargs["confidence"] == "medium"

    @pytest.mark.asyncio
    async def test_query_refine_action_runs_refinement(self):
        """When CRAG says 'refine', should run refinement queries."""
        service = _stub_rag_service()

        initial_results = [_make_rerank_result("c1", 0.5)]
        retrieval_resp = RetrievalResponse(
            query="test", results=[_make_retrieval_result("c1", 0.5)],
            total_dense=1, total_sparse=0, total_fused=1,
        )
        rerank_resp = RerankResponse(
            query="test", results=initial_results,
            model="test", candidates_received=1, candidates_returned=1,
        )

        mock_hybrid = MagicMock()
        mock_hybrid.search.return_value = retrieval_resp
        with patch("app.services.rag_service.HybridRetriever", return_value=mock_hybrid):
            service._reranker.rerank.return_value = rerank_resp

            with patch.object(service._crag, "evaluate") as mock_eval:
                mock_eval.return_value = CRAGResult(
                    query="test", original_query="test", action_taken="refine",
                    accepted_chunks=initial_results, avg_confidence=0.5,
                    refinement_queries=["test clinical evidence"],
                )

                gen_result = _make_generation_result(confidence="medium")
                service._generator.generate.return_value = gen_result

                result = await service.query("ambiguous question")

        assert result.confidence == "medium"
        # Generator should have been called with extended context
        call_kwargs = service._generator.generate.call_args
        assert call_kwargs.kwargs["confidence"] == "medium"
        # Hybrid search called at least twice (initial + refinement)
        assert mock_hybrid.search.call_count >= 2

    @pytest.mark.asyncio
    async def test_query_passes_conversation_history(self):
        """Conversation history should be forwarded to the generator."""
        service = _stub_rag_service()

        retrieval_resp = RetrievalResponse(
            query="test", results=[], total_dense=0, total_sparse=0, total_fused=0,
        )
        rerank_resp = RerankResponse(
            query="test", results=[], model="test", candidates_received=0, candidates_returned=0,
        )

        mock_hybrid = MagicMock()
        mock_hybrid.search.return_value = retrieval_resp
        with patch("app.services.rag_service.HybridRetriever", return_value=mock_hybrid):
            service._reranker.rerank.return_value = rerank_resp

            with patch.object(service._crag, "evaluate") as mock_eval:
                mock_eval.return_value = CRAGResult(
                    query="test", original_query="test", action_taken="fallback",
                    avg_confidence=0.0,
                )
                gen_result = _make_generation_result(confidence="insufficient")
                service._generator.generate.return_value = gen_result

                history = [{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}]
                await service.query("follow up", conversation_history=history)

        call_kwargs = service._generator.generate.call_args
        assert call_kwargs.kwargs["conversation_history"] == history

    @pytest.mark.asyncio
    async def test_query_graph_retriever_optional(self):
        """Pipeline should work fine without Neo4j configured."""
        service = _stub_rag_service()

        retrieval_resp = RetrievalResponse(
            query="test", results=[_make_retrieval_result("c1", 0.9)],
            total_dense=1, total_sparse=0, total_fused=1,
        )
        rerank_resp = RerankResponse(
            query="test", results=[_make_rerank_result("c1", 0.9)],
            model="test", candidates_received=1, candidates_returned=1,
        )

        mock_hybrid = MagicMock()
        mock_hybrid.search.return_value = retrieval_resp
        with (
            patch("app.services.rag_service.HybridRetriever", return_value=mock_hybrid),
            patch("app.services.rag_service.settings") as mock_settings,
        ):
            mock_settings.neo4j_uri = ""  # No Neo4j
            mock_settings.qdrant_url = "http://localhost:6333"
            mock_settings.qdrant_api_key = ""
            mock_settings.qdrant_collection = "test"
            mock_settings.rrf_k = 60
            mock_settings.dense_weight = 1.0
            mock_settings.sparse_weight = 1.0

            service._reranker.rerank.return_value = rerank_resp
            with patch.object(service._crag, "evaluate") as mock_eval:
                mock_eval.return_value = CRAGResult(
                    query="test", original_query="test", action_taken="proceed",
                    accepted_chunks=[_make_rerank_result("c1", 0.9)], avg_confidence=0.9,
                )
                service._generator.generate.return_value = _make_generation_result()

                result = await service.query("test")

        assert result.answer is not None


class TestRAGServiceBM25Build:
    """Tests for BM25 index lazy building and failure handling."""

    def test_bm25_build_failure_sets_flag(self):
        """Failed BM25 build should set _bm25_build_failed so it's not retried."""
        service = _stub_rag_service()
        service._bm25_index = MagicMock()
        service._bm25_index.is_built = False
        service._bm25_index.build_from_qdrant.side_effect = Exception("Qdrant down")

        with patch("app.services.rag_service.settings") as mock_settings:
            mock_settings.qdrant_url = "http://localhost:6333"
            mock_settings.qdrant_api_key = ""
            mock_settings.qdrant_collection = "test"
            service._get_bm25_index()

        assert service._bm25_build_failed is True
        # Second call should NOT retry
        service._bm25_index.build_from_qdrant.reset_mock()
        service._get_bm25_index()
        service._bm25_index.build_from_qdrant.assert_not_called()


class TestGeneratorSelection:
    """Tests for _build_generator selecting Claude vs Groq."""

    def test_claude_selected_when_api_key_set(self):
        with (
            patch("app.services.rag_service.settings") as mock_settings,
            patch("app.services.rag_service.PubMedBERTEmbedder"),
            patch("app.services.rag_service.ColBERTReranker"),
        ):
            mock_settings.anthropic_api_key = "sk-ant-test"
            mock_settings.claude_model = "claude-sonnet-4-20250514"
            mock_settings.claude_max_tokens = 2048
            mock_settings.groq_api_key = "gsk_test"
            mock_settings.embedding_model = "test"
            mock_settings.reranker_model = "test"

            with patch("app.generation.claude_generator.anthropic"):
                from app.services.rag_service import _build_generator
                gen = _build_generator()
                assert gen.__class__.__name__ == "ClaudeGenerator"

    def test_groq_fallback_when_no_anthropic_key(self):
        with (
            patch("app.services.rag_service.settings") as mock_settings,
            patch("app.services.rag_service.PubMedBERTEmbedder"),
            patch("app.services.rag_service.ColBERTReranker"),
        ):
            mock_settings.anthropic_api_key = ""
            mock_settings.groq_api_key = "gsk_test"
            mock_settings.claude_max_tokens = 2048
            mock_settings.embedding_model = "test"
            mock_settings.reranker_model = "test"

            from app.services.rag_service import _build_generator
            gen = _build_generator()
            assert gen.__class__.__name__ == "GroqGenerator"
