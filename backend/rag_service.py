import re
import requests
from typing import List, Dict, Any, Optional
from config import settings
from embeddings import embedding_service
from vector_store import get_vector_store
from parsers import extract_biomarkers_from_text

MEDICAL_DISCLAIMER = "MediQuery provides informational document extraction and retrieval only. This is not medical advice, a diagnosis, or a treatment plan. Always consult a qualified healthcare provider regarding clinical lab results or health conditions."

SYSTEM_PROMPT = f"""You are MediQuery, an intelligent and compassionate medical document assistant.
Your job is to help patients understand and find specific information within their uploaded medical reports, lab results, prescriptions, and clinical summaries.

CRITICAL RULES:
1. STRICT GROUNDING: Answer ONLY based on the provided document excerpts below. Do NOT fabricate or speculate on unmentioned facts.
2. CITATIONS: Whenever stating a clinical finding, lab metric, or doctor instruction, cite the source document and page (e.g. '[Source: Complete Blood Count, Page 1]').
3. EXPLAIN TERMS: Explain medical jargon in simple, empathetic, plain English based on the report.
4. REFERENCE RANGES: State the patient's value, the standard reference interval, units, and whether it is Normal, Low, or High according to the report.
5. MEDICAL SAFETY: Emphasize that you are an informational assistant and encourage discussing results with their physician.

DISCLAIMER TO KEEP IN MIND:
{MEDICAL_DISCLAIMER}
"""

