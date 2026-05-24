"""AAMI EC57 five-class heartbeat labels — order matches the model's softmax."""

from dataclasses import dataclass


@dataclass(frozen=True)
class BeatClass:
    code: str
    name: str
    description: str
    clinical_significance: str


# Index order MUST match the training order used in the Colab notebook
# (Kaggle "ECG Heartbeat Categorization" — mitbih_train.csv).
CLASSES: tuple[BeatClass, ...] = (
    BeatClass(
        code="N",
        name="Normal",
        description="Normal sinus beat",
        clinical_significance="No arrhythmia detected on this beat.",
    ),
    BeatClass(
        code="S",
        name="Supraventricular ectopic",
        description="Supraventricular premature or escape beat",
        clinical_significance=(
            "Originates above the ventricles. Occasional beats are benign; "
            "frequent runs may indicate atrial arrhythmia."
        ),
    ),
    BeatClass(
        code="V",
        name="Ventricular ectopic",
        description="Premature ventricular contraction (PVC) or ventricular escape",
        clinical_significance=(
            "Originates in the ventricles. Isolated PVCs are common; couplets, "
            "bigeminy, or runs warrant evaluation."
        ),
    ),
    BeatClass(
        code="F",
        name="Fusion",
        description="Fusion of ventricular and normal beat",
        clinical_significance=(
            "Simultaneous activation from sinus node and ventricular focus. "
            "Often seen alongside PVCs."
        ),
    ),
    BeatClass(
        code="Q",
        name="Unknown / Paced",
        description="Paced beat, fusion of paced and normal, or unclassifiable",
        clinical_significance=(
            "Could not be confidently classified — may reflect pacemaker "
            "activity or signal artifact."
        ),
    ),
)


def class_at(index: int) -> BeatClass:
    return CLASSES[index]
