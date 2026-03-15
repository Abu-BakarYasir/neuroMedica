"""Full RAG pipeline service: retrieve -> rerank -> CRAG evaluate -> generate.

This is the main orchestrator that wires together all RAG components
and integrates with the existing chat API.
"""

import logging
from typing import Optional

from app.core.config import settings
from app.ingestion.embedder import PubMedBERTEmbedder
from app.retrieval.dense_retriever import DenseRetriever
from app.retrieval.sparse_retriever import BM25Index
from app.retrieval.hybrid_retriever import HybridRetriever
from app.retrieval.graph_retriever import GraphRetriever
from app.retrieval.rrf_fusion import reciprocal_rank_fusion
from app.reranking.reranker import ColBERTReranker
from app.evaluation.crag_evaluator import CRAGEvaluator
from app.generation.models import GenerationResult
from app.knowledge_graph.neo4j_client import Neo4jClient

logger = logging.getLogger(__name__)


def _build_generator():
    """Build the best available generator: Claude if API key set, else Groq."""
    if settings.anthropic_api_key:
        from app.generation.claude_generator import ClaudeGenerator
        logger.info("Using Claude generator (model=%s)", settings.claude_model)
        return ClaudeGenerator(
            api_key=settings.anthropic_api_key,
            model=settings.claude_model,
            max_tokens=settings.claude_max_tokens,
        )
    else:
        from app.generation.groq_generator import GroqGenerator
        logger.info("Anthropic key not set — using Groq generator as fallback")
        return GroqGenerator(
            api_key=settings.groq_api_key,
            max_tokens=settings.claude_max_tokens,
        )


class RAGService:
    """Orchestrates the full RAG pipeline.

    Pipeline: Query -> Hybrid Retrieval (dense + sparse + graph)
              -> RRF Fusion -> ColBERT Rerank -> CRAG Evaluation
              -> Generation with Citations (Claude or Groq)
    """

    def __init__(self):
        self._bm25_index = BM25Index()
        self._embedder = PubMedBERTEmbedder(model_name=settings.embedding_model)
        self._reranker = ColBERTReranker(model_name=settings.reranker_model)
        self._crag = CRAGEvaluator()
        self._generator = _build_generator()
        self._neo4j: Optional[Neo4jClient] = None

    def _get_dense_retriever(self) -> DenseRetriever:
        return DenseRetriever(
            qdrant_url=settings.qdrant_url,
            qdrant_api_key=settings.qdrant_api_key,
            collection_name=settings.qdrant_collection,
            embedder=self._embedder,
        )

    def _get_bm25_index(self) -> BM25Index:
        if not self._bm25_index.is_built:
            logger.info("Building BM25 index from Qdrant...")
            self._bm25_index.build_from_qdrant(
                qdrant_url=settings.qdrant_url,
                qdrant_api_key=settings.qdrant_api_key,
                collection_name=settings.qdrant_collection,
            )
        return self._bm25_index

    def _get_graph_retriever(self) -> Optional[GraphRetriever]:
        """Return graph retriever if Neo4j is configured."""
        if not settings.neo4j_uri:
            return None
        try:
            if self._neo4j is None:
                self._neo4j = Neo4jClient(
                    uri=settings.neo4j_uri,
                    user=settings.neo4j_user,
                    password=settings.neo4j_password,
                )
            return GraphRetriever(self._neo4j)
        except Exception as e:
            logger.warning("Neo4j unavailable, skipping graph retrieval: %s", e)
            return None

    async def query(
        self,
        question: str,
        conversation_history: Optional[list[dict]] = None,
        top_k: int = 10,
    ) -> GenerationResult:
        """Execute the full RAG pipeline for a user question.

        Steps:
            1. Hybrid retrieval (dense + sparse + optional graph)
            2. RRF fusion across all retrievers
            3. ColBERT reranking of fused candidates
            4. CRAG self-evaluation (proceed / refine / fallback)
            5. Claude generation with citations
        """
        # Step 1 & 2: Hybrid retrieval with RRF
        logger.info("RAG Step 1-2: Hybrid retrieval for '%s'", question[:80])
        hybrid = HybridRetriever(
            dense_retriever=self._get_dense_retriever(),
            bm25_index=self._get_bm25_index(),
            rrf_k=settings.rrf_k,
            dense_weight=settings.dense_weight,
            sparse_weight=settings.sparse_weight,
        )
        retrieval_response = hybrid.search(query=question, top_k=top_k * 3)

        # Optional: Graph retrieval + re-fuse
        graph_retriever = self._get_graph_retriever()
        if graph_retriever:
            try:
                graph_results = graph_retriever.search(question, top_k=top_k)
                if graph_results:
                    # Re-fuse hybrid results with graph results
                    combined = reciprocal_rank_fusion(
                        result_lists=[retrieval_response.results, graph_results],
                        k=settings.rrf_k,
                        top_n=top_k * 3,
                        weights=[1.0, 0.5],
                    )
                    retrieval_response.results = combined
            except Exception as e:
                logger.warning("Graph retrieval failed, continuing without: %s", e)

        # Step 3: Rerank
        logger.info("RAG Step 3: Reranking %d candidates", len(retrieval_response.results))
        reranked = self._reranker.rerank(
            query=question,
            candidates=retrieval_response.results,
            top_n=top_k,
        )

        # Step 4: CRAG evaluation
        logger.info("RAG Step 4: CRAG evaluation")
        crag_result = self._crag.evaluate(
            query=question,
            reranked_results=reranked.results,
        )

        # Determine confidence and context based on CRAG action
        confidence = "medium"
        context_chunks = crag_result.accepted_chunks

        if crag_result.action_taken == "proceed":
            confidence = "high"
        elif crag_result.action_taken == "fallback":
            confidence = "insufficient"
            context_chunks = []  # Don't use unreliable context
        elif crag_result.action_taken == "refine":
            confidence = "medium"
            # Try refinement queries for additional context
            if crag_result.refinement_queries:
                extra = await self._refine_retrieval(
                    crag_result.refinement_queries, top_k=5
                )
                context_chunks.extend(extra)

        # Step 5: Generate answer
        logger.info(
            "RAG Step 5: Generating answer (confidence=%s, context=%d chunks)",
            confidence, len(context_chunks),
        )
        result = self._generator.generate(
            query=question,
            context_chunks=context_chunks,
            confidence=confidence,
            conversation_history=conversation_history,
        )

        return result

    async def _refine_retrieval(
        self, refinement_queries: list[str], top_k: int = 5
    ) -> list:
        """Run additional retrieval passes with refined queries."""
        extra_results = []
        hybrid = HybridRetriever(
            dense_retriever=self._get_dense_retriever(),
            bm25_index=self._get_bm25_index(),
            rrf_k=settings.rrf_k,
        )
        for rq in refinement_queries[:2]:  # Limit to 2 refinement queries
            try:
                response = hybrid.search(query=rq, top_k=top_k)
                reranked = self._reranker.rerank(
                    query=rq, candidates=response.results, top_n=3
                )
                extra_results.extend(reranked.results)
            except Exception as e:
                logger.warning("Refinement query failed: %s", e)

        return extra_results
