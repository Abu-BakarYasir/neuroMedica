"""Claude API generation with citation formatting and safety guardrails.

Per ADR-007: Claude's long context window handles large retrieval sets.
Strong instruction-following for citation formatting. System prompts
enforce "I don't know" for unsupported claims.
"""

import logging
from typing import Optional

import anthropic

from app.reranking.models import RerankResult
from app.generation.models import Citation, GenerationResult

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are NeuroMedica, a medical research assistant powered by evidence-based retrieval.

STRICT RULES:
1. ONLY use information from the provided source documents to answer questions.
2. ALWAYS cite sources using [1], [2], etc. matching the provided citation numbers.
3. If the sources do NOT contain sufficient information to answer the question, say:
   "Based on the available sources, I cannot provide a complete answer to this question. Please consult current medical literature or a qualified healthcare professional."
4. NEVER fabricate medical information, drug dosages, treatment protocols, or clinical guidelines.
5. NEVER provide personal medical advice or diagnoses.
6. When sources contain conflicting information, acknowledge the conflict and cite both sources.
7. Use precise medical terminology but explain complex terms.
8. End your response with a brief summary of key takeaways when appropriate.

RESPONSE FORMAT:
- Use clear, structured prose with inline citations [1], [2], etc.
- For treatment-related queries, organize by: mechanism, evidence, guidelines, considerations.
- For diagnostic queries, organize by: criteria, differential diagnosis, recommended workup.
"""

NO_CONTEXT_PROMPT = """You are NeuroMedica, a medical research assistant.

The retrieval system did not find sufficient evidence to answer the user's question.

Respond with:
1. An acknowledgment that you don't have enough evidence-based sources to answer.
2. General guidance on where the user might find reliable information (e.g., UpToDate, PubMed, clinical guidelines).
3. A recommendation to consult qualified healthcare professionals.

Do NOT guess, speculate, or fabricate medical information.
"""


class ClaudeGenerator:
    """Generates grounded answers using Claude API with citation formatting."""

    def __init__(
        self,
        api_key: str,
        model: str = "claude-sonnet-4-20250514",
        max_tokens: int = 2048,
    ):
        self.model = model
        self.max_tokens = max_tokens
        self._client = anthropic.Anthropic(api_key=api_key)

    def generate(
        self,
        query: str,
        context_chunks: list[RerankResult],
        confidence: str = "medium",
        conversation_history: Optional[list[dict]] = None,
    ) -> GenerationResult:
        """Generate a grounded answer with citations from retrieved context.

        Args:
            query: User's question.
            context_chunks: Reranked/evaluated chunks to use as context.
            confidence: CRAG confidence level.
            conversation_history: Prior messages for multi-turn context.

        Returns:
            GenerationResult with cited answer.
        """
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
        messages = []
        if conversation_history:
            messages.extend(conversation_history[-6:])  # Keep last 3 turns
        messages.append({"role": "user", "content": user_message})

        logger.info(
            "Generating answer (model=%s, context_chunks=%d, confidence=%s)",
            self.model, len(context_chunks), confidence,
        )

        # Call Claude API
        response = self._client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            system=system,
            messages=messages,
        )

        answer = response.content[0].text

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

        for i, chunk in enumerate(chunks):
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
        # Map PMIDs to citation numbers
        pmid_to_num = {c.pmid: c.index for c in citations}

        # Build source blocks
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
