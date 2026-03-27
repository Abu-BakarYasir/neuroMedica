"""Sparse retrieval using BM25 over indexed document chunks."""

import logging
import re
from typing import Optional

from rank_bm25 import BM25Okapi

from app.core.qdrant_client_factory import get_qdrant_client
from app.retrieval.models import RetrievalResult

logger = logging.getLogger(__name__)


def _tokenize(text: str) -> list[str]:
    """Simple whitespace + punctuation tokenizer with lowercasing."""
    return re.findall(r"\w+", text.lower())


class BM25Index:
    """In-memory BM25 index built from Qdrant collection payloads."""

    def __init__(self):
        self._documents: list[dict] = []
        self._bm25: Optional[BM25Okapi] = None

    @property
    def is_built(self) -> bool:
        return self._bm25 is not None and len(self._documents) > 0

    @property
    def size(self) -> int:
        return len(self._documents)

    def build_from_qdrant(
        self,
        qdrant_url: str = "http://localhost:6333",
        qdrant_api_key: Optional[str] = None,
        collection_name: str = "pubmed_articles",
    ) -> int:
        """Load all documents from Qdrant and build a BM25 index."""
        client = get_qdrant_client(qdrant_url, qdrant_api_key, timeout=300)

        # Scroll through all points to build the corpus
        self._documents = []
        offset = None
        batch_size = 256

        while True:
            results, next_offset = client.scroll(
                collection_name=collection_name,
                limit=batch_size,
                offset=offset,
                with_payload=True,
                with_vectors=False,
            )

            for point in results:
                payload = point.payload or {}
                self._documents.append({
                    "chunk_id": str(point.id),
                    "pmid": payload.get("pmid", ""),
                    "text": payload.get("text", ""),
                    "section": payload.get("section", "abstract"),
                    "metadata": {
                        k: v for k, v in payload.items()
                        if k not in ("pmid", "text", "section", "chunk_index")
                    },
                })

            if next_offset is None:
                break
            offset = next_offset

        # Build BM25 index from tokenized texts
        corpus = [_tokenize(doc["text"]) for doc in self._documents]
        self._bm25 = BM25Okapi(corpus)

        logger.info("Built BM25 index with %d documents", len(self._documents))
        return len(self._documents)

    def build_from_documents(self, documents: list[dict]) -> int:
        """Build BM25 index from a list of document dicts (for testing)."""
        self._documents = documents
        corpus = [_tokenize(doc["text"]) for doc in self._documents]
        self._bm25 = BM25Okapi(corpus)
        return len(self._documents)

    def search(self, query: str, top_k: int = 20) -> list[RetrievalResult]:
        """Search the BM25 index and return ranked results."""
        if not self.is_built:
            logger.warning("BM25 index not built, returning empty results")
            return []

        tokenized_query = _tokenize(query)
        scores = self._bm25.get_scores(tokenized_query)

        # Get top-k indices sorted by score descending
        scored_indices = sorted(
            enumerate(scores), key=lambda x: x[1], reverse=True
        )[:top_k]

        results = []
        for idx, score in scored_indices:
            if score <= 0:
                continue
            doc = self._documents[idx]
            results.append(RetrievalResult(
                chunk_id=doc["chunk_id"],
                pmid=doc["pmid"],
                text=doc["text"],
                section=doc["section"],
                score=float(score),
                source="sparse",
                metadata=doc.get("metadata", {}),
            ))

        logger.info("BM25 search returned %d results for: %s", len(results), query[:80])
        return results
