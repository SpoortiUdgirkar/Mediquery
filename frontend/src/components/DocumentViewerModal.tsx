import React, { useState } from 'react';
import { FileText, X, Calendar, User, Tag, Layers, Activity, Search } from 'lucide-react';
import type { DocumentItem } from '../types';

interface Props {
  document: DocumentItem | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<Props> = ({ document, onClose }) => {
  const [activeTab, setActiveTab] = useState<'chunks' | 'biomarkers'>('chunks');
  const [searchChunk, setSearchChunk] = useState('');

  if (!document) return null;

  const filteredChunks = (document.chunks || []).filter((c) =>
    c.content.toLowerCase().includes(searchChunk.toLowerCase()) ||
    c.section_title.toLowerCase().includes(searchChunk.toLowerCase())
  );

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
              <FileText size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                {document.name}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={14} color="#06b6d4" /> {document.patient_name}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} color="#10b981" /> {document.document_date || 'N/A'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={14} color="#f59e0b" /> {document.category}
                </span>
                <span>{document.page_count} Pages</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('chunks')}
            className={activeTab === 'chunks' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            <Layers size={15} /> Semantic Chunks ({document.chunks?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('biomarkers')}
            className={activeTab === 'biomarkers' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            <Activity size={15} /> Extracted Biomarkers ({document.extracted_biomarkers?.length || 0})
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {activeTab === 'chunks' && (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    placeholder="Search chunks by keyword or section..."
                    value={searchChunk}
                    onChange={(e) => setSearchChunk(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', paddingLeft: '38px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredChunks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No chunks found matching "{searchChunk}"
                  </div>
                ) : (
                  filteredChunks.map((chunk, idx) => (
                    <div
                      key={chunk.id || idx}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(148, 163, 184, 0.12)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(148, 163, 184, 0.08)', paddingBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#38bdf8' }}>
                          Chunk #{idx + 1}: {chunk.section_title}
                        </span>
                        <span style={{ fontSize: '11px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', padding: '2px 8px', borderRadius: '999px' }}>
                          Page {chunk.page_number}
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: '#cbd5e1', whiteSpace: 'pre-wrap', margin: 0 }}>
                        {chunk.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'biomarkers' && (
            <div>
              {document.extracted_biomarkers?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  No quantitative biomarkers were detected in this document.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                  {document.extracted_biomarkers.map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(148, 163, 184, 0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                          {b.name}
                        </span>
                        <span className={`badge-status badge-${b.status.toLowerCase()}`}>
                          {b.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#38bdf8' }}>
                        {b.value} <span style={{ fontSize: '12px', fontWeight: '400', color: '#94a3b8' }}>{b.unit}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Ref Range: {b.reference_range} {b.unit}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
