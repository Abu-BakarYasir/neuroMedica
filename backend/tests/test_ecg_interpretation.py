"""Unit tests for the ECG clinical-interpretation + reliability gate.

These exercise the pure logic only (no TensorFlow / model load) by passing
duck-typed summary objects, so they run fast.
"""

from types import SimpleNamespace

from app.ecg import interpretation as I


def make_summary(
    *,
    total=20,
    counts=None,
    mean_conf=0.95,
    dominant_code="N",
    dominant_label="Normal",
):
    counts = counts or {"N": total, "S": 0, "V": 0, "F": 0, "Q": 0}
    abnormal = total - counts.get("N", 0)
    return SimpleNamespace(
        total_beats=total,
        dominant_class=dominant_code,
        dominant_label=dominant_label,
        class_counts=counts,
        abnormal_beats=abnormal,
        abnormal_percentage=round(abnormal / total * 100, 1) if total else 0.0,
        mean_confidence=mean_conf,
    )


# --------------------------------------------------------------------------- #
# Heart rate
# --------------------------------------------------------------------------- #
def test_heart_rate_regular_75bpm():
    # RR = 100 samples at 125 Hz = 0.8 s -> 75 bpm.
    peaks = list(range(100, 100 + 100 * 10, 100))
    bpm, reg = I.compute_heart_rate(peaks, 125)
    assert bpm == 75.0
    assert reg == "Regular"


def test_heart_rate_irregular():
    peaks = [0, 100, 250, 300, 520, 560, 800]  # wildly varying RR
    bpm, reg = I.compute_heart_rate(peaks, 125)
    assert bpm is not None
    assert reg == "Irregular"


def test_heart_rate_insufficient_peaks():
    assert I.compute_heart_rate([100, 200], 125) == (None, None)
    assert I.compute_heart_rate(None, 125) == (None, None)
    assert I.compute_heart_rate([1, 2, 3], None) == (None, None)


def test_heart_rate_drops_impossible_intervals():
    # A doubled detection (tiny RR) shouldn't blow up the estimate.
    peaks = [0, 5, 100, 200, 300, 400]
    bpm, _ = I.compute_heart_rate(peaks, 125)
    assert 60 <= bpm <= 90  # dominated by the clean ~0.8 s intervals


# --------------------------------------------------------------------------- #
# Reliability gate — the random-image safeguard
# --------------------------------------------------------------------------- #
def test_gate_csv_is_trusted():
    level, _ = I.assess_reliability(
        source_format="long", summary=make_summary(), notes={}
    )
    assert level == "high"


def test_gate_sample_is_trusted_even_with_one_beat():
    level, _ = I.assess_reliability(
        source_format="sample", summary=make_summary(total=1), notes={}
    )
    assert level == "high"


def test_gate_12lead_image_is_low():
    # Multiple stacked traces => looks like a 12-lead chart => unreliable.
    level, reasons = I.assess_reliability(
        source_format="image",
        summary=make_summary(),
        notes={"trace_bands": 3, "grid_detected": False, "coverage": 0.9,
               "digitization_quality": 0.7},
    )
    assert level == "low"
    assert any("12-lead" in r or "Multiple" in r for r in reasons)


def test_gate_clean_image_is_high():
    level, _ = I.assess_reliability(
        source_format="image",
        summary=make_summary(),
        notes={"trace_bands": 1, "grid_detected": True, "coverage": 0.9,
               "digitization_quality": 0.85},
    )
    assert level == "high"


def test_gate_no_grid_image_is_moderate():
    level, _ = I.assess_reliability(
        source_format="image",
        summary=make_summary(),
        notes={"trace_bands": 1, "grid_detected": False, "coverage": 0.9,
               "digitization_quality": 0.7},
    )
    assert level == "moderate"


def test_gate_low_model_confidence_is_low():
    level, _ = I.assess_reliability(
        source_format="image",
        summary=make_summary(mean_conf=0.4),
        notes={"trace_bands": 1, "grid_detected": True, "coverage": 0.9,
               "digitization_quality": 0.85},
    )
    assert level == "low"


# --------------------------------------------------------------------------- #
# build_interpretation
# --------------------------------------------------------------------------- #
def test_unreliable_image_refuses_to_assert_labels():
    interp = I.build_interpretation(
        source_format="image",
        summary=make_summary(),
        notes={"trace_bands": 4, "grid_detected": False, "coverage": 0.4,
               "digitization_quality": 0.3},
    )
    assert interp.reliable is False
    assert interp.reliability == "low"
    assert "reliab" in interp.headline.lower() or "could not" in interp.headline.lower()
    assert "single-lead" in interp.recommendation.lower()


def test_normal_sample_interpretation():
    interp = I.build_interpretation(
        source_format="sample", summary=make_summary(), notes={}
    )
    assert interp.reliable is True
    assert "normal" in interp.headline.lower()
    assert interp.recommendation


def test_pvc_burden_interpretation_recommends_followup():
    summary = make_summary(
        total=100,
        counts={"N": 80, "S": 0, "V": 20, "F": 0, "Q": 0},
    )
    interp = I.build_interpretation(
        source_format="long",
        summary=summary,
        notes={"r_peak_samples": list(range(0, 100 * 100, 100)),
               "sampling_rate_hz": 125, "grid_detected": True},
    )
    assert interp.reliable is True
    assert interp.heart_rate_bpm is not None
    # 20% ectopy is "very frequent" -> should escalate.
    assert "12-lead" in interp.recommendation or "Holter" in interp.recommendation
    assert any("ventricular" in f.lower() for f in interp.findings)
