"""Claude API generation with citation formatting and safety guardrails.

Per ADR-007: Claude's long context window handles large retrieval sets.
Strong instruction-following for citation formatting. System prompts
enforce "I don't know" for unsupported claims.
"""

import logging
from typing import AsyncIterator, Optional

import anthropic

from app.reranking.models import RerankResult
from app.generation.models import Citation, GenerationResult

logger = logging.getLogger(__name__)

# ── Base rules shared across all intent-specific prompts ──────────────────

_BASE_RULES = """STRICT RULES:
1. ONLY use information from the provided source documents to answer questions.
2. ALWAYS cite sources using [1], [2], etc. matching the provided citation numbers.
3. If the sources do NOT contain sufficient information, clearly state what aspects you CAN answer from the sources and what aspects are NOT covered.
4. NEVER fabricate medical information, drug dosages, treatment protocols, or clinical guidelines.
5. NEVER provide personal medical advice or diagnoses.
6. When sources contain conflicting information, acknowledge the conflict and cite both sources.
7. Use precise medical terminology but explain complex terms in parentheses.
"""

# ── Intent-specific system prompts ────────────────────────────────────────

INTENT_PROMPTS = {
    "definitional": f"""You are NeuroMedica, a medical research assistant powered by evidence-based retrieval.

The user is asking a DEFINITIONAL question. Structure your response as:
1. **Definition**: What the term/condition/drug is, including its class or category
2. **Mechanism of action**: How it works (for drugs) or pathophysiology (for conditions)
3. **Clinical uses**: Primary indications and therapeutic applications
4. **Key considerations**: Important safety information, common side effects, or notable features
5. **Summary**: Brief takeaway

Extract background and definitional information from Introduction, Background, and Methods sections of the sources, even if the papers focus on specific research questions.

{_BASE_RULES}""",

    "mechanism": f"""You are NeuroMedica, a medical research assistant powered by evidence-based retrieval.

The user is asking about a MECHANISM OF ACTION or how something works biologically. Structure your response as:
1. **Primary mechanism**: The main biological pathway or process
2. **Molecular targets**: Receptors, enzymes, or signaling pathways involved
3. **Pharmacokinetics**: Absorption, distribution, metabolism, excretion (if applicable)
4. **Clinical significance**: Why this mechanism matters for treatment

{_BASE_RULES}""",

    "treatment": f"""You are NeuroMedica, a medical research assistant powered by evidence-based retrieval.

The user is asking about TREATMENT options. Structure your response as:
1. **First-line therapy**: Most widely recommended treatments with evidence level
2. **Alternative options**: Second-line or adjunctive therapies
3. **Key evidence**: Specific trials or guidelines supporting the recommendations
4. **Considerations**: Patient-specific factors, contraindications, monitoring

Prioritize information from clinical trials, systematic reviews, and practice guidelines.

{_BASE_RULES}""",

    "adverse_effects": f"""You are NeuroMedica, a medical research assistant powered by evidence-based retrieval.

The user is asking about SIDE EFFECTS, RISKS, or ADVERSE REACTIONS. Structure your response as:
1. **Common adverse effects**: Frequently reported side effects with incidence if available
2. **Serious adverse effects**: Rare but clinically significant risks
3. **Contraindications**: When the drug/intervention should NOT be used
4. **Drug interactions**: Notable interactions (if covered in sources)
5. **Monitoring**: Recommended monitoring or precautions

{_BASE_RULES}""",

    "diagnostic": f"""You are NeuroMedica, a medical research assistant powered by evidence-based retrieval.

The user is asking about DIAGNOSIS. Structure your response as:
1. **Diagnostic criteria**: Established criteria or definitions
2. **Clinical presentation**: Signs and symptoms
3. **Workup**: Recommended investigations (labs, imaging)
4. **Differential diagnosis**: Conditions to rule out

{_BASE_RULES}""",

    "comparison": f"""You are NeuroMedica, a medical research assistant powered by evidence-based retrieval.

The user is COMPARING treatments, drugs, or approaches. Structure your response as:
1. **Head-to-head comparison**: Key differences in efficacy, safety, and cost
2. **Evidence summary**: Relevant trials or meta-analyses comparing them
3. **When to prefer each**: Clinical scenarios favoring one over the other
4. **Shared considerations**: Common features, monitoring requirements

{_BASE_RULES}""",

    "dosage": f"""You are NeuroMedica, a medical research assistant powered by evidence-based retrieval.

The user is asking about DOSAGE or ADMINISTRATION. Structure your response as:
1. **Standard dosing**: Recommended doses for common indications
2. **Route of administration**: How the medication is given
3. **Adjustments**: Renal/hepatic dosing, pediatric/geriatric considerations
4. **Important notes**: Maximum doses, timing, food interactions

IMPORTANT: Only provide dosing information explicitly stated in the source documents. Never estimate or extrapolate doses.

{_BASE_RULES}""",

    "general": f"""You are NeuroMedica, a medical research assistant powered by evidence-based retrieval.

{_BASE_RULES}

RESPONSE FORMAT:
- Use clear, structured prose with inline citations [1], [2], etc.
- Organize information logically based on the nature of the question.
- End your response with a brief summary of key takeaways when appropriate.
""",
}

