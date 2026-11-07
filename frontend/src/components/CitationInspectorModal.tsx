import React, { useState } from 'react';
import { X, Check, Copy, Bookmark, Sparkles } from 'lucide-react';
import type { Citation } from '../types';

interface Props {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationInspectorModal: React.FC<Props> = ({ citation, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!citation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const confidencePct = Math.round(citation.similarity_score * 100);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '620px', width: '100%', padding: '26px', position: 'relative', border: '1px solid rgba(6, 182, 212, 0.35)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
              <Bookmark size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                Grounded Source Citation Inspector
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Document: <strong style={{ color: '#f8fafc' }}>{citation.document_name}</strong>
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '999px' }}>
                  Page {citation.page_number}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Confidence metric & Section bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.12)', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            Section: <strong style={{ color: '#e2e8f0' }}>{citation.section_title}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#34d399' }}>
            <Sparkles size={14} /> Semantic Match Score: <strong>{confidencePct}%</strong>
          </div>
        </div>

        {/* Cited Text Box */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
            📄 Extracted Clinical Context Passage:
          </label>
          <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(148, 163, 184, 0.15)', fontSize: '13px', lineHeight: '1.65', color: '#f1f5f9', whiteSpace: 'pre-wrap', maxHeight: '220px', overflowY: 'auto' }}>
            {citation.snippet}
          </div>
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={handleCopy} className="btn-secondary" style={{ fontSize: '13px', padding: '8px 14px' }}>
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            {copied ? 'Copied to Clipboard' : 'Copy Excerpt'}
          </button>

          <button onClick={onClose} className="btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
