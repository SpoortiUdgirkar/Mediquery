import json
import uuid
import numpy as np
import requests
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime
from config import settings, LOCAL_DB_FILE

class LocalVectorStore:
    def __init__(self, db_path: Path = LOCAL_DB_FILE):
        self.db_path = db_path
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.chunks: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        if self.db_path.exists():
            try:
                with open(self.db_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.documents = data.get("documents", {})
                    self.chunks = data.get("chunks", [])
            except Exception as e:
                print(f"[LocalVectorStore] Error loading DB file: {e}")
                self.documents = {}
                self.chunks = []
        else:
            self.documents = {}
            self.chunks = []

    def _save(self):
        try:
            with open(self.db_path, "w", encoding="utf-8") as f:
                json.dump({
                    "documents": self.documents,
                    "chunks": self.chunks
                }, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[LocalVectorStore] Error saving DB file: {e}")

    def add_document(self, doc_data: Dict[str, Any], chunks: List[Dict[str, Any]]) -> str:
        doc_id = doc_data.get("id") or str(uuid.uuid4())
        doc_data["id"] = doc_id
        doc_data["created_at"] = doc_data.get("created_at") or datetime.utcnow().isoformat()
        
        self.documents[doc_id] = doc_data

        # Add chunks
        for chunk in chunks:
            chunk_copy = dict(chunk)
            chunk_copy["id"] = chunk_copy.get("id") or str(uuid.uuid4())
            chunk_copy["document_id"] = doc_id
            chunk_copy["document_name"] = doc_data.get("name", "Document")
            self.chunks.append(chunk_copy)

        self._save()
        return doc_id

    def list_documents(self) -> List[Dict[str, Any]]:
        return list(self.documents.values())

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        doc = self.documents.get(doc_id)
        if not doc:
            return None
        # Attach chunks
        doc_chunks = [c for c in self.chunks if c.get("document_id") == doc_id]
        res = dict(doc)
        res["chunks"] = doc_chunks
        return res

    def delete_document(self, doc_id: str) -> bool:
        if doc_id in self.documents:
            del self.documents[doc_id]
            self.chunks = [c for c in self.chunks if c.get("document_id") != doc_id]
            self._save()
            return True
        return False

    def clear_all(self):
        self.documents = {}
        self.chunks = []
        self._save()

    def search_chunks(
        self,
        query_embedding: List[float],
        query_text: str,
        top_k: int = 5,
        filter_doc_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Performs hybrid retrieval: Dense Cosine Similarity + Lexical / BM25 term overlap.
        """
        if not self.chunks:
            return []

        q_vec = np.array(query_embedding, dtype=np.float32)
        q_words = set(re_clean(w) for w in query_text.lower().split() if len(w) > 2)

        results = []
        for chunk in self.chunks:
            doc_id = chunk.get("document_id")
            if filter_doc_ids and doc_id not in filter_doc_ids:
                continue

            chunk_emb = chunk.get("embedding")
            if not chunk_emb:
                continue

            c_vec = np.array(chunk_emb, dtype=np.float32)
            
            # Auto-align vector dimensions if embedding model changed
            if q_vec.shape != c_vec.shape:
                from embeddings import embedding_service
                new_emb = embedding_service.generate_query_embedding(chunk.get("content", ""))
                c_vec = np.array(new_emb, dtype=np.float32)
                chunk["embedding"] = new_emb

            # Cosine similarity
            cosine_sim = float(np.dot(q_vec, c_vec) / (np.linalg.norm(q_vec) * np.linalg.norm(c_vec) + 1e-9))
            
            # Dynamic Lexical overlap
            content_lower = chunk.get("content", "").lower()
            overlap_count = sum(1 for w in q_words if w in content_lower)
            lexical_boost = min(0.35, overlap_count * 0.10)

            combined_score = float(np.clip(cosine_sim * 0.70 + lexical_boost, 0.0, 1.0))

            if combined_score >= 0.05:
                results.append({
                    "id": chunk.get("id"),
                    "document_id": doc_id,
                    "document_name": chunk.get("document_name", self.documents.get(doc_id, {}).get("name", "Document")),
                    "chunk_index": chunk.get("chunk_index", 0),
                    "page_number": chunk.get("page_number", 1),
                    "section_title": chunk.get("section_title", "General"),
                    "content": chunk.get("content", ""),
                    "similarity": combined_score,
                    "created_at": chunk.get("created_at")
                })

        # Sort by similarity descending
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]

    def get_all_biomarkers(self) -> List[Dict[str, Any]]:
        """Aggregates all extracted biomarkers across all stored reports."""
        all_markers = []
        for doc_id, doc in self.documents.items():
            markers = doc.get("extracted_biomarkers", [])
            for m in markers:
                item = dict(m)
                item["document_id"] = doc_id
                item["document_name"] = doc.get("name")
                item["document_date"] = doc.get("document_date") or item.get("date")
                all_markers.append(item)
        return all_markers


class SupabaseVectorStore:
    def __init__(self):
        self.url = settings.SUPABASE_URL.rstrip("/")
        self.key = settings.SUPABASE_KEY
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        self.fallback = LocalVectorStore()

    def is_configured(self) -> bool:
        return bool(self.url and self.key and "supabase" in self.url)

    def add_document(self, doc_data: Dict[str, Any], chunks: List[Dict[str, Any]]) -> str:
        if not self.is_configured():
            return self.fallback.add_document(doc_data, chunks)

        try:
            # 1. Insert document
            doc_payload = {
                "name": doc_data["name"],
                "file_type": doc_data.get("file_type", "pdf"),
                "file_size": doc_data.get("file_size", 0),
                "patient_name": doc_data.get("patient_name", "Patient"),
                "document_date": doc_data.get("document_date"),
                "category": doc_data.get("category", "General"),
                "page_count": doc_data.get("page_count", 1),
                "summary": doc_data.get("summary", ""),
                "extracted_biomarkers": doc_data.get("extracted_biomarkers", [])
            }
            resp = requests.post(f"{self.url}/rest/v1/documents", headers=self.headers, json=doc_payload, timeout=10)
            if resp.status_code not in [200, 201]:
                print(f"[Supabase] Insert doc error: {resp.text}, saving locally.")
                return self.fallback.add_document(doc_data, chunks)

            created_docs = resp.json()
            doc_id = created_docs[0]["id"] if created_docs else str(uuid.uuid4())

            # 2. Insert chunks
            chunk_payloads = []
            for c in chunks:
                chunk_payloads.append({
                    "document_id": doc_id,
                    "chunk_index": c.get("chunk_index", 0),
                    "page_number": c.get("page_number", 1),
                    "section_title": c.get("section_title", "General"),
                    "content": c.get("content", ""),
                    "embedding": c.get("embedding", []),
                    "metadata": {"document_name": doc_data["name"]}
                })

            c_resp = requests.post(f"{self.url}/rest/v1/document_chunks", headers=self.headers, json=chunk_payloads, timeout=15)
            if c_resp.status_code not in [200, 201]:
                print(f"[Supabase] Insert chunks error: {c_resp.text}")

            # Also keep a local cache
            doc_data["id"] = doc_id
            self.fallback.add_document(doc_data, chunks)
            return doc_id
        except Exception as e:
            print(f"[Supabase] Exception: {e}. Falling back to local store.")
            return self.fallback.add_document(doc_data, chunks)

    def list_documents(self) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return self.fallback.list_documents()

        try:
            resp = requests.get(f"{self.url}/rest/v1/documents?select=*&order=created_at.desc", headers=self.headers, timeout=10)
            if resp.status_code == 200:
                return resp.json()
            return self.fallback.list_documents()
        except Exception as e:
            print(f"[Supabase] list_documents error: {e}")
            return self.fallback.list_documents()

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_configured():
            return self.fallback.get_document(doc_id)

        try:
            resp = requests.get(f"{self.url}/rest/v1/documents?id=eq.{doc_id}&select=*,document_chunks(*)", headers=self.headers, timeout=10)
            if resp.status_code == 200 and resp.json():
                item = resp.json()[0]
                item["chunks"] = item.pop("document_chunks", [])
                return item
            return self.fallback.get_document(doc_id)
        except Exception:
            return self.fallback.get_document(doc_id)

    def delete_document(self, doc_id: str) -> bool:
        if not self.is_configured():
            return self.fallback.delete_document(doc_id)

        try:
            requests.delete(f"{self.url}/rest/v1/documents?id=eq.{doc_id}", headers=self.headers, timeout=10)
            self.fallback.delete_document(doc_id)
            return True
        except Exception:
            return self.fallback.delete_document(doc_id)

    def search_chunks(
        self,
        query_embedding: List[float],
        query_text: str,
        top_k: int = 5,
        filter_doc_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return self.fallback.search_chunks(query_embedding, query_text, top_k, filter_doc_ids)

        try:
            # Call RPC stored procedure 'match_document_chunks'
            payload = {
                "query_embedding": query_embedding,
                "match_threshold": settings.SIMILARITY_THRESHOLD,
                "match_count": top_k,
                "filter_doc_ids": filter_doc_ids
            }
            resp = requests.post(f"{self.url}/rest/v1/rpc/match_document_chunks", headers=self.headers, json=payload, timeout=12)
            if resp.status_code == 200:
                results = resp.json()
                if results:
                    return results
            # If RPC is not created yet or fails, fallback to local
            return self.fallback.search_chunks(query_embedding, query_text, top_k, filter_doc_ids)
        except Exception as e:
            print(f"[Supabase] Search RPC exception: {e}. Using local search.")
            return self.fallback.search_chunks(query_embedding, query_text, top_k, filter_doc_ids)

    def get_all_biomarkers(self) -> List[Dict[str, Any]]:
        return self.fallback.get_all_biomarkers()


def re_clean(word: str) -> str:
    import re
    return re.sub(r"[^\w]", "", word)


def get_vector_store():
    if settings.VECTOR_STORE_MODE == "supabase" and settings.SUPABASE_URL and settings.SUPABASE_KEY:
        return SupabaseVectorStore()
    return LocalVectorStore()
