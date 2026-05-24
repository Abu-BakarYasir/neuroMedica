# neuroMedica - Medical RAG System

## Project Overview

**Goal**: Build a production-grade medical Retrieval-Augmented Generation (RAG) system for clinical decision support.

**Stack**:
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS + Radix UI + Supabase Auth
- **Backend**: FastAPI + Uvicorn (Python)
- **Vector DB**: Qdrant (dense embeddings)
- **Knowledge Graph**: Neo4j (UMLS/SNOMED-CT ontology)
- **Embeddings**: PubMedBERT (dense) + BM25 (sparse)
- **Reranker**: ColBERT
- **Generation**: Claude API (Anthropic)
- **Framework**: LangChain / LlamaIndex
- **Auth**: Supabase + python-jose JWT

## Architecture

```
User Query
    |
    v
[Query Understanding] -- UMLS concept extraction + query expansion
    |
    v
[Hybrid Retrieval]
    |--- Dense: PubMedBERT -> Qdrant (ANN search)
    |--- Sparse: BM25 (Elasticsearch/in-memory)
    |--- Graph: Neo4j Cypher traversal (UMLS/SNOMED-CT)
    |
    v
[Reciprocal Rank Fusion] -- merge results from all 3 retrievers
    |
    v
[ColBERT Reranker] -- fine-grained token-level reranking
    |
    v
[CRAG Self-Evaluation Loop]
    |--- Score relevance of retrieved docs
    |--- If LOW: trigger web search / knowledge graph fallback
    |--- If AMBIGUOUS: decompose query + re-retrieve
    |--- If HIGH: proceed to generation
    |
    v
[Claude API Generation] -- grounded answer with citations
    |
    v
[Response + Citations]
```

### Bounded Contexts (DDD)

| Context | Responsibility | Location |
|---------|---------------|----------|
| **Ingestion** | Document parsing, chunking, embedding, indexing | `backend/app/ingestion/` |
| **Retrieval** | Hybrid search (dense + sparse + graph) | `backend/app/retrieval/` |
| **Reranking** | ColBERT reranking pipeline | `backend/app/reranking/` |
| **Evaluation** | CRAG self-evaluation loop | `backend/app/evaluation/` |
| **Generation** | Claude API prompt construction + response | `backend/app/generation/` |
| **KnowledgeGraph** | Neo4j UMLS/SNOMED-CT operations | `backend/app/knowledge_graph/` |
| **Chat** | Existing chat API (already implemented) | `backend/app/api/chat.py` |
| **Auth** | Supabase + JWT auth (already implemented) | `backend/app/core/security.py` |

## Key Architecture Decisions

### ADR-001: Hybrid Retrieval over Single-Method
Dense-only retrieval misses exact medical terminology matches. BM25 catches exact term matches (drug names, ICD codes). GraphRAG captures ontological relationships (is-a, part-of, treats). Reciprocal Rank Fusion merges all three.

### ADR-002: PubMedBERT over General Embeddings
PubMedBERT is pretrained on biomedical literature — significantly outperforms general-purpose models (e5, ada-002) on medical text. Use `microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext`.

### ADR-003: Qdrant over Pinecone/Weaviate
Qdrant supports hybrid search (dense + sparse in one query), has native filtering by metadata (speciality, publication year, evidence level), and can be self-hosted for PHI compliance.

### ADR-004: Neo4j for UMLS/SNOMED-CT
Medical ontologies are inherently graph-structured. Neo4j enables multi-hop traversal (drug -> mechanism -> condition -> symptom) that vector search cannot replicate. Load UMLS RRF files and SNOMED-CT RF2 distributions.

### ADR-005: ColBERT Reranker over Cross-Encoder
ColBERT offers late interaction (token-level matching) with pre-computable document representations. Better latency than full cross-encoder at comparable quality for medical queries.

### ADR-006: CRAG Self-Evaluation Loop
Medical RAG cannot afford hallucination. CRAG scores retrieval relevance before generation. Low-confidence retrievals trigger fallback (web search, graph expansion). This adds latency but is non-negotiable for clinical safety.

### ADR-007: Claude API for Generation
Claude's long context window (200K tokens) handles large retrieval sets. Strong instruction-following for citation formatting. Use system prompts to enforce "I don't know" for unsupported claims.

## Build & Run

```bash
# Frontend
npm run dev          # Next.js dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Qdrant (Docker)
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant

# Neo4j (Docker)
docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:5

# Run tests
cd backend && python -m pytest tests/ -v
npm test
```

## Implementation Steps

### Phase 1: Infrastructure Setup
1. Add RAG dependencies to `backend/requirements.txt`:
   - `qdrant-client`, `sentence-transformers`, `transformers`, `torch`
   - `neo4j`, `langchain`, `langchain-community`, `llama-index`
   - `anthropic`, `rank-bm25`, `colbert-ai`
2. Set up Qdrant (Docker or Qdrant Cloud)
3. Set up Neo4j and load UMLS/SNOMED-CT subsets
4. Configure `.env` with `ANTHROPIC_API_KEY`, `QDRANT_URL`, `NEO4J_URI`

