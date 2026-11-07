import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  MessageSquare,
  Sparkles,
  Calendar,
  User,
  Tag,
  Layers,
  Activity,
  Search,
  AlertCircle
} from 'lucide-react';
import type { DocumentItem } from '../types';
import { api } from '../services/api';

interface Props {
  documents: DocumentItem[];
  onDocumentUploaded: () => void;
  onSelectDocumentForChat: (docId: string) => void;
  onViewDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (docId: string) => void;
  onSeedDemo: () => void;
}

export const DocumentVault: React.FC<Props> = ({
  documents,
  onDocumentUploaded,
  onSelectDocumentForChat,
  onViewDocument,
  onDeleteDocument,
  onSeedDemo,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('Blood Test');
  const [patientName, setPatientName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFileUpload(e.target.files[0]);
    }
  };

  const processFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      await api.uploadDocument(file, category, patientName || undefined);
      onDocumentUploaded();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse and index document.');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesQuery =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === 'all' ||
      doc.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase());

    return matchesQuery && matchesCategory;
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Banner & Dropzone */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Upload Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="glass-panel"
          style={{
            padding: '28px',
            border: isDragging ? '2px dashed #06b6d4' : '2px dashed rgba(148, 163, 184, 0.2)',
            background: isDragging ? 'rgba(6, 182, 212, 0.1)' : 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            minHeight: '220px',
            transition: 'all 0.2s ease',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.docx,.png,.jpg,.jpeg"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(6, 182, 212, 0.15)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
          }}>
            <Upload size={28} />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', marginBottom: '6px' }}>
            {uploading ? 'Processing & Vectorizing Document...' : 'Upload Medical Report or Prescription'}
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '340px', marginBottom: '14px' }}>
            Drag and drop your PDF lab report, blood test, or prescription here, or click to browse.
          </p>

          <span style={{ fontSize: '11px', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px' }}>
            Supported formats: PDF, TXT, DOCX, Images
          </span>

          {uploadError && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#fb7185', fontSize: '12px' }}>
              <AlertCircle size={14} /> {uploadError}
            </div>
          )}
        </div>

        {/* Upload Metadata & Quick Seed Box */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={18} color="#06b6d4" />
              Document Upload Settings
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Default Category Tag:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  <option value="Blood Test (CBC)">Blood Test (Complete Blood Count / Hemogram)</option>
                  <option value="Lipid Profile">Lipid Panel & Cholesterol</option>
                  <option value="Metabolic Panel">Comprehensive Metabolic Panel (CMP)</option>
                  <option value="Prescription">Prescription & Medication Plan</option>
                  <option value="Thyroid Panel">Thyroid Function (TSH, T3, T4)</option>
                  <option value="Imaging & Radiology">Imaging / Ultrasound / X-Ray</option>
                  <option value="General Medical Report">General Medical Summary</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Patient Name (Optional, auto-extracted):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(148, 163, 184, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Need test documents to try?
            </span>
            <button onClick={onSeedDemo} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>
              <Sparkles size={14} color="#f59e0b" /> Load Sample Lab Reports
            </button>
          </div>

        </div>

      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
            Indexed Medical Document Vault ({filteredDocuments.length})
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            All documents parsed, chunked, and vectorized into the vector store.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search reports or patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input"
              style={{ paddingLeft: '36px', fontSize: '13px', width: '100%' }}
            />
          </div>

          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="glass-input"
            style={{ fontSize: '13px', cursor: 'pointer' }}
          >
            <option value="all">All Categories</option>
            <option value="blood">Blood Tests</option>
            <option value="lipid">Lipid Panels</option>
            <option value="prescription">Prescriptions</option>
            <option value="metabolic">Metabolic Panels</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <FileText size={48} color="#64748b" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            No documents in vault
          </h3>
          <p style={{ fontSize: '13px', maxWidth: '380px', margin: '0 auto 20px' }}>
            Upload your medical documents above or load the curated sample clinical dataset to explore RAG search.
          </p>
          <button onClick={onSeedDemo} className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
            <Sparkles size={16} /> Load 4 Realistic Demo Reports
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="glass-panel glass-panel-hover animate-fade-in"
              style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.12)', color: '#38bdf8' }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', margin: 0, wordBreak: 'break-word' }}>
                        {doc.name}
                      </h4>
                      <span style={{ fontSize: '11px', color: '#06b6d4', fontWeight: '600' }}>
                        {doc.category}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="btn-ghost"
                    style={{ padding: '6px', color: '#64748b' }}
                    title="Delete document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Metadata Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: '#94a3b8', marginBottom: '14px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '6px' }}>
                    <User size={12} color="#06b6d4" /> {doc.patient_name}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '6px' }}>
                    <Calendar size={12} color="#10b981" /> {doc.document_date || 'N/A'}
                  </span>
                </div>

                {/* Summary / Biomarker counters */}
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(148, 163, 184, 0.08)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#cbd5e1' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Activity size={13} color="#f59e0b" />
                      <strong>{doc.extracted_biomarkers?.length || 0}</strong> Lab Biomarkers
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Layers size={13} color="#38bdf8" />
                      <strong>{doc.page_count}</strong> Pages
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => onViewDocument(doc)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '7px 10px' }}
                >
                  <Eye size={14} /> View Chunks
                </button>

                <button
                  onClick={() => onSelectDocumentForChat(doc.id)}
                  className="btn-primary"
                  style={{ fontSize: '12px', padding: '7px 10px' }}
                >
                  <MessageSquare size={14} /> Ask Query
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
