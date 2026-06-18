"""API schemas for the Symptom Explorer (symptom -> differential diagnosis)."""

from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.chat import CitationItem


class SymptomExploreRequest(BaseModel):
    symptoms: str = Field(..., description="Presenting symptoms (free text or comma-separated)", min_length=1)


class Differential(BaseModel):
    condition: str
    icd10: Optional[str] = Field(None, description="AI-suggested ICD-10 code (verify)")
    snomed: Optional[str] = Field(None, description="AI-suggested SNOMED CT code (verify)")
    likelihood: str = Field("moderate", description="high | moderate | low")
    rationale: str = ""
    supporting_citations: List[int] = Field(
        default_factory=list, description="Citation indices supporting this condition"
    )
    red_flags: Optional[str] = None


class SymptomExploreResponse(BaseModel):
    symptoms: str
    differentials: List[Differential] = Field(default_factory=list)
    summary: str = ""
    recommended_workup: List[str] = Field(default_factory=list)
    structured: bool = Field(
        True, description="False when the model returned prose instead of JSON (summary holds it)"
    )
    citations: List[CitationItem] = Field(default_factory=list)
    confidence: str = "medium"
    disclaimer: str = ""
