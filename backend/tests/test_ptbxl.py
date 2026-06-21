"""End-to-end tests for the PTB-XL 12-lead diagnostic pipeline.

A correct-architecture stand-in model (random weights) is built and saved once,
so these run without the real trained weights. They validate parsing,
preprocessing, prediction shape, and the interpretation/reliability gate — not
clinical accuracy.
"""

import os

import numpy as np
import pytest


@pytest.fixture(scope="module")
def standin_model(tmp_path_factory):
    """Build + save a stand-in model and point the loader at it."""
    from app.ecg.ptbxl.model import build_model
    from app.ecg.ptbxl import model_loader

    tmp = tmp_path_factory.mktemp("ptbxl")
    model_path = tmp / "standin.keras"
    build_model(timesteps=1000).save(str(model_path))
    os.environ["PTBXL_MODEL_PATH"] = str(model_path)
    model_loader.reset_cache()
    yield
    os.environ.pop("PTBXL_MODEL_PATH", None)
    model_loader.reset_cache()


def _synthetic_wfdb(tmp, fs=500, seconds=10, seed=0):
    import wfdb

    rng = np.random.default_rng(seed)
    sig = (rng.standard_normal((fs * seconds, 12)) * 0.1).astype(np.float64)
    leads = ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"]
    wfdb.wrsamp(
        "rec", fs=fs, units=["mV"] * 12, sig_name=leads,
        p_signal=sig, write_dir=str(tmp),
    )
    hea = (tmp / "rec.hea").read_bytes()
    dat = (tmp / "rec.dat").read_bytes()
    return [("rec.hea", hea), ("rec.dat", dat)]


def test_norm_stats_load():
    from app.ecg.ptbxl import model_loader

    norm = model_loader.get_norm()
    assert norm.sampling_rate == 100
    assert norm.timesteps == 1000
    assert norm.lead_mean.shape == (12,)
    assert norm.superclasses == ("NORM", "MI", "STTC", "CD", "HYP")


def test_wfdb_parse_reorders_to_12_leads(tmp_path):
    from app.ecg.ptbxl import parser

    files = _synthetic_wfdb(tmp_path)
    rec = parser.parse_wfdb(files)
    assert rec.signal.shape[1] == 12
    assert rec.sampling_rate_hz == 500.0
    assert rec.source_format == "wfdb"


def test_wfdb_missing_lead_errors(tmp_path):
    import wfdb
    from app.ecg.ptbxl import parser

    # Only 11 leads -> should be rejected.
    rng = np.random.default_rng(1)
    sig = (rng.standard_normal((5000, 11)) * 0.1).astype(np.float64)
    leads = ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5"]
    wfdb.wrsamp("bad", fs=500, units=["mV"] * 11, sig_name=leads,
                p_signal=sig, write_dir=str(tmp_path))
    files = [
        ("bad.hea", (tmp_path / "bad.hea").read_bytes()),
        ("bad.dat", (tmp_path / "bad.dat").read_bytes()),
    ]
    with pytest.raises(parser.PtbxlParseError, match="missing leads"):
        parser.parse_wfdb(files)


def test_preprocess_shape_and_rate():
    from app.ecg.ptbxl import preprocess, model_loader

    norm = model_loader.get_norm()
    sig = np.random.default_rng(2).standard_normal((5000, 12)).astype(np.float32)
    batch = preprocess.prepare(sig, src_rate=500, norm=norm)
    assert batch.shape == (1, 1000, 12)
    assert batch.dtype == np.float32


def test_csv_12lead_parse():
    from app.ecg.ptbxl import parser

    rows = ["," .join(["0.1"] * 12) for _ in range(1000)]
    raw = "\n".join(rows).encode()
    rec = parser.parse_csv_12lead(raw, sampling_rate_hz=100)
    assert rec.signal.shape == (1000, 12)
    assert rec.source_format == "csv"


def test_csv_wrong_columns_errors():
    from app.ecg.ptbxl import parser

    raw = "\n".join(["0.1,0.2,0.3"] * 100).encode()
    with pytest.raises(parser.PtbxlParseError, match="12"):
        parser.parse_csv_12lead(raw, sampling_rate_hz=100)


def test_predict_and_interpret_wfdb(standin_model, tmp_path):
    from app.ecg.ptbxl import parser, predictor, interpretation

    rec = parser.parse_wfdb(_synthetic_wfdb(tmp_path))
    result = predictor.predict(rec)
    assert set(result.probabilities) == {"NORM", "MI", "STTC", "CD", "HYP"}
    assert all(0.0 <= p <= 1.0 for p in result.probabilities.values())

    interp = interpretation.build_interpretation(result)
    assert interp.reliable is True
    assert interp.reliability == "high"
    assert interp.headline


def test_image_source_is_gated_low(standin_model):
    from app.ecg.ptbxl import predictor, interpretation
    from app.ecg.ptbxl.parser import ParsedRecord

    sig = np.random.default_rng(3).standard_normal((250, 12)).astype(np.float32)
    rec = ParsedRecord(signal=sig, sampling_rate_hz=100, source_format="image",
                       meta={"approximate": True})
    result = predictor.predict(rec)
    interp = interpretation.build_interpretation(result)
    assert interp.reliable is False
    assert interp.reliability == "low"
    assert "WFDB" in interp.recommendation
