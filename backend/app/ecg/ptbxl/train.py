"""Phase 2 — train the PTB-XL 12-lead diagnostic model.

Run from the ``backend/`` directory so ``app.*`` imports resolve:

    python -m app.ecg.ptbxl.train --data-dir /path/to/ptbxl --epochs 30

Outputs (into ``--out-dir``, default ``backend/models/``):

    ptbxl_12lead.keras            trained model (best val macro-AUC)
    ptbxl_12lead.norm.json        sampling rate, timesteps, per-lead z-score
                                  stats, label order — for Phase 3 inference
    ptbxl_12lead.metrics.json     per-class + macro test AUC and config

A GPU is strongly recommended (Colab/Kaggle free tier works). CPU runs but is
slow. Use ``--limit`` for a quick end-to-end smoke test on a laptop.
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

import numpy as np

from app.ecg.ptbxl.data import load_ptbxl, save_norm_stats
from app.ecg.ptbxl.labels import SUPERCLASS_CODES
from app.ecg.ptbxl.model import build_model

_logger = logging.getLogger(__name__)

_BACKEND_ROOT = Path(__file__).resolve().parents[3]
_DEFAULT_OUT = _BACKEND_ROOT / "models"


def _per_class_auc(y_true: np.ndarray, y_prob: np.ndarray) -> dict[str, float]:
    """ROC-AUC per superclass; skips classes with no positives in y_true."""
    from sklearn.metrics import roc_auc_score

    out: dict[str, float] = {}
    for i, code in enumerate(SUPERCLASS_CODES):
        col = y_true[:, i]
        if col.min() == col.max():  # all-0 or all-1 — AUC undefined
            out[code] = float("nan")
        else:
            out[code] = float(roc_auc_score(col, y_prob[:, i]))
    return out


def train(args: argparse.Namespace) -> None:
    import keras

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    model_path = out_dir / f"{args.name}.keras"
    norm_path = out_dir / f"{args.name}.norm.json"
    metrics_path = out_dir / f"{args.name}.metrics.json"

    # ---- data ----
    ds = load_ptbxl(
        args.data_dir,
        sampling_rate=args.sampling_rate,
        cache_dir=args.cache_dir,
        limit=args.limit,
    )
    save_norm_stats(norm_path, ds)
    _logger.info("Saved normalization stats -> %s", norm_path)

    # ---- model ----
    model = build_model(timesteps=ds.timesteps)
    model.summary(print_fn=_logger.info)

    callbacks = [
        keras.callbacks.ModelCheckpoint(
            str(model_path), monitor="val_auc", mode="max",
            save_best_only=True, verbose=1,
        ),
        keras.callbacks.EarlyStopping(
            monitor="val_auc", mode="max", patience=args.patience,
            restore_best_weights=True, verbose=1,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_auc", mode="max", factor=0.5,
            patience=max(2, args.patience // 2), min_lr=1e-5, verbose=1,
        ),
    ]

    model.fit(
        ds.train.X, ds.train.Y,
        validation_data=(ds.val.X, ds.val.Y),
        epochs=args.epochs,
        batch_size=args.batch_size,
        callbacks=callbacks,
        verbose=2,
    )

    # ModelCheckpoint already saved the best epoch; ensure the file exists even
    # if val_auc never improved (e.g. 1-epoch smoke test).
    if not model_path.exists():
        model.save(str(model_path))
    _logger.info("Saved model -> %s", model_path)

    # ---- evaluation on the held-out test fold (fold 10) ----
    test_prob = model.predict(ds.test.X, batch_size=args.batch_size, verbose=0)
    per_class = _per_class_auc(ds.test.Y, test_prob)
    valid = [v for v in per_class.values() if not np.isnan(v)]
    macro = float(np.mean(valid)) if valid else float("nan")

    metrics = {
        "macro_auc": macro,
        "per_class_auc": per_class,
        "config": {
            "sampling_rate": ds.sampling_rate,
            "timesteps": ds.timesteps,
            "epochs": args.epochs,
            "batch_size": args.batch_size,
            "n_train": int(ds.train.X.shape[0]),
            "n_val": int(ds.val.X.shape[0]),
            "n_test": int(ds.test.X.shape[0]),
            "limit": args.limit,
        },
    }
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    _logger.info("=" * 56)
    _logger.info("TEST macro-AUC: %.4f", macro)
    for code, v in per_class.items():
        _logger.info("  %-5s AUC: %s", code, f"{v:.4f}" if not np.isnan(v) else "n/a")
    _logger.info("Metrics -> %s", metrics_path)
    _logger.info("=" * 56)


def _parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Train PTB-XL 12-lead model")
    ap.add_argument("--data-dir", required=True, help="root of PTB-XL distribution")
    ap.add_argument("--out-dir", default=str(_DEFAULT_OUT))
    ap.add_argument("--cache-dir", default=None, help="default <data-dir>/.cache")
    ap.add_argument("--name", default="ptbxl_12lead", help="output file stem")
    ap.add_argument("--sampling-rate", type=int, default=100, choices=(100, 500))
    ap.add_argument("--epochs", type=int, default=30)
    ap.add_argument("--batch-size", type=int, default=64)
    ap.add_argument("--patience", type=int, default=6, help="early-stop patience")
    ap.add_argument("--limit", type=int, default=None,
                    help="load only N records (quick smoke test)")
    return ap.parse_args()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    train(_parse_args())
