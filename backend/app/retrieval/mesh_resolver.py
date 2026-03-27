"""MeSH term resolver via NCBI Entrez API.

Maps user medical terms to MeSH (Medical Subject Headings) vocabulary.
This is critical for PubMed search quality — "paracetamol" needs to map
to "Acetaminophen" (the MeSH preferred term) to get relevant results.
"""

import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

ENTREZ_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
ESEARCH_URL = f"{ENTREZ_BASE}/esearch.fcgi"
EFETCH_URL = f"{ENTREZ_BASE}/efetch.fcgi"
ESPELL_URL = f"{ENTREZ_BASE}/espell.fcgi"


class MeSHResolver:
    """Resolves user terms to MeSH vocabulary via NCBI Entrez API."""

    def __init__(self, email: str, api_key: Optional[str] = None):
        self.email = email
        self.api_key = api_key
        self._client = httpx.AsyncClient(timeout=10.0)
        self._cache: dict[str, Optional[str]] = {}

    async def resolve(self, term: str) -> Optional[str]:
        """Resolve a user term to its MeSH preferred descriptor name.

        Examples:
            "paracetamol" -> "Acetaminophen"
            "high blood pressure" -> "Hypertension"
            "heart attack" -> "Myocardial Infarction"
            "aspirin" -> "Aspirin" (already MeSH term)

        Returns None if no MeSH term found.
        """
        normalized = term.lower().strip()
        if normalized in self._cache:
            return self._cache[normalized]

        mesh_term = await self._lookup_mesh(normalized)
        self._cache[normalized] = mesh_term
        return mesh_term

    async def _lookup_mesh(self, term: str) -> Optional[str]:
        """Look up a term in the MeSH database via Entrez esearch + efetch."""
        try:
            # Step 1: Search MeSH database for the term
            params = {
                "db": "mesh",
                "term": term,
                "retmax": 1,
                "retmode": "json",
                "email": self.email,
            }
            if self.api_key:
                params["api_key"] = self.api_key

            resp = await self._client.get(ESEARCH_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

            uid_list = data.get("esearchresult", {}).get("idlist", [])
            if not uid_list:
                logger.debug("No MeSH term found for: %s", term)
                return None

            # Step 2: Fetch the MeSH record to get the preferred descriptor name
            mesh_uid = uid_list[0]
            params = {
                "db": "mesh",
                "id": mesh_uid,
                "retmode": "xml",
                "email": self.email,
            }
            if self.api_key:
                params["api_key"] = self.api_key

            resp = await self._client.get(EFETCH_URL, params=params)
            resp.raise_for_status()

            # Parse the XML to extract the descriptor name
            descriptor_name = self._parse_descriptor_name(resp.text)
            if descriptor_name:
                logger.info("MeSH resolved: '%s' -> '%s'", term, descriptor_name)
            return descriptor_name

        except Exception as e:
            logger.warning("MeSH lookup failed for '%s': %s", term, e)
            return None

    def _parse_descriptor_name(self, xml_text: str) -> Optional[str]:
        """Extract the preferred descriptor name from MeSH XML response."""
        import xml.etree.ElementTree as ET
        try:
            root = ET.fromstring(xml_text)
            # MeSH XML has <DescriptorRecord> -> <DescriptorName> -> <String>
            descriptor = root.find(".//DescriptorName/String")
            if descriptor is not None and descriptor.text:
                return descriptor.text.strip()

            # Fallback: try DescriptorName directly
            descriptor = root.find(".//DescriptorName")
            if descriptor is not None and descriptor.text:
                return descriptor.text.strip()

            return None
        except ET.ParseError:
            return None

    async def close(self):
        await self._client.aclose()


def extract_medical_terms(query: str) -> list[str]:
    """Extract potential medical/drug terms from a query for MeSH lookup.

    Simple heuristic: remove common question words and return the
    remaining noun phrases as candidate terms.
    """
    import re

    # Remove question patterns
    q = query.lower().strip().rstrip("?.")
    for prefix in [
        "what is ", "what are ", "define ", "tell me about ",
        "describe ", "explain ", "overview of ", "information about ",
        "how does ", "how do ", "how to ", "treatment for ",
        "therapy for ", "side effects of ", "mechanism of ",
        "dose of ", "dosing for ", "dosage of ",
        "is ", "are ", "can ", "does ", "will ",
    ]:
        if q.startswith(prefix):
            q = q[len(prefix):]
            break

    # Remove trailing filler
    for suffix in [
        " work", " used for", " used", " mean",
        " act", " help", " cause",
    ]:
        if q.endswith(suffix):
            q = q[: -len(suffix)]

    # Remove common stop words
    stop_words = {
        "the", "a", "an", "of", "in", "for", "and", "or", "with",
        "to", "from", "by", "on", "is", "are", "was", "were",
        "be", "been", "being", "have", "has", "had", "do", "does",
        "did", "will", "would", "could", "should", "may", "might",
        "can", "shall", "it", "its", "this", "that", "these", "those",
    }

    words = [w for w in q.split() if w not in stop_words]
    if not words:
        return []

    # Return the full remaining phrase as primary term
    primary_term = " ".join(words)
    return [primary_term]
