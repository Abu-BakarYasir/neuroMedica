"""API schemas for the ECG analyzer.

The live endpoint now serves the **PTB-XL 12-lead diagnostic** model
(multi-label superclasses: NORM / MI / STTC / CD / HYP). The older single-lead
beat-classification schemas are retained below for any internal callers/tests
but are no longer returned by ``/api/ecg/analyze``.
"""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------- #
# PTB-XL 12-lead diagnostic schema (current)
# --------------------------------------------------------------------------- #
class DiagnosisOut(BaseModel):
    code: str = Field(..., description="Superclass code: NORM, MI, STTC, CD, HYP")
    name: str
    description: str
    clinical_significance: str
    probability: float = Field(..., ge=0.0, le=1.0)
    positive: bool = Field(..., description="probability >= decision threshold")


class EcgDiagnosticInterpretationOut(BaseModel):
    reliable: bool = Field(
        ..., description="False for image uploads, whose 12-lead digitization is "
        "approximate and uncalibrated; the probabilities should not be trusted."
    )
    reliability: str = Field(..., description="'high' | 'moderate' | 'low'")
    urgent: bool = Field(..., description="True when a time-critical finding (MI) is present")
    headline: str
    findings: List[str]
    recommendation: str
    caveats: List[str] = Field(default_factory=list)
    heart_rate_bpm: Optional[float] = None
    heart_rate_label: Optional[str] = None
    rhythm_regularity: Optional[str] = None


class EcgDiagnosisResponse(BaseModel):
    diagnoses: List[DiagnosisOut] = Field(
        ..., description="All superclasses with probabilities, severity-ordered"
    )
    top_code: str
    top_label: str
    positive_codes: List[str]
    threshold: float
    interpretation: EcgDiagnosticInterpretationOut
    source_format: str = Field(..., description="'wfdb' | 'csv' | 'image' | 'sample'")
    notes: Dict[str, object] = Field(default_factory=dict)
    disclaimer: str = (
        "This automated 12-lead analysis is for decision support only. "
        "Predictions must be confirmed by a qualified clinician with a "
        "standard 12-lead ECG. Do not use as the sole basis for diagnosis or "
        "treatment."
    )


# --------------------------------------------------------------------------- #
# Legacy single-lead beat schema (kept for internal use; not served)
# --------------------------------------------------------------------------- #
class BeatPredictionOut(BaseModel):
    index: int
    predicted_class: str = Field(..., description="One of N, S, V, F, Q")
    predicted_label: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    probabilities: Dict[str, float]
    waveform: List[float]


class ClassInfoOut(BaseModel):
    code: str
    name: str
    description: str
    clinical_significance: str


class AnalysisSummaryOut(BaseModel):
    total_beats: int
    dominant_class: str
    dominant_label: str
    class_counts: Dict[str, int]
    class_percentages: Dict[str, float]
    abnormal_beats: int
    abnormal_percentage: float
    mean_confidence: float
