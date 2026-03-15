"""Ingestion pipeline orchestrator: fetch -> chunk -> embed -> store."""

import logging
import time

from app.ingestion.pubmed_fetcher import PubMedFetcher
from app.ingestion.chunker import DocumentChunker
from app.ingestion.embedder import PubMedBERTEmbedder
from app.ingestion.qdrant_store import QdrantStore
from app.ingestion.models import IngestionResult

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
