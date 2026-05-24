"""Document chunker with overlap-aware splitting that respects section boundaries."""

import hashlib
import logging
import re
import uuid

from app.ingestion.models import DocumentChunk, GenericDocument, PubMedArticle

logger = logging.getLogger(__name__)

# Common PubMed structured abstract labels
SECTION_LABELS = {
    "BACKGROUND", "OBJECTIVE", "OBJECTIVES", "PURPOSE", "AIM", "AIMS",
    "METHODS", "MATERIALS AND METHODS", "DESIGN", "SETTING", "PARTICIPANTS",
    "RESULTS", "FINDINGS", "OUTCOMES", "CONCLUSIONS", "CONCLUSION",
    "INTERPRETATION", "SIGNIFICANCE", "INTRODUCTION", "DISCUSSION",
}


class DocumentChunker:
    """Splits PubMed articles into overlapping chunks for embedding."""

    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 64,
        min_chunk_size: int = 50,
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

    def chunk_article(self, article: PubMedArticle) -> list[DocumentChunk]:
        """Split an article into chunks, respecting section boundaries."""
        chunks: list[DocumentChunk] = []

        # Chunk the title as its own chunk (always short enough)
        if article.title:
            chunks.append(self._make_chunk(
                article, article.title, section="title", index=0
            ))

        # Split abstract into sections, then chunk each section
        if article.abstract:
            sections = self._split_into_sections(article.abstract)
            chunk_index = len(chunks)
            for section_name, section_text in sections:
                section_chunks = self._split_text(section_text)
                for text in section_chunks:
                    chunks.append(self._make_chunk(
                        article, text, section=section_name, index=chunk_index
                    ))
                    chunk_index += 1

        return chunks

    def chunk_articles(self, articles: list[PubMedArticle]) -> list[DocumentChunk]:
        """Chunk multiple articles."""
        all_chunks = []
        for article in articles:
            article_chunks = self.chunk_article(article)
            all_chunks.extend(article_chunks)

        logger.info(
            "Chunked %d articles into %d chunks", len(articles), len(all_chunks)
        )
        return all_chunks

    def chunk_document(self, doc: GenericDocument) -> list[DocumentChunk]:
        """Chunk a source-agnostic document (OpenFDA label, RxNorm concept,
        guideline). Each non-empty section becomes one or more chunks."""
        chunks: list[DocumentChunk] = []
        chunk_index = 0

        # Title chunk (helps lexical / dense retrieval find the doc by name).
        if doc.title:
            chunks.append(self._make_generic_chunk(
                doc, doc.title, section="title", index=chunk_index,
            ))
            chunk_index += 1

        for section_name, body in doc.sections:
            if not body or not body.strip():
                continue
            for piece in self._split_text(body):
                chunks.append(self._make_generic_chunk(
                    doc, piece, section=section_name, index=chunk_index,
                ))
                chunk_index += 1

        return chunks

    def chunk_documents(self, docs: list[GenericDocument]) -> list[DocumentChunk]:
        all_chunks: list[DocumentChunk] = []
        for d in docs:
            all_chunks.extend(self.chunk_document(d))
        logger.info(
            "Chunked %d generic docs into %d chunks", len(docs), len(all_chunks)
        )
        return all_chunks

    def _split_into_sections(
        self, text: str
    ) -> list[tuple[str, str]]:
        """Split structured abstract into labeled sections."""
        # Try to detect labeled sections (e.g., "METHODS: ...") anywhere in text
        pattern = r"(?:^|\n|\.\s+)(" + "|".join(
            re.escape(label) for label in SECTION_LABELS
        ) + r")\s*:\s*"
        parts = re.split(pattern, text, flags=re.IGNORECASE)

        if len(parts) <= 1:
            # No labeled sections found — treat as single "abstract" section
            return [("abstract", text.strip())]

        sections = []
        # parts[0] is text before first label (often empty)
        if parts[0].strip():
            sections.append(("abstract", parts[0].strip()))

        # Remaining parts alternate: label, text, label, text, ...
        for i in range(1, len(parts), 2):
            label = parts[i].lower()
            body = parts[i + 1].strip() if i + 1 < len(parts) else ""
            if body:
                sections.append((label, body))

        return sections

    def _split_text(self, text: str) -> list[str]:
        """Split text into chunks by word count with overlap."""
        words = text.split()
        if len(words) <= self.chunk_size:
            return [text] if len(words) >= self.min_chunk_size else [text] if text.strip() else []

        chunks = []
        start = 0
        while start < len(words):
            end = start + self.chunk_size
            chunk_words = words[start:end]
            chunk_text = " ".join(chunk_words)

            if len(chunk_words) >= self.min_chunk_size or start == 0:
                chunks.append(chunk_text)

            if end >= len(words):
                break
            start = end - self.chunk_overlap

        return chunks

    def _make_chunk(
        self,
        article: PubMedArticle,
        text: str,
        section: str,
        index: int,
    ) -> DocumentChunk:
        """Create a DocumentChunk with a deterministic ID."""
        # Qdrant requires point IDs to be unsigned integers or UUIDs.
        # Use UUID5 (deterministic) so the same content always gets the same ID.
        chunk_id = str(uuid.uuid5(
            uuid.NAMESPACE_URL,
            f"pubmed:{article.pmid}:{section}:{index}",
        ))

        metadata = {
            "title": article.title,
            "authors": article.authors[:5],  # Limit to first 5
            "journal": article.journal,
            "mesh_terms": article.mesh_terms,
            "keywords": article.keywords,
            "doi": article.doi,
        }
        if article.publication_date:
            metadata["publication_date"] = article.publication_date.isoformat()

        return DocumentChunk(
            chunk_id=chunk_id,
            pmid=article.pmid,
            source_type="pubmed",
            text=text,
            section=section,
            chunk_index=index,
            url=f"https://pubmed.ncbi.nlm.nih.gov/{article.pmid}/",
            metadata=metadata,
        )

    def _make_generic_chunk(
        self,
        doc: GenericDocument,
        text: str,
        section: str,
        index: int,
    ) -> DocumentChunk:
        """Create a DocumentChunk for a non-PubMed source."""
        chunk_id = str(uuid.uuid5(
            uuid.NAMESPACE_URL,
            f"{doc.source_type}:{doc.doc_id}:{section}:{index}",
        ))

        metadata = dict(doc.metadata)
        metadata.setdefault("title", doc.title)

        return DocumentChunk(
            chunk_id=chunk_id,
            pmid=doc.doc_id,
            source_type=doc.source_type,
            text=text,
            section=section,
            chunk_index=index,
            url=doc.url,
            metadata=metadata,
        )
