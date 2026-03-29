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
    """Application lifespan. ML models lazy-load on first request to avoid
    startup timeouts on resource-constrained hosts (e.g. Railway free tier)."""
    _logger.info("App starting — ML models will lazy-load on first request")
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




