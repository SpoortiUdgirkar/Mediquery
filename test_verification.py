import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_all():
    print("=== 1. HEALTH CHECK ===")
    h = requests.get('http://127.0.0.1:8000/api/health').json()
    print(json.dumps(h, indent=2))

    print("\n=== 2. LIST DOCUMENTS ===")
    docs = requests.get('http://127.0.0.1:8000/api/documents').json()
    print(f"Total documents: {len(docs)}")
    for d in docs:
        cat = d.get('category', 'General')
        name = d.get('name')
        patient = d.get('patient_name')
        date = d.get('document_date')
        b_count = len(d.get('extracted_biomarkers', []))
        print(f" - [{cat}] {name} (Patient: {patient}, Date: {date}) - {b_count} biomarkers")

    print("\n=== 3. RAG CHAT QUERY: HEMOGLOBIN ===")
    q1 = requests.post('http://127.0.0.1:8000/api/chat/query', json={'question': 'What is my hemoglobin value?'}).json()
    print("Answer:\n", q1['answer'])
    print(f"Citations ({len(q1['citations'])}):")
    for c in q1['citations']:
        print(f"  * [{c['document_name']} Page {c['page_number']}] (Score: {c['similarity_score']})")

    print("\n=== 4. RAG CHAT QUERY: PRESCRIPTION ===")
    q2 = requests.post('http://127.0.0.1:8000/api/chat/query', json={'question': 'What medications did Dr. Patel prescribe and what are the instructions?'}).json()
    print("Answer:\n", q2['answer'])

    print("\n=== 5. BIOMARKER TRENDS ===")
    trends = requests.get('http://127.0.0.1:8000/api/analytics/biomarkers').json()
    print(f"Total tracked biomarker trends: {len(trends)}")
    for t in trends[:4]:
        print(f" - {t['name']}: Latest {t['latest_value']} {t['unit']} ({t['latest_status']}) | Delta: {t['delta']} ({t['pct_change']}%) across {t['data_points']} reports")

    print("\n=== 6. MULTI-REPORT COMPARISON ===")
    doc_ids = [d['id'] for d in docs if 'jan' in d['id'] or 'lipid' in d['id']]
    if len(doc_ids) >= 2:
        comp = requests.post('http://127.0.0.1:8000/api/documents/compare', json={'document_ids': doc_ids[:2]}).json()
        print(f"Comparing {len(comp['documents'])} reports. Common parameter rows: {len(comp['comparison_matrix'])}")
        for r in comp['comparison_matrix'][:4]:
            print(f" - {r['biomarker']}: Ref ({r['reference_range']} {r['unit']})")

    print("\n=== 7. FRONTEND STATUS CHECK ===")
    fe = requests.get('http://127.0.0.1:5173')
    print(f"Frontend HTTP Status: {fe.status_code} (Length: {len(fe.text)} bytes)")

if __name__ == '__main__':
    test_all()
