# 🩺 MediQuery — AI-Powered Medical Document Assistant (RAG)

MediQuery is a specialized Retrieval-Augmented Generation (RAG) application engineered to help users securely upload, understand, search, and compare their medical documents (e.g., blood tests, metabolic panels, prescriptions, clinical discharge summaries) using conversational AI with strict source citations and longitudinal biomarker trend tracking.

> ⚠️ **Important Medical Disclaimer**:
> MediQuery provides informational document extraction and retrieval only. It does not provide medical diagnoses, treatment decisions, or medical advice. Always consult a qualified healthcare provider regarding clinical lab results or health conditions.

---

## 🌟 Key Features

1. **Intelligent Document Ingestion & Chunking**:
   - Parses multi-page clinical PDFs, text lab reports, and prescriptions.
   - Preserves section hierarchy (*Complete Blood Count, Lipid Panel, Metabolic Profile, Medications, Clinical Impression*).
   - Extracts structured quantitative biomarkers (*Hemoglobin, Fasting Blood Sugar, HbA1c, Total Cholesterol, LDL, HDL, Triglycerides, TSH, Creatinine, etc.*) with units and reference intervals.

2. **Grounded RAG Search & Strict Source Citations**:
   - Hybrid semantic search (*Cosine vector similarity + exact clinical keyword matching*).
   - Every answer displays clickable **Verified Source Cards** citing the exact document name, page number, section, and text excerpt.
   - Contextual follow-up query suggestions and medical terminology plain-English explanations.

3. **Longitudinal Biomarker Analytics & Trend Tracking**:
   - Interactive charts (*Recharts Area/Line views*) tracking physiological biomarker trajectories across multiple dated reports.
   - Calculates deltas and percentage changes (*e.g., LDL Cholesterol decreased by -23.9%*).
   - Highlights normal, borderline, and out-of-range indicators.

4. **Multi-Report Side-by-Side Comparison**:
   - Select 2 or more reports to generate a comprehensive parameter comparison matrix.
   - 1-click AI comparative summary analyzing what improved or changed between visits.

5. **Dual-Store Architecture (Zero-Setup Local + Supabase pgvector)**:
   - **Local Mode (Default)**: Instant zero-configuration local vector store & cosine indexing.
   - **Supabase pgvector Mode**: Cloud PostgreSQL vector index via `supabase_schema.sql` with HNSW index and `match_document_chunks` RPC.

6. **Pluggable LLM Support**:
   - Google Gemini (`gemini-2.0-flash` / `gemini-1.5-flash`)
   - OpenAI (`gpt-4o-mini` / `gpt-3.5-turbo`)
   - Built-in High-Precision Clinical Synthesizer *(works immediately without external API keys)*.

---

## 📁 Project Structure

```
mediquery/
├── run.py                       # 🚀 Unified runner (runs frontend + backend together)
├── package.json                 # Unified npm workspace scripts
├── README.md                    # Project documentation
├── backend/
│   ├── main.py                  # FastAPI REST endpoints & Static React SPA serving
│   ├── config.py                # Environment & retrieval settings
│   ├── parsers.py               # PDF/Text parser, chunker & biomarker extractor
│   ├── embeddings.py            # Vector embedding provider (Gemini / OpenAI / Local Semantic)
│   ├── vector_store.py          # Local JSON/Numpy Vector Store & Supabase pgvector client
│   ├── rag_service.py           # Grounded RAG query pipeline & prompt orchestration
│   ├── sample_data.py           # 4 realistic pre-seeded clinical reports
│   ├── supabase_schema.sql      # Supabase PostgreSQL + pgvector migration script
│   └── requirements.txt         # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.tsx                   # Header with tabs, mode indicator & seed buttons
    │   │   ├── ChatInterface.tsx            # Conversational RAG chat with citations & pills
    │   │   ├── DocumentVault.tsx            # File dropzone & document grid
    │   │   ├── BiomarkerAnalytics.tsx       # Recharts trend graphs & biomarker KPI cards
    │   │   ├── MultiReportCompare.tsx       # Side-by-side report parameter matrix
    │   │   ├── CitationInspectorModal.tsx   # Verified source inspector popup
    │   │   ├── DocumentViewerModal.tsx      # Document chunk & biomarker inspector
    │   │   ├── MedicalDisclaimerModal.tsx   # Patient safety policy
    │   │   └── SettingsModal.tsx            # Vector store (pgvector) & LLM key configuration
    │   ├── services/
    │   │   └── api.ts                       # Backend API client
    │   ├── types/
    │   │   └── index.ts                     # TypeScript definitions
    │   ├── App.tsx                          # Main application state and layout
    │   └── index.css                        # Modern medical dark theme & design system
    ├── package.json
    └── vite.config.ts
```

---

## 🚀 Quick Start Guide (Run Everything Together)

### 🌟 Option 1: Unified Single-Command Run (Recommended)

Run everything together on a single port (`http://127.0.0.1:8000`):

```bash
# In project root (C:\Users\spoor\.gemini\antigravity-ide\scratch\mediquery)
python run.py
```

FastAPI will serve **both** the React Web Application and all RAG APIs from `http://127.0.0.1:8000`.

---

### 🛠️ Option 2: Unified Development Mode (Hot-Reload)

Run backend and frontend with live hot-reload simultaneously:

```bash
python run.py --dev
```
- Frontend UI: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000` (Proxy configured)

---

## ☁️ Supabase pgvector Setup (Optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the script located at `backend/supabase_schema.sql`.
4. In MediQuery's top bar, click the **Settings** icon.
5. Select **Supabase + pgvector**, paste your **Supabase URL** and **Service Role / Anon Key**, then click **Save**.
