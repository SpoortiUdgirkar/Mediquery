-- ==============================================================================
-- MediQuery: Supabase pgvector Setup & Schema
-- Run this script in the Supabase SQL Editor to enable pgvector RAG for MediQuery.
-- ==============================================================================

-- 1. Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the Documents Table to store uploaded report metadata
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    patient_name TEXT,
    document_date DATE,
    category TEXT DEFAULT 'general_lab', -- 'blood_test', 'lipid_panel', 'prescription', 'radiology', 'discharge_summary'
    page_count INT DEFAULT 1,
    summary TEXT,
    extracted_biomarkers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the Document Chunks Table with vector embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    page_number INT DEFAULT 1,
    section_title TEXT DEFAULT 'General',
    content TEXT NOT NULL,
    embedding VECTOR(768), -- 768 dimensions for Gemini/SentenceTransformers (change to 1536 for OpenAI)
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create an HNSW index for high-speed approximate nearest neighbor vector search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- 5. Stored Procedure for Semantic Vector Search with Cosine Distance
CREATE OR REPLACE FUNCTION match_document_chunks (
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 5,
    filter_doc_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    document_name TEXT,
    chunk_index INT,
    page_number INT,
    section_title TEXT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        d.name AS document_name,
        dc.chunk_index,
        dc.page_number,
        dc.section_title,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE 
        (filter_doc_ids IS NULL OR dc.document_id = ANY(filter_doc_ids))
        AND (1 - (dc.embedding <=> query_embedding)) >= match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 6. Enable Row Level Security (RLS) policies (Optional / Public access for demo)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to documents" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to documents" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access to documents" ON documents FOR DELETE USING (true);

CREATE POLICY "Allow public read access to chunks" ON document_chunks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to chunks" ON document_chunks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access to chunks" ON document_chunks FOR DELETE USING (true);