### Phase 2: Ingestion Pipeline
1. Build document chunker (overlap-aware, respects section boundaries)
2. Generate PubMedBERT embeddings for chunks
3. Index into Qdrant with metadata (source, speciality, evidence level)
4. Build BM25 index from same chunks
5. Populate Neo4j with UMLS concepts and relationships

**Knowledge sources currently wired into the ingestion pipeline:**
| Source | Endpoint | Source tag |
|---|---|---|
| PubMed research articles | `POST /api/ingestion/ingest` | `pubmed` |
| Clinical practice guidelines (PubMed `Practice Guideline[pt]`) | `POST /api/ingestion/guidelines` | `guideline` |
| FDA drug labels (OpenFDA / SPL) | `POST /api/ingestion/openfda` | `openfda` |
| RxNorm drug concepts (RxNav) | `POST /api/ingestion/rxnorm` | `rxnorm` |

All sources flow through the same chunker → PubMedBERT embedder → Qdrant collection. Each chunk carries a `source_type` payload field so dense + BM25 retrieval, the reranker, CRAG, and the citation builder can all distinguish them. Frontend citation cards render source-aware links: PubMed → pubmed.ncbi.nlm.nih.gov, OpenFDA → DailyMed, RxNorm → RxNav.

### Phase 3: Hybrid Retrieval
1. Implement dense retriever (PubMedBERT -> Qdrant)
2. Implement sparse retriever (BM25)
3. Implement graph retriever (UMLS concept -> Neo4j Cypher)
4. Build Reciprocal Rank Fusion merger

### Phase 4: Reranking + CRAG
1. Integrate ColBERT reranker
2. Build CRAG evaluator (relevance scoring)
3. Implement fallback strategies (web search, graph expansion, query decomposition)

### Phase 5: Generation
1. Build Claude API prompt templates with citation formatting
2. Implement streaming response with source attribution
3. Add safety guardrails (medical disclaimer, uncertainty markers)

### Phase 6: Integration
1. Wire RAG pipeline into existing chat API (`backend/app/api/chat.py`)
2. Update frontend chat UI to display citations and source cards
3. Add conversation memory (multi-turn RAG context)

## File Organization

- `/backend/app/` — Python backend (FastAPI)
- `/backend/app/api/` — API routes
- `/backend/app/core/` — Config, security
- `/backend/app/models/` — Pydantic models
- `/backend/app/services/` — Business logic
- `/backend/app/ingestion/` — Document processing pipeline (NEW)
- `/backend/app/retrieval/` — Hybrid retrieval (NEW)
- `/backend/app/reranking/` — ColBERT reranker (NEW)
- `/backend/app/evaluation/` — CRAG loop (NEW)
- `/backend/app/generation/` — Claude API generation (NEW)
- `/backend/app/knowledge_graph/` — Neo4j/UMLS operations (NEW)
- `/app/` — Next.js pages and routes
- `/components/` — React UI components
- `/lib/` — Shared utilities (Supabase client, etc.)
- `/tests/` — All test files
- `/supabase/` — Database schema and migrations
- `/supabase/migrations/` — Sequential migration files (see rules below)
- `/supabase/MIGRATION_RULES.md` — Migration guidelines (MUST READ before writing SQL)

## Database Migrations

**CRITICAL: We use a shared Supabase database (same instance for dev and prod).**

Before writing ANY migration, read `supabase/MIGRATION_RULES.md`. Key rules:
- Files go in `supabase/migrations/` named `NNN_action_target.sql`
- Every migration MUST be idempotent (safe to run twice)
- Every migration MUST be wrapped in `begin; ... commit;`
- Use `if not exists` / `if exists` everywhere
- NEVER use `DROP TABLE` or `DROP COLUMN` on active tables
- New columns MUST be nullable or have defaults (backward-compatible)
- Always add RLS policies for new tables
- Update `supabase/schema.sql` after each migration

## Behavioral Rules

- NEVER hardcode API keys, secrets, or credentials in source files
- NEVER commit `.env` files
- ALWAYS read a file before editing it
- ALWAYS run tests after making code changes
- ALWAYS validate user input at system boundaries
- Keep files under 500 lines
- Use typed interfaces (Pydantic models) for all API boundaries
- Prefer editing existing files over creating new ones

## Environment Variables

```bash
# backend/.env (DO NOT COMMIT)
ANTHROPIC_API_KEY=sk-ant-...
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=               # optional for local
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=
GROQ_API_KEY=                 # existing chat service
SUPABASE_URL=
SUPABASE_KEY=
JWT_SECRET=
```

## Key Dependencies (to add)

```txt
# RAG Core
qdrant-client>=1.7.0
sentence-transformers>=2.3.0
transformers>=4.36.0
torch>=2.1.0
rank-bm25>=0.2.2

# Knowledge Graph
neo4j>=5.15.0

# Frameworks
langchain>=0.1.0
langchain-community>=0.0.10
llama-index>=0.10.0

# LLM
anthropic>=0.18.0

# Reranker
colbert-ai>=0.2.0

# Medical NLP
scispacy>=0.5.3
spacy>=3.7.0
```
