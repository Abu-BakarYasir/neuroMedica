"""Parse the supported upload formats into a common (T, 12) record.

Formats:
  * **WFDB** — a ``.hea`` header + its ``.dat`` signal file (the native PTB-XL
    layout). Read with the ``wfdb`` package; leads are reordered to LEAD_ORDER.
  * **CSV**  — 12 columns (one per lead) of raw samples. Sampling rate comes
    from the request (defaults to the model's training rate).
  * **Image** — best-effort digitization of a 12-lead chart (see
    ``image_digitizer_12lead``). Inherently approximate; flagged downstream.

Everything returns a :class:`ParsedRecord` so the predictor doesn't care which
format the user uploaded.
"""

from __future__ import annotations

import io
import logging
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

from app.ecg.ptbxl.labels import LEAD_ORDER

_logger = logging.getLogger(__name__)

# Normalized (uppercase, no spaces) PTB-XL lead names, in output order.
_CANON_LEADS = tuple(name.upper() for name in LEAD_ORDER)


class PtbxlParseError(ValueError):
    """Raised when an upload can't be turned into a (T, 12) record."""


@dataclass
class ParsedRecord:
    signal: np.ndarray  # (T, 12) float32, lead order = LEAD_ORDER, millivolts
    sampling_rate_hz: float
    source_format: str  # "wfdb" | "csv" | "image"
    meta: dict = field(default_factory=dict)


# --------------------------------------------------------------------------- #
# WFDB
# --------------------------------------------------------------------------- #
def _canon(name: str) -> str:
    return name.strip().upper().replace(" ", "")


def parse_wfdb(files: list[tuple[str, bytes]]) -> ParsedRecord:
    """Read a WFDB record from an uploaded (.hea, .dat[, ...]) file set.

    ``files`` is a list of (filename, bytes). We materialize them to a temp dir
    under their original names (the .hea references the .dat by name) and let
    wfdb decode. Leads are then reordered/subset to the 12 standard leads.
    """
    import wfdb

    headers = [f for f in files if f[0].lower().endswith(".hea")]
    if not headers:
        raise PtbxlParseError(
            "WFDB upload needs a .hea header file (and its matching .dat). "
            "Select both files."
        )
    if len(headers) > 1:
        raise PtbxlParseError("Multiple .hea files uploaded — send one record at a time.")

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        for name, raw in files:
            # Strip any directory components from the uploaded name for safety.
            safe = Path(name).name
            (tmp_path / safe).write_bytes(raw)

        record_stem = Path(headers[0][0]).name[: -len(".hea")]
        try:
            sig, fields = wfdb.rdsamp(str(tmp_path / record_stem))
        except Exception as e:  # noqa: BLE001 - any wfdb failure is user-facing
            raise PtbxlParseError(
                f"Could not read the WFDB record: {e}. Make sure the .hea and "
                ".dat belong together and are uncorrupted."
            ) from e

    sig = np.asarray(sig, dtype=np.float32)  # (T, n_sig)
    sig_names = [_canon(n) for n in fields.get("sig_name", [])]
    fs = float(fields.get("fs") or 0)
    if fs <= 0:
        raise PtbxlParseError("WFDB header is missing a valid sampling rate (fs).")

    # Reorder to the 12 standard leads. Error clearly if any are absent.
    try:
        idx = [sig_names.index(lead) for lead in _CANON_LEADS]
    except ValueError:
        missing = [
            LEAD_ORDER[i]
            for i, lead in enumerate(_CANON_LEADS)
            if lead not in sig_names
        ]
        raise PtbxlParseError(
            "This record isn't a standard 12-lead ECG — missing leads: "
            f"{', '.join(missing)}. Found: {', '.join(sig_names) or 'none'}."
        )
    ordered = sig[:, idx]

    return ParsedRecord(
        signal=ordered,
        sampling_rate_hz=fs,
        source_format="wfdb",
        meta={
            "record": record_stem,
            "native_rate_hz": round(fs, 1),
            "duration_s": round(sig.shape[0] / fs, 2),
        },
    )


# --------------------------------------------------------------------------- #
# CSV (12 columns)
# --------------------------------------------------------------------------- #
def parse_csv_12lead(raw: bytes, sampling_rate_hz: float) -> ParsedRecord:
    text = raw.decode("utf-8", errors="replace").strip()
    if not text:
        raise PtbxlParseError("Uploaded CSV is empty.")
    try:
        arr = np.genfromtxt(io.StringIO(text), delimiter=",", dtype=np.float64)
    except Exception as e:
        raise PtbxlParseError(f"Could not parse CSV: {e}") from e
    if arr.ndim == 0 or arr.size == 0 or np.isnan(arr).all():
        # Retry skipping a header row.
        arr = np.genfromtxt(
            io.StringIO(text), delimiter=",", dtype=np.float64, skip_header=1
        )
    if arr.ndim != 2:
        raise PtbxlParseError(
            "Expected a 12-column CSV (one column per lead: I, II, III, aVR, "
            "aVL, aVF, V1–V6)."
        )
    # Accept (T, 12) or (12, T).
    if arr.shape[1] == 12:
        sig = arr
    elif arr.shape[0] == 12:
        sig = arr.T
    else:
        raise PtbxlParseError(
            f"Expected 12 leads; got an array of shape {arr.shape}. Provide 12 "
            "columns (or 12 rows) in PTB-XL lead order."
        )
    sig = np.nan_to_num(sig, nan=0.0).astype(np.float32)
    if sampling_rate_hz <= 0:
        raise PtbxlParseError("Sampling rate must be positive.")
    return ParsedRecord(
        signal=sig,
        sampling_rate_hz=float(sampling_rate_hz),
        source_format="csv",
        meta={
            "native_rate_hz": round(float(sampling_rate_hz), 1),
            "duration_s": round(sig.shape[0] / sampling_rate_hz, 2),
        },
    )


# --------------------------------------------------------------------------- #
# Image (best-effort)
# --------------------------------------------------------------------------- #
def parse_image_12lead(raw: bytes) -> ParsedRecord:
    """Digitize a 12-lead chart image. Imported lazily (Pillow/SciPy cost)."""
    from app.ecg.ptbxl import image_digitizer_12lead as digi

    try:
        result = digi.digitize_12lead_image(raw)
    except digi.Ecg12LeadImageError as e:
        raise PtbxlParseError(str(e)) from e

    return ParsedRecord(
        signal=result.signal,
        sampling_rate_hz=result.sampling_rate_hz,
        source_format="image",
        meta=result.meta,
    )
