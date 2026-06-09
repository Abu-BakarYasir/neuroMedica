"""One-off: ingest a small PubMed corpus into an embedded (on-disk) Qdrant.

Run with QDRANT_LOCAL_PATH set so the app's factory uses embedded mode.
This process must fully exit (releasing the on-disk lock) before the backend
starts against the same path.
"""
import asyncio
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

from app.core.config import settings
from app.ingestion.pubmed_fetcher import PubMedFetcher
from app.ingestion.chunker import DocumentChunker
from app.ingestion.embedder import PubMedBERTEmbedder
from app.ingestion.qdrant_store import QdrantStore
from app.ingestion.pipeline import IngestionPipeline

QUERIES = [
    "metformin mechanism of action type 2 diabetes",
    "atorvastatin statin cardiovascular prevention",
    "hypertension management ACE inhibitors",
    "aspirin antiplatelet secondary prevention",
    "warfarin anticoagulation INR monitoring",
]


async def main():
    embedder = PubMedBERTEmbedder(model_name=settings.embedding_model)
    chunker = DocumentChunker(
        chunk_size=settings.chunk_size, chunk_overlap=settings.chunk_overlap
    )
    store = QdrantStore(
        url=settings.qdrant_url,
        api_key=settings.qdrant_api_key,
        collection_name=settings.qdrant_collection,
    )
    total = 0
    for q in QUERIES:
        fetcher = PubMedFetcher(
            email=settings.pubmed_email, api_key=settings.pubmed_api_key
        )
        pipeline = IngestionPipeline(fetcher, chunker, embedder, store)
        res = await pipeline.run(query=q, max_results=12)
        await fetcher.close()
        print(f"[{q}] -> fetched={res.articles_fetched} chunks={res.chunks_created} stored={res.chunks_stored}")
        total += res.chunks_stored
    print("TOTAL stored:", total)
    print("Collection info:", store.get_collection_info())


if __name__ == "__main__":
    asyncio.run(main())
