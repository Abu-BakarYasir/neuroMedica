"""Generate embeddings using PubMedBERT via sentence-transformers."""

import logging
from collections import OrderedDict
from typing import Optional

from app.ingestion.models import DocumentChunk, EmbeddedChunk

logger = logging.getLogger(__name__)

# Default: sentence-transformers repo (PubMed-tuned). Raw microsoft/BiomedNLP-* IDs often
# mis-resolve on Hugging Face for SentenceTransformer; override via settings if you re-ingest.
DEFAULT_MODEL = "pritamdeka/S-PubMedBert-MS-MARCO"


class PubMedBERTEmbedder:
    """Generates dense embeddings using PubMedBERT."""

    def __init__(self, model_name: Optional[str] = None, batch_size: int = 32):
        self.model_name = model_name or DEFAULT_MODEL
        self.batch_size = batch_size
        self._model = None
        # Small LRU cache of query -> normalized vector. Repeated identical
        # queries (common during demos and repeated symptom lookups) skip the
        # transformer forward pass entirely.
        self._query_cache: "OrderedDict[str, list[float]]" = OrderedDict()
        self._query_cache_max = 256

    def _load_model(self):
        """Lazy-load the sentence-transformers model."""
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading embedding model: %s", self.model_name)
            self._model = SentenceTransformer(self.model_name)
            logger.info(
                "Model loaded. Embedding dimension: %d",
                self._model.get_sentence_embedding_dimension(),
            )

    def encode_query(self, query: str) -> list[float]:
        """Encode a single query string to a normalized vector, with a small
        LRU cache. Used by dense retrieval on the hot path."""
        cached = self._query_cache.get(query)
        if cached is not None:
            self._query_cache.move_to_end(query)
            return cached

        self._load_model()
        vector = self._model.encode(query, normalize_embeddings=True).tolist()

        self._query_cache[query] = vector
        if len(self._query_cache) > self._query_cache_max:
            self._query_cache.popitem(last=False)
        return vector

    @property
    def dimension(self) -> int:
        """Return the embedding dimension."""
        self._load_model()
        return self._model.get_sentence_embedding_dimension()

    def embed_chunks(self, chunks: list[DocumentChunk]) -> list[EmbeddedChunk]:
        """Generate embeddings for a list of document chunks."""
        if not chunks:
            return []

        self._load_model()

        texts = [chunk.text for chunk in chunks]
        logger.info("Embedding %d chunks (batch_size=%d)", len(texts), self.batch_size)

        embeddings = self._model.encode(
            texts,
            batch_size=self.batch_size,
            show_progress_bar=True,
            normalize_embeddings=True,
        )

        embedded = []
        for chunk, embedding in zip(chunks, embeddings):
            embedded.append(EmbeddedChunk(
                chunk_id=chunk.chunk_id,
                pmid=chunk.pmid,
                source_type=chunk.source_type,
                text=chunk.text,
                section=chunk.section,
                chunk_index=chunk.chunk_index,
                url=chunk.url,
                embedding=embedding.tolist(),
                metadata=chunk.metadata,
            ))

        logger.info("Embedded %d chunks", len(embedded))
        return embedded