NO_CONTEXT_PROMPT = """You are NeuroMedica, a medical research assistant.

The retrieval system did not find sufficient evidence to answer the user's question.

Respond with:
1. An acknowledgment that you don't have enough evidence-based sources to answer.
2. General guidance on where the user might find reliable information (e.g., UpToDate, PubMed, clinical guidelines, DailyMed for drug information).
3. A recommendation to consult qualified healthcare professionals.

Do NOT guess, speculate, or fabricate medical information.
"""

# ── Confidence-level instructions prepended to user message ───────────────

_CONFIDENCE_INSTRUCTIONS = {
    "high": (
        "The sources below are highly relevant to the question. "
        "Synthesize them into a comprehensive, well-cited answer."
    ),
    "medium": (
        "The sources below are partially relevant — some may be tangentially related. "
        "Focus on extracting DIRECTLY relevant information (especially from Introduction "
        "and Background sections). If the sources only partially address the question, "
        "clearly state what you CAN answer from the evidence and what aspects are not covered."
    ),
    "insufficient": (
        "WARNING: The retrieval system found no highly relevant sources. "
        "DO NOT attempt to cobble together an answer from tangential sources."
    ),
}


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
        self._async_client = anthropic.AsyncAnthropic(api_key=api_key)

    def generate(
        self,
        query: str,
        context_chunks: list[RerankResult],
        confidence: str = "medium",
        conversation_history: Optional[list[dict]] = None,
        query_intent: str = "general",
    ) -> GenerationResult:
        """Generate a grounded answer with citations from retrieved context.

        Args:
            query: User's question.
            context_chunks: Reranked/evaluated chunks to use as context.
            confidence: CRAG confidence level (high/medium/insufficient).
            conversation_history: Prior messages for multi-turn context.
            query_intent: Classified query intent for prompt selection.

        Returns:
            GenerationResult with cited answer.
        """
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
        messages = []
        if conversation_history:
            messages.extend(conversation_history[-6:])  # Keep last 3 turns
        messages.append({"role": "user", "content": user_message})

        logger.info(
            "Generating answer (model=%s, context_chunks=%d, confidence=%s, intent=%s)",
            self.model, len(context_chunks), confidence, query_intent,
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

    async def stream_generate(
        self,
        query: str,
        context_chunks: list[RerankResult],
        confidence: str = "medium",
        conversation_history: Optional[list[dict]] = None,
        query_intent: str = "general",
    ) -> AsyncIterator[str]:
        """Stream the answer text as it's generated. Yields raw text deltas."""
        if context_chunks:
            system = INTENT_PROMPTS.get(query_intent, INTENT_PROMPTS["general"])
            user_message = self._build_context_message(
                query, context_chunks, [], confidence,
            )
            # Re-build with proper citations now that we know we have chunks
            citations = self._build_citations(context_chunks)
            user_message = self._build_context_message(
                query, context_chunks, citations, confidence,
            )
        else:
            user_message = f"User question: {query}"
            system = NO_CONTEXT_PROMPT

        messages = []
        if conversation_history:
            messages.extend(conversation_history[-6:])
        messages.append({"role": "user", "content": user_message})

        logger.info(
            "Streaming answer (model=%s, context_chunks=%d, confidence=%s, intent=%s)",
            self.model, len(context_chunks), confidence, query_intent,
        )

        async with self._async_client.messages.stream(
            model=self.model,
            max_tokens=self.max_tokens,
            system=system,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text

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
        confidence: str = "medium",
    ) -> str:
        """Build the user message with numbered source documents and confidence context."""
        # Map PMIDs to citation numbers
        pmid_to_num = {c.pmid: c.index for c in citations}

        # Build source blocks with relevance labels
        source_blocks = []
        for chunk in chunks:
            cite_num = pmid_to_num.get(chunk.pmid, "?")
            # Annotate each source with relevance level so the LLM can weigh them
            if chunk.rerank_score > 0.7:
                relevance_tag = "HIGHLY RELEVANT"
            elif chunk.rerank_score > 0.3:
                relevance_tag = "MODERATELY RELEVANT"
            else:
                relevance_tag = "TANGENTIALLY RELEVANT"

            source_blocks.append(
                f"[Source {cite_num}] (PMID: {chunk.pmid}, "
                f"Section: {chunk.section}, Relevance: {relevance_tag})\n"
                f"{chunk.text}"
            )

        sources_text = "\n\n---\n\n".join(source_blocks)

        # Prepend confidence-level instructions
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
