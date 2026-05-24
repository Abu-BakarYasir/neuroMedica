"""Groq-based generator as fallback when Anthropic API key is not available.

Uses Llama 3 70B via Groq for RAG generation with the same citation
formatting and safety guardrails as the Claude generator.
"""

import logging
from typing import Optional

from groq import Groq

from app.reranking.models import RerankResult
from app.generation.models import Citation, GenerationResult
from app.generation.claude_generator import (
    INTENT_PROMPTS,
    NO_CONTEXT_PROMPT,
    _CONFIDENCE_INSTRUCTIONS,
    _SOURCE_TAGS,
    _default_url_for,
)

logger = logging.getLogger(__name__)


class GroqGenerator:
    """Generates grounded answers using Groq (Llama 3) with citation formatting."""

    def __init__(
        self,
        api_key: str,
        model: str = "llama3-70b-8192",
        max_tokens: int = 2048,
    ):
        self.model = model
        self.max_tokens = max_tokens
        self._client = Groq(api_key=api_key)

    def generate(
        self,
        query: str,
        context_chunks: list[RerankResult],
        confidence: str = "medium",
        conversation_history: Optional[list[dict]] = None,
        query_intent: str = "general",
    ) -> GenerationResult:
        """Generate a grounded answer with citations from retrieved context."""
        # Build citations
        citations = self._build_citations(context_chunks)

        # Select system prompt based on intent
        if context_chunks:
            system = INTENT_PROMPTS.get(query_intent, INTENT_PROMPTS["general"])
            user_message = self._build_context_message(
                query, context_chunks, citations, confidence
            )
        else:
            user_message = f"User question: {query}"
            system = NO_CONTEXT_PROMPT

        # Build message list
        messages = [{"role": "system", "content": system}]
        if conversation_history:
            messages.extend(conversation_history[-6:])
        messages.append({"role": "user", "content": user_message})

        logger.info(
            "Generating answer via Groq (model=%s, context_chunks=%d, confidence=%s, intent=%s)",
            self.model, len(context_chunks), confidence, query_intent,
        )

        response = self._client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=self.max_tokens,
            temperature=0.3,
        )

        answer = response.choices[0].message.content

        return GenerationResult(
            answer=answer,
            citations=citations,
            query=query,
            confidence=confidence,
        )

    def _build_citations(self, chunks: list[RerankResult]) -> list[Citation]:
        """Build citation objects from context chunks (source-aware)."""
        citations = []
        seen: set[tuple[str, str]] = set()

        for chunk in chunks:
            key = (chunk.source_type, chunk.pmid)
            if key in seen:
                continue
            seen.add(key)

            citations.append(Citation(
                index=len(citations) + 1,
                pmid=chunk.pmid,
                source_type=chunk.source_type,
                title=chunk.metadata.get("title", ""),
                text_excerpt=chunk.text[:200],
                journal=chunk.metadata.get("journal", "") or chunk.metadata.get("manufacturer", ""),
                doi=chunk.metadata.get("doi"),
                url=chunk.url or _default_url_for(chunk.source_type, chunk.pmid),
            ))

        return citations

    def _build_context_message(
        self,
        query: str,
        chunks: list[RerankResult],
        citations: list[Citation],
        confidence: str = "medium",
    ) -> str:
        """Build the user message with numbered source documents and confidence context."""
        cite_map = {(c.source_type, c.pmid): c.index for c in citations}

        source_blocks = []
        for chunk in chunks:
            cite_num = cite_map.get((chunk.source_type, chunk.pmid), "?")
            if chunk.rerank_score > 0.7:
                relevance_tag = "HIGHLY RELEVANT"
            elif chunk.rerank_score > 0.3:
                relevance_tag = "MODERATELY RELEVANT"
            else:
                relevance_tag = "TANGENTIALLY RELEVANT"

            source_label = _SOURCE_TAGS.get(chunk.source_type, "Source")
            source_blocks.append(
                f"[Source {cite_num}] ({source_label}: {chunk.pmid}, "
                f"Section: {chunk.section}, Relevance: {relevance_tag})\n"
                f"{chunk.text}"
            )

        sources_text = "\n\n---\n\n".join(source_blocks)

        confidence_note = _CONFIDENCE_INSTRUCTIONS.get(
            confidence, _CONFIDENCE_INSTRUCTIONS["medium"]
        )

        return (
            f"RETRIEVAL CONFIDENCE: {confidence.upper()}\n"
            f"{confidence_note}\n\n"
            f"SOURCES:\n{sources_text}\n\n"
            f"---\n\n"
            f"QUESTION: {query}"
        )
