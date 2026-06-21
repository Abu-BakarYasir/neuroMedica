import { BookOpen, Pill, ScrollText, type LucideIcon } from "lucide-react";
import type { CitationItem } from "./types";

/** Resolve the canonical external URL for a citation, source-aware. */
export function citationLink(c: CitationItem): string {
  if (c.url) return c.url;
  switch (c.source_type) {
    case "openfda": {
      const setId = c.pmid.startsWith("fda:") ? c.pmid.slice(4) : c.pmid;
      return `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${encodeURIComponent(setId)}`;
    }
    case "rxnorm": {
      const rxcui = c.pmid.startsWith("rxnorm:") ? c.pmid.slice(7) : c.pmid;
      return `https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${encodeURIComponent(rxcui)}`;
    }
    default:
      return `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(c.pmid)}/`;
  }
}

export interface CitationSourceMeta {
  label: string;
  idLabel: string;
  idValue: string;
  icon: LucideIcon;
  linkLabel: string;
}

/** Source-type display metadata (badge label, id label, icon, link label). */
export function citationSourceMeta(c: CitationItem): CitationSourceMeta {
  switch (c.source_type) {
    case "openfda": {
      const setId = c.pmid.startsWith("fda:") ? c.pmid.slice(4) : c.pmid;
      return { label: "FDA Drug Label", idLabel: "SetID", idValue: setId, icon: Pill, linkLabel: "DailyMed" };
    }
    case "rxnorm": {
      const rxcui = c.pmid.startsWith("rxnorm:") ? c.pmid.slice(7) : c.pmid;
      return { label: "RxNorm Drug", idLabel: "RxCUI", idValue: rxcui, icon: Pill, linkLabel: "RxNav" };
    }
    case "guideline":
      return { label: "Clinical Guideline", idLabel: "PMID", idValue: c.pmid, icon: ScrollText, linkLabel: "PubMed" };
    default:
      return { label: "PubMed", idLabel: "PMID", idValue: c.pmid, icon: BookOpen, linkLabel: "PubMed" };
  }
}
