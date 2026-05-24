"""Inference layer — turns a normalized (N, 187, 1) tensor into per-beat
class predictions plus an aggregate rhythm summary."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.ecg.labels import CLASSES, class_at
from app.ecg.model_loader import get_model


@dataclass
class BeatPrediction:
    index: int
    predicted_class: str  # "N", "S", "V", "F", "Q"
    predicted_label: str  # human-readable name
    confidence: float  # [0, 1]
    probabilities: dict[str, float]  # all five class probs
    waveform: list[float]  # the 187 normalized samples for plotting


@dataclass
class AnalysisSummary:
    total_beats: int
    dominant_class: str
    dominant_label: str
    class_counts: dict[str, int]
    class_percentages: dict[str, float]
    abnormal_beats: int  # anything that isn't N
    abnormal_percentage: float
    mean_confidence: float


def predict(beats: np.ndarray) -> tuple[list[BeatPrediction], AnalysisSummary]:
    """Run the model on a batch of beats and produce the API payload shape."""
    if beats.ndim != 3 or beats.shape[1:] != (187, 1):
        raise ValueError(
            f"Expected beats of shape (N, 187, 1); got {beats.shape}"
        )

    model = get_model()
    probs = model.predict(beats, verbose=0)
    pred_idx = probs.argmax(axis=1)
    confidences = probs.max(axis=1)

    predictions: list[BeatPrediction] = []
    for i in range(beats.shape[0]):
        idx = int(pred_idx[i])
        prob_row = probs[i]
        predictions.append(
            BeatPrediction(
                index=i,
                predicted_class=CLASSES[idx].code,
                predicted_label=CLASSES[idx].name,
                confidence=float(confidences[i]),
                probabilities={
                    CLASSES[k].code: float(prob_row[k])
                    for k in range(len(CLASSES))
                },
                # Downsample-free: 187 floats per beat is cheap (~1.5 KB)
                # and lets the UI plot the actual waveform.
                waveform=[float(v) for v in beats[i, :, 0]],
            )
        )

    counts: dict[str, int] = {c.code: 0 for c in CLASSES}
    for p in predictions:
        counts[p.predicted_class] += 1
    total = len(predictions)
    pcts = {
        code: round((counts[code] / total) * 100.0, 1) if total else 0.0
        for code in counts
    }
    dominant_idx = int(np.bincount(pred_idx, minlength=len(CLASSES)).argmax())
    dominant = class_at(dominant_idx)
    abnormal = total - counts["N"]

    summary = AnalysisSummary(
        total_beats=total,
        dominant_class=dominant.code,
        dominant_label=dominant.name,
        class_counts=counts,
        class_percentages=pcts,
        abnormal_beats=abnormal,
        abnormal_percentage=round((abnormal / total) * 100.0, 1) if total else 0.0,
        mean_confidence=float(confidences.mean()) if total else 0.0,
    )
    return predictions, summary
