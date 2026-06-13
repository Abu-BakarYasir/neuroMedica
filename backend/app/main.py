from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.api import chat, ingestion, retrieval, reranking, ecg, cxr

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

_logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan. Preload the RAGService (embedder + reranker + BM25)
    so the first user request doesn't pay ~25s of model-load latency.
    Set PRELOAD_MODELS=false to skip (e.g. Railway free tier where startup must
    complete inside the platform's health-check window)."""
    app.state.rag_service = None
    if settings.preload_models:
        _logger.info("Preloading RAG models (embedder + reranker + BM25)...")
        from app.services.rag_service import RAGService
        rag = RAGService()
        rag.warmup()
        app.state.rag_service = rag
        _logger.info("RAG models preloaded — first request will be warm")

        _logger.info("Preloading ECG CNN...")
        from app.ecg.model_loader import warmup as ecg_warmup
        ecg_warmup()

        _logger.info("Preloading chest X-ray DenseNet...")
        from app.cxr.model_loader import warmup as cxr_warmup
        cxr_warmup()
    else:
        _logger.info("PRELOAD_MODELS=false — models will lazy-load on first request")
    yield

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router)
app.include_router(ingestion.router)
app.include_router(retrieval.router)
app.include_router(reranking.router)
app.include_router(ecg.router)
app.include_router(cxr.router)


@app.get("/")
async def root():
    return {
        "message": "NeuroMedica Chat API",
        "version": settings.app_version,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.app_version,
    }


@app.get("/demo")
async def demo_page():
    """Local-only Med Assistant demo UI (served same-origin so it can call the
    streaming chat API without CORS). Requires DEV_AUTH_BYPASS for offline use."""
    import os
    from fastapi.responses import FileResponse, JSONResponse
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "demo.html")
    if not os.path.exists(path):
        return JSONResponse({"error": "demo page not found"}, status_code=404)
    return FileResponse(path)




