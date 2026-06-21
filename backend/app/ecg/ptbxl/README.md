# PTB-XL 12-lead diagnostic model

Trains a 1D-ResNet that reads a full **12-lead, 10-second ECG signal** and
predicts the 5 PTB-XL diagnostic superclasses (multi-label):

| Code | Meaning |
|------|---------|
| `NORM` | Normal ECG |
| `MI`   | Myocardial Infarction |
| `STTC` | ST/T change |
| `CD`   | Conduction disturbance |
| `HYP`  | Hypertrophy |

This is the **signal-based** path (CSV / WFDB upload), independent of the
single-lead MIT-BIH beat classifier and the image digitizer. It does **not**
attempt to read ECG *images* — feed it the actual recording.

> Phases 1 (data pipeline) and 2 (training) live here. Wiring the trained model
> into the backend (`/api/ecg/analyze-12lead`) and frontend is Phase 3.

---

## 1. Get the dataset

PTB-XL is free on PhysioNet (~2 GB for the 100 Hz version):

```bash
wget -r -N -c -np https://physionet.org/files/ptb-xl/1.0.3/
# dataset root = physionet.org/files/ptb-xl/1.0.3/
```

Or the convenience zip: https://physionet.org/content/ptb-xl/1.0.3/

After extraction the `--data-dir` you pass must contain:

```
ptbxl_database.csv
scp_statements.csv
records100/   # 100 Hz (filename_lr) — used by default
records500/   # 500 Hz (filename_hr) — optional, large
```

## 2. Install training deps

```bash
pip install -r app/ecg/ptbxl/requirements-train.txt
```

## 3. Smoke-test the pipeline (no training, ~1 min)

From the **`backend/`** directory:

```bash
python -m app.ecg.ptbxl.data --data-dir /path/to/ptb-xl/1.0.3 --limit 200
```

Expected: prints `X shape (train) = (..., 1000, 12)` and the label order.

## 4. Train

```bash
# quick end-to-end check on a laptop (tiny subset, 2 epochs)
python -m app.ecg.ptbxl.train --data-dir /path/to/ptb-xl/1.0.3 --limit 500 --epochs 2

# full run (GPU strongly recommended)
python -m app.ecg.ptbxl.train --data-dir /path/to/ptb-xl/1.0.3 --epochs 30
```

First full run decodes all WFDB records once and caches them to
`<data-dir>/.cache/*.npy`; later runs reuse the cache.

### Outputs (into `backend/models/`)

| File | Purpose |
|------|---------|
| `ptbxl_12lead.keras` | trained model (best validation macro-AUC) |
| `ptbxl_12lead.norm.json` | sampling rate, timesteps, per-lead z-score stats, label order — Phase 3 inference reuses these to preprocess uploads identically |
| `ptbxl_12lead.metrics.json` | per-class + macro test AUC on fold 10 |

A healthy full run lands around **macro-AUC ≈ 0.90+** on the test fold,
comparable to the published PTB-XL benchmark.

## 5. Run on Colab / Kaggle (free GPU)

```python
!pip install wfdb pandas scikit-learn
# upload this backend/ folder or git clone the repo, then:
%cd backend
!python -m app.ecg.ptbxl.train --data-dir /content/ptb-xl/1.0.3 --epochs 30
```

Download the three `ptbxl_12lead.*` files from `backend/models/` when done and
drop them into your local/Railway `backend/models/` for Phase 3.

---

## Design notes

- **Splits** follow PTB-XL's official `strat_fold`: folds 1–8 train, 9 val,
  10 test — so metrics are comparable to the literature.
- **Labels** aggregate SCP codes → superclass via `scp_statements.csv`
  (`diagnostic == 1`, `diagnostic_class`), the canonical PTB-XL recipe.
- **Normalization** is per-lead z-score computed on the **train split only**
  (no leakage) and saved for inference.
- **Multi-label**: sigmoid output + binary cross-entropy; a record can carry
  several diagnoses at once.
