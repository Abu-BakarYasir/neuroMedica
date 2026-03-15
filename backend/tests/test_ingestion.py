"""Tests for the ingestion pipeline components."""

from datetime import datetime

from app.ingestion.models import PubMedArticle, DocumentChunk
from app.ingestion.chunker import DocumentChunker
from app.ingestion.pubmed_fetcher import PubMedFetcher


def _make_article(
    pmid: str = "12345678",
    title: str = "Test Article",
    abstract: str = "This is a test abstract with enough words to be meaningful.",
    **kwargs,
) -> PubMedArticle:
    return PubMedArticle(pmid=pmid, title=title, abstract=abstract, **kwargs)


class TestDocumentChunker:
    def test_chunk_short_article(self):
        """Short abstracts should produce title + 1 abstract chunk."""
        article = _make_article()
        chunker = DocumentChunker(chunk_size=512, chunk_overlap=64)
        chunks = chunker.chunk_article(article)

        assert len(chunks) >= 2  # title + abstract
        assert chunks[0].section == "title"
        assert chunks[0].text == "Test Article"
        assert chunks[1].section == "abstract"
        assert chunks[1].pmid == "12345678"

    def test_chunk_structured_abstract(self):
        """Structured abstracts should split on section labels."""
        article = _make_article(
            abstract=(
                "BACKGROUND: Some background text here with enough words to pass the minimum chunk size filter easily. "
                "METHODS: The methods used in this study involved several detailed procedures and analyses. "
                "RESULTS: The results found in this comprehensive evaluation showed significant improvements. "
                "CONCLUSIONS: Final thoughts on the implications and future directions of this research work."
            )
        )
        chunker = DocumentChunker(chunk_size=512, chunk_overlap=64, min_chunk_size=3)
        chunks = chunker.chunk_article(article)

        sections = [c.section for c in chunks]
        assert "title" in sections
        assert "background" in sections
        assert "methods" in sections

    def test_chunk_ids_are_deterministic(self):
        """Same article should produce same chunk IDs."""
        article = _make_article()
        chunker = DocumentChunker()
        chunks1 = chunker.chunk_article(article)
        chunks2 = chunker.chunk_article(article)

        assert [c.chunk_id for c in chunks1] == [c.chunk_id for c in chunks2]

    def test_chunk_metadata_includes_article_fields(self):
        """Chunk metadata should carry article-level info."""
        article = _make_article(
            authors=["Smith J", "Doe A"],
            journal="Nature Medicine",
            mesh_terms=["Diabetes", "Insulin"],
            doi="10.1234/test",
        )
        chunker = DocumentChunker()
        chunks = chunker.chunk_article(article)
        meta = chunks[0].metadata

        assert meta["journal"] == "Nature Medicine"
        assert meta["doi"] == "10.1234/test"
        assert "Diabetes" in meta["mesh_terms"]

    def test_long_text_splits_with_overlap(self):
        """Text longer than chunk_size should be split with overlap."""
        long_text = " ".join(f"word{i}" for i in range(200))
        article = _make_article(abstract=long_text)
        chunker = DocumentChunker(chunk_size=100, chunk_overlap=20)
        chunks = chunker.chunk_article(article)

        # Should have title + at least 2 abstract chunks
        abstract_chunks = [c for c in chunks if c.section == "abstract"]
        assert len(abstract_chunks) >= 2

    def test_empty_abstract_produces_title_only(self):
        """Article with no abstract should only produce title chunk."""
        article = _make_article(abstract="")
        chunker = DocumentChunker()
        chunks = chunker.chunk_article(article)

        assert len(chunks) == 1
        assert chunks[0].section == "title"


class TestPubMedFetcherParsing:
    """Test XML parsing logic without network calls."""

    def test_parse_xml_basic(self):
        xml = """<?xml version="1.0"?>
        <PubmedArticleSet>
          <PubmedArticle>
            <MedlineCitation>
              <PMID>99999999</PMID>
              <Article>
                <ArticleTitle>Test Title</ArticleTitle>
                <Abstract>
                  <AbstractText>Test abstract content.</AbstractText>
                </Abstract>
                <Journal><Title>Test Journal</Title></Journal>
                <AuthorList>
                  <Author><LastName>Smith</LastName><ForeName>John</ForeName></Author>
                </AuthorList>
              </Article>
            </MedlineCitation>
          </PubmedArticle>
        </PubmedArticleSet>"""

        fetcher = PubMedFetcher(email="test@test.com")
        articles = fetcher._parse_xml(xml)

        assert len(articles) == 1
        assert articles[0].pmid == "99999999"
        assert articles[0].title == "Test Title"
        assert articles[0].abstract == "Test abstract content."
        assert articles[0].authors == ["Smith John"]
        assert articles[0].journal == "Test Journal"

    def test_parse_structured_abstract(self):
        xml = """<?xml version="1.0"?>
        <PubmedArticleSet>
          <PubmedArticle>
            <MedlineCitation>
              <PMID>11111111</PMID>
              <Article>
                <ArticleTitle>Structured</ArticleTitle>
                <Abstract>
                  <AbstractText Label="BACKGROUND">Background info.</AbstractText>
                  <AbstractText Label="METHODS">Method info.</AbstractText>
                </Abstract>
                <Journal><Title>J</Title></Journal>
              </Article>
            </MedlineCitation>
          </PubmedArticle>
        </PubmedArticleSet>"""

        fetcher = PubMedFetcher(email="test@test.com")
        articles = fetcher._parse_xml(xml)

        assert "BACKGROUND: Background info." in articles[0].abstract
        assert "METHODS: Method info." in articles[0].abstract
