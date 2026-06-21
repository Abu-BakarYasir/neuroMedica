"""Generate a self-contained Colab notebook from the ptbxl source files.

Run from anywhere with: py -3 app/ecg/ptbxl/_build_notebook.py
Outputs ptbxl_colab_training.ipynb at the repo root. This is a one-off build
helper, not part of the runtime or training path.
"""

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent          # backend/app/ecg/ptbxl
REPO_ROOT = HERE.parents[3]                      # repo root
OUT = REPO_ROOT / "ptbxl_colab_training.ipynb"

# Colab-side package root where the embedded code is recreated.
PKG = "/content/work/app/ecg/ptbxl"


def md(text: str) -> dict:
    return {"cell_type": "markdown", "metadata": {}, "source": text}


def code(text: str) -> dict:
    return {"cell_type": "code", "metadata": {}, "outputs": [], "execution_count": None, "source": text}


def writefile_cell(filename: str) -> dict:
    body = (HERE / filename).read_text(encoding="utf-8")
    return code(f"%%writefile {PKG}/{filename}\n{body}")


cells = [
    md(
        "# neuroMedica — PTB-XL 12-lead ECG model (training)\n"
        "\n"
        "Self-contained. **No repo or login needed** — just run every cell top to bottom.\n"
        "\n"
        "**Before you start:** `Runtime > Change runtime type > T4 GPU`.\n"
        "\n"
        "Produces three files in `/content/models/`:\n"
        "`ptbxl_12lead.keras`, `ptbxl_12lead.norm.json`, `ptbxl_12lead.metrics.json`.\n"
        "Send all three back to the project owner.\n"
        "\n"
        "Total time ≈ 45–70 min (dataset download + training)."
    ),
    md("### 1. Confirm the GPU is on"),
    code(
        "import tensorflow as tf\n"
        "gpus = tf.config.list_physical_devices('GPU')\n"
        "print('GPU detected:', gpus)\n"
        "assert gpus, 'No GPU! Runtime > Change runtime type > T4 GPU, then re-run.'"
    ),
    md("### 2. Install the one extra dependency"),
    code("!pip install -q wfdb   # pandas / scikit-learn / tensorflow already on Colab"),
    md("### 3. Recreate the training package (embedded — nothing to download)"),
    code(
        "import os, pathlib\n"
        f"base = '{PKG}'\n"
        "os.makedirs(base, exist_ok=True)\n"
        "for p in ['/content/work/app/__init__.py',\n"
        "          '/content/work/app/ecg/__init__.py',\n"
        "          base + '/__init__.py']:\n"
        "    pathlib.Path(p).write_text('')\n"
        "print('package ready at', base)"
    ),
    writefile_cell("labels.py"),
    writefile_cell("data.py"),
    writefile_cell("model.py"),
    writefile_cell("train.py"),
    md(
        "### 4. Download PTB-XL from PhysioNet (~1.7 GB, skips the 500 Hz set)\n"
        "Takes ~15–30 min. When done, the printout must list "
        "`ptbxl_database.csv` and `records100`."
    ),
    code(
        "%cd /content\n"
        "!wget -r -N -c -np -q --show-progress --reject-regex 'records500' \\\n"
        "    https://physionet.org/files/ptb-xl/1.0.3/\n"
        "\n"
        "DATADIR = '/content/physionet.org/files/ptb-xl/1.0.3'\n"
        "import os\n"
        "print('Contents:', os.listdir(DATADIR))"
    ),
    md("### 5. Smoke-test the data pipeline (~1 min — catches problems early)"),
    code(
        "%cd /content/work\n"
        "!python -m app.ecg.ptbxl.data --data-dir {DATADIR} --limit 200"
    ),
    md(
        "### 6. Train\n"
        "Watch `val_auc` climb; the final lines print **TEST macro-AUC** + per-class AUC "
        "(healthy ≈ 0.90+).\n"
        "\n"
        "_Quick dry run instead? Change the last line to_ `--limit 1000 --epochs 3`."
    ),
    code(
        "%cd /content/work\n"
        "!python -m app.ecg.ptbxl.train \\\n"
        "    --data-dir {DATADIR} \\\n"
        "    --cache-dir /content/cache \\\n"
        "    --out-dir /content/models \\\n"
        "    --epochs 30"
    ),
    md("### 7. Download the 3 result files (send these back)"),
    code(
        "from google.colab import files\n"
        "for f in ['ptbxl_12lead.keras', 'ptbxl_12lead.norm.json', 'ptbxl_12lead.metrics.json']:\n"
        "    files.download(f'/content/models/{f}')"
    ),
]

nb = {
    "nbformat": 4,
    "nbformat_minor": 5,
    "metadata": {
        "accelerator": "GPU",
        "colab": {"provenance": [], "gpuType": "T4"},
        "kernelspec": {"name": "python3", "display_name": "Python 3"},
        "language_info": {"name": "python"},
    },
    "cells": cells,
}

OUT.write_text(json.dumps(nb, indent=1), encoding="utf-8")
print(f"Wrote {OUT}  ({len(cells)} cells)")
