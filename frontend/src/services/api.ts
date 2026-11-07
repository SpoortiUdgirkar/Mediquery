import type { DocumentItem, BiomarkerTrend, SystemConfig, ComparisonResult } from '../types';

const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return 'http://127.0.0.1:8000/api';
  }
  return '/api';
};

export const api = {
  async getHealth() {
    const res = await fetch(`${getApiBase()}/health`);
    return res.json();
  },

  async getConfig(): Promise<SystemConfig> {
    const res = await fetch(`${getApiBase()}/config`);
    return res.json();
  },

  async updateConfig(config: Partial<SystemConfig & { supabase_key?: string; gemini_api_key?: string; openai_api_key?: string }>) {
    const res = await fetch(`${getApiBase()}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async listDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${getApiBase()}/documents`);
    return res.json();
  },

  async getDocument(docId: string): Promise<DocumentItem> {
    const res = await fetch(`${getApiBase()}/documents/${docId}`);
    return res.json();
  },

  async uploadDocument(file: File, category?: string, patientName?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);
    if (patientName) formData.append('patient_name', patientName);

    const res = await fetch(`${getApiBase()}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async deleteDocument(docId: string) {
    const res = await fetch(`${getApiBase()}/documents/${docId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async sendQuery(question: string, filterDocIds?: string[], chatHistory?: { role: string; content: string }[]) {
    const res = await fetch(`${getApiBase()}/chat/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        filter_doc_ids: filterDocIds && filterDocIds.length > 0 ? filterDocIds : undefined,
        chat_history: chatHistory,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Query failed' }));
      throw new Error(err.detail || 'Query failed');
    }
    return res.json();
  },

  async getBiomarkerTrends(): Promise<BiomarkerTrend[]> {
    const res = await fetch(`${getApiBase()}/analytics/biomarkers`);
    return res.json();
  },

  async compareDocuments(documentIds: string[]): Promise<ComparisonResult> {
    const res = await fetch(`${getApiBase()}/documents/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: documentIds }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Comparison failed' }));
      throw new Error(err.detail || 'Comparison failed');
    }
    return res.json();
  },

  async seedDemo() {
    const res = await fetch(`${getApiBase()}/demo/seed`, {
      method: 'POST',
    });
    return res.json();
  },

  async resetDemo() {
    const res = await fetch(`${getApiBase()}/demo/reset`, {
      method: 'POST',
    });
    return res.json();
  },
};
