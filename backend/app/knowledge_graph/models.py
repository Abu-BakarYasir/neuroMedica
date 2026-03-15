"""Domain models for the knowledge graph module."""

from pydantic import BaseModel, Field


class UMLSConcept(BaseModel):
    """A UMLS concept node."""
    cui: str = Field(..., description="Concept Unique Identifier")
    name: str
    semantic_type: str = ""
    source: str = "UMLS"


class ConceptRelation(BaseModel):
    """A relationship between two UMLS concepts."""
    source_cui: str
    target_cui: str
    relation_type: str = Field(..., description="e.g. 'treats', 'causes', 'is_a', 'part_of'")
    source_name: str = ""
    target_name: str = ""


class GraphSearchResult(BaseModel):
    """Result from a knowledge graph traversal."""
    query_concept: str
    concepts: list[UMLSConcept] = Field(default_factory=list)
    relations: list[ConceptRelation] = Field(default_factory=list)
    paths: list[list[str]] = Field(default_factory=list, description="Multi-hop paths")
