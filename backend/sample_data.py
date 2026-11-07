import uuid
from typing import List, Dict, Any
from datetime import datetime
from parsers import parse_text_content, chunk_document_pages, extract_biomarkers_from_text
from embeddings import embedding_service
from vector_store import get_vector_store

SAMPLE_REPORTS = [
    {
        "id": "sample-doc-cbc-aug-2025",
        "name": "Complete_Blood_Count_CBC_Aug_2025.pdf",
        "patient_name": "Alex Johnson",
        "document_date": "2025-08-15",
        "category": "Blood Test (CBC)",
        "file_type": "pdf",
        "file_size": 142850,
        "page_count": 2,
        "summary": "Routine Complete Blood Count showing mild low hemoglobin (11.2 g/dL) and normal WBC and platelets.",
        "text_content": """METROPOLIS DIAGNOSTIC & CLINICAL LABORATORIES
CLINICAL PATHOLOGY REPORT - COMPLETE BLOOD COUNT (CBC)
Patient Name: Alex Johnson        Age / Gender: 38 Y / Male
Referred By: Dr. Sarah Patel, MD  Date of Collection: 2025-08-15
Sample Type: Whole Blood (EDTA)   Status: Finalized

HEMATOLOGY & COMPLETE HEMOGRAM
===========================================================================
Test Parameter                Result      Unit        Reference Interval   Flag
---------------------------------------------------------------------------
Hemoglobin (Hb)               11.2        g/dL        13.8 - 17.2          LOW
Total RBC Count               4.10        x10^6/uL    4.50 - 5.90          LOW
Hematocrit (PCV)              34.8        %           40.0 - 50.0          LOW
Mean Corpuscular Volume (MCV) 78.5        fL          80.0 - 100.0         LOW
MCH                           26.1        pg          27.0 - 33.0          LOW
MCHC                          32.1        g/dL        32.0 - 36.0          NORMAL
Red Cell Distribution (RDW)   15.8        %           11.5 - 14.5          HIGH

LEUKOCYTE & DIFFERENTIAL COUNT
---------------------------------------------------------------------------
Total WBC Count               6.8         x10^3/uL    4.5 - 11.0           NORMAL
Neutrophils                   58          %           40 - 70              NORMAL
Lymphocytes                   32          %           20 - 40              NORMAL
Monocytes                     6           %           2 - 8                NORMAL
Eosinophils                   3           %           1 - 6                NORMAL
Basophils                     1           %           0 - 2                NORMAL

THROMBOCYTE / PLATELET COUNT
---------------------------------------------------------------------------
Platelet Count                240         x10^3/uL    150 - 450            NORMAL
Mean Platelet Volume (MPV)    9.2         fL          7.4 - 10.4           NORMAL

CLINICAL IMPRESSION & REMARKS:
- Peripheral smear shows mild microcytic, hypochromic red blood cells.
- Findings are consistent with mild iron deficiency anemia.
- Platelet count and total leukocyte count are within physiological limits.
- Advised serum ferritin / iron profile correlation and dietary evaluation.

Authorized Signatory: Dr. R. Verma, MD (Pathology)"""
    },
    {
        "id": "sample-doc-cmp-jan-2025",
        "name": "Comprehensive_Metabolic_Lipid_Jan_2025.pdf",
        "patient_name": "Alex Johnson",
        "document_date": "2025-01-10",
        "category": "Lipid & Metabolic Panel",
        "file_type": "pdf",
        "file_size": 168400,
        "page_count": 2,
        "summary": "Baseline checkup showing normal metabolic markers, baseline hemoglobin (13.9 g/dL), and elevated Total Cholesterol (218 mg/dL) and LDL (142 mg/dL).",
        "text_content": """METROPOLIS DIAGNOSTIC & CLINICAL LABORATORIES
ANNUAL HEALTH CHECKUP & METABOLIC BIOCHEMISTRY REPORT
Patient Name: Alex Johnson        Age / Gender: 38 Y / Male
Referred By: Dr. Sarah Patel, MD  Date of Collection: 2025-01-10
Sample Type: Serum Fasting        Status: Finalized

HEMATOLOGY & GLYCEMIC PROFILE
===========================================================================
Test Parameter                Result      Unit        Reference Interval   Flag
---------------------------------------------------------------------------
Hemoglobin                    13.9        g/dL        13.8 - 17.2          NORMAL
Fasting Blood Sugar           92          mg/dL       70 - 99              NORMAL
HbA1c                         5.4         %           4.0 - 5.6            NORMAL

LIPID PANEL (FASTING 12 HOURS)
---------------------------------------------------------------------------
Total Cholesterol             218         mg/dL       125 - 200            HIGH
LDL Cholesterol               142         mg/dL       0 - 100              HIGH
HDL Cholesterol               48          mg/dL       40 - 60              NORMAL
Triglycerides                 165         mg/dL       50 - 150             HIGH
VLDL Cholesterol              33          mg/dL       5 - 30               HIGH
Cholesterol / HDL Ratio       4.54        Ratio       < 4.5                BORDERLINE

RENAL & THYROID FUNCTION
---------------------------------------------------------------------------
Serum Creatinine              0.9         mg/dL       0.6 - 1.2            NORMAL
Blood Urea Nitrogen (BUN)     14.0        mg/dL       7.0 - 20.0           NORMAL
TSH                           2.10        uIU/mL      0.40 - 4.50          NORMAL

CLINICAL IMPRESSION:
- Lipid profile indicates mild hypercholesterolemia with elevated LDL (142 mg/dL) and triglycerides (165 mg/dL).
- Glycemic control (HbA1c 5.4%) and Renal parameters are fully intact.
- Recommended therapeutic lifestyle modifications (low saturated fat diet, cardio exercise) and follow-up lipid screening in 6 months."""
    },
    {
        "id": "sample-doc-lipid-aug-2025",
        "name": "FollowUp_Lipid_Liver_Panel_Aug_2025.pdf",
        "patient_name": "Alex Johnson",
        "document_date": "2025-08-20",
        "category": "Lipid Profile",
        "file_type": "pdf",
        "file_size": 154200,
        "page_count": 1,
        "summary": "Follow-up lipid test showing marked improvement: Total Cholesterol reduced to 185 mg/dL, LDL dropped to 108 mg/dL, and Triglycerides reduced to 125 mg/dL.",
        "text_content": """METROPOLIS DIAGNOSTIC & CLINICAL LABORATORIES
LIPID RE-EVALUATION & HEPATIC PANEL REPORT
Patient Name: Alex Johnson        Age / Gender: 38 Y / Male
Referred By: Dr. Sarah Patel, MD  Date of Collection: 2025-08-20
Sample Type: Serum Fasting        Status: Finalized

LIPID PROFILE RE-EVALUATION
===========================================================================
Test Parameter                Result      Unit        Reference Interval   Flag
---------------------------------------------------------------------------
Total Cholesterol             185         mg/dL       125 - 200            NORMAL
LDL Cholesterol               108         mg/dL       0 - 100              BORDERLINE
HDL Cholesterol               52          mg/dL       40 - 60              NORMAL
Triglycerides                 125         mg/dL       50 - 150             NORMAL
Non-HDL Cholesterol           133         mg/dL       < 130                BORDERLINE

LIVER ENZYMES & NUTRITIONAL VITAMINS
---------------------------------------------------------------------------
SGPT (ALT)                    28          U/L         7 - 56               NORMAL
SGOT (AST)                    24          U/L         8 - 48               NORMAL
Alkaline Phosphatase (ALP)    68          U/L         44 - 147             NORMAL
Vitamin D (25-OH)             24.0        ng/mL       30.0 - 100.0         LOW
Vitamin B12                   420         pg/mL       200 - 900            NORMAL

SUMMARY & PROGRESS NOTE:
- Substantial improvement compared to January 2025 report: Total Cholesterol reduced by 33 mg/dL (from 218 to 185 mg/dL).
- Triglycerides normalized from 165 to 125 mg/dL.
- Vitamin D is insufficient at 24 ng/mL, supplementation recommended."""
    },
    {
        "id": "sample-doc-rx-aug-2025",
        "name": "Cardiology_Prescription_Dr_Patel.pdf",
        "patient_name": "Alex Johnson",
        "document_date": "2025-08-22",
        "category": "Prescription",
        "file_type": "pdf",
        "file_size": 118000,
        "page_count": 1,
        "summary": "Prescription from Dr. Sarah Patel specifying Atorvastatin 10mg, Ferrous Ascorbate 100mg for low hemoglobin, and Vitamin D3 weekly.",
        "text_content": """CARDIOVASCULAR & INTERNAL MEDICINE ASSOCIATES
Dr. Sarah Patel, MD, FACC (Cardiologist)
Clinic: Suite 402, St. Jude Medical Plaza | Phone: (555) 839-2041

PRESCRIPTION & CLINICAL DISCHARGE SUMMARY
Patient Name: Alex Johnson        Age / Sex: 38 / M
Date: August 22, 2025             Diagnosis: Microcytic Anemia, Hyperlipidemia (Improving), Vitamin D Insufficiency

Rx (PRESCRIPTION MEDICATIONS):
---------------------------------------------------------------------------
1. Tab. Atorvastatin 10 mg
   - Dosage: 1 tablet orally once daily at bedtime
   - Duration: 90 days (Refills: 2)
   - Indication: LDL reduction & plaque stabilization

2. Tab. Ferrous Ascorbate 100 mg + Folic Acid 1.5 mg
   - Dosage: 1 tablet orally once daily after lunch with citrus juice
   - Duration: 60 days
   - Indication: Iron deficiency anemia (for Hemoglobin 11.2 g/dL)
   - Note: Avoid taking at same time as calcium supplements or dairy.

3. Cap. Cholecalciferol (Vitamin D3) 60,000 IU
   - Dosage: 1 capsule orally once weekly with morning meal
   - Duration: 8 weeks, then recheck levels

ADVICE & LIFESTYLE PROTOCOL:
- Increase iron-rich foods (spinach, lentils, beans, fortified cereals).
- Continue 30-40 minutes daily moderate cardiovascular exercise (brisk walking/cycling).
- Maintain low saturated fat diet.
- Repeat Complete Blood Count (CBC) and Vitamin D level in 8 to 10 weeks.

Doctor Signature: Dr. Sarah Patel, MD"""
    }
]


