"""Medical query intent classification.

Classifies user queries into intent types (definitional, mechanism, treatment, etc.)
to route them to different retrieval and generation strategies.

Uses fast regex-based heuristics — zero latency cost, no API calls.
"""

import re
from enum import Enum


class QueryIntent(str, Enum):
    DEFINITIONAL = "definitional"       # "what is X", "define X"
    MECHANISM = "mechanism"             # "how does X work", "mechanism of X"
    TREATMENT = "treatment"             # "treatment for X", "therapy for X"
    ADVERSE_EFFECTS = "adverse_effects" # "side effects of X", "risks of X"
    DIAGNOSTIC = "diagnostic"           # "how to diagnose X", "criteria for X"
    COMPARISON = "comparison"           # "X vs Y", "compare X and Y"
    DOSAGE = "dosage"                   # "dose of X", "dosing for X"
    GENERAL = "general"                 # Fallback


# Patterns ordered by specificity — first match wins
_INTENT_PATTERNS: list[tuple[QueryIntent, list[str]]] = [
    (QueryIntent.COMPARISON, [
        r"\bvs\.?\b",
        r"\bversus\b",
        r"\bcompare\b",
        r"comparison (?:of|between) ",
        r"difference(?:s)? between ",
        r"better.+(?:than|or) ",
        r"which (?:is|are) (?:better|safer|more effective)",
    ]),
    (QueryIntent.DOSAGE, [
        r"dos(?:e|ing|age) (?:of|for) ",
        r"how much .+ (?:to take|should)",
        r"(?:recommended|maximum|max|usual|standard) dos(?:e|age)",
        r"administration (?:of|route)",
        r"how (?:to|should .+) (?:take|administer|give)",
    ]),
    (QueryIntent.ADVERSE_EFFECTS, [
        r"side effects? (?:of|from|with) ",
        r"adverse (?:effects?|reactions?|events?) (?:of|from|with) ",
        r"risks? (?:of|associated with|from) ",
        r"contraindications? (?:of|for|to) ",
        r"(?:drug )?interactions? (?:of|with|between) ",
        r"toxicity (?:of|from) ",
        r"safety (?:of|profile)",
        r"(?:is|are) .+ (?:safe|dangerous|harmful)",
        r"overdose",
    ]),
    (QueryIntent.MECHANISM, [
        r"how does .+ work",
        r"how do .+ work",
        r"mechanism of (?:action )?",
        r"mode of action",
        r"pharmacology of",
        r"pharmacokinetics? of",
        r"pharmacodynamics? of",
        r"how .+ acts? (?:on|in|at)",
        r"(?:signaling |metabolic )?pathway",
        r"receptor (?:binding|affinity|interaction)",
        r"half[- ]life of",
    ]),
    (QueryIntent.TREATMENT, [
        r"treatment (?:for|of) ",
        r"therapy (?:for|of) ",
        r"how to treat ",
        r"management of ",
        r"therapeutic .+ for",
        r"first[- ]line .+ for",
        r"(?:drug|medication)s? for ",
        r"(?:can|does|will) .+ (?:treat|cure|help|manage) ",
        r"what (?:drug|medication|medicine)s? (?:for|treat) ",
        r"prescription for",
        r"guidelines? for (?:treating|managing)",
    ]),
    (QueryIntent.DIAGNOSTIC, [
        r"(?:how to )?diagnos[ei]",
        r"diagnostic criteria",
        r"differential diagnosis",
        r"workup for",
        r"signs? and symptoms? of",
        r"(?:clinical )?presentation of",
        r"(?:lab|laboratory) (?:tests?|findings?) for",
        r"(?:imaging|radiology) (?:for|findings? in)",
        r"screening for",
        r"biomarkers? (?:of|for)",
    ]),
    (QueryIntent.DEFINITIONAL, [
        r"^what (?:is|are) ",
        r"^define ",
        r"^tell me about ",
        r"^describe ",
        r"^overview of ",
        r"^explain (?:what )?",
        r"^what does .+ mean",
        r"^(?:give|provide) .+ (?:summary|overview|description)",
        r"^information (?:about|on) ",
    ]),
]


def classify_query(query: str) -> QueryIntent:
    """Classify a medical query into an intent type.

    Uses regex pattern matching for zero-latency classification.
    Returns QueryIntent.GENERAL if no specific pattern matches.
    """
    q = query.lower().strip().rstrip("?.")
    for intent, patterns in _INTENT_PATTERNS:
        for pattern in patterns:
            if re.search(pattern, q):
                return intent
    return QueryIntent.GENERAL


# Maps intents to PubMed article type filters and MeSH subheadings
INTENT_SEARCH_CONFIG: dict[QueryIntent, dict] = {
    QueryIntent.DEFINITIONAL: {
        "pubmed_filter": "(Review[pt] OR Systematic Review[pt])",
        "mesh_subheadings": [],  # No subheading — get general reviews
        "sort": "relevance",
        "prefer_recent": False,
    },
    QueryIntent.MECHANISM: {
        "pubmed_filter": "Review[pt]",
        "mesh_subheadings": ["pharmacology", "pharmacokinetics"],
        "sort": "relevance",
        "prefer_recent": False,
    },
    QueryIntent.TREATMENT: {
        "pubmed_filter": "(Clinical Trial[pt] OR Practice Guideline[pt] OR Systematic Review[pt])",
        "mesh_subheadings": ["therapeutic use"],
        "sort": "pub_date",
        "prefer_recent": True,
    },
    QueryIntent.ADVERSE_EFFECTS: {
        "pubmed_filter": "",  # Don't filter — case reports are valuable
        "mesh_subheadings": ["adverse effects", "toxicity"],
        "sort": "relevance",
        "prefer_recent": False,
    },
    QueryIntent.DIAGNOSTIC: {
        "pubmed_filter": "(Practice Guideline[pt] OR Guideline[pt] OR Systematic Review[pt])",
        "mesh_subheadings": ["diagnosis"],
        "sort": "relevance",
        "prefer_recent": True,
    },
    QueryIntent.COMPARISON: {
        "pubmed_filter": "(Systematic Review[pt] OR Meta-Analysis[pt])",
        "mesh_subheadings": ["therapeutic use"],
        "sort": "pub_date",
        "prefer_recent": True,
    },
    QueryIntent.DOSAGE: {
        "pubmed_filter": "(Review[pt] OR Practice Guideline[pt])",
        "mesh_subheadings": ["administration and dosage"],
        "sort": "relevance",
        "prefer_recent": True,
    },
    QueryIntent.GENERAL: {
        "pubmed_filter": "Review[pt]",
        "mesh_subheadings": [],
        "sort": "relevance",
        "prefer_recent": False,
    },
}
