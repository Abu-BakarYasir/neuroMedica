"""Tests for the chat API endpoint, covering both standard and RAG modes."""

from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _generation_result(**overrides):
    """Build a GenerationResult-like object for mocking."""
    from app.generation.models import Citation, GenerationResult
    defaults = dict(
        answer="Based on the evidence [1], metformin is effective for type 2 diabetes.",
        citations=[
            Citation(index=1, pmid="12345678", title="Metformin Study", journal="NEJM", doi="10.1234/test"),
            Citation(index=2, pmid="87654321", title="Diabetes Review", journal="Lancet", doi="10.5678/review"),
        ],
        query="Is metformin effective?",
        confidence="high",
        disclaimer="This information is for educational purposes only.",
    )
    defaults.update(overrides)
    return GenerationResult(**defaults)


def _get_test_client():
    """Build a TestClient with auth dependency overridden."""
    from app.main import app
    from app.core.security import get_current_user
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test-user-id"}
    return TestClient(app)


# ---------------------------------------------------------------------------
# Tests: Standard chat (Groq)
# ---------------------------------------------------------------------------


class TestChatEndpointStandard:
    """Tests for the standard (non-RAG) chat endpoint."""

    def test_standard_chat_returns_message(self):
        client = _get_test_client()
        with patch("app.api.chat.chat_service") as mock_svc:
            mock_svc.get_chat_response.return_value = ("Hello! I can help.", "conv-123")
            resp = client.post("/api/chat/message", json={
                "message": "Hello",
                "use_rag": False,
            })

        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "Hello! I can help."
        assert data["conversation_id"] == "conv-123"
        assert data.get("citations") is None
        assert data.get("confidence") is None

    def test_standard_chat_preserves_conversation_id(self):
        client = _get_test_client()
        with patch("app.api.chat.chat_service") as mock_svc:
            mock_svc.get_chat_response.return_value = ("Response", "conv-existing")
            resp = client.post("/api/chat/message", json={
                "message": "Follow up",
                "conversation_id": "conv-existing",
                "use_rag": False,
            })

        assert resp.status_code == 200
        assert resp.json()["conversation_id"] == "conv-existing"

    def test_standard_chat_with_history(self):
        client = _get_test_client()
        with patch("app.api.chat.chat_service") as mock_svc:
            mock_svc.get_chat_response.return_value = ("Follow-up answer", "conv-123")
            resp = client.post("/api/chat/message", json={
                "message": "Tell me more",
                "history": [
                    {"role": "user", "content": "What is diabetes?"},
                    {"role": "assistant", "content": "Diabetes is..."},
                ],
                "use_rag": False,
            })

        assert resp.status_code == 200
        call_args = mock_svc.get_chat_response.call_args
        assert len(call_args.kwargs.get("history", call_args[1].get("history", []))) == 2

    def test_empty_message_rejected(self):
        client = _get_test_client()
        resp = client.post("/api/chat/message", json={
            "message": "",
            "use_rag": False,
        })
        assert resp.status_code == 422  # Pydantic validation (min_length=1)

    def test_missing_message_rejected(self):
        client = _get_test_client()
        resp = client.post("/api/chat/message", json={
            "use_rag": False,
        })
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Tests: RAG chat mode
# ---------------------------------------------------------------------------


class TestChatEndpointRAG:
    """Tests for the RAG-enhanced chat endpoint."""

    def test_rag_mode_returns_citations(self):
        client = _get_test_client()
        gen_result = _generation_result()

        with patch("app.services.rag_service.RAGService") as MockRAG:
            mock_rag = MagicMock()
            mock_rag.query = AsyncMock(return_value=gen_result)
            MockRAG.return_value = mock_rag

            resp = client.post("/api/chat/message", json={
                "message": "Is metformin effective?",
                "use_rag": True,
            })

        assert resp.status_code == 200
        data = resp.json()
        assert "metformin" in data["message"]
        assert data["confidence"] == "high"
        assert data["disclaimer"] is not None
        assert len(data["citations"]) == 2
        assert data["citations"][0]["pmid"] == "12345678"
        assert data["citations"][0]["title"] == "Metformin Study"
        assert data["citations"][0]["journal"] == "NEJM"
        assert data["citations"][0]["doi"] == "10.1234/test"
        assert data["citations"][1]["index"] == 2

    def test_rag_mode_no_citations_returns_null(self):
        client = _get_test_client()
        gen_result = _generation_result(
            answer="I don't have enough sources.",
            citations=[],
            confidence="insufficient",
        )

        with patch("app.services.rag_service.RAGService") as MockRAG:
            mock_rag = MagicMock()
            mock_rag.query = AsyncMock(return_value=gen_result)
            MockRAG.return_value = mock_rag

            resp = client.post("/api/chat/message", json={
                "message": "rare disease question",
                "use_rag": True,
            })

        data = resp.json()
        assert data["confidence"] == "insufficient"
        assert data["citations"] is None  # empty list → None

    def test_rag_mode_passes_history(self):
        client = _get_test_client()
        gen_result = _generation_result()

        with patch("app.services.rag_service.RAGService") as MockRAG:
            mock_rag = MagicMock()
            mock_rag.query = AsyncMock(return_value=gen_result)
            MockRAG.return_value = mock_rag

            resp = client.post("/api/chat/message", json={
                "message": "follow up",
                "use_rag": True,
                "history": [
                    {"role": "user", "content": "first question"},
                    {"role": "assistant", "content": "first answer"},
                ],
            })

        assert resp.status_code == 200
        call_kwargs = mock_rag.query.call_args.kwargs
        assert len(call_kwargs["conversation_history"]) == 2

    def test_rag_error_returns_500(self):
        client = _get_test_client()

        with patch("app.services.rag_service.RAGService") as MockRAG:
            mock_rag = MagicMock()
            mock_rag.query = AsyncMock(side_effect=Exception("Qdrant connection refused"))
            MockRAG.return_value = mock_rag

            resp = client.post("/api/chat/message", json={
                "message": "test",
                "use_rag": True,
            })

        assert resp.status_code == 500
        assert "detail" in resp.json()


# ---------------------------------------------------------------------------
# Tests: ChatResponse model
# ---------------------------------------------------------------------------


class TestChatResponseModel:
    """Tests for the ChatResponse Pydantic model serialization."""

    def test_citation_item_serialization(self):
        from app.models.chat import CitationItem
        c = CitationItem(index=1, pmid="123", title="Test", journal="NEJM", doi="10.1/x")
        d = c.model_dump()
        assert d["pmid"] == "123"
        assert d["doi"] == "10.1/x"

    def test_chat_response_with_citations(self):
        from app.models.chat import ChatResponse, CitationItem
        resp = ChatResponse(
            message="answer",
            conversation_id="conv-1",
            citations=[CitationItem(index=1, pmid="111", title="T")],
            confidence="high",
            disclaimer="Disclaimer text",
        )
        d = resp.model_dump()
        assert len(d["citations"]) == 1
        assert d["confidence"] == "high"

    def test_chat_response_without_citations(self):
        from app.models.chat import ChatResponse
        resp = ChatResponse(message="answer", conversation_id="conv-1")
        d = resp.model_dump()
        assert d["citations"] is None
        assert d["confidence"] is None