class RAGService:
    def __init__(self):
        self.vector_store = get_vector_store()

    def query(
        self,
        question: str,
        filter_doc_ids: Optional[List[str]] = None,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Pure dynamic RAG retrieval pipeline:
        1. Encodes query into dense vector embedding
        2. Retrieves top-K semantically matching chunks from vector database
        3. Dynamically extracts parameters from retrieved excerpts
        4. Synthesizes grounded answer using LLM (Gemini/OpenAI) or dynamic clinical context generator
        """
        clean_q = question.strip()
        if not clean_q:
            return {
                "answer": "Please ask a question about your uploaded medical documents.",
                "citations": [],
                "detected_biomarkers": [],
                "suggested_followups": [],
                "disclaimer": MEDICAL_DISCLAIMER
            }

        # 1. Generate query dense embedding
        q_embedding = embedding_service.generate_query_embedding(clean_q)

        # 2. Retrieve top matching chunks
        matched_chunks = self.vector_store.search_chunks(
            query_embedding=q_embedding,
            query_text=clean_q,
            top_k=settings.TOP_K_CHUNKS,
            filter_doc_ids=filter_doc_ids
        )

        # Fallback if strict threshold produced no chunks but documents exist in vault
        if not matched_chunks:
            all_docs = self.vector_store.list_documents()
            if all_docs:
                target_doc = all_docs[0]
                doc_detail = self.vector_store.get_document(target_doc["id"])
                if doc_detail and doc_detail.get("chunks"):
                    matched_chunks = [{
                        "id": c.get("id"),
                        "document_id": target_doc["id"],
                        "document_name": target_doc["name"],
                        "chunk_index": c.get("chunk_index", 0),
                        "page_number": c.get("page_number", 1),
                        "section_title": c.get("section_title", "General"),
                        "content": c.get("content", ""),
                        "similarity": 0.45
                    } for c in doc_detail["chunks"][:3]]

        if not matched_chunks:
            return {
                "answer": "I could not find any relevant information in your uploaded documents regarding your question. Please ensure your medical report is uploaded or try rephrasing your search.",
                "citations": [],
                "detected_biomarkers": [],
                "suggested_followups": [
                    "What documents are currently in my vault?",
                    "What are the main findings in my latest report?",
                    "Summarize my latest lab results"
                ],
                "disclaimer": MEDICAL_DISCLAIMER
            }

        # 3. Dynamically extract biomarkers from matched chunks
        combined_chunk_text = "\n\n".join([c["content"] for c in matched_chunks])
        detected_biomarkers = extract_biomarkers_from_text(combined_chunk_text)

        # 4. Generate answer via LLM (Gemini / OpenAI / Dynamic Generator)
        answer = self._generate_llm_response(clean_q, matched_chunks, detected_biomarkers, chat_history)

        # 5. Format citations
        citations = []
        for idx, chunk in enumerate(matched_chunks):
            citations.append({
                "citation_id": f"cit-{idx + 1}",
                "document_id": chunk.get("document_id"),
                "document_name": chunk.get("document_name", "Medical Report"),
                "page_number": chunk.get("page_number", 1),
                "section_title": chunk.get("section_title", "Clinical Findings"),
                "snippet": chunk.get("content", "")[:280] + ("..." if len(chunk.get("content", "")) > 280 else ""),
                "similarity_score": round(chunk.get("similarity", 0.0), 3)
            })

        # 6. Generate dynamic contextual followups based on query and results
        followups = self._generate_dynamic_followups(clean_q, detected_biomarkers)

        return {
            "answer": answer,
            "citations": citations,
            "detected_biomarkers": detected_biomarkers,
            "suggested_followups": followups,
            "disclaimer": MEDICAL_DISCLAIMER
        }

    def _generate_llm_response(
        self,
        question: str,
        chunks: List[Dict[str, Any]],
        biomarkers: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        # 1. Try Gemini if configured
        if settings.GEMINI_API_KEY and (settings.LLM_PROVIDER in ["gemini", "auto"]):
            try:
                res = self._call_gemini_api(question, chunks, chat_history)
                if res:
                    return res
            except Exception as e:
                print(f"[RAGService] Gemini generation warning: {e}")

        # 2. Try OpenAI if configured
        if settings.OPENAI_API_KEY and (settings.LLM_PROVIDER in ["openai", "auto"]):
            try:
                res = self._call_openai_api(question, chunks, chat_history)
                if res:
                    return res
            except Exception as e:
                print(f"[RAGService] OpenAI generation warning: {e}")

        # 3. Dynamic grounded synthesizer
        return self._dynamic_clinical_synthesizer(question, chunks, biomarkers)

    def _call_gemini_api(self, question: str, chunks: List[Dict[str, Any]], chat_history: Optional[List[Dict[str, str]]] = None) -> Optional[str]:
        context_parts = []
        for i, c in enumerate(chunks):
            context_parts.append(f"--- EXCERPT {i+1} [Document: {c.get('document_name')}, Page {c.get('page_number')}, Section: {c.get('section_title')}] ---\n{c.get('content')}")
        context_str = "\n\n".join(context_parts)

        prompt = f"""{SYSTEM_PROMPT}

DOCUMENT EXCERPTS:
{context_str}

PATIENT QUESTION:
{question}

Please provide a clear, accurate, patient-friendly response with exact citations."""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1000}
        }
        resp = requests.post(url, json=payload, timeout=20)
        if resp.status_code == 200:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                return candidates[0]["content"]["parts"][0]["text"]
        return None

    def _call_openai_api(self, question: str, chunks: List[Dict[str, Any]], chat_history: Optional[List[Dict[str, str]]] = None) -> Optional[str]:
        context_parts = []
        for i, c in enumerate(chunks):
            context_parts.append(f"--- EXCERPT {i+1} [Document: {c.get('document_name')}, Page {c.get('page_number')}] ---\n{c.get('content')}")
        context_str = "\n\n".join(context_parts)

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"DOCUMENT EXCERPTS:\n{context_str}\n\nPATIENT QUESTION:\n{question}"}
        ]

        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"}
        payload = {"model": "gpt-4o-mini", "messages": messages, "temperature": 0.2}

        resp = requests.post(url, headers=headers, json=payload, timeout=20)
        if resp.status_code == 200:
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        return None

    def _dynamic_clinical_synthesizer(self, question: str, chunks: List[Dict[str, Any]], biomarkers: List[Dict[str, Any]]) -> str:
        """
        Pure dynamic context generator that extracts and formats information directly from the retrieved document text with zero hardcoded values.
        """
        top_chunk = chunks[0]
        doc_name = top_chunk.get("document_name", "your medical report")
        page_num = top_chunk.get("page_number", 1)
        sec_title = top_chunk.get("section_title", "Clinical Findings")

        lines = []
        q_words = set(w.lower() for w in re.findall(r"\b\w+\b", question) if len(w) > 2)

        # Match biomarkers dynamically by checking if any query token is in the biomarker name
        matched_bio = []
        for b in biomarkers:
            b_words = set(w.lower() for w in re.findall(r"\b\w+\b", b["name"]))
            if q_words & b_words or any(qw in b["name"].lower() for qw in q_words):
                if not any(m["name"].lower() == b["name"].lower() for m in matched_bio):
                    matched_bio.append(b)

        if matched_bio:
            lines.append(f"### 📋 Key Findings from **{doc_name}** *(Page {page_num}, Section: {sec_title})*:\n")
            for b in matched_bio:
                status_icon = "🟢" if b["status"] == "NORMAL" else ("🔴" if b["status"] == "HIGH" else "🟡")
                ref_text = f"Standard Reference: {b['reference_range']}" if b.get('reference_range') else "Normal Range"
                unit_text = f" {b['unit']}" if b.get('unit') else ""
                lines.append(f"- **{b['name']}**: **{b['value']}{unit_text}** {status_icon} *({b['status']} — {ref_text}{unit_text})*")
            
            lines.append(f"\n**Source Citation:** `[{doc_name}, Page {page_num}, Section: {sec_title}]`")
        else:
            # Dynamic excerpt extraction for non-tabular queries (e.g. impressions, medications, instructions)
            lines.append(f"Based on **{doc_name}** *(Page {page_num}, {sec_title})*:\n")
            content_snippet = top_chunk.get("content", "").strip()
            raw_lines = [s.strip() for s in content_snippet.split("\n") if s.strip()]
            
            relevant_lines = []
            for r in raw_lines:
                r_words = set(w.lower() for w in re.findall(r"\b\w+\b", r))
                if q_words & r_words or any(kw in r.lower() for kw in ["prescribed", "diagnosis", "impression", "result", "normal", "high", "low", "advice"]):
                    relevant_lines.append(r)

            if not relevant_lines:
                relevant_lines = raw_lines[:5]

            for r in relevant_lines[:5]:
                lines.append(f"- {r}")

            lines.append(f"\n*(Reference: **{doc_name}**, Page {page_num})*")

        lines.append(f"\n> 💡 **Reminder:** {MEDICAL_DISCLAIMER}")
        return "\n".join(lines)

    def _generate_dynamic_followups(self, question: str, biomarkers: List[Dict[str, Any]]) -> List[str]:
        suggestions = []
        if biomarkers:
            first_marker = biomarkers[0]["name"]
            suggestions.append(f"What does my {first_marker} level indicate?")
            suggestions.append(f"Are there any abnormal values in this report?")
            suggestions.append(f"Compare my results across all uploaded reports")
        else:
            suggestions = [
                "What are the main findings in my report?",
                "Are any parameters flagged as abnormal?",
                "Summarize all medications and instructions"
            ]
        return suggestions[:3]

rag_service = RAGService()
