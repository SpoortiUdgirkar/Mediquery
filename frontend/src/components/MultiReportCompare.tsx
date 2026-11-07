import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  CheckSquare,
  Square,
  FileText,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import type { DocumentItem, ComparisonResult } from '../types';
import { api } from '../services/api';

interface Props {
  documents: DocumentItem[];
  onAskComparisonQuery: (promptText: string) => void;
  onSeedDemo: () => void;
}

export const MultiReportCompare: React.FC<Props> = ({
  documents,
  onAskComparisonQuery,
  onSeedDemo,
}) => {
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Select first 2 or 3 documents by default
    if (documents.length >= 2) {
      const initialIds = documents.slice(0, 3).map((d) => d.id);
      setSelectedDocIds(initialIds);
      fetchComparison(initialIds);
    }
  }, [documents]);

  const toggleDocSelection = (id: string) => {
    let updated: string[];
    if (selectedDocIds.includes(id)) {
      updated = selectedDocIds.filter((dId) => dId !== id);
    } else {
      updated = [...selectedDocIds, id];
    }
    setSelectedDocIds(updated);
    if (updated.length >= 2) {
      fetchComparison(updated);
    } else {
      setComparison(null);
    }
  };

  const fetchComparison = async (ids: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.compareDocuments(ids);
      setComparison(res);
    } catch (err: any) {
      setError(err.message || 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskComparison = () => {
    if (!comparison || comparison.documents.length < 2) return;
    const docNames = comparison.documents.map((d) => d.name).join(' vs ');
    onAskComparisonQuery(`Compare all lab results, cholesterol, and blood parameters between ${docNames}. Summarize what improved, what got worse, and what changed.`);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '26px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitCompare size={24} color="#06b6d4" />
            Multi-Report Parameter Comparison
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Select 2 or more reports to generate a side-by-side parameter diff and progression matrix.
          </p>
        </div>

        {comparison && comparison.documents.length >= 2 && (
          <button onClick={handleAskComparison} className="btn-primary" style={{ fontSize: '13px', padding: '9px 18px' }}>
            <Sparkles size={16} /> Ask AI to Summarize Report Differences
          </button>
        )}
      </div>

      {documents.length < 2 ? (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <FileText size={44} color="#64748b" style={{ margin: '0 auto 14px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
            At least 2 documents required for comparison
          </h3>
          <p style={{ fontSize: '13px', maxWidth: '380px', margin: '0 auto 18px' }}>
            Please upload another lab report or seed the demo clinical test cases.
          </p>
          <button onClick={onSeedDemo} className="btn-primary" style={{ fontSize: '13px', padding: '9px 18px' }}>
            <Sparkles size={15} /> Load Sample Reports
          </button>
        </div>
      ) : (
        <>
          {/* Document Selector Checkbox Bar */}
          <div className="glass-panel" style={{ padding: '18px 22px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '12px' }}>
              Select Documents to Compare (Selected: {selectedDocIds.length}):
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {documents.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocSelection(doc.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                      border: isSelected ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid rgba(148, 163, 184, 0.1)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.2s ease',
                    }}
                    className="glass-panel-hover"
                  >
                    {isSelected ? (
                      <CheckSquare size={18} color="#06b6d4" />
                    ) : (
                      <Square size={18} color="#64748b" />
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span>{doc.document_date || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison Matrix Table */}
          {loading ? (
            <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8' }}>
              Loading multi-document matrix...
            </div>
          ) : error ? (
            <div className="glass-panel" style={{ padding: '30px 20px', textAlign: 'center', color: '#fb7185' }}>
              <AlertCircle size={24} style={{ margin: '0 auto 8px' }} />
              {error}
            </div>
          ) : comparison && comparison.comparison_matrix.length > 0 ? (
            <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                    <th style={{ padding: '16px 20px', fontWeight: '700', color: '#ffffff' }}>Biomarker / Test</th>
                    <th style={{ padding: '16px 14px', fontWeight: '600', color: '#94a3b8' }}>Category</th>
                    <th style={{ padding: '16px 14px', fontWeight: '600', color: '#94a3b8' }}>Reference Range</th>
                    {comparison.documents.map((doc) => (
                      <th key={doc.id} style={{ padding: '16px 16px', fontWeight: '700', color: '#38bdf8' }}>
                        <div>{doc.name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400', marginTop: '2px' }}>
                          📅 {doc.date || 'N/A'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.comparison_matrix.map((row, idx) => (
                    <tr
                      key={row.biomarker}
                      style={{
                        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                      }}
                    >
                      <td style={{ padding: '14px 20px', fontWeight: '600', color: '#ffffff' }}>
                        {row.biomarker}
                      </td>
                      <td style={{ padding: '14px 14px', color: '#94a3b8' }}>
                        {row.category}
                      </td>
                      <td style={{ padding: '14px 14px', color: '#64748b' }}>
                        {row.reference_range} {row.unit}
                      </td>
                      {comparison.documents.map((doc) => {
                        const valObj = row.values_by_doc[doc.id];
                        if (!valObj) {
                          return (
                            <td key={doc.id} style={{ padding: '14px 16px', color: '#64748b' }}>
                              —
                            </td>
                          );
                        }
                        return (
                          <td key={doc.id} style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '700', color: '#f8fafc' }}>
                                {valObj.value} {row.unit}
                              </span>
                              <span className={`badge-status badge-${valObj.status.toLowerCase()}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                                {valObj.status}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
              Please select at least 2 reports to view parameter comparisons.
            </div>
          )}
        </>
      )}

    </div>
  );
};
