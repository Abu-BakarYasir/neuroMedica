from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.api import chat, ingestion, retrieval, reranking

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

_logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Preload ML models at startup so the first request isn't slow."""
    _logger.info("Preloading embedding and reranker models...")
    try:
        from app.ingestion.embedder import PubMedBERTEmbedder
        embedder = PubMedBERTEmbedder(model_name=settings.embedding_model)
        embedder._load_model()
        _logger.info("Embedding model loaded at startup")
    except Exception as e:
        _logger.warning("Embedding model preload failed (will lazy-load): %s", e)

    try:
        from app.reranking.reranker import ColBERTReranker
        reranker = ColBERTReranker(model_name=settings.reranker_model)
        reranker._load_model()
        _logger.info("Reranker model loaded at startup")
    except Exception as e:
        _logger.warning("Reranker model preload failed (will lazy-load): %s", e)

    yield  # Application runs here

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


@app.get("/")
async def root():
    return {
        "message": "NeuroMedica Chat API",
        "version": settings.app_version,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}




