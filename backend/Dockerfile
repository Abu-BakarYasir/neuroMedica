FROM python:3.11-slim

WORKDIR /app

# Install system deps for torch/transformers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Railway injects PORT env var
ENV PORT=8000

EXPOSE ${PORT}

# Start with uvicorn — bind to 0.0.0.0 so Railway can route traffic
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
