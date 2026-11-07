import os
import shutil
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from config import settings, UPLOADS_DIR
from parsers import parse_pdf_bytes, parse_text_content, chunk_document_pages, extract_metadata_hints, extract_biomarkers_from_text
from embeddings import embedding_service
from vector_store import get_vector_store
from rag_service import rag_service
from sample_data import seed_sample_data, SAMPLE_REPORTS

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="MediQuery: AI-Powered Medical Document Assistant using RAG with pgvector and Multi-Report Comparison."
)

# Enable CORS for frontend Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request/Response Models ---

class QueryRequest(BaseModel):
    question: str
    filter_doc_ids: Optional[List[str]] = None
    chat_history: Optional[List[Dict[str, str]]] = None

class ConfigUpdateRequest(BaseModel):
    vector_store_mode: Optional[str] = None
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    llm_provider: Optional[str] = None

class CompareRequest(BaseModel):
    document_ids: List[str]


# --- Health & Config Endpoints ---

@app.get("/api/health")
def health_check():
    store = get_vector_store()
    doc_count = len(store.list_documents())
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "vector_store_mode": settings.VECTOR_STORE_MODE,
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "documents_count": doc_count
    }


@app.get("/api/config")
def get_config():
    return {
        "vector_store_mode": settings.VECTOR_STORE_MODE,
        "supabase_url": settings.SUPABASE_URL[:15] + "..." if settings.SUPABASE_URL else "",
        "supabase_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "llm_provider": settings.LLM_PROVIDER
    }


@app.post("/api/config")
def update_config(payload: ConfigUpdateRequest):
    if payload.vector_store_mode is not None:
        settings.VECTOR_STORE_MODE = payload.vector_store_mode
    if payload.supabase_url is not None:
        settings.SUPABASE_URL = payload.supabase_url
    if payload.supabase_key is not None:
        settings.SUPABASE_KEY = payload.supabase_key
    if payload.gemini_api_key is not None:
        settings.GEMINI_API_KEY = payload.gemini_api_key
    if payload.openai_api_key is not None:
        settings.OPENAI_API_KEY = payload.openai_api_key
    if payload.llm_provider is not None:
        settings.LLM_PROVIDER = payload.llm_provider
    return {"status": "updated", "config": get_config()}


# --- Document Management Endpoints ---

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    patient_name: Optional[str] = Form(None)
):
    try:
        content = await file.read()
        file_name = file.filename or "uploaded_document"
        file_size = len(content)
        file_ext = os.path.splitext(file_name)[1].lower()

        # Parse text from file
        if file_ext == ".pdf":
            pages = parse_pdf_bytes(content)
        else:
            try:
                text_str = content.decode("utf-8")
            except UnicodeDecodeError:
                text_str = content.decode("latin-1", errors="ignore")
            pages = parse_text_content(text_str)

        full_extracted_text = "\n\n".join([p["text"] for p in pages])
        if not full_extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract any readable text from the document.")

        # Extract metadata hints
        meta_hints = extract_metadata_hints(full_extracted_text)
        final_patient = patient_name or meta_hints.get("patient_name", "Patient")
        final_category = category or meta_hints.get("category", "General Medical Report")
        final_date = meta_hints.get("document_date")

        # Chunk document
        chunks = chunk_document_pages(pages, chunk_size=settings.CHUNK_SIZE, overlap=settings.CHUNK_OVERLAP)
        if not chunks:
            chunks = [{"chunk_index": 0, "page_number": 1, "section_title": "General", "content": full_extracted_text[:1000]}]

        # Extract structured biomarkers
        biomarkers = extract_biomarkers_from_text(full_extracted_text, doc_date=final_date)

        # Compute embeddings for all chunks
        chunk_texts = [c["content"] for c in chunks]
        embeddings = embedding_service.generate_embeddings(chunk_texts)
        for i, c in enumerate(chunks):
            c["embedding"] = embeddings[i]

        doc_id = str(uuid.uuid4())
        doc_data = {
            "id": doc_id,
            "name": file_name,
            "file_type": file_ext.replace(".", ""),
            "file_size": file_size,
            "patient_name": final_patient,
            "document_date": final_date,
            "category": final_category,
            "page_count": len(pages),
            "summary": f"Extracted {len(chunks)} chunks and {len(biomarkers)} clinical biomarker metrics.",
            "extracted_biomarkers": biomarkers
        }

        # Save to vector store
        store = get_vector_store()
        saved_id = store.add_document(doc_data, chunks)

        return {
            "status": "success",
            "document": doc_data,
            "chunk_count": len(chunks),
            "biomarker_count": len(biomarkers)
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@app.get("/api/documents")
def list_documents():
    store = get_vector_store()
    return store.list_documents()


@app.get("/api/documents/{doc_id}")
def get_document(doc_id: str):
    store = get_vector_store()
    doc = store.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: str):
    store = get_vector_store()
    success = store.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "deleted", "id": doc_id}


