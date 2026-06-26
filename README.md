<div align="center">

# NeuroMedica

**Explainable, citation-backed AI for clinical decision support and medical education.**

A unified platform that pairs a production-grade medical **Retrieval-Augmented Generation (RAG)** pipeline with **explainable deep-learning models** for ECG and chest X-ray interpretation — every answer grounded in sources, every prediction visualised.

[Overview](#overview) · [Architecture](#architecture) · [Features](#features) · [Tech Stack](#tech-stack) · [Quick Start](#quick-start) · [API](#api-reference) · [Project Structure](#project-structure) · [Deployment](#deployment)

</div>

---

## Overview

NeuroMedica is a full-stack medical AI platform built around a single principle: **clinical AI must be explainable and verifiable.** Generic chatbots hallucinate; black-box classifiers can't be trusted at the bedside. NeuroMedica addresses both.

- **Answers are grounded.** A hybrid RAG pipeline (dense + sparse + knowledge-graph retrieval, reranking, and a self-evaluation loop) retrieves from PubMed, clinical guidelines, FDA drug labels, and RxNorm before any text is generated — then cites every source.
- **Predictions are visual.** The chest X-ray classifier ships with Grad-CAM heatmaps; the 12-lead ECG model returns per-condition confidence and clinical interpretation, not just a label.
- **Safety is built in.** When retrieval confidence is low, the system says so ("Insufficient evidence") instead of guessing.

> **Disclaimer:** NeuroMedica is an educational and decision-support tool. It is **not** a medical device and must not be used as a substitute for professional clinical judgement.

---

## Architecture

```
                                  ┌──────────────────────────────┐
   Next.js 15 / React 19  ───────▶│        FastAPI Gateway       │
   (App Router, Supabase Auth)    └───────────────┬──────────────┘
                                                  │
        ┌─────────────────────────────────────────┼─────────────────────────────────────┐
        │                                          │                                     │
        ▼                                          ▼                                     ▼
┌───────────────┐                  ┌───────────────────────────┐               ┌──────────────────┐
│   RAG Engine  │                  │   Imaging / Signal Models  │               │  Doctor Workspace │
├───────────────┤                  ├───────────────────────────┤               ├──────────────────┤
│ Query → MeSH  │                  │ ECG  : PTB-XL 12-lead CNN  │               │ Patients         │
│ Hybrid search │                  │ CXR  : DenseNet-121 +      │               │ Reports (PDF)    │
│  · Dense (Qdrant/PubMedBERT)     │        Grad-CAM            │               │ Conversations    │
│  · Sparse (BM25)                 │ Rx   : Vision OCR scan     │               └──────────────────┘
│  · Graph (Neo4j/UMLS)            └───────────────────────────┘
│ RRF fusion    │
│ BGE rerank    │                  Data stores
│ CRAG evaluate │                  ┌───────────────────────────┐
│ PubMed fallbk │                  │ Qdrant (vectors)          │
│ Claude / Groq │                  │ Neo4j  (UMLS/SNOMED graph)│
└───────────────┘                  │ Supabase (Postgres + Auth)│
                                   └───────────────────────────┘
```

The RAG flow follows the [CRAG](https://arxiv.org/abs/2401.15884) pattern: **query understanding → hybrid retrieval → reciprocal rank fusion → reranking → relevance self-evaluation → grounded generation with citations.** Low-confidence retrievals trigger a live PubMed fallback before generation rather than producing an unsupported answer.

---

## Features

| Module | Description | Frontend | Backend |
|---|---|---|---|
| **Medical Chat** | Multi-turn, streaming, citation-backed clinical Q&A over the full RAG pipeline | `/protected/chat` | `/api/chat` |
| **Medical Q&A** | Single-shot grounded answers with source cards | `/protected/medical-qa` | `/api/chat`, `/api/retrieval` |
| **Symptom Explorer** | Structured symptom → differential reasoning with citations | `/protected/symptom-explorer` | `/api/symptoms` |
| **ECG Analysis** | 12-lead diagnostic CNN (PTB-XL) with per-condition confidence; accepts WFDB signals or ECG images (auto-digitised) | `/protected/ecg-signal-analysis` | `/api/ecg` |
| **Chest X-Ray** | DenseNet-121 multi-label classifier with **Grad-CAM** explainability heatmaps | `/protected/chest-x-ray` | `/api/cxr` |
| **Prescription Scan** | Vision OCR of handwritten/printed prescriptions (Groq vision, Claude fallback) | — | `/api/prescription/scan` |
| **Report Generator** | Generates and exports clinical reports to PDF | `/protected/report-generator` | `/api/chat` |
| **Doctor Dashboard** | Patient records, documentation, settings, support | `/protected/doctors/*` | Supabase |

**Knowledge sources wired into ingestion:** PubMed research articles, clinical practice guidelines, FDA drug labels (OpenFDA / SPL), and RxNorm drug concepts (RxNav) — each tagged so retrieval, reranking, and citation rendering can distinguish them.

---

## Tech Stack

### Frontend
| Concern | Choice |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| UI | [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) (Radix primitives) |
| Auth | [Supabase](https://supabase.com/) (SSR) |
| UX | [Framer Motion](https://www.framer.com/motion/), [Lucide](https://lucide.dev/), `react-markdown` + `remark-gfm` |
| PDF export | `jspdf` + `html2canvas` |
| Testing | [Vitest](https://vitest.dev/) |

### Backend
| Concern | Choice |
|---|---|
| Framework | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) (Python 3.13) |
| Vector DB | [Qdrant](https://qdrant.tech/) (dense ANN) |
| Knowledge Graph | [Neo4j](https://neo4j.com/) (UMLS / SNOMED-CT) |
| Embeddings | PubMedBERT (`S-PubMedBert-MS-MARCO`) + BM25 sparse |
| Reranker | `BAAI/bge-reranker-base` (ColBERT-style late interaction) |
| Generation | [Anthropic Claude](https://www.anthropic.com/) (primary) with [Groq](https://groq.com/) fallback |
| ECG model | TensorFlow / Keras 3 CNN trained on PTB-XL; `wfdb`, `neurokit2`, `scipy` |
| CXR model | PyTorch / torchvision DenseNet-121 + Grad-CAM |
| Validation | [Pydantic](https://docs.pydantic.dev/) v2 |

---

## Prerequisites

- **Node.js** ≥ 18 ([download](https://nodejs.org/))
- **Python** 3.13 ([download](https://www.python.org/downloads/))
- **Git**
- **Supabase** project ([sign up](https://supabase.com/))
- **Anthropic** and/or **Groq** API key
- *(Optional, for full RAG)* **Qdrant** and **Neo4j** instances — local via Docker or managed (Qdrant Cloud / AuraDB)

The app runs without Qdrant/Neo4j; RAG simply degrades to live PubMed retrieval and the imaging models work standalone.

---

## Quick Start

### 1. Clone

```bash
git clone <repository-url>
cd neuroMedica
```

### 2. Frontend

```bash
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_or_publishable_key
NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000
```

### 3. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

> **Note:** `torch` / `torchvision` (CXR DenseNet backbone) are installed separately in the Dockerfile as CPU-only builds to keep the image small. For local CXR work, install a build matching your platform from [pytorch.org](https://pytorch.org/get-started/locally/).

Create `backend/.env`:

```env
# --- Generation (at least one required) ---
ANTHROPIC_API_KEY=sk-ant-...          # primary generator
GROQ_API_KEY=gsk_...                  # fallback + prescription OCR

# --- Supabase ---
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # keep secret

# --- Vector DB (optional) ---
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=pubmed_articles

# --- Knowledge Graph (optional) ---
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=

# --- App ---
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
PRELOAD_MODELS=true                   # set false on constrained/free tiers
DEBUG=false
```

### 4. (Optional) Infrastructure via Docker

```bash
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:5
```

### 5. Run

```bash
# Backend (from backend/)
uvicorn app.main:app --reload --port 8000

# Frontend (from project root)
npm run dev
```

- Frontend → http://localhost:3000
- API → http://localhost:8000 · Interactive docs → http://localhost:8000/docs · Health → http://localhost:8000/health

> On first start with `PRELOAD_MODELS=true`, the backend warms the embedder, reranker, BM25 index, and the ECG/CXR models (~25 s) so the first user request is fast. Set `PRELOAD_MODELS=false` to lazy-load instead.

---

## API Reference

Interactive OpenAPI docs are served at **`/docs`**. Authenticated routes expect a Supabase JWT: `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness + version |
| `POST` | `/api/chat/message` | Grounded chat reply |
| `POST` | `/api/chat/stream` | Streaming (SSE) chat |
| `POST` | `/api/chat/generate-title` | Auto-title a conversation |
| `POST` | `/api/symptoms/explore` · `/explore/stream` | Symptom → differential reasoning |
| `POST` | `/api/retrieval/search` | Hybrid retrieval (debug) |
| `POST` | `/api/retrieval/rebuild-index` | Rebuild BM25 index |
| `POST` | `/api/reranking/search` | Retrieval + rerank (debug) |
| `POST` | `/api/ingestion/ingest` | Ingest PubMed articles |
| `POST` | `/api/ingestion/guidelines` | Ingest practice guidelines |
| `POST` | `/api/ingestion/openfda` | Ingest FDA drug labels |
| `POST` | `/api/ingestion/rxnorm` | Ingest RxNorm concepts |
| `GET` | `/api/ingestion/status` | Index / collection stats |
| `POST` | `/api/ecg/analyze` · `/analyze-sample` | 12-lead ECG diagnosis |
| `POST` | `/api/cxr/analyze` | Chest X-ray classification |
| `POST` | `/api/cxr/gradcam` | Grad-CAM explainability heatmap |
| `POST` | `/api/prescription/scan` | Prescription vision OCR (Next.js route) |

<details>
<summary><b>Example — chat request</b></summary>

```http
POST /api/chat/message
Authorization: Bearer <supabase_token>
Content-Type: application/json

{
  "message": "What is the first-line treatment for type 2 diabetes?",
  "conversation_id": "optional-uuid",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "How can I help?" }
  ]
}
```

Returns a grounded answer with attached source citations and a `conversation_id`.
</details>

---

## Project Structure

```
neuroMedica/
├── app/                        # Next.js App Router
│   ├── api/                    # Route handlers (chat proxy, cxr/gradcam, prescription/scan)
│   ├── auth/                   # Login, sign-up, password reset, OAuth callback
│   └── protected/              # Authenticated app
│       ├── chat/ medical-qa/ symptom-explorer/
│       ├── ecg-signal-analysis/ chest-x-ray/ report-generator/
│       └── doctors/            # Patients, documentation, settings, support
│
├── backend/app/
│   ├── api/                    # FastAPI routers (chat, ingestion, retrieval, reranking, ecg, cxr, symptoms)
│   ├── core/                   # Config, security (JWT), Qdrant factory
│   ├── ingestion/              # Chunker, PubMedBERT embedder, Qdrant store, source fetchers
│   ├── retrieval/              # Dense / sparse / graph retrievers, RRF, MeSH resolver, query classifier
│   ├── reranking/              # BGE reranker
│   ├── evaluation/             # CRAG self-evaluation loop
│   ├── generation/             # Claude + Groq generators
│   ├── knowledge_graph/        # Neo4j (UMLS / SNOMED-CT)
│   ├── ecg/                    # PTB-XL 12-lead model, parser, image digitizer, training
│   ├── cxr/                    # DenseNet-121, transforms, Grad-CAM
│   ├── services/               # RAGService orchestrator, chat service
│   └── main.py                 # App entry + model warmup lifespan
│
├── components/                 # React UI (chatbot, doctors, landing, ui/)
├── lib/                        # Supabase clients, chatbot api-client/hooks/types
├── supabase/migrations/        # 001 conversations · 002 messages · 003 patients · 004 reports
└── README.md
```

---

## Development

### Scripts

```bash
# Frontend
npm run dev          # dev server
npm run build        # production build
npm run lint         # ESLint
npm test             # Vitest

# Backend
uvicorn app.main:app --reload --port 8000          # dev
uvicorn app.main:app --workers 4 --host 0.0.0.0    # production
python -m pytest tests/ -v                          # tests
```

### Conventions

- **Files under 500 lines.** Typed boundaries everywhere — Pydantic models on the backend, TypeScript interfaces on the frontend.
- **No secrets in source.** `.env` files are git-ignored; never commit credentials.
- **Migrations are append-only and idempotent.** Read `supabase/MIGRATION_RULES.md` before writing SQL — the same Supabase instance is shared across environments.
- **Always run the relevant test suite after a change.**

### Environment Variables

<details>
<summary><b>Frontend (<code>.env.local</code>)</b></summary>

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/publishable key |
| `NEXT_PUBLIC_CHAT_API_URL` | ✅ | Backend base URL |
</details>

<details>
<summary><b>Backend (<code>backend/.env</code>)</b></summary>

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ | Fallback generator + prescription OCR |
| `ANTHROPIC_API_KEY` | ⬚ | Primary generator (Claude); falls back to Groq if unset |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service-role key (secret) |
| `QDRANT_URL` / `QDRANT_API_KEY` / `QDRANT_COLLECTION` | ⬚ | Vector store |
| `NEO4J_URI` / `NEO4J_USER` / `NEO4J_PASSWORD` | ⬚ | Knowledge graph |
| `EMBEDDING_MODEL` | ⬚ | Override embedder (default `pritamdeka/S-PubMedBert-MS-MARCO`) |
| `CLAUDE_MODEL` | ⬚ | Override Claude model (default `claude-sonnet-4-6`) |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS origins |
| `PRELOAD_MODELS` | ⬚ | Warm models at startup (default `true`) |
| `DEBUG` | ⬚ | Verbose mode |
</details>

---

## Deployment

The backend ships with a CPU-only Docker image (Torch/TF installed lean) and is designed for platforms such as **Railway** with managed **Qdrant Cloud** and **Neo4j AuraDB**.

- Set `PRELOAD_MODELS=false` on free/constrained tiers so startup completes inside the platform's health-check window (models then lazy-load on first request).
- `ALLOWED_ORIGINS` must include the deployed frontend origin.
- The frontend deploys to any Next.js host (e.g. Vercel) with `NEXT_PUBLIC_CHAT_API_URL` pointed at the backend.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL is not defined` | Ensure `.env.local` exists in the root and restart the dev server. |
| Frontend can't reach the API | Confirm the backend is on port 8000 and `NEXT_PUBLIC_CHAT_API_URL` matches. |
| CORS errors | Add the frontend origin to `ALLOWED_ORIGINS` in `backend/.env`. |
| `ModuleNotFoundError` | Activate the venv and `pip install -r requirements.txt`. |
| Slow first request | Expected with `PRELOAD_MODELS=true` off — models lazy-load once, then stay warm. |
| "Insufficient evidence" answers | RAG retrieval found nothing relevant; ingest sources or check Qdrant connectivity. |
| Port 8000 in use | Run on another port and update `NEXT_PUBLIC_CHAT_API_URL`. |

---

## Contributing

1. Branch from `main`: `git checkout -b feature/your-feature`
2. Make changes; keep files small and typed.
3. Run `npm run lint`, `npm test`, and `python -m pytest`.
4. Open a pull request with a clear description.

---

## License

To be defined by the project owners.

---

<div align="center">

**Built for safer, more transparent medical AI.**

</div>
