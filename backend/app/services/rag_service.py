"""Full RAG pipeline service: retrieve -> rerank -> CRAG evaluate -> generate.

This is the main orchestrator that wires together all RAG components
and integrates with the existing chat API.
"""

import logging
from typing import AsyncIterator, Optional

from app.core.config import settings
from app.ingestion.embedder import PubMedBERTEmbedder
from app.ingestion.pubmed_fetcher import PubMedFetcher
from app.ingestion.chunker import DocumentChunker
from app.retrieval.dense_retriever import DenseRetriever
from app.retrieval.sparse_retriever import BM25Index
from app.retrieval.hybrid_retriever import HybridRetriever
from app.retrieval.graph_retriever import GraphRetriever
from app.retrieval.rrf_fusion import reciprocal_rank_fusion
from app.retrieval.models import RetrievalResult
from app.retrieval.query_classifier import (
    QueryIntent,
    classify_query,
    INTENT_SEARCH_CONFIG,
)
from app.retrieval.mesh_resolver import MeSHResolver, extract_medical_terms
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

    Pipeline: Query Understanding (intent + MeSH)
              -> Hybrid Retrieval (dense + sparse + graph)
              -> RRF Fusion -> ColBERT Rerank -> CRAG Evaluation
              -> Live PubMed Fallback (if needed)
              -> Intent-aware Generation with Citations (Claude or Groq)
    """

    def __init__(self):
        self._bm25_index = BM25Index()
        self._bm25_build_failed = False
        self._embedder = PubMedBERTEmbedder(model_name=settings.embedding_model)
        self._reranker = ColBERTReranker(model_name=settings.reranker_model)
        self._crag = CRAGEvaluator()
        self._generator = _build_generator()
        self._neo4j: Optional[Neo4jClient] = None
        self._mesh_resolver = MeSHResolver(
            email=settings.pubmed_email,
            api_key=settings.pubmed_api_key,
        )

    def _get_dense_retriever(self) -> DenseRetriever:
        return DenseRetriever(
            qdrant_url=settings.qdrant_url,
            qdrant_api_key=settings.qdrant_api_key,
            collection_name=settings.qdrant_collection,
            embedder=self._embedder,
        )

    def warmup(self) -> None:
        """Force-load embedder + reranker + BM25 AND run one dummy inference
        through each so PyTorch/Transformers JIT-compiles its kernels. Without
        the dummy predict() the first real request still pays a ~30s
        compilation cliff on the cross-encoder."""
        try:
            self._embedder._load_model()
            # Tiny encode forces tokenizer + model graph compile.
            self._embedder._model.encode(
                ["warmup"], batch_size=1, show_progress_bar=False,
                normalize_embeddings=True,
            )
        except Exception as e:
            logger.warning("Embedder warmup failed: %s", e)
        try:
            self._reranker._load_model()
            # One pair through the cross-encoder triggers kernel compile.
            self._reranker._model.predict(
                [["warmup query", "warmup document"]],
                batch_size=1, show_progress_bar=False,
            )
        except Exception as e:
            logger.warning("Reranker warmup failed: %s", e)
        self._get_bm25_index()

    def _get_bm25_index(self) -> BM25Index:
        if self._bm25_build_failed:
            return self._bm25_index
        if not self._bm25_index.is_built:
            try:
                logger.info("Building BM25 index from Qdrant...")
                self._bm25_index.build_from_qdrant(
                    qdrant_url=settings.qdrant_url,
                    qdrant_api_key=settings.qdrant_api_key,
                    collection_name=settings.qdrant_collection,
                )
            except Exception as e:
                self._bm25_build_failed = True
                logger.warning(
                    "BM25 build from Qdrant failed; sparse retrieval disabled for "
                    "this process (dense-only hybrid). Cause: %s",
                    e,
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

    async def _retrieve_context(
        self, question: str, top_k: int = 10
    ) -> tuple[list, str, QueryIntent]:
        """Steps 0-4 of the pipeline: query understanding -> hybrid retrieval
        (+ optional graph) -> rerank -> CRAG -> live-PubMed fallback.

        Returns (context_chunks, confidence, intent). Shared by query(),
        query_stream(), and explore_symptoms() so retrieval stays identical.
        """
        # Step 0: Query understanding
        intent = classify_query(question)
        mesh_term = await self._resolve_mesh_term(question)
        logger.info(
            "RAG Step 0: intent=%s, mesh_term=%s", intent.value, mesh_term or "none",
        )

        # Steps 1-2: Hybrid retrieval with RRF
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
                    retrieval_response.results = reciprocal_rank_fusion(
                        result_lists=[retrieval_response.results, graph_results],
                        k=settings.rrf_k,
                        top_n=top_k * 3,
                        weights=[1.0, 0.5],
                    )
            except Exception as e:
                logger.warning("Graph retrieval failed, continuing without: %s", e)

        # Step 3: Rerank
        logger.info("RAG Step 3: Reranking %d candidates", len(retrieval_response.results))
        reranked = self._reranker.rerank(
            query=question, candidates=retrieval_response.results, top_n=top_k,
        )

        # Step 4: CRAG evaluation
        logger.info("RAG Step 4: CRAG evaluation")
        crag_result = self._crag.evaluate(
            query=question, reranked_results=reranked.results,
        )

        confidence = "medium"
        context_chunks = crag_result.accepted_chunks
        if crag_result.action_taken == "proceed":
            confidence = "high"
        elif crag_result.action_taken == "fallback":
            logger.info("CRAG fallback: attempting live PubMed search for '%s'", question[:80])
            live_chunks = await self._live_pubmed_fallback(
                question, intent=intent, mesh_term=mesh_term, top_k=top_k
            )
            if live_chunks:
                confidence = "medium"
                context_chunks = live_chunks
            else:
                confidence = "insufficient"
                context_chunks = []
        elif crag_result.action_taken == "refine":
            confidence = "medium"
            if crag_result.refinement_queries:
                extra = await self._refine_retrieval(
                    crag_result.refinement_queries, top_k=5
                )
                context_chunks.extend(extra)
            if not context_chunks:
                logger.info("CRAG refine yielded no chunks: attempting live PubMed search")
                live_chunks = await self._live_pubmed_fallback(
                    question, intent=intent, mesh_term=mesh_term, top_k=top_k
                )
                if live_chunks:
                    context_chunks = live_chunks
                else:
                    confidence = "insufficient"

        return context_chunks, confidence, intent

    async def query(
        self,
        question: str,
        conversation_history: Optional[list[dict]] = None,
        top_k: int = 10,
    ) -> GenerationResult:
        """Execute the full RAG pipeline for a user question.

        Steps:
            0. Query understanding (intent classification + MeSH resolution)
            1. Hybrid retrieval (dense + sparse + optional graph)
            2. RRF fusion across all retrievers
            3. ColBERT reranking of fused candidates
            4. CRAG self-evaluation (proceed / refine / fallback)
            4b. Live PubMed fallback with intent-aware search (if needed)
            5. Intent-aware generation with citations
        """
        # Steps 0-4: query understanding -> retrieval -> rerank -> CRAG -> fallback
        context_chunks, confidence, intent = await self._retrieve_context(
            question, top_k=top_k
        )

        # Step 5: Generate answer with intent-aware prompt
        logger.info(
            "RAG Step 5: Generating answer (confidence=%s, context=%d chunks, intent=%s)",
            confidence, len(context_chunks), intent.value,
        )
        result = self._generator.generate(
            query=question,
            context_chunks=context_chunks,
            confidence=confidence,
            conversation_history=conversation_history,
            query_intent=intent.value,
        )

        return result

    async def query_stream(
        self,
        question: str,
        conversation_history: Optional[list[dict]] = None,
        top_k: int = 10,
    ) -> AsyncIterator[dict]:
        """Streaming variant of query(). Yields event dicts:
            {"type": "meta", "citations": [...], "confidence": ..., "disclaimer": ...}
            {"type": "delta", "text": "..."}    (one per chunk)
            {"type": "done"}

        Retrieval/rerank/CRAG run synchronously, then the answer is streamed
        token-by-token from Claude. Frontend can render citations + confidence
        immediately while the prose streams in.
        """
        # Steps 0-4: shared retrieval pipeline
        context_chunks, confidence, intent = await self._retrieve_context(
            question, top_k=top_k
        )

        # Build citations now so the frontend can render the citation chips
        # while the prose is still streaming.
        citations = self._generator._build_citations(context_chunks) if hasattr(
            self._generator, "_build_citations"
        ) else []
        disclaimer = "This information is for educational purposes only. Always consult qualified healthcare professionals for clinical decisions."

        yield {
            "type": "meta",
            "citations": [c.model_dump() for c in citations],
            "confidence": confidence,
            "disclaimer": disclaimer,
        }

        # Stream the answer text
        if hasattr(self._generator, "stream_generate"):
            async for text in self._generator.stream_generate(
                query=question,
                context_chunks=context_chunks,
                confidence=confidence,
                conversation_history=conversation_history,
                query_intent=intent.value,
            ):
                yield {"type": "delta", "text": text}
        else:
            # Fallback: generator doesn't support streaming — emit the whole
            # answer as one delta so the SSE contract is preserved.
            result = self._generator.generate(
                query=question,
                context_chunks=context_chunks,
                confidence=confidence,
                conversation_history=conversation_history,
                query_intent=intent.value,
            )
            yield {"type": "delta", "text": result.answer}

        yield {"type": "done"}

    async def _resolve_mesh_term(self, question: str) -> Optional[str]:
        """Extract medical terms from the question and resolve to MeSH vocabulary."""
        terms = extract_medical_terms(question)
        if not terms:
            return None
        try:
            mesh_term = await self._mesh_resolver.resolve(terms[0])
            return mesh_term
        except Exception as e:
            logger.warning("MeSH resolution failed: %s", e)
            return None

    async def _live_pubmed_fallback(
        self,
        query: str,
        intent: QueryIntent = QueryIntent.GENERAL,
        mesh_term: Optional[str] = None,
        top_k: int = 10,
    ) -> list:
        """Fetch articles from PubMed live when local corpus lacks relevant results.

        Uses intent-aware search: MeSH terms, article type filters, and
        sort order are all determined by the query intent.
        """
        try:
            fetcher = PubMedFetcher(
                email=settings.pubmed_email,
                api_key=settings.pubmed_api_key,
            )

            # Build intent-aware search query
            search_config = INTENT_SEARCH_CONFIG.get(
                intent, INTENT_SEARCH_CONFIG[QueryIntent.GENERAL]
            )

            # Construct the search term using MeSH if available
            if mesh_term:
                # Use MeSH term with subheading qualifiers if applicable
                subheadings = search_config.get("mesh_subheadings", [])
                if subheadings:
                    mesh_queries = [
                        f'"{mesh_term}/{sh}"[MeSH]' for sh in subheadings
                    ]
                    search_term = f'({" OR ".join(mesh_queries)})'
                else:
                    search_term = f'"{mesh_term}"[MeSH]'
            else:
                # Fallback to raw query
                search_term = query

            # Get article type filter from intent config
            article_filter = search_config.get("pubmed_filter", "")
            sort = search_config.get("sort", "relevance")
            min_date = "2015" if search_config.get("prefer_recent") else ""

            logger.info(
                "Live PubMed search: term='%s', filter='%s', sort=%s",
                search_term[:100], article_filter or "none", sort,
            )

            # Primary search: intent-optimized
            pmids = await fetcher.search(
                search_term,
                max_results=15,
                article_type_filter=article_filter,
                sort=sort,
                min_date=min_date,
            )

            # Fallback: if intent-filtered search returns too few, broaden
            if len(pmids) < 3 and article_filter:
                logger.info("Intent-filtered search returned %d results, broadening...", len(pmids))
                broader_pmids = await fetcher.search(
                    search_term if mesh_term else query,
                    max_results=15,
                    article_type_filter="",  # No filter
                    sort="relevance",
                )
                # Merge unique PMIDs (intent-filtered first)
                seen = set(pmids)
                for p in broader_pmids:
                    if p not in seen:
                        pmids.append(p)
                        seen.add(p)

            if not pmids:
                logger.warning("Live PubMed search returned no results for: %s", query)
                await fetcher.close()
                return []

            # Fetch full articles
            articles = await fetcher.fetch_articles(pmids[:15])
            await fetcher.close()

            if not articles:
                return []

            logger.info("Live PubMed fallback fetched %d articles", len(articles))

            # Chunk the articles
            chunker = DocumentChunker(
                chunk_size=settings.chunk_size,
                chunk_overlap=settings.chunk_overlap,
            )
            doc_chunks = chunker.chunk_articles(articles)

            if not doc_chunks:
                return []

            # Convert DocumentChunks to RetrievalResults for the reranker
            retrieval_results = [
                RetrievalResult(
                    chunk_id=dc.chunk_id,
                    pmid=dc.pmid,
                    source_type=dc.source_type,
                    text=dc.text,
                    section=dc.section,
                    url=dc.url,
                    score=1.0,
                    source="pubmed_live",
                    metadata=dc.metadata,
                )
                for dc in doc_chunks
            ]

            # Rerank against the original query
            reranked = self._reranker.rerank(
                query=query,
                candidates=retrieval_results,
                top_n=top_k,
            )

            logger.info(
                "Live PubMed fallback: reranked %d chunks, top score=%.4f",
                len(reranked.results),
                reranked.results[0].rerank_score if reranked.results else 0.0,
            )

            return reranked.results

        except Exception as e:
            logger.error("Live PubMed fallback failed: %s", e)
            return []

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

    async def explore_symptoms(self, symptoms: str, top_k: int = 10) -> dict:
        """Symptom -> structured differential diagnosis, grounded in retrieved
        literature. Reuses the same retrieval pipeline as query(); the answer is
        a structured differential payload instead of prose."""
        question = (
            "Differential diagnosis for a patient presenting with: " + symptoms
        )
        context_chunks, confidence, _intent = await self._retrieve_context(
            question, top_k=top_k
        )

        citations = (
            self._generator._build_citations(context_chunks)
            if hasattr(self._generator, "_build_citations") else []
        )
        disclaimer = (
            "This information is for educational purposes only. Always consult "
            "qualified healthcare professionals for clinical decisions."
        )

        if hasattr(self._generator, "generate_differential"):
            payload = self._generator.generate_differential(
                symptoms=symptoms,
                context_chunks=context_chunks,
                citations=citations,
                confidence=confidence,
            )
        else:
            # Groq fallback: no structured path — surface a prose answer.
            result = self._generator.generate(
                query=question, context_chunks=context_chunks,
                confidence=confidence, query_intent="diagnostic",
            )
            payload = {
                "structured": False, "summary": result.answer,
                "differentials": [], "recommended_workup": [],
            }

        return {
            "symptoms": symptoms,
            "differentials": payload.get("differentials", []),
            "summary": payload.get("summary", ""),
            "recommended_workup": payload.get("recommended_workup", []),
            "structured": payload.get("structured", True),
            "citations": [c.model_dump() for c in citations],
            "confidence": confidence,
            "disclaimer": disclaimer,
        }
