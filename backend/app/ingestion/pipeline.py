"""Ingestion pipeline orchestrator: fetch -> chunk -> embed -> store."""

import logging
import time

from app.ingestion.pubmed_fetcher import PubMedFetcher
from app.ingestion.openfda_fetcher import OpenFDAFetcher
from app.ingestion.rxnorm_fetcher import RxNormFetcher
from app.ingestion.chunker import DocumentChunker
from app.ingestion.embedder import PubMedBERTEmbedder
from app.ingestion.qdrant_store import QdrantStore
from app.ingestion.models import GenericDocument, IngestionResult

logger = logging.getLogger(__name__)


class IngestionPipeline:
    """Orchestrates the full ingestion pipeline:
    PubMed search -> fetch articles -> chunk -> embed -> store in Qdrant.
    """

    def __init__(
        self,
        fetcher: PubMedFetcher,
        chunker: DocumentChunker,
        embedder: PubMedBERTEmbedder,
        store: QdrantStore,
    ):
        self.fetcher = fetcher
        self.chunker = chunker
        self.embedder = embedder
        self.store = store

    async def run(
        self,
        query: str,
        max_results: int = 50,
    ) -> IngestionResult:
        """Execute the full ingestion pipeline for a PubMed query."""
        start = time.time()
        errors: list[str] = []

        # 1. Search PubMed for PMIDs
        logger.info("Step 1: Searching PubMed for '%s'", query)
        pmids = await self.fetcher.search(query, max_results=max_results)

        # 2. Fetch article metadata
        logger.info("Step 2: Fetching %d articles", len(pmids))
        articles = await self.fetcher.fetch_articles(pmids)
        articles_fetched = len(articles)

        # Filter out articles with no abstract
        articles = [a for a in articles if a.abstract.strip()]
        if articles_fetched > len(articles):
            skipped = articles_fetched - len(articles)
            errors.append(f"Skipped {skipped} articles with no abstract")
            logger.info("Skipped %d articles with no abstract", skipped)

        # 3. Chunk articles
        logger.info("Step 3: Chunking %d articles", len(articles))
        chunks = self.chunker.chunk_articles(articles)
        chunks_created = len(chunks)

        # 4. Embed chunks
        logger.info("Step 4: Embedding %d chunks", len(chunks))
        embedded = self.embedder.embed_chunks(chunks)
        chunks_embedded = len(embedded)

        # 5. Ensure Qdrant collection exists and store
        logger.info("Step 5: Storing %d chunks in Qdrant", len(embedded))
        self.store.ensure_collection(vector_size=self.embedder.dimension)
        chunks_stored = self.store.upsert_chunks(embedded)

        duration = time.time() - start
        logger.info(
            "Pipeline complete: %d articles -> %d chunks -> %d stored (%.1fs)",
            articles_fetched, chunks_created, chunks_stored, duration,
        )

        return IngestionResult(
            query=query,
            articles_fetched=articles_fetched,
            chunks_created=chunks_created,
            chunks_embedded=chunks_embedded,
            chunks_stored=chunks_stored,
            errors=errors,
            duration_seconds=round(duration, 2),
        )


class GenericDocPipeline:
    """Shared chunk -> embed -> Qdrant path for any source that produces
    ``GenericDocument`` records (OpenFDA, RxNorm, guidelines)."""

    def __init__(
        self,
        chunker: DocumentChunker,
        embedder: PubMedBERTEmbedder,
        store: QdrantStore,
    ):
        self.chunker = chunker
        self.embedder = embedder
        self.store = store

    def ingest(
        self,
        documents: list[GenericDocument],
        query: str = "",
    ) -> IngestionResult:
        start = time.time()
        errors: list[str] = []

        if not documents:
            return IngestionResult(
                query=query,
                articles_fetched=0,
                chunks_created=0,
                chunks_embedded=0,
                chunks_stored=0,
                errors=["no documents returned by source"],
                duration_seconds=round(time.time() - start, 2),
            )

        logger.info("Generic ingest: chunking %d documents", len(documents))
        chunks = self.chunker.chunk_documents(documents)

        logger.info("Generic ingest: embedding %d chunks", len(chunks))
        embedded = self.embedder.embed_chunks(chunks)

        logger.info("Generic ingest: storing %d chunks in Qdrant", len(embedded))
        self.store.ensure_collection(vector_size=self.embedder.dimension)
        stored = self.store.upsert_chunks(embedded)

        duration = time.time() - start
        return IngestionResult(
            query=query,
            articles_fetched=len(documents),
            chunks_created=len(chunks),
            chunks_embedded=len(embedded),
            chunks_stored=stored,
            errors=errors,
            duration_seconds=round(duration, 2),
        )


