"""Phase 1 — PTB-XL data pipeline.

Turns the raw PTB-XL distribution into model-ready arrays:

    X : float32 (N, timesteps, 12)   — 12-lead signals, channels-last
    Y : float32 (N, 5)               — multi-hot diagnostic superclass labels

and splits them by PTB-XL's official ``strat_fold`` column so results are
comparable to the published benchmark:

    folds 1-8  -> train
    fold  9    -> validation
    fold  10   -> test

Dataset layout expected at ``--data-dir`` (download instructions in README.md):

    ptbxl_database.csv
    scp_statements.csv
    records100/...        (100 Hz WFDB .hea/.dat pairs, filename_lr column)
    records500/...        (500 Hz, filename_hr column — optional)

Signals are read with the ``wfdb`` package. Decoded arrays are cached to
``--cache-dir`` as .npy so re-runs skip the slow per-record WFDB reads.
"""

from __future__ import annotations

import argparse
import ast
import json
import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from app.ecg.ptbxl.labels import SUPERCLASS_CODES

_logger = logging.getLogger(__name__)

TRAIN_FOLDS = (1, 2, 3, 4, 5, 6, 7, 8)
VAL_FOLD = 9
TEST_FOLD = 10


@dataclass
class Split:
    """One train/val/test partition: signals, labels, and the source ecg_ids."""

    X: np.ndarray  # (N, timesteps, 12) float32
    Y: np.ndarray  # (N, 5) float32 multi-hot
    ecg_ids: np.ndarray  # (N,) int — for traceability / debugging


@dataclass
class Dataset:
    train: Split
    val: Split
    test: Split
    sampling_rate: int
    # Per-lead z-score stats computed on TRAIN only (no leakage). Shape (12,).
    lead_mean: np.ndarray
    lead_std: np.ndarray

    @property
    def timesteps(self) -> int:
        return int(self.train.X.shape[1])


# ---------------------------------------------------------------------------
# Label aggregation: SCP codes -> diagnostic superclasses
# ---------------------------------------------------------------------------
def _load_superclass_map(data_dir: Path) -> dict[str, str]:
    """Map each diagnostic SCP code -> its superclass via scp_statements.csv.

    Mirrors the canonical PTB-XL example: keep rows where ``diagnostic == 1``
    and read their ``diagnostic_class`` (one of NORM/MI/STTC/CD/HYP).
    """
    import pandas as pd

    agg = pd.read_csv(data_dir / "scp_statements.csv", index_col=0)
    agg = agg[agg.diagnostic == 1]
    return {code: row.diagnostic_class for code, row in agg.iterrows()}


def _parse_scp_codes(raw: str) -> dict[str, float]:
    """ptbxl_database.csv stores scp_codes as a stringified dict."""
    try:
        value = ast.literal_eval(raw)
        return value if isinstance(value, dict) else {}
    except (ValueError, SyntaxError):
        return {}


def _superclasses_for(scp_codes: dict[str, float], code_to_super: dict[str, str]) -> set[str]:
    return {
        code_to_super[code]
        for code in scp_codes
        if code in code_to_super
    }


def _multi_hot(supers: set[str]) -> np.ndarray:
    vec = np.zeros(len(SUPERCLASS_CODES), dtype=np.float32)
    for code in supers:
        vec[SUPERCLASS_CODES.index(code)] = 1.0
    return vec


# ---------------------------------------------------------------------------
# Signal loading
# ---------------------------------------------------------------------------
def _load_signals(data_dir: Path, rel_paths: list[str]) -> np.ndarray:
    """Read a list of WFDB records into a single (N, timesteps, 12) array."""
    import wfdb

    signals: list[np.ndarray] = []
    total = len(rel_paths)
    for i, rel in enumerate(rel_paths):
        record_path = str(data_dir / rel)  # rel has no extension; wfdb adds it
        sig, _ = wfdb.rdsamp(record_path)  # (timesteps, 12) float64
        signals.append(sig.astype(np.float32))
        if (i + 1) % 1000 == 0 or (i + 1) == total:
            _logger.info("  read %d/%d records", i + 1, total)
    return np.stack(signals, axis=0)


