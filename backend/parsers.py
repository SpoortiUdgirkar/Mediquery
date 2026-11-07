import io
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
from pypdf import PdfReader

def parse_pdf_bytes(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """Extract page-by-page text from PDF byte stream dynamically."""
    pages = []
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        for page_idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            cleaned_text = re.sub(r"[ \t]+", " ", text).strip()
            pages.append({
                "page_number": page_idx + 1,
                "text": cleaned_text
            })
    except Exception as e:
        pages.append({
            "page_number": 1,
            "text": f"Error parsing PDF content: {str(e)}"
        })
    return pages


def parse_text_content(content: str) -> List[Dict[str, Any]]:
    """Format plain text or markdown as structured document pages."""
    cleaned = content.strip()
    return [{"page_number": 1, "text": cleaned}]


def extract_metadata_hints(full_text: str) -> Dict[str, Any]:
    """Scan document text dynamically for patient name, report date, and category hints."""
    metadata: Dict[str, Any] = {
        "patient_name": "Patient",
        "document_date": datetime.now().strftime("%Y-%m-%d"),
        "category": "Medical Report"
    }
    
    # Check date patterns (YYYY-MM-DD, DD/MM/YYYY, Month DD, YYYY)
    date_match = re.search(r"\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b", full_text, re.IGNORECASE)
    if date_match:
        raw_date = date_match.group(1)
        try:
            for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%B %d, %Y", "%b %d, %Y", "%B %d %Y", "%b %d %Y"):
                try:
                    dt = datetime.strptime(raw_date.replace(",", ""), fmt)
                    metadata["document_date"] = dt.strftime("%Y-%m-%d")
                    break
                except ValueError:
                    continue
        except Exception:
            pass

    # Check Patient Name
    patient_match = re.search(r"(?:Patient Name|Name|Patient)\s*[:\-]\s*([A-Za-z\s\.\-]{3,35})(?:\r|\n|\t|$)", full_text, re.IGNORECASE)
    if patient_match:
        p_name = patient_match.group(1).strip()
        if len(p_name) > 2 and not any(k in p_name.lower() for k in ["report", "date", "age", "male", "female", "doctor"]):
            metadata["patient_name"] = p_name

    # Determine category dynamically from document title / keywords
    lower_text = full_text.lower()
    if any(k in lower_text for k in ["lipid", "cholesterol", "triglyceride"]):
        metadata["category"] = "Lipid Profile"
    elif any(k in lower_text for k in ["blood count", "cbc", "hemogram", "leucocyte", "haematology", "platelet"]):
        metadata["category"] = "Blood Test (CBC)"
    elif any(k in lower_text for k in ["metabolic", "glucose", "creatinine", "renal", "electrolyte"]):
        metadata["category"] = "Metabolic Panel"
    elif any(k in lower_text for k in ["prescription", "dosage", "tablet", "capsule", "rx\b", "refills"]):
        metadata["category"] = "Prescription"
    elif any(k in lower_text for k in ["radiology", "ultrasound", "x-ray", "mri", "ct scan"]):
        metadata["category"] = "Imaging & Radiology"
    elif any(k in lower_text for k in ["thyroid", "tsh"]):
        metadata["category"] = "Thyroid Panel"

    return metadata


def chunk_document_pages(pages: List[Dict[str, Any]], chunk_size: int = 600, overlap: int = 100) -> List[Dict[str, Any]]:
    """Splits pages into semantic chunks with section identification."""
    chunks = []
    global_idx = 0

    section_header_pattern = re.compile(
        r"^(?:[A-Z0-9\s\-–:]{3,40}(?:PANEL|REPORT|TEST|RESULTS|EXAMINATION|IMPRESSION|DIAGNOSIS|MEDICATIONS|PRESCRIPTION|SUMMARY|HISTORY|HAEMATOLOGY|HEMATOLOGY|COUNT))",
        re.MULTILINE
    )

    for page_item in pages:
        page_num = page_item.get("page_number", 1)
        text = page_item.get("text", "")
        if not text.strip():
            continue

        lines = text.split("\n")
        current_section = "Clinical Findings"
        current_block = []
        current_len = 0

        for line in lines:
            trimmed_line = line.strip()
            if not trimmed_line:
                continue

            # Detect potential section headers
            if section_header_pattern.match(trimmed_line) and len(trimmed_line) < 60:
                current_section = trimmed_line.replace(":", "").strip()

            current_block.append(trimmed_line)
            current_len += len(trimmed_line) + 1

            if current_len >= chunk_size:
                chunk_text = "\n".join(current_block)
                chunks.append({
                    "chunk_index": global_idx,
                    "page_number": page_num,
                    "section_title": current_section,
                    "content": chunk_text
                })
                global_idx += 1
                
                overlap_lines = []
                overlap_len = 0
                for prev_line in reversed(current_block):
                    if overlap_len + len(prev_line) < overlap:
                        overlap_lines.insert(0, prev_line)
                        overlap_len += len(prev_line)
                    else:
                        break
                current_block = overlap_lines
                current_len = overlap_len

        if current_block:
            chunk_text = "\n".join(current_block)
            chunks.append({
                "chunk_index": global_idx,
                "page_number": page_num,
                "section_title": current_section,
                "content": chunk_text
            })
            global_idx += 1

    return chunks


def extract_biomarkers_from_text(text: str, doc_date: Optional[str] = None) -> List[Dict[str, Any]]:
    """Dynamically scan medical document text to extract ANY lab parameter, value, reference interval, and status with ZERO hardcoded test dictionaries."""
    extracted = []
    doc_date = doc_date or datetime.now().strftime("%Y-%m-%d")
    lines = text.split("\n")
    
    unit_re = r"(?:g/dL|mg/dL|/cumm|x10\^3/uL|Million/cumm|cells/mcL|x10\^6/uL|%|fL|pg|uIU/mL|mIU/L|IU/mL|U/L|ng/mL|pg/mL|mg/L|ug/dL|mmol/L|mEq/L|Ratio)"

    for line in lines:
        line_clean = line.strip()
        if not line_clean or len(line_clean) < 4:
            continue
        
        # Skip non-data metadata lines
        if any(h in line_clean.lower() for h in ["patient id", "report id", "collection date", "phone no", "page ", "dr.", "authorized signature", "interpretation:"]):
            continue

        match = re.search(
            rf"^([A-Za-z0-9\s\(\)\/\-\%\.\,]{{2,45}}?)[:\t\s]{{1,6}}([<>]?\s*\d+(?:\.\d+)?)\s*({unit_re})?\s*(?:\(?([\d\.]+\s*[-–]\s*[\d\.]+|<[\d\.]+|>[\d\.]+)\)?)?\s*({unit_re})?\s*(High|Low|Normal|Borderline|Abnormal|Alert)?",
            line_clean,
            re.IGNORECASE
        )

        if match:
            test_name = match.group(1).replace(":", "").strip()
            if len(test_name) < 2 or test_name.lower() in ["result", "flag", "status", "test description", "haematology", "differential leucocyte count", "test"]:
                continue

            val_str = match.group(2).replace(" ", "").replace("<", "").replace(">", "").strip()
            unit_str = match.group(3) or match.group(5) or ""
            ref_str = match.group(4) or ""
            flag_str = match.group(6)

            try:
                numeric_val = float(val_str)
            except ValueError:
                continue

            min_val = None
            max_val = None
            if ref_str and ("-" in ref_str or "–" in ref_str):
                parts = re.split(r"[-–]", ref_str)
                try:
                    min_val = float(parts[0].strip())
                    max_val = float(parts[1].strip())
                except Exception:
                    pass

            status = "NORMAL"
            if flag_str:
                status = flag_str.upper()
                if status not in ["HIGH", "LOW", "NORMAL", "BORDERLINE"]:
                    status = "NORMAL"
            elif min_val is not None and max_val is not None:
                if numeric_val < min_val:
                    status = "LOW"
                elif numeric_val > max_val:
                    status = "HIGH"
                else:
                    status = "NORMAL"

            if not any(r["name"].lower() == test_name.lower() for r in extracted):
                extracted.append({
                    "name": test_name,
                    "value": numeric_val,
                    "unit": unit_str,
                    "reference_range": ref_str or (f"{min_val} - {max_val}" if min_val else "Normal"),
                    "reference_min": min_val,
                    "reference_max": max_val,
                    "status": status,
                    "category": "Lab Parameter",
                    "date": doc_date
                })

    return extracted
