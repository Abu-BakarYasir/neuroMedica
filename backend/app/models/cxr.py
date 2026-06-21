"""API schemas for the chest X-ray analyzer."""

from typing import Dict, List

from pydantic import BaseModel, Field


class PathologyPredictionOut(BaseModel):
    code: str = Field(..., description="Stable machine key (NIH training label)")
    name: str = Field(..., description="Human-readable pathology name")
    probability: float = Field(..., ge=0.0, le=1.0)
    detected: bool = Field(..., description="probability >= positive threshold")
    description: str
    clinical_significance: str


class CxrAnalysisResponse(BaseModel):
    abnormal_probability: float = Field(
        ..., ge=0.0, le=1.0, description="Binary Normal/Abnormal screen"
    )
    predicted_abnormal: bool
    detected_count: int = Field(..., description="Number of pathologies above threshold")
    top_finding: str = Field(..., description="Highest-probability pathology name")
    findings: List[PathologyPredictionOut] = Field(
        ..., description="All 14 pathologies, ranked by probability (high→low)"
    )
    notes: Dict[str, object] = Field(default_factory=dict)
    disclaimer: str = (
        "This automated analysis is for decision support only. "
        "Predictions must be confirmed by a qualified radiologist. "
        "Do not use as the sole basis for diagnosis or treatment."
    )


class GradCamResponse(BaseModel):
    """Grad-CAM explainability overlay for the top predicted pathology."""

    overlay_data_url: str = Field(
        ..., description="PNG data URL of the heatmap composited over the radiograph"
    )
    target_code: str = Field(..., description="Stable key of the pathology the CAM targets")
    target_name: str = Field(..., description="Human-readable name of that pathology")
    target_probability: float = Field(..., ge=0.0, le=1.0)
    disclaimer: str = (
        "Grad-CAM highlights regions that most influenced the model's top "
        "prediction. It is an explainability aid, not a diagnostic localization, "
        "and must be interpreted by a qualified radiologist."
    )
