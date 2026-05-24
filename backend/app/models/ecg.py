"""API schemas for the ECG analyzer."""

from typing import Dict, List

from pydantic import BaseModel, Field


class BeatPredictionOut(BaseModel):
    index: int
    predicted_class: str = Field(..., description="One of N, S, V, F, Q")
    predicted_label: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    probabilities: Dict[str, float] = Field(
        ..., description="Class -> probability for all five classes"
    )
    waveform: List[float] = Field(
        ..., description="187 normalized samples, suitable for plotting"
    )


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


class EcgAnalysisResponse(BaseModel):
    summary: AnalysisSummaryOut
    beats: List[BeatPredictionOut]
    classes: List[ClassInfoOut]
    source_format: str = Field(..., description="'wide' or 'long' or 'sample'")
    notes: Dict[str, object] = Field(default_factory=dict)
    disclaimer: str = (
        "This automated analysis is for decision support only. "
        "Predictions must be confirmed by a qualified clinician. "
        "Do not use as the sole basis for diagnosis or treatment."
    )
