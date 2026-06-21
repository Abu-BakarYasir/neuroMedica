"""PTB-XL diagnostic *superclasses* — the 5-way grouping used as the canonical
PTB-XL benchmark.

Unlike the single-lead MIT-BIH model (``app.ecg.labels``), this is a
**multi-label** task: one 10-second 12-lead recording can carry several of
these at once (e.g. MI + STTC). The ``SUPERCLASSES`` order below is the fixed
column order of the model's sigmoid output — training, inference, and the
saved label-order file must all agree on it.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DiagnosticClass:
    code: str
    name: str
    description: str
    clinical_significance: str


# Index order MUST match the model's output layer and the label-order file
# saved next to the trained weights. Do not reorder without retraining.
SUPERCLASSES: tuple[DiagnosticClass, ...] = (
    DiagnosticClass(
        code="NORM",
        name="Normal ECG",
        description="No diagnostic abnormality detected",
        clinical_significance="Recording is within normal limits.",
    ),
    DiagnosticClass(
        code="MI",
        name="Myocardial Infarction",
        description="Signs of prior or acute myocardial infarction",
        clinical_significance=(
            "Pathological Q waves or evolving changes suggestive of infarction. "
            "Acute presentations are time-critical and warrant urgent review."
        ),
    ),
    DiagnosticClass(
        code="STTC",
        name="ST/T Change",
        description="ST-segment and/or T-wave abnormalities",
        clinical_significance=(
            "Non-specific repolarisation changes. May reflect ischaemia, "
            "electrolyte disturbance, or drug effect — correlate clinically."
        ),
    ),
    DiagnosticClass(
        code="CD",
        name="Conduction Disturbance",
        description="Bundle branch / fascicular / AV conduction abnormality",
        clinical_significance=(
            "Includes bundle branch blocks and AV blocks. Significance depends "
            "on type and degree; new high-grade block needs prompt evaluation."
        ),
    ),
    DiagnosticClass(
        code="HYP",
        name="Hypertrophy",
        description="Left/right ventricular or atrial hypertrophy/enlargement",
        clinical_significance=(
            "Voltage and axis criteria suggesting chamber enlargement, often "
            "secondary to hypertension or valvular disease."
        ),
    ),
)

# The 12 standard leads, in the order PTB-XL stores them. Used to label the
# channel axis of the (timesteps, 12) input tensor.
LEAD_ORDER: tuple[str, ...] = (
    "I", "II", "III", "aVR", "aVL", "aVF",
    "V1", "V2", "V3", "V4", "V5", "V6",
)

# Convenience views.
SUPERCLASS_CODES: tuple[str, ...] = tuple(c.code for c in SUPERCLASSES)
N_CLASSES: int = len(SUPERCLASSES)


def class_at(index: int) -> DiagnosticClass:
    return SUPERCLASSES[index]


def index_of(code: str) -> int:
    return SUPERCLASS_CODES.index(code)
