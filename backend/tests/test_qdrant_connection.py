"""Quick smoke test: verify Qdrant Cloud connectivity and collection status."""

import os
import sys

# Ensure backend root is on the path so `app` package resolves
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from qdrant_client import QdrantClient


def test_qdrant_cloud_connection():
    """Connect to Qdrant Cloud and list collections."""
    url = os.environ.get("QDRANT_URL")
    api_key = os.environ.get("QDRANT_API_KEY")

    assert url, "QDRANT_URL not set in environment"
    assert api_key, "QDRANT_API_KEY not set in environment"

    print(f"Connecting to Qdrant at {url} ...")
    client = QdrantClient(url=url, api_key=api_key, timeout=30)

    # Basic health check
    collections = client.get_collections().collections
    collection_names = [c.name for c in collections]
    print(f"Collections found: {collection_names}")

    # Check if pubmed_articles collection exists
    if "pubmed_articles" in collection_names:
        info = client.get_collection("pubmed_articles")
        print(f"  pubmed_articles: {info.points_count} points, status={info.status.value}")
    else:
        print("  'pubmed_articles' collection does not exist yet — will be created on first ingestion")


def test_qdrant_collection_create_and_query():
    """Ensure we can create a collection, insert, and query (uses a temp collection)."""
    url = os.environ.get("QDRANT_URL")
    api_key = os.environ.get("QDRANT_API_KEY")

    client = QdrantClient(url=url, api_key=api_key, timeout=30)

    test_collection = "_neuromedica_test_smoke"

    # Cleanup if leftover from previous run
    try:
        client.delete_collection(test_collection)
    except Exception:
        pass

    from qdrant_client.http.models import Distance, VectorParams, PointStruct

    # Create
    client.create_collection(
        collection_name=test_collection,
        vectors_config=VectorParams(size=4, distance=Distance.COSINE),
    )

    # Insert
    client.upsert(
        collection_name=test_collection,
        points=[
            PointStruct(id=1, vector=[0.1, 0.2, 0.3, 0.4], payload={"text": "hello"}),
            PointStruct(id=2, vector=[0.5, 0.6, 0.7, 0.8], payload={"text": "world"}),
        ],
    )

    # Query
    results = client.query_points(
        collection_name=test_collection,
        query=[0.1, 0.2, 0.3, 0.4],
        limit=2,
    )
    assert len(results.points) == 2, f"Expected 2 results, got {len(results.points)}"
    print(f"Query returned {len(results.points)} results — Qdrant Cloud is fully operational!")

    # Cleanup
    client.delete_collection(test_collection)


if __name__ == "__main__":
    test_qdrant_cloud_connection()
    test_qdrant_collection_create_and_query()
    print("\nAll Qdrant Cloud tests passed!")
