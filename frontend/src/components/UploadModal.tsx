import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  onSeedDemo: () => void;
}

export const UploadModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  onSeedDemo,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('Blood Test (CBC)');
  const [patientName, setPatientName] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessData, setUploadSuccessData] = useState<{
    docName: string;
    chunks: number;
    biomarkers: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please choose or drop a medical document to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const res = await api.uploadDocument(selectedFile, category, patientName || undefined);
      setUploadSuccessData({
        docName: selectedFile.name,
        chunks: res.chunk_count || 0,
        biomarkers: res.biomarker_count || 0,
      });
      onUploadSuccess();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process and vectorize document.');
    } finally {
      setUploading(false);
    }
  };

  const handleResetAndClose = () => {
    setSelectedFile(null);
    setUploadSuccessData(null);
    setUploadError(null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          maxWidth: '620px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '26px',
          position: 'relative',
          border: '1px solid rgba(6, 182, 212, 0.35)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
              }}
            >
              <Upload size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                Upload & Process Medical Report
              </h2>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                PDF, Lab Scans, Prescriptions & Clinical Summaries
              </span>
            </div>
          </div>
          <button onClick={handleResetAndClose} className="btn-ghost" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {uploadSuccessData ? (
          /* Success Screen */
          <div style={{ textAlign: 'center', padding: '24px 10px' }} className="animate-fade-in">
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '6px' }}>
              Document Successfully Indexed!
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px' }}>
              <strong>{uploadSuccessData.docName}</strong> is now embedded and ready for natural language RAG queries.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '360px', margin: '0 auto 24px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#38bdf8' }}>{uploadSuccessData.chunks}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Semantic Chunks</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#34d399' }}>{uploadSuccessData.biomarkers}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Biomarkers Detected</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setUploadSuccessData(null);
                }}
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '10px 18px' }}
              >
                Upload Another Report
              </button>
              <button
                onClick={handleResetAndClose}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '10px 22px' }}
              >
                Done & Start Asking Questions
              </button>
            </div>
          </div>
        ) : (
          /* Upload Form */
          <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '28px 20px',
                borderRadius: '14px',
                border: isDragging ? '2px dashed #06b6d4' : '2px dashed rgba(148, 163, 184, 0.25)',
                background: isDragging ? 'rgba(6, 182, 212, 0.12)' : 'rgba(15, 23, 42, 0.7)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
              className="glass-panel-hover"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.docx,.png,.jpg,.jpeg"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <FileText size={26} />
              </div>

              {selectedFile ? (
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#38bdf8', display: 'block' }}>
                    📄 {selectedFile.name}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    ({(selectedFile.size / 1024).toFixed(1)} KB) — Click to change
                  </span>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', display: 'block', marginBottom: '4px' }}>
                    Choose a file or drag & drop here
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Supports PDF reports, Blood tests, Prescriptions, Lab text & Scans
                  </span>
                </div>
              )}
            </div>

            {/* Document Metadata Settings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Document Category Tag:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', cursor: 'pointer', fontSize: '13px' }}
                >
                  <option value="Blood Test (CBC)">Blood Test (CBC / Hemogram)</option>
                  <option value="Lipid Profile">Lipid Profile & Cholesterol</option>
                  <option value="Metabolic Panel">Metabolic Panel (CMP / Glucose)</option>
                  <option value="Prescription">Prescription & Medications</option>
                  <option value="Thyroid Panel">Thyroid Panel (TSH / T3 / T4)</option>
                  <option value="Imaging & Radiology">Imaging / Ultrasound / X-Ray</option>
                  <option value="General Medical Report">General Medical Summary</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Patient Name (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', fontSize: '13px' }}
                />
              </div>
            </div>

            {uploadError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fb7185',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  onSeedDemo();
                  onClose();
                }}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '8px 14px' }}
              >
                <Sparkles size={14} color="#f59e0b" /> Load Sample Reports
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={handleResetAndClose} className="btn-secondary" style={{ fontSize: '13px' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="btn-primary"
                  style={{ fontSize: '13px', padding: '10px 20px', opacity: uploading || !selectedFile ? 0.6 : 1 }}
                >
                  <Upload size={15} />
                  {uploading ? 'Processing & Vectorizing...' : 'Upload & Extract'}
                </button>
              </div>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
