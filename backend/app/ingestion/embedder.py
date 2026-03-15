"""Generate embeddings using PubMedBERT via sentence-transformers."""

import logging
from typing import Optional

from app.ingestion.models import DocumentChunk, EmbeddedChunk

logger = logging.getLogger(__name__)

# Default model per ADR-002
DEFAULT_MODEL = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"


class PubMedBERTEmbedder:
    """Generates dense embeddings using PubMedBERT."""

    def __init__(self, model_name: Optional[str] = None, batch_size: int = 32):
        self.model_name = model_name or DEFAULT_MODEL
        self.batch_size = batch_size
        self._model = None

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
                text=chunk.text,
                section=chunk.section,
                chunk_index=chunk.chunk_index,
                embedding=embedding.tolist(),
                metadata=chunk.metadata,
            ))

        logger.info("Embedded %d chunks", len(embedded))
        return embedded
