"""Fetch articles from PubMed via NCBI Entrez API."""

import logging
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Optional

import httpx

from app.ingestion.models import PubMedArticle

logger = logging.getLogger(__name__)

ENTREZ_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
ESEARCH_URL = f"{ENTREZ_BASE}/esearch.fcgi"
EFETCH_URL = f"{ENTREZ_BASE}/efetch.fcgi"


class PubMedFetcher:
    """Fetches articles from PubMed using the Entrez E-utilities API."""

    def __init__(self, email: str, api_key: Optional[str] = None):
        self.email = email
        self.api_key = api_key
        self._client = httpx.AsyncClient(timeout=30.0)

    async def search(
        self,
        query: str,
        max_results: int = 50,
        article_type_filter: str = "",
        sort: str = "relevance",
        min_date: str = "",
        max_date: str = "",
    ) -> list[str]:
        """Search PubMed and return a list of PMIDs.

        Args:
            query: Search query (can include MeSH terms and PubMed syntax).
            max_results: Maximum number of PMIDs to return.
            article_type_filter: PubMed filter e.g. "Review[pt]" appended to query.
            sort: Sort order — "relevance" or "pub_date".
            min_date: Minimum publication date (e.g., "2015").
            max_date: Maximum publication date (e.g., "2026").
        """
        # Build the full search term
        search_term = query
        if article_type_filter:
            search_term = f"({query}) AND {article_type_filter}"

        params = {
            "db": "pubmed",
            "term": search_term,
            "retmax": max_results,
            "retmode": "json",
            "sort": sort,
            "email": self.email,
        }
        if min_date:
            params["datetype"] = "pdat"
            params["mindate"] = min_date
        if max_date:
            params["datetype"] = "pdat"
            params["maxdate"] = max_date
        if self.api_key:
            params["api_key"] = self.api_key

        resp = await self._client.get(ESEARCH_URL, params=params)
        resp.raise_for_status()
        data = resp.json()
        pmids = data.get("esearchresult", {}).get("idlist", [])
        logger.info(
            "PubMed search '%s' returned %d PMIDs (filter=%s, sort=%s)",
            search_term[:100], len(pmids), article_type_filter or "none", sort,
        )
        return pmids

    async def fetch_articles(self, pmids: list[str]) -> list[PubMedArticle]:
        """Fetch full article metadata for a list of PMIDs."""
        if not pmids:
            return []

        # Entrez efetch accepts comma-separated IDs, batch in groups of 200
        articles = []
        for i in range(0, len(pmids), 200):
            batch = pmids[i : i + 200]
            batch_articles = await self._fetch_batch(batch)
            articles.extend(batch_articles)

        logger.info("Fetched %d articles from PubMed", len(articles))
        return articles

    async def _fetch_batch(self, pmids: list[str]) -> list[PubMedArticle]:
        """Fetch a batch of articles by PMID."""
        params = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "rettype": "xml",
            "retmode": "xml",
            "email": self.email,
        }
        if self.api_key:
            params["api_key"] = self.api_key

        resp = await self._client.get(EFETCH_URL, params=params)
        resp.raise_for_status()
        return self._parse_xml(resp.text)

    def _parse_xml(self, xml_text: str) -> list[PubMedArticle]:
        """Parse PubMed XML response into PubMedArticle objects."""
        root = ET.fromstring(xml_text)
        articles = []

        for article_el in root.findall(".//PubmedArticle"):
            try:
                articles.append(self._parse_article(article_el))
            except Exception as e:
                logger.warning("Failed to parse article: %s", e)

        return articles

    def _parse_article(self, el: ET.Element) -> PubMedArticle:
        """Parse a single PubmedArticle XML element."""
        medline = el.find(".//MedlineCitation")
        article = medline.find(".//Article")

        # PMID
        pmid = medline.findtext("PMID", default="")

        # Title
        title = article.findtext(".//ArticleTitle", default="")

        # Abstract — concatenate all AbstractText elements
        abstract_parts = []
        for abs_text in article.findall(".//AbstractText"):
            label = abs_text.get("Label", "")
            text = "".join(abs_text.itertext()).strip()
            if label:
                abstract_parts.append(f"{label}: {text}")
            else:
                abstract_parts.append(text)
        abstract = "\n".join(abstract_parts)

        # Authors
        authors = []
        for author_el in article.findall(".//Author"):
            last = author_el.findtext("LastName", "")
            fore = author_el.findtext("ForeName", "")
            if last:
                authors.append(f"{last} {fore}".strip())

        # Journal
        journal = article.findtext(".//Journal/Title", default="")

        # Publication date
        pub_date = self._parse_pub_date(article)

        # MeSH terms
        mesh_terms = [
            m.findtext("DescriptorName", "")
            for m in medline.findall(".//MeshHeading")
            if m.findtext("DescriptorName")
        ]

        # Keywords
        keywords = [
            kw.text for kw in medline.findall(".//Keyword") if kw.text
        ]

        # DOI
        doi = None
        for eid in article.findall(".//ELocationID"):
            if eid.get("EIdType") == "doi":
                doi = eid.text

        return PubMedArticle(
            pmid=pmid,
            title=title,
            abstract=abstract,
            authors=authors,
            journal=journal,
            publication_date=pub_date,
            mesh_terms=mesh_terms,
            keywords=keywords,
            doi=doi,
        )

    def _parse_pub_date(self, article_el: ET.Element) -> Optional[datetime]:
        """Extract publication date from article XML."""
        date_el = article_el.find(".//PubDate")
        if date_el is None:
            return None

        year = date_el.findtext("Year")
        month = date_el.findtext("Month", "1")
        day = date_el.findtext("Day", "1")

        if not year:
            return None

        # Month might be abbreviated name
        month_map = {
            "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
            "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
        }
        if isinstance(month, str) and not month.isdigit():
            month = month_map.get(month[:3], 1)

        try:
            return datetime(int(year), int(month), int(day))
        except (ValueError, TypeError):
            try:
                return datetime(int(year), 1, 1)
            except (ValueError, TypeError):
                return None

    async def close(self):
        await self._client.aclose()
