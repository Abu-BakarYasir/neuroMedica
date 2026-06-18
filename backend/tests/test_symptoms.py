"""Tests for the Symptom Explorer differential-JSON parser.

parse_differential_payload must be robust to fenced/unfenced/prose-wrapped JSON
and degrade to a prose fallback (structured=False) on anything unparseable, so
the feature never hard-fails on a non-conforming model response.
"""

from __future__ import annotations

import json

from app.generation.claude_generator import parse_differential_payload

_GOOD = {
    "differentials": [
        {
            "condition": "Community-acquired pneumonia",
            "icd10": "J18.9",
            "snomed": "385093006",
            "likelihood": "high",
            "rationale": "Fever, productive cough, pleuritic pain [1][2].",
            "supporting_citations": [1, 2],
            "red_flags": "Hypoxia or sepsis",
        },
        {
            "condition": "Acute bronchitis",
            "icd10": None,
            "likelihood": "moderate",
            "rationale": "Cough without consolidation [3].",
            "supporting_citations": [3],
        },
    ],
    "summary": "Most likely CAP; confirm with chest imaging.",
    "recommended_workup": ["Chest X-ray", "CBC", "Sputum culture"],
}


def test_clean_json():
    out = parse_differential_payload(json.dumps(_GOOD))
    assert out["structured"] is True
    assert len(out["differentials"]) == 2
    d0 = out["differentials"][0]
    assert d0["condition"] == "Community-acquired pneumonia"
    assert d0["icd10"] == "J18.9"
    assert d0["likelihood"] == "high"
    assert d0["supporting_citations"] == [1, 2]
    assert out["recommended_workup"][0] == "Chest X-ray"


def test_fenced_json():
    fenced = "```json\n" + json.dumps(_GOOD) + "\n```"
    out = parse_differential_payload(fenced)
    assert out["structured"] is True
    assert len(out["differentials"]) == 2


def test_prose_wrapped_json():
    wrapped = "Here is the differential:\n\n" + json.dumps(_GOOD) + "\n\nHope this helps."
    out = parse_differential_payload(wrapped)
    assert out["structured"] is True
    assert out["differentials"][1]["icd10"] is None  # null preserved


def test_bad_likelihood_normalized():
    payload = {"differentials": [{"condition": "X", "likelihood": "very-high"}], "summary": "", "recommended_workup": []}
    out = parse_differential_payload(json.dumps(payload))
    assert out["differentials"][0]["likelihood"] == "moderate"


def test_malformed_falls_back_to_prose():
    text = "I cannot produce JSON, but consider pneumonia and bronchitis."
    out = parse_differential_payload(text)
    assert out["structured"] is False
    assert out["differentials"] == []
    assert "pneumonia" in out["summary"]


def test_empty_falls_back():
    out = parse_differential_payload("")
    assert out["structured"] is False
    assert out["differentials"] == []


def test_differential_without_condition_skipped():
    payload = {"differentials": [{"likelihood": "high"}, {"condition": "Real"}], "summary": "s", "recommended_workup": []}
    out = parse_differential_payload(json.dumps(payload))
    assert len(out["differentials"]) == 1
    assert out["differentials"][0]["condition"] == "Real"
