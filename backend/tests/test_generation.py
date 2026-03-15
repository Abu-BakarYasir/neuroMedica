"""Tests for the Claude generation pipeline."""

from unittest.mock import MagicMock, patch

from app.reranking.models import RerankResult
from app.generation.models import Citation, GenerationResult
from app.generation.claude_generator import ClaudeGenerator


def _make_context(chunk_id: str, pmid: str, text: str) -> RerankResult:
    return RerankResult(
        chunk_id=chunk_id,
        pmid=pmid,
        text=text,
        rerank_score=0.9,
        original_score=0.5,
        original_source="fused",
        rank=1,
        metadata={"title": f"Title for {pmid}", "journal": "Test Journal", "doi": f"10.1234/{pmid}"},
    )


class TestCitationBuilding:
    def test_citations_from_chunks(self):
        generator = ClaudeGenerator(api_key="test-key")
        chunks = [
            _make_context("c1", "111", "First document text"),
            _make_context("c2", "222", "Second document text"),
            _make_context("c3", "111", "Another chunk from same article"),
        ]
        citations = generator._build_citations(chunks)

        # Should deduplicate by PMID
        assert len(citations) == 2
        assert citations[0].pmid == "111"
        assert citations[0].index == 1
        assert citations[1].pmid == "222"
        assert citations[1].index == 2

    def test_citation_metadata(self):
        generator = ClaudeGenerator(api_key="test-key")
        chunks = [_make_context("c1", "999", "test text")]
        citations = generator._build_citations(chunks)

        assert citations[0].title == "Title for 999"
        assert citations[0].journal == "Test Journal"
        assert citations[0].doi == "10.1234/999"


class TestContextMessageBuilding:
    def test_context_message_contains_sources(self):
        generator = ClaudeGenerator(api_key="test-key")
        chunks = [
            _make_context("c1", "111", "Metformin reduces blood glucose levels."),
            _make_context("c2", "222", "Insulin resistance in type 2 diabetes."),
        ]
        citations = generator._build_citations(chunks)
        msg = generator._build_context_message("diabetes treatment", chunks, citations)

        assert "SOURCES:" in msg
        assert "QUESTION: diabetes treatment" in msg
        assert "Metformin reduces blood glucose levels." in msg
        assert "PMID: 111" in msg
        assert "[Source 1]" in msg
        assert "[Source 2]" in msg

    def test_empty_context_not_used(self):
        """When no context, should use NO_CONTEXT_PROMPT path."""
        # This is tested through the generate method behavior
        generator = ClaudeGenerator(api_key="test-key")
        citations = generator._build_citations([])
        assert citations == []


class TestClaudeGenerator:
    def test_generate_with_context(self):
        """Test generation with mocked Claude API."""
        generator = ClaudeGenerator(api_key="test-key")

        # Mock the Anthropic client
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="Based on the evidence [1], metformin is effective.")]
        generator._client = MagicMock()
        generator._client.messages.create.return_value = mock_response

        chunks = [_make_context("c1", "111", "Metformin study results")]
        result = generator.generate("Is metformin effective?", chunks, confidence="high")

        assert "metformin" in result.answer
        assert result.confidence == "high"
        assert len(result.citations) == 1
        assert result.query == "Is metformin effective?"
        assert result.disclaimer  # Should always have a disclaimer

    def test_generate_without_context(self):
        """Test generation when no context available."""
        generator = ClaudeGenerator(api_key="test-key")

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="I don't have enough sources to answer.")]
        generator._client = MagicMock()
        generator._client.messages.create.return_value = mock_response

        result = generator.generate("rare disease question", [], confidence="insufficient")

        assert result.citations == []
        assert result.confidence == "insufficient"

    def test_generate_passes_history(self):
        """Conversation history should be passed to Claude."""
        generator = ClaudeGenerator(api_key="test-key")

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="Follow-up answer.")]
        generator._client = MagicMock()
        generator._client.messages.create.return_value = mock_response

        history = [
            {"role": "user", "content": "What is diabetes?"},
            {"role": "assistant", "content": "Diabetes is..."},
        ]
        chunks = [_make_context("c1", "111", "Diabetes context")]
        generator.generate("Tell me more", chunks, conversation_history=history)

        call_args = generator._client.messages.create.call_args
        messages = call_args.kwargs["messages"]
        # History + current message
        assert len(messages) == 3
        assert messages[0]["role"] == "user"
        assert messages[0]["content"] == "What is diabetes?"
