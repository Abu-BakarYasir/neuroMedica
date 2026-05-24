"""Fetch FDA Structured Product Labeling (SPL) drug labels from OpenFDA.

API: https://api.fda.gov/drug/label.json
Docs: https://open.fda.gov/apis/drug/label/

Authentication is optional. Without an API key the public limit is 240
req/min and 1000 req/day per IP; with a key it bumps to 120k/day.
"""

import logging
from typing import Optional

import httpx

from app.ingestion.models import GenericDocument

logger = logging.getLogger(__name__)

OPENFDA_LABEL_URL = "https://api.fda.gov/drug/label.json"

# SPL sections we want to embed. Each is a list of strings in the JSON
# response. The order here determines display order in chunks.
LABEL_SECTIONS: list[tuple[str, str]] = [
    ("description", "description"),
    ("indications_and_usage", "indications"),
    ("dosage_and_administration", "dosage"),
    ("contraindications", "contraindications"),
    ("warnings_and_cautions", "warnings"),
    ("warnings", "warnings"),
    ("boxed_warning", "boxed_warning"),
    ("adverse_reactions", "adverse_reactions"),
    ("drug_interactions", "drug_interactions"),
    ("mechanism_of_action", "mechanism_of_action"),
    ("clinical_pharmacology", "clinical_pharmacology"),
    ("pregnancy", "pregnancy"),
    ("pediatric_use", "pediatric_use"),
    ("geriatric_use", "geriatric_use"),
    ("clinical_studies", "clinical_studies"),
    ("overdosage", "overdosage"),
]


class OpenFDAFetcher:
    """Pull drug labels from the OpenFDA SPL endpoint."""

    def __init__(self, api_key: Optional[str] = None, timeout: float = 30.0):
        self.api_key = api_key
        self._client = httpx.AsyncClient(timeout=timeout)

    async def close(self) -> None:
        await self._client.aclose()

    async def search_labels(
        self,
        query: str,
        max_results: int = 50,
    ) -> list[GenericDocument]:
        """Search OpenFDA drug labels and return documents ready for chunking.

        ``query`` follows the OpenFDA Lucene-style search syntax. Common forms:
            - ``"atorvastatin"`` -> matches anywhere
            - ``openfda.generic_name:"atorvastatin"``
            - ``indications_and_usage:"hypertension"``
        """
        params: dict = {
            "search": query,
            "limit": min(max_results, 100),  # OpenFDA caps per-call at 100
        }
        if self.api_key:
            params["api_key"] = self.api_key

        try:
            r = await self._client.get(OPENFDA_LABEL_URL, params=params)
            r.raise_for_status()
        except httpx.HTTPStatusError as e:
            # 404 = no results; surface as an empty list rather than an error.
            if e.response.status_code == 404:
                logger.info("OpenFDA returned no results for '%s'", query)
                return []
            logger.error("OpenFDA HTTP error: %s", e)
            raise

        data = r.json()
        results = data.get("results", [])
        logger.info(
            "OpenFDA search '%s' -> %d labels (total available: %d)",
            query, len(results), data.get("meta", {}).get("results", {}).get("total", 0),
        )

        return [self._label_to_document(label) for label in results]

    def _label_to_document(self, label: dict) -> GenericDocument:
        """Convert one OpenFDA SPL JSON record into a ``GenericDocument``.

        Each SPL section becomes one (label, body) entry in ``sections``;
        empty sections are filtered out by the chunker.
        """
        openfda = label.get("openfda", {}) or {}

        brand = _first(openfda.get("brand_name"))
        generic = _first(openfda.get("generic_name"))
        manufacturer = _first(openfda.get("manufacturer_name"))
        rxcui = _first(openfda.get("rxcui"))

        # Prefer brand + generic for the title so retrieval finds either.
        if brand and generic and brand.lower() != generic.lower():
            title = f"{brand} ({generic})"
        else:
            title = brand or generic or label.get("set_id", "FDA Drug Label")

        set_id = label.get("set_id") or label.get("id") or ""
        url = (
            f"https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid={set_id}"
            if set_id else None
        )

        sections: list[tuple[str, str]] = []
        for json_key, label_name in LABEL_SECTIONS:
            value = label.get(json_key)
            text = _flatten_section(value)
            if text:
                sections.append((label_name, text))

        metadata = {
            "title": title,
            "brand_name": brand,
            "generic_name": generic,
            "manufacturer": manufacturer,
            "rxcui": rxcui,
            "set_id": set_id,
            "spl_version": label.get("version"),
            "effective_time": label.get("effective_time"),
            "route": _first(openfda.get("route")),
            "product_type": _first(openfda.get("product_type")),
        }
        # Drop None values so the Qdrant payload stays clean.
        metadata = {k: v for k, v in metadata.items() if v}

        return GenericDocument(
            doc_id=f"fda:{set_id}",
            source_type="openfda",
            title=title,
            sections=sections,
            url=url,
            metadata=metadata,
        )


def _first(value) -> Optional[str]:
    """Return the first element of an OpenFDA list field, or None."""
    if isinstance(value, list) and value:
        return str(value[0]).strip() or None
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _flatten_section(value) -> str:
    """OpenFDA section fields are usually ``list[str]``; flatten to one block.

    Keeps paragraph breaks so the chunker can find sensible split points.
    """
    if value is None:
        return ""
    if isinstance(value, list):
        return "\n\n".join(str(v).strip() for v in value if v).strip()
    return str(value).strip()
