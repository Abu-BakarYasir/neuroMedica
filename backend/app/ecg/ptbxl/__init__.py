"""PTB-XL 12-lead diagnostic model.

Offline training package (Phase 1 = data pipeline, Phase 2 = training) plus
shared definitions (labels, model architecture, preprocessing) that the future
inference path (Phase 3) can import directly.

Nothing here is imported by the running FastAPI app yet — training is run
manually via ``python -m app.ecg.ptbxl.train`` (see README.md).
"""