def seed_sample_data() -> Dict[str, Any]:
    """Seeds sample documents into the active vector store."""
    v_store = get_vector_store()
    seeded_docs = []

    for item in SAMPLE_REPORTS:
        # Check if already seeded
        existing = v_store.get_document(item["id"])
        if existing:
            seeded_docs.append(existing)
            continue

        pages = parse_text_content(item["text_content"])
        chunks = chunk_document_pages(pages, chunk_size=500, overlap=80)
        
        # Extract biomarkers
        biomarkers = extract_biomarkers_from_text(item["text_content"], doc_date=item["document_date"])

        # Compute embeddings for chunks
        chunk_texts = [c["content"] for c in chunks]
        embeddings = embedding_service.generate_embeddings(chunk_texts)
        for idx, c in enumerate(chunks):
            c["embedding"] = embeddings[idx]

        doc_data = {
            "id": item["id"],
            "name": item["name"],
            "patient_name": item["patient_name"],
            "document_date": item["document_date"],
            "category": item["category"],
            "file_type": item["file_type"],
            "file_size": item["file_size"],
            "page_count": item["page_count"],
            "summary": item["summary"],
            "extracted_biomarkers": biomarkers
        }

        v_store.add_document(doc_data, chunks)
        seeded_docs.append(doc_data)

    return {
        "status": "success",
        "message": f"Successfully seeded {len(seeded_docs)} clinical demo documents.",
        "documents": seeded_docs
    }