def _cache_paths(cache_dir: Path, sampling_rate: int) -> dict[str, Path]:
    stem = f"ptbxl_{sampling_rate}"
    return {
        "X": cache_dir / f"{stem}_X.npy",
        "Y": cache_dir / f"{stem}_Y.npy",
        "ids": cache_dir / f"{stem}_ids.npy",
        "folds": cache_dir / f"{stem}_folds.npy",
    }


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
def load_ptbxl(
    data_dir: str | Path,
    sampling_rate: int = 100,
    cache_dir: str | Path | None = None,
    limit: int | None = None,
    drop_unlabelled: bool = True,
) -> Dataset:
    """Build the full train/val/test Dataset.

    Args:
        data_dir: root of the PTB-XL distribution.
        sampling_rate: 100 (records100, recommended) or 500 (records500).
        cache_dir: where to read/write decoded .npy caches. Defaults to
            ``<data_dir>/.cache``. Caching is skipped when ``limit`` is set.
        limit: if given, only load the first N records (fast smoke test).
        drop_unlabelled: drop records with no diagnostic superclass.
    """
    import pandas as pd

    data_dir = Path(data_dir)
    if sampling_rate not in (100, 500):
        raise ValueError("sampling_rate must be 100 or 500")
    cache_dir = Path(cache_dir) if cache_dir else data_dir / ".cache"
    filename_col = "filename_lr" if sampling_rate == 100 else "filename_hr"

    db = pd.read_csv(data_dir / "ptbxl_database.csv", index_col="ecg_id")
    code_to_super = _load_superclass_map(data_dir)

    db["scp_parsed"] = db.scp_codes.apply(_parse_scp_codes)
    db["supers"] = db.scp_parsed.apply(lambda d: _superclasses_for(d, code_to_super))
    if drop_unlabelled:
        db = db[db.supers.map(len) > 0]
    if limit is not None:
        db = db.iloc[:limit]

    _logger.info("PTB-XL: %d labelled records @ %d Hz", len(db), sampling_rate)

    Y = np.stack([_multi_hot(s) for s in db.supers], axis=0)
    ecg_ids = db.index.to_numpy()
    folds = db.strat_fold.to_numpy()

    # ---- signals: from cache when possible ----
    paths = _cache_paths(cache_dir, sampling_rate)
    use_cache = limit is None
    if use_cache and all(p.exists() for p in paths.values()):
        _logger.info("Loading cached signals from %s", cache_dir)
        X = np.load(paths["X"])
        cached_ids = np.load(paths["ids"])
        if not np.array_equal(cached_ids, ecg_ids):
            _logger.warning("Cache ecg_ids differ from current selection — rebuilding")
            X = _load_signals(data_dir, db[filename_col].tolist())
            _write_cache(paths, X, Y, ecg_ids, folds)
    else:
        _logger.info("Decoding %d WFDB records (first run is slow)...", len(db))
        X = _load_signals(data_dir, db[filename_col].tolist())
        if use_cache:
            _write_cache(paths, X, Y, ecg_ids, folds)

    return _assemble(X, Y, ecg_ids, folds, sampling_rate)


def _write_cache(paths: dict[str, Path], X, Y, ecg_ids, folds) -> None:
    paths["X"].parent.mkdir(parents=True, exist_ok=True)
    np.save(paths["X"], X)
    np.save(paths["Y"], Y)
    np.save(paths["ids"], ecg_ids)
    np.save(paths["folds"], folds)
    _logger.info("Cached decoded signals to %s", paths["X"].parent)


def _assemble(X, Y, ecg_ids, folds, sampling_rate: int) -> Dataset:
    train_mask = np.isin(folds, TRAIN_FOLDS)
    val_mask = folds == VAL_FOLD
    test_mask = folds == TEST_FOLD

    # Per-lead z-score from TRAIN only, applied to all splits (no leakage).
    train_X = X[train_mask]
    lead_mean = train_X.mean(axis=(0, 1)).astype(np.float32)  # (12,)
    lead_std = train_X.std(axis=(0, 1)).astype(np.float32)
    lead_std[lead_std < 1e-6] = 1.0  # guard against dead leads

    def norm(arr: np.ndarray) -> np.ndarray:
        return ((arr - lead_mean) / lead_std).astype(np.float32)

    ds = Dataset(
        train=Split(norm(train_X), Y[train_mask], ecg_ids[train_mask]),
        val=Split(norm(X[val_mask]), Y[val_mask], ecg_ids[val_mask]),
        test=Split(norm(X[test_mask]), Y[test_mask], ecg_ids[test_mask]),
        sampling_rate=sampling_rate,
        lead_mean=lead_mean,
        lead_std=lead_std,
    )
    _logger.info(
        "Splits — train=%d val=%d test=%d | per-class positives (train): %s",
        ds.train.X.shape[0], ds.val.X.shape[0], ds.test.X.shape[0],
        dict(zip(SUPERCLASS_CODES, ds.train.Y.sum(axis=0).astype(int).tolist())),
    )
    return ds


def save_norm_stats(path: str | Path, ds: Dataset) -> None:
    """Persist normalization stats + label order beside the trained model so
    Phase 3 inference preprocesses uploads identically."""
    payload = {
        "sampling_rate": ds.sampling_rate,
        "timesteps": ds.timesteps,
        "lead_mean": ds.lead_mean.tolist(),
        "lead_std": ds.lead_std.tolist(),
        "superclasses": list(SUPERCLASS_CODES),
    }
    Path(path).write_text(json.dumps(payload, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# CLI — sanity-check the pipeline without training
# ---------------------------------------------------------------------------
def _main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    ap = argparse.ArgumentParser(description="Inspect the PTB-XL data pipeline")
    ap.add_argument("--data-dir", required=True)
    ap.add_argument("--sampling-rate", type=int, default=100, choices=(100, 500))
    ap.add_argument("--limit", type=int, default=200,
                    help="records to load for this smoke test (default 200)")
    args = ap.parse_args()

    ds = load_ptbxl(args.data_dir, sampling_rate=args.sampling_rate, limit=args.limit)
    print(f"\nOK. X shape (train) = {ds.train.X.shape}, Y shape = {ds.train.Y.shape}")
    print(f"timesteps={ds.timesteps}, sampling_rate={ds.sampling_rate} Hz")
    print(f"label order = {SUPERCLASS_CODES}")


if __name__ == "__main__":
    _main()
