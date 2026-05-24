"""Reciprocal Rank Fusion (RRF) to merge results from multiple retrievers."""

import logging
from collections import defaultdict

from app.retrieval.models import RetrievalResult

logger = logging.getLogger(__name__)

# Standard RRF constant (Cormack et al., 2009)
DEFAULT_K = 60


def reciprocal_rank_fusion(
    result_lists: list[list[RetrievalResult]],
    k: int = DEFAULT_K,
    top_n: int = 20,
    weights: list[float] | None = None,
) -> list[RetrievalResult]:
    """Merge multiple ranked result lists using Reciprocal Rank Fusion.

    RRF score for document d = sum over all lists L of:
        weight_L / (k + rank_L(d))

    where rank starts at 1 for the top result in each list.

    Args:
        result_lists: List of ranked result lists from different retrievers.
        k: RRF constant (default 60). Higher k reduces the impact of high ranks.
        top_n: Number of results to return after fusion.
        weights: Optional per-list weights. Defaults to equal weights.

    Returns:
        Fused list of RetrievalResults sorted by RRF score descending.
    """
    if not result_lists:
        return []

    if weights is None:
        weights = [1.0] * len(result_lists)

    if len(weights) != len(result_lists):
        raise ValueError(
            f"weights length ({len(weights)}) must match "
            f"result_lists length ({len(result_lists)})"
        )

    # Accumulate RRF scores by chunk_id
    rrf_scores: dict[str, float] = defaultdict(float)
    # Keep the best RetrievalResult object for each chunk_id
    best_result: dict[str, RetrievalResult] = {}

    for list_idx, results in enumerate(result_lists):
        w = weights[list_idx]
        for rank, result in enumerate(results, start=1):
            rrf_score = w / (k + rank)
            rrf_scores[result.chunk_id] += rrf_score

            # Keep the result with highest original score per chunk
            if (
                result.chunk_id not in best_result
                or result.score > best_result[result.chunk_id].score
            ):
                best_result[result.chunk_id] = result

    # Sort by fused RRF score
    sorted_ids = sorted(rrf_scores, key=rrf_scores.get, reverse=True)[:top_n]

    fused = []
    for chunk_id in sorted_ids:
        original = best_result[chunk_id]
        fused.append(RetrievalResult(
            chunk_id=original.chunk_id,
            pmid=original.pmid,
            source_type=original.source_type,
            text=original.text,
            section=original.section,
            url=original.url,
            score=rrf_scores[chunk_id],
            source="fused",
            metadata={
                **original.metadata,
                "rrf_score": rrf_scores[chunk_id],
                "original_source": original.source,
                "original_score": original.score,
            },
        ))

    logger.info(
        "RRF fused %d lists (%s results) into %d results",
        len(result_lists),
        "+".join(str(len(r)) for r in result_lists),
        len(fused),
    )
    return fused
