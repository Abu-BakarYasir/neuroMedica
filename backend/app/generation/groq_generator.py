"""Groq-based generator as fallback when Anthropic API key is not available.

Uses Llama 3 70B via Groq for RAG generation with the same citation
formatting and safety guardrails as the Claude generator.
"""

import logging
from typing import Optional

from groq import Groq

from app.reranking.models import RerankResult
from app.generation.models import Citation, GenerationResult
from app.generation.claude_generator import SYSTEM_PROMPT, NO_CONTEXT_PROMPT

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
    ) -> GenerationResult:
        """Generate a grounded answer with citations from retrieved context."""
        # Build citations
        citations = self._build_citations(context_chunks)

        # Build the user message with context
        if context_chunks:
            user_message = self._build_context_message(query, context_chunks, citations)
            system = SYSTEM_PROMPT
        else:
            user_message = f"User question: {query}"
            system = NO_CONTEXT_PROMPT

        # Build message list
        messages = [{"role": "system", "content": system}]
        if conversation_history:
            messages.extend(conversation_history[-6:])
        messages.append({"role": "user", "content": user_message})

        logger.info(
            "Generating answer via Groq (model=%s, context_chunks=%d, confidence=%s)",
            self.model, len(context_chunks), confidence,
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
        """Build citation objects from context chunks."""
        citations = []
        seen_pmids = set()

        for chunk in chunks:
            pmid = chunk.pmid
            if pmid in seen_pmids:
                continue
            seen_pmids.add(pmid)

            citations.append(Citation(
                index=len(citations) + 1,
                pmid=pmid,
                title=chunk.metadata.get("title", ""),
                text_excerpt=chunk.text[:200],
                journal=chunk.metadata.get("journal", ""),
                doi=chunk.metadata.get("doi"),
            ))

        return citations

    def _build_context_message(
        self,
        query: str,
        chunks: list[RerankResult],
        citations: list[Citation],
    ) -> str:
        """Build the user message with numbered source documents."""
        pmid_to_num = {c.pmid: c.index for c in citations}

        source_blocks = []
        for chunk in chunks:
            cite_num = pmid_to_num.get(chunk.pmid, "?")
            source_blocks.append(
                f"[Source {cite_num}] (PMID: {chunk.pmid}, Section: {chunk.section})\n"
                f"{chunk.text}"
            )

        sources_text = "\n\n---\n\n".join(source_blocks)

        return (
            f"Based on the following medical literature sources, answer the question below.\n\n"
            f"SOURCES:\n{sources_text}\n\n"
            f"---\n\n"
            f"QUESTION: {query}"
        )