# --- RAG Chat Query Endpoint ---

@app.post("/api/chat/query")
def chat_query(req: QueryRequest):
    try:
        response = rag_service.query(
            question=req.question,
            filter_doc_ids=req.filter_doc_ids,
            chat_history=req.chat_history
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG query execution error: {str(e)}")


# --- Biomarker Analytics & Trends Endpoint ---

@app.get("/api/analytics/biomarkers")
def get_biomarker_analytics():
    store = get_vector_store()
    raw_markers = store.get_all_biomarkers()

    grouped: Dict[str, Dict[str, Any]] = {}

    for m in raw_markers:
        name = m.get("name")
        if not name:
            continue

        if name not in grouped:
            grouped[name] = {
                "name": name,
                "category": m.get("category", "General"),
                "unit": m.get("unit", ""),
                "reference_range": m.get("reference_range", ""),
                "reference_min": m.get("reference_min", 0),
                "reference_max": m.get("reference_max", 100),
                "history": []
            }

        grouped[name]["history"].append({
            "date": m.get("date") or m.get("document_date", "Unknown"),
            "value": m.get("value"),
            "status": m.get("status", "NORMAL"),
            "document_name": m.get("document_name", "Report"),
            "document_id": m.get("document_id")
        })

    # Sort history chronologically and calculate delta
    trend_summary = []
    for name, item in grouped.items():
        # Sort by date
        item["history"].sort(key=lambda x: x["date"])
        
        # Calculate delta if multiple entries
        if len(item["history"]) >= 2:
            first_val = item["history"][0]["value"]
            latest_val = item["history"][-1]["value"]
            delta = round(latest_val - first_val, 2)
            pct_change = round(((latest_val - first_val) / (first_val + 1e-6)) * 100, 1)
        else:
            delta = 0.0
            pct_change = 0.0

        latest_entry = item["history"][-1] if item["history"] else {}
        trend_summary.append({
            "name": name,
            "category": item["category"],
            "unit": item["unit"],
            "reference_range": item["reference_range"],
            "reference_min": item["reference_min"],
            "reference_max": item["reference_max"],
            "latest_value": latest_entry.get("value"),
            "latest_status": latest_entry.get("status", "NORMAL"),
            "latest_date": latest_entry.get("date"),
            "delta": delta,
            "pct_change": pct_change,
            "data_points": len(item["history"]),
            "history": item["history"]
        })

    # Sort so items with abnormal status or multiple data points appear first
    trend_summary.sort(key=lambda x: (x["latest_status"] != "NORMAL", x["data_points"] > 1, x["name"]), reverse=True)
    return trend_summary


# --- Multi-Report Comparison Endpoint ---

@app.post("/api/documents/compare")
def compare_documents(req: CompareRequest):
    store = get_vector_store()
    docs = []
    for d_id in req.document_ids:
        doc = store.get_document(d_id)
        if doc:
            docs.append(doc)

    if len(docs) < 2:
        raise HTTPException(status_code=400, detail="Please select at least 2 documents to compare.")

    # Build comparison matrix of all extracted biomarkers
    marker_matrix: Dict[str, Dict[str, Any]] = {}

    for doc in docs:
        d_name = doc.get("name")
        d_date = doc.get("document_date", "N/A")
        for m in doc.get("extracted_biomarkers", []):
            m_name = m.get("name")
            if m_name not in marker_matrix:
                marker_matrix[m_name] = {
                    "biomarker": m_name,
                    "category": m.get("category", "General"),
                    "unit": m.get("unit", ""),
                    "reference_range": m.get("reference_range", ""),
                    "values_by_doc": {}
                }
            marker_matrix[m_name]["values_by_doc"][doc["id"]] = {
                "value": m.get("value"),
                "status": m.get("status"),
                "date": d_date,
                "document_name": d_name
            }

    matrix_rows = list(marker_matrix.values())

    return {
        "documents": [{"id": d["id"], "name": d["name"], "date": d.get("document_date"), "category": d.get("category")} for d in docs],
        "comparison_matrix": matrix_rows
    }


# --- Demo Seeding & Reset Endpoints ---

@app.post("/api/demo/seed")
def seed_demo():
    result = seed_sample_data()
    return result


@app.post("/api/demo/reset")
def reset_demo():
    store = get_vector_store()
    if hasattr(store, "clear_all"):
        store.clear_all()
    return {"status": "cleared", "message": "All documents and vector records have been reset."}


# Auto-seed sample reports on initial startup if store is empty
@app.on_event("startup")
def startup_event():
    store = get_vector_store()
    if len(store.list_documents()) == 0:
        print("[Startup] Seeding initial clinical demo dataset...")
        seed_sample_data()


# --- Static Frontend Serving (Unified Deployment) ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    if (FRONTEND_DIST / "assets").exists():
        app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Ignore API calls that might slip through
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        target_file = FRONTEND_DIST / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(FRONTEND_DIST / "index.html")

