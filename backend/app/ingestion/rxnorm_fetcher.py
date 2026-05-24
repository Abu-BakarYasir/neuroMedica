"""Fetch RxNorm drug concepts from the RxNav REST API.

Base URL: https://rxnav.nlm.nih.gov/REST
Docs:     https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html

Each drug name is resolved to an RXCUI, then we pull related concept groups
(ingredients, brand names, dose forms, strengths) and build a single
``GenericDocument`` per drug. The text is short and deterministic, which is
exactly what the dense+BM25 retrievers want for "what is X?" / "is Y a brand
of Z?" style questions.
"""

import asyncio
import logging
from typing import Optional

import httpx

from app.ingestion.models import GenericDocument

logger = logging.getLogger(__name__)

RXNAV_BASE = "https://rxnav.nlm.nih.gov/REST"


# Term Type (TTY) -> human-readable label. Only the most useful subset.
TTY_LABELS = {
    "IN": "Ingredient",
    "PIN": "Precise ingredient",
    "MIN": "Multiple ingredient",
    "BN": "Brand name",
    "DF": "Dose form",
    "DFG": "Dose form group",
    "SCD": "Clinical drug (generic)",
    "SBD": "Branded drug",
    "GPCK": "Generic pack",
    "BPCK": "Brand pack",
}


class RxNormFetcher:
    """Pull drug-concept records from RxNav."""

    def __init__(self, timeout: float = 15.0):
        self._client = httpx.AsyncClient(timeout=timeout)

    async def close(self) -> None:
        await self._client.aclose()

    async def fetch_many(self, names: list[str]) -> list[GenericDocument]:
        """Resolve a batch of drug names to ``GenericDocument`` records.

        Names that don't resolve to an RXCUI are skipped (logged at INFO).
        Calls are serialized with a tiny delay to be polite to RxNav.
        """
        docs: list[GenericDocument] = []
        for name in names:
            try:
                doc = await self.fetch_drug(name)
                if doc:
                    docs.append(doc)
            except Exception as e:
                logger.warning("RxNorm fetch failed for '%s': %s", name, e)
            await asyncio.sleep(0.1)
        return docs

    async def fetch_drug(self, name: str) -> Optional[GenericDocument]:
        """Resolve a drug name to its RxNorm concept document."""
        rxcui = await self._find_rxcui(name)
        if not rxcui:
            logger.info("RxNorm: no RXCUI found for '%s'", name)
            return None

        properties = await self._get_properties(rxcui)
        related = await self._get_all_related(rxcui)

        canonical_name = (properties or {}).get("name") or name
        tty = (properties or {}).get("tty", "")

        # Group related concepts by TTY for a structured description.
        grouped: dict[str, list[str]] = {}
        for tty_code, concept_names in related.items():
            if not concept_names:
                continue
            grouped[tty_code] = sorted(set(concept_names))

        sections: list[tuple[str, str]] = []

        # Top-line summary that names the drug, its TTY, RXCUI, and ingredients.
        summary_lines = [
            f"{canonical_name} (RxNorm CUI {rxcui}).",
        ]
        if tty:
            summary_lines.append(
                f"Term type: {TTY_LABELS.get(tty, tty)}."
            )
        if "IN" in grouped:
            summary_lines.append(
                "Active ingredient(s): " + ", ".join(grouped["IN"]) + "."
            )
        sections.append(("summary", " ".join(summary_lines)))

        # One section per concept group, ordered by clinical usefulness.
        order = ["IN", "PIN", "MIN", "BN", "DF", "SCD", "SBD", "GPCK", "BPCK"]
        for code in order:
            members = grouped.get(code)
            if not members:
                continue
            label = TTY_LABELS.get(code, code).lower().replace(" ", "_")
            body = (
                f"{TTY_LABELS.get(code, code)} concepts for {canonical_name}: "
                + ", ".join(members[:50])
                + (" ..." if len(members) > 50 else "")
            )
            sections.append((label, body))

        url = f"https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm={rxcui}"

        metadata = {
            "title": canonical_name,
            "rxcui": rxcui,
            "tty": tty,
            "ingredients": grouped.get("IN", [])[:10],
            "brand_names": grouped.get("BN", [])[:10],
            "dose_forms": grouped.get("DF", [])[:10],
        }
        metadata = {k: v for k, v in metadata.items() if v}

        return GenericDocument(
            doc_id=f"rxnorm:{rxcui}",
            source_type="rxnorm",
            title=canonical_name,
            sections=sections,
            url=url,
            metadata=metadata,
        )

    async def _find_rxcui(self, name: str) -> Optional[str]:
        """findRxcuiByString — exact match, then approximate fallback."""
        # 1. Exact / normalized match
        r = await self._client.get(
            f"{RXNAV_BASE}/rxcui.json",
            params={"name": name, "search": "2"},  # 2 = normalized
        )
        if r.status_code == 200:
            ids = (r.json().get("idGroup") or {}).get("rxnormId") or []
            if ids:
                return str(ids[0])

        # 2. Approximate match
        r = await self._client.get(
            f"{RXNAV_BASE}/approximateTerm.json",
            params={"term": name, "maxEntries": 1},
        )
        if r.status_code == 200:
            candidates = (r.json().get("approximateGroup") or {}).get("candidate") or []
            if candidates:
                return str(candidates[0].get("rxcui") or "") or None
        return None

    async def _get_properties(self, rxcui: str) -> dict:
        r = await self._client.get(f"{RXNAV_BASE}/rxcui/{rxcui}/properties.json")
        if r.status_code != 200:
            return {}
        return (r.json().get("properties") or {})

    async def _get_all_related(self, rxcui: str) -> dict[str, list[str]]:
        """Return a {tty -> [concept_name, ...]} map for the RXCUI."""
        r = await self._client.get(f"{RXNAV_BASE}/rxcui/{rxcui}/allrelated.json")
        if r.status_code != 200:
            return {}
        groups = ((r.json().get("allRelatedGroup") or {}).get("conceptGroup")) or []
        out: dict[str, list[str]] = {}
        for g in groups:
            tty = g.get("tty")
            props = g.get("conceptProperties") or []
            if not tty or not props:
                continue
            out[tty] = [p.get("name", "") for p in props if p.get("name")]
        return out
