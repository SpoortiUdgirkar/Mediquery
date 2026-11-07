export interface Biomarker {
  name: string;
  value: number;
  unit: string;
  reference_range: string;
  reference_min?: number;
  reference_max?: number;
  status: 'NORMAL' | 'HIGH' | 'LOW' | 'BORDERLINE' | string;
  category?: string;
  date?: string;
  document_name?: string;
  document_id?: string;
}

export interface BiomarkerHistoryPoint {
  date: string;
  value: number;
  status: string;
  document_name: string;
  document_id: string;
}

export interface BiomarkerTrend {
  name: string;
  category: string;
  unit: string;
  reference_range: string;
  reference_min: number;
  reference_max: number;
  latest_value: number;
  latest_status: string;
  latest_date: string;
  delta: number;
  pct_change: number;
  data_points: number;
  history: BiomarkerHistoryPoint[];
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  page_number: number;
  section_title: string;
  content: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  patient_name: string;
  document_date: string;
  category: string;
  page_count: number;
  summary: string;
  extracted_biomarkers: Biomarker[];
  chunks?: DocumentChunk[];
  created_at?: string;
}

export interface Citation {
  citation_id: string;
  document_id: string;
  document_name: string;
  page_number: number;
  section_title: string;
  snippet: string;
  similarity_score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  detected_biomarkers?: Biomarker[];
  suggested_followups?: string[];
  disclaimer?: string;
}

export interface SystemConfig {
  vector_store_mode: string;
  supabase_url?: string;
  supabase_configured: boolean;
  gemini_configured: boolean;
  openai_configured: boolean;
  llm_provider: string;
}

export interface ComparisonResult {
  documents: { id: string; name: string; date: string; category: string }[];
  comparison_matrix: {
    biomarker: string;
    category: string;
    unit: string;
    reference_range: string;
    values_by_doc: Record<string, { value: number; status: string; date: string; document_name: string }>;
  }[];
}