class OpenFDAIngestionPipeline:
    """Search OpenFDA -> chunk -> embed -> Qdrant."""

    def __init__(
        self,
        fetcher: OpenFDAFetcher,
        generic: GenericDocPipeline,
    ):
        self.fetcher = fetcher
        self.generic = generic

    async def run(self, query: str, max_results: int = 50) -> IngestionResult:
        logger.info("OpenFDA pipeline: searching '%s' (max=%d)", query, max_results)
        documents = await self.fetcher.search_labels(
            query=query, max_results=max_results,
        )
        logger.info("OpenFDA pipeline: fetched %d labels", len(documents))
        return self.generic.ingest(documents=documents, query=query)


class RxNormIngestionPipeline:
    """Resolve drug names via RxNav -> chunk -> embed -> Qdrant."""

    def __init__(
        self,
        fetcher: RxNormFetcher,
        generic: GenericDocPipeline,
    ):
        self.fetcher = fetcher
        self.generic = generic

    async def run(self, names: list[str]) -> IngestionResult:
        logger.info("RxNorm pipeline: resolving %d drug names", len(names))
        documents = await self.fetcher.fetch_many(names)
        logger.info("RxNorm pipeline: built %d concept docs", len(documents))
        return self.generic.ingest(
            documents=documents, query=", ".join(names),
        )


class GuidelineIngestionPipeline:
    """Pull clinical practice guidelines via PubMed (article-type filter) and
    ingest them as ``source_type='guideline'`` so retrieval and citations can
    distinguish them from regular research articles."""

    GUIDELINE_FILTER = '("Practice Guideline"[pt] OR "Guideline"[pt])'

    def __init__(
        self,
        fetcher: PubMedFetcher,
        generic: GenericDocPipeline,
    ):
        self.fetcher = fetcher
        self.generic = generic

    async def run(self, query: str, max_results: int = 50) -> IngestionResult:
        logger.info("Guideline pipeline: searching PubMed for '%s'", query)
        pmids = await self.fetcher.search(
            query,
            max_results=max_results,
            article_type_filter=self.GUIDELINE_FILTER,
            sort="relevance",
        )
        if not pmids:
            return IngestionResult(
                query=query,
                articles_fetched=0,
                chunks_created=0,
                chunks_embedded=0,
                chunks_stored=0,
                errors=["no guidelines matched"],
                duration_seconds=0.0,
            )

        articles = await self.fetcher.fetch_articles(pmids)
        articles = [a for a in articles if a.abstract.strip()]

        # Convert each PubMed article into a GenericDocument tagged
        # ``guideline`` so downstream code shows it correctly.
        documents = [
            GenericDocument(
                doc_id=a.pmid,
                source_type="guideline",
                title=a.title,
                sections=[("abstract", a.abstract)],
                url=f"https://pubmed.ncbi.nlm.nih.gov/{a.pmid}/",
                metadata={
                    "title": a.title,
                    "authors": a.authors[:5],
                    "journal": a.journal,
                    "mesh_terms": a.mesh_terms,
                    "doi": a.doi,
                    "publication_date": (
                        a.publication_date.isoformat() if a.publication_date else None
                    ),
                },
            )
            for a in articles
        ]

        return self.generic.ingest(documents=documents, query=query)
