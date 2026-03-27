"""Store embedded chunks in Qdrant vector database."""

import logging
from typing import Optional

from qdrant_client.http.models import (
    Distance,
    PointStruct,
    VectorParams,
    Filter,
    FieldCondition,
    MatchValue,
)

from app.core.qdrant_client_factory import get_qdrant_client
from app.ingestion.models import EmbeddedChunk

logger = logging.getLogger(__name__)

COLLECTION_NAME = "pubmed_articles"


class QdrantStore:
    """Manages Qdrant collection for PubMed article embeddings."""

    def __init__(
        self,
        url: str = "http://localhost:6333",
        api_key: Optional[str] = None,
        collection_name: str = COLLECTION_NAME,
    ):
        self.collection_name = collection_name
        self._client = get_qdrant_client(url, api_key)

    def ensure_collection(self, vector_size: int):
        """Create the collection if it doesn't exist."""
        collections = self._client.get_collections().collections
        existing_names = {c.name for c in collections}

        if self.collection_name in existing_names:
            logger.info("Collection '%s' already exists", self.collection_name)
            return

        self._client.create_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE,
            ),
        )
        logger.info(
            "Created collection '%s' (dim=%d, cosine)",
            self.collection_name,
            vector_size,
        )

    def upsert_chunks(self, chunks: list[EmbeddedChunk]) -> int:
        """Upsert embedded chunks into Qdrant. Returns count of stored points."""
        if not chunks:
            return 0

        points = []
        for chunk in chunks:
            payload = {
                "pmid": chunk.pmid,
                "text": chunk.text,
                "section": chunk.section,
                "chunk_index": chunk.chunk_index,
                **chunk.metadata,
            }
            points.append(PointStruct(
                id=chunk.chunk_id,
                vector=chunk.embedding,
                payload=payload,
            ))

        # Qdrant upsert in batches of 100
        batch_size = 100
        stored = 0
        for i in range(0, len(points), batch_size):
            batch = points[i : i + batch_size]
            self._client.upsert(
                collection_name=self.collection_name,
                points=batch,
            )
            stored += len(batch)
            logger.info("Upserted batch %d-%d", i, i + len(batch))

        logger.info("Stored %d chunks in Qdrant", stored)
        return stored

    def get_collection_info(self) -> dict:
        """Get collection statistics."""
        info = self._client.get_collection(self.collection_name)
        return {
            "name": self.collection_name,
            "points_count": info.points_count,
            "vectors_count": getattr(info, "vectors_count", info.points_count),
            "status": info.status.value,
        }

    def delete_by_pmid(self, pmid: str) -> None:
        """Delete all chunks for a given PMID."""
        self._client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=[FieldCondition(key="pmid", match=MatchValue(value=pmid))]
            ),
        )
        logger.info("Deleted chunks for PMID %s", pmid)
