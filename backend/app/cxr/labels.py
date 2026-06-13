"""NIH Chest X-ray14 pathology labels — order MUST match the model's
multi-label output head (trained on the NIH ChestX-ray14 label order)."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Pathology:
    code: str  # stable machine key (training label, underscores preserved)
    name: str  # human-readable display name
    description: str
    clinical_significance: str


# Index order MUST match the training order used for the multi-label head.
# Mirrors PATHOLOGY_LABELS in the training dataset definition.
PATHOLOGIES: tuple[Pathology, ...] = (
    Pathology(
        code="Atelectasis",
        name="Atelectasis",
        description="Partial or complete collapse of a lung or lobe.",
        clinical_significance=(
            "Reduced lung volume from airway obstruction, compression, or "
            "hypoventilation. Common post-operatively; correlate with symptoms."
        ),
    ),
    Pathology(
        code="Cardiomegaly",
        name="Cardiomegaly",
        description="Enlarged cardiac silhouette (cardiothoracic ratio > 0.5).",
        clinical_significance=(
            "May reflect heart failure, cardiomyopathy, or pericardial effusion. "
            "Confirm with echocardiography."
        ),
    ),
    Pathology(
        code="Effusion",
        name="Pleural Effusion",
        description="Fluid accumulation in the pleural space.",
        clinical_significance=(
            "Blunted costophrenic angles. Causes range from heart failure to "
            "infection or malignancy; consider thoracentesis if large."
        ),
    ),
    Pathology(
        code="Infiltration",
        name="Infiltration",
        description="Ill-defined opacity from interstitial or alveolar filling.",
        clinical_significance=(
            "Non-specific finding seen in infection, edema, or inflammation. "
            "Interpret with clinical context."
        ),
    ),
    Pathology(
        code="Mass",
        name="Mass",
        description="A discrete opacity larger than 3 cm.",
        clinical_significance=(
            "Raises concern for malignancy. Recommend CT characterization and "
            "comparison with priors."
        ),
    ),
    Pathology(
        code="Nodule",
        name="Nodule",
        description="A rounded opacity 3 cm or smaller.",
        clinical_significance=(
            "May be benign (granuloma) or early malignancy. Follow Fleischner "
            "Society guidelines for follow-up."
        ),
    ),
    Pathology(
        code="Pneumonia",
        name="Pneumonia",
        description="Air-space consolidation suggestive of infection.",
        clinical_significance=(
            "Suggests pulmonary infection. Correlate with fever, white cell "
            "count, and symptoms before treating."
        ),
    ),
    Pathology(
        code="Pneumothorax",
        name="Pneumothorax",
        description="Air in the pleural space causing lung collapse.",
        clinical_significance=(
            "Can be life-threatening if under tension. Large or symptomatic "
            "pneumothoraces require urgent decompression."
        ),
    ),
    Pathology(
        code="Consolidation",
        name="Consolidation",
        description="Alveolar air replaced by fluid, pus, or cells.",
        clinical_significance=(
            "Dense opacity with air bronchograms. Seen in pneumonia, edema, or "
            "hemorrhage."
        ),
    ),
    Pathology(
        code="Edema",
        name="Edema",
        description="Pulmonary edema — fluid in the interstitium and alveoli.",
        clinical_significance=(
            "Often cardiogenic. Look for cephalization, Kerley B lines, and "
            "effusions; manage the underlying cause."
        ),
    ),
    Pathology(
        code="Emphysema",
        name="Emphysema",
        description="Irreversible alveolar destruction with air trapping.",
        clinical_significance=(
            "Hyperinflation and lucency. A feature of COPD; correlate with "
            "smoking history and pulmonary function tests."
        ),
    ),
    Pathology(
        code="Fibrosis",
        name="Fibrosis",
        description="Scarring with reticular opacities and architectural distortion.",
        clinical_significance=(
            "Chronic and progressive in interstitial lung disease. High-"
            "resolution CT better characterizes the pattern."
        ),
    ),
    Pathology(
        code="Pleural_Thickening",
        name="Pleural Thickening",
        description="Thickening of the pleural lining.",
        clinical_significance=(
            "May follow infection, asbestos exposure, or prior effusion. "
            "Asymmetric thickening warrants further evaluation."
        ),
    ),
    Pathology(
        code="Hernia",
        name="Hernia",
        description="Diaphragmatic or hiatal herniation of abdominal contents.",
        clinical_significance=(
            "Often incidental. Large hernias can compromise lung volumes or "
            "cause obstruction."
        ),
    ),
)

NUM_CLASSES = len(PATHOLOGIES)


def pathology_at(index: int) -> Pathology:
    return PATHOLOGIES[index]
