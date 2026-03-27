"""Shared Qdrant client settings for stable local dev and corporate proxy environments."""

from __future__ import annotations

import os
from typing import Optional

from qdrant_client import QdrantClient

# Singleton client instance — avoids recreating connections per request
_qdrant_client: Optional[QdrantClient] = None
_qdrant_key: Optional[tuple] = None


def make_qdrant_client(
    url: str,
    api_key: Optional[str] = None,
    *,
    timeout: int = 120,
) -> QdrantClient:
    """Build QdrantClient with stable defaults.

    Uses **REST on port 6333** by default. Many local Docker setups only publish ``6333``;
    gRPC on **6334** is opt-in via ``QDRANT_PREFER_GRPC=1`` (publish ``-p 6334:6334`` too).

    Set ``QDRANT_PREFER_GRPC=1`` if corporate HTTP proxies break localhost REST (WinError 10054).
    """
    prefer_grpc = False
    env_grpc = os.environ.get("QDRANT_PREFER_GRPC", "").strip().lower()
    if env_grpc in ("1", "true", "yes"):
        prefer_grpc = True

    return QdrantClient(
        url=url,
        api_key=api_key,
        check_compatibility=False,
        timeout=timeout,
        prefer_grpc=prefer_grpc,
    )


def get_qdrant_client(
    url: str,
    api_key: Optional[str] = None,
    *,
    timeout: int = 120,
) -> QdrantClient:
    """Return a singleton QdrantClient, creating it if necessary.

    Reuses the same connection across the application lifetime to avoid
    per-request connection overhead.
    """
    global _qdrant_client, _qdrant_key
    key = (url, api_key, timeout)
    if _qdrant_client is None or _qdrant_key != key:
        _qdrant_client = make_qdrant_client(url, api_key, timeout=timeout)
        _qdrant_key = key
    return _qdrant_client
