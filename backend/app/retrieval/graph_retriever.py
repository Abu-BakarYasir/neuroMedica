"""Graph retriever using Neo4j UMLS/SNOMED-CT knowledge graph.

Augments dense+sparse retrieval with ontological relationships
(is-a, part-of, treats) that vector search cannot capture.
"""

import logging
from typing import Optional

from app.knowledge_graph.neo4j_client import Neo4jClient
from app.retrieval.models import RetrievalResult

logger = logging.getLogger(__name__)


class GraphRetriever:
    """Retrieves related concepts from the UMLS knowledge graph."""

    def __init__(self, neo4j_client: Neo4jClient):
        self._client = neo4j_client

    def search(
        self,
        query: str,
        top_k: int = 10,
        max_hops: int = 2,
    ) -> list[RetrievalResult]:
        """Search the knowledge graph for concepts related to the query.

        1. Find concepts matching query terms
        2. Traverse graph to find related concepts
        3. Return as RetrievalResults for RRF fusion
        """
        # Step 1: Find matching concepts
        concepts = self._client.search_concepts(query, limit=5)
        if not concepts:
            logger.info("No graph concepts found for: %s", query[:80])
            return []

        # Step 2: Expand through graph relationships
        results = []
        seen = set()
        for concept in concepts:
            graph_result = self._client.get_related_concepts(
                cui=concept.cui, max_hops=max_hops
            )

            # Convert graph paths to pseudo-documents for fusion
            for related in graph_result.concepts:
                if related.cui in seen:
                    continue
                seen.add(related.cui)

                # Find the relationship connecting them
                rel_types = [
                    r.relation_type
                    for r in graph_result.relations
                    if r.target_cui == related.cui
                ]

                # Build a text representation of the graph relationship
                rel_text = ", ".join(rel_types) if rel_types else "related_to"
                text = (
                    f"{concept.name} ({concept.cui}) --[{rel_text}]--> "
                    f"{related.name} ({related.cui}). "
                    f"Semantic type: {related.semantic_type}"
                )

                results.append(RetrievalResult(
                    chunk_id=f"graph_{concept.cui}_{related.cui}",
                    pmid=f"UMLS:{related.cui}",
                    text=text,
                    section="knowledge_graph",
                    score=1.0 / (len(results) + 1),  # Rank decay
                    source="graph",
                    metadata={
                        "source_concept": concept.name,
                        "source_cui": concept.cui,
                        "target_cui": related.cui,
                        "relation_types": rel_types,
                        "semantic_type": related.semantic_type,
                    },
                ))

                if len(results) >= top_k:
                    break
            if len(results) >= top_k:
                break

        logger.info("Graph search returned %d results for: %s", len(results), query[:80])
        return results
