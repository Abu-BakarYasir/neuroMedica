"""Dense retrieval via PubMedBERT embeddings and Qdrant ANN search."""

import logging
from typing import Optional

from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue

from app.ingestion.embedder import PubMedBERTEmbedder
from app.retrieval.models import RetrievalResult

logger = logging.getLogger(__name__)


class DenseRetriever:
    """Retrieves documents via dense vector similarity search in Qdrant."""

    def __init__(
        self,
        qdrant_url: str = "http://localhost:6333",
        qdrant_api_key: Optional[str] = None,
        collection_name: str = "pubmed_articles",
        embedder: Optional[PubMedBERTEmbedder] = None,
    ):
        self.collection_name = collection_name
        self._client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        self._embedder = embedder or PubMedBERTEmbedder()

    def search(
        self,
        query: str,
        top_k: int = 20,
        score_threshold: float = 0.0,
        filter_pmids: Optional[list[str]] = None,
    ) -> list[RetrievalResult]:
        """Embed query and search Qdrant for nearest neighbors."""
        # Embed the query
        self._embedder._load_model()
        query_vector = self._embedder._model.encode(
            query, normalize_embeddings=True
        ).tolist()

        # Build optional filter
        qdrant_filter = None
        if filter_pmids:
            qdrant_filter = Filter(
                must=[
                    FieldCondition(
                        key="pmid",
                        match=MatchValue(value=pmid),
                    )
                    for pmid in filter_pmids
                ]
            )

        # Search Qdrant
        hits = self._client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=top_k,
            score_threshold=score_threshold,
            query_filter=qdrant_filter,
        )

        results = []
        for hit in hits:
            payload = hit.payload or {}
            results.append(RetrievalResult(
                chunk_id=str(hit.id),
                pmid=payload.get("pmid", ""),
                text=payload.get("text", ""),
                section=payload.get("section", "abstract"),
                score=hit.score,
                source="dense",
                metadata={
                    k: v for k, v in payload.items()
                    if k not in ("pmid", "text", "section", "chunk_index")
                },
            ))

        logger.info("Dense search returned %d results for: %s", len(results), query[:80])
        return results
