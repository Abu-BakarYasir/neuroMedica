"""Neo4j client for UMLS/SNOMED-CT knowledge graph operations.

Per ADR-004: Medical ontologies are inherently graph-structured. Neo4j enables
multi-hop traversal (drug -> mechanism -> condition -> symptom) that vector
search cannot replicate.
"""

import logging
from typing import Optional

from app.knowledge_graph.models import (
    UMLSConcept,
    ConceptRelation,
    GraphSearchResult,
)

logger = logging.getLogger(__name__)


class Neo4jClient:
    """Manages Neo4j connections and UMLS/SNOMED-CT queries."""

    def __init__(
        self,
        uri: str = "bolt://localhost:7687",
        user: str = "neo4j",
        password: str = "",
    ):
        self._uri = uri
        self._user = user
        self._password = password
        self._driver = None

    def _connect(self):
        """Lazy-connect to Neo4j."""
        if self._driver is None:
            from neo4j import GraphDatabase
            self._driver = GraphDatabase.driver(
                self._uri, auth=(self._user, self._password)
            )
            logger.info("Connected to Neo4j at %s", self._uri)

    def close(self):
        if self._driver:
            self._driver.close()
            self._driver = None

    def search_concepts(
        self, term: str, limit: int = 10
    ) -> list[UMLSConcept]:
        """Search for UMLS concepts by name (case-insensitive)."""
        self._connect()
        query = """
        MATCH (c:Concept)
        WHERE toLower(c.name) CONTAINS toLower($term)
        RETURN c.cui AS cui, c.name AS name, c.semantic_type AS semantic_type
        LIMIT $limit
        """
        with self._driver.session() as session:
            result = session.run(query, term=term, limit=limit)
            return [
                UMLSConcept(
                    cui=record["cui"],
                    name=record["name"],
                    semantic_type=record.get("semantic_type", ""),
                )
                for record in result
            ]

    def get_related_concepts(
        self, cui: str, relation_types: Optional[list[str]] = None, max_hops: int = 2
    ) -> GraphSearchResult:
        """Traverse the graph from a concept CUI to find related concepts."""
        self._connect()

        # Build relationship filter
        rel_filter = ""
        if relation_types:
            types = "|".join(relation_types)
            rel_filter = f"[r:{types}]"
        else:
            rel_filter = "[r]"

        query = f"""
        MATCH (source:Concept {{cui: $cui}})
        MATCH path = (source)-{rel_filter}->{{1,{max_hops}}}(target:Concept)
        WITH source, target, relationships(path) AS rels, nodes(path) AS ns
        RETURN
            target.cui AS target_cui,
            target.name AS target_name,
            target.semantic_type AS semantic_type,
            [r IN rels | type(r)] AS rel_types,
            [n IN ns | n.name] AS path_names
        LIMIT 50
        """
        concepts = []
        relations = []
        paths = []
        seen_cuis = set()

        with self._driver.session() as session:
            result = session.run(query, cui=cui)
            for record in result:
                target_cui = record["target_cui"]
                if target_cui not in seen_cuis:
                    seen_cuis.add(target_cui)
                    concepts.append(UMLSConcept(
                        cui=target_cui,
                        name=record["target_name"],
                        semantic_type=record.get("semantic_type", ""),
                    ))

                for rel_type in record["rel_types"]:
                    relations.append(ConceptRelation(
                        source_cui=cui,
                        target_cui=target_cui,
                        relation_type=rel_type,
                        target_name=record["target_name"],
                    ))

                if record["path_names"]:
                    paths.append(record["path_names"])

        return GraphSearchResult(
            query_concept=cui,
            concepts=concepts,
            relations=relations,
            paths=paths,
        )

    def find_path_between(
        self, cui_a: str, cui_b: str, max_hops: int = 4
    ) -> list[list[str]]:
        """Find paths between two concepts."""
        self._connect()
        query = f"""
        MATCH (a:Concept {{cui: $cui_a}}), (b:Concept {{cui: $cui_b}})
        MATCH path = shortestPath((a)-[*..{max_hops}]-(b))
        RETURN [n IN nodes(path) | n.name] AS path_names
        LIMIT 5
        """
        with self._driver.session() as session:
            result = session.run(query, cui_a=cui_a, cui_b=cui_b)
            return [record["path_names"] for record in result]

    def load_concepts(self, concepts: list[dict]) -> int:
        """Bulk load UMLS concepts into Neo4j."""
        self._connect()
        query = """
        UNWIND $concepts AS c
        MERGE (n:Concept {cui: c.cui})
        SET n.name = c.name, n.semantic_type = c.semantic_type
        """
        with self._driver.session() as session:
            session.run(query, concepts=concepts)
        logger.info("Loaded %d concepts into Neo4j", len(concepts))
        return len(concepts)

    def load_relations(self, relations: list[dict]) -> int:
        """Bulk load UMLS relations into Neo4j."""
        self._connect()
        # Group by relation type and create edges
        query = """
        UNWIND $relations AS r
        MATCH (s:Concept {cui: r.source_cui})
        MATCH (t:Concept {cui: r.target_cui})
        CALL apoc.merge.relationship(s, r.relation_type, {}, {}, t) YIELD rel
        RETURN count(rel)
        """
        try:
            with self._driver.session() as session:
                result = session.run(query, relations=relations)
                count = result.single()[0]
            logger.info("Loaded %d relations into Neo4j", count)
            return count
        except Exception:
            # Fallback without APOC — create generic RELATED_TO edges
            fallback_query = """
            UNWIND $relations AS r
            MATCH (s:Concept {cui: r.source_cui})
            MATCH (t:Concept {cui: r.target_cui})
            MERGE (s)-[:RELATED_TO {type: r.relation_type}]->(t)
            """
            with self._driver.session() as session:
                session.run(fallback_query, relations=relations)
            logger.info("Loaded %d relations into Neo4j (fallback mode)", len(relations))
            return len(relations)
