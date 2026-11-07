import React, { useState, useEffect } from 'react';
import { Database, Check, X, Server, Sparkles, Code2 } from 'lucide-react';
import { api } from '../services/api';
import type { SystemConfig } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, onConfigUpdated }) => {
  const [vectorMode, setVectorMode] = useState<string>('local');
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [llmProvider, setLlmProvider] = useState<string>('auto');
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showSql, setShowSql] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const data: SystemConfig = await api.getConfig();
      setVectorMode(data.vector_store_mode || 'local');
      setLlmProvider(data.llm_provider || 'auto');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateConfig({
        vector_store_mode: vectorMode,
        supabase_url: supabaseUrl || undefined,
        supabase_key: supabaseKey || undefined,
        gemini_api_key: geminiKey || undefined,
        openai_api_key: openaiKey || undefined,
        llm_provider: llmProvider,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      onConfigUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, padding: '20px' }}>
      <div className="glass-panel" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', position: 'relative' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#38bdf8' }}>
              <Database size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                System & AI Engine Settings
              </h2>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Vector Store (pgvector) & LLM Configuration</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Vector Store Selection */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', display: 'block', marginBottom: '10px' }}>
              📦 Vector Storage Backend:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setVectorMode('local')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: vectorMode === 'local' ? '2px solid #06b6d4' : '1px solid rgba(148, 163, 184, 0.2)',
                  background: vectorMode === 'local' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Server size={16} color="#06b6d4" />
                  <strong style={{ fontSize: '13px' }}>Embedded Local Store</strong>
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Zero-setup instant cosine vector retrieval</p>
              </button>

              <button
                type="button"
                onClick={() => setVectorMode('supabase')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: vectorMode === 'supabase' ? '2px solid #06b6d4' : '1px solid rgba(148, 163, 184, 0.2)',
                  background: vectorMode === 'supabase' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Database size={16} color="#10b981" />
                  <strong style={{ fontSize: '13px' }}>Supabase + pgvector</strong>
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Cloud PostgreSQL vector index</p>
              </button>
            </div>

            {/* Supabase fields if selected */}
            {vectorMode === 'supabase' && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Supabase Project URL</label>
                  <input
                    type="text"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Supabase Service Role / Anon Key</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowSql(!showSql)}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 12px', width: 'fit-content' }}
                >
                  <Code2 size={14} /> {showSql ? 'Hide SQL Schema' : 'View Supabase pgvector SQL Migration'}
                </button>

                {showSql && (
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(148, 163, 184, 0.15)', fontSize: '11px', maxHeight: '140px', overflowY: 'auto' }}>
                    <code style={{ color: '#38bdf8' }}>
                      CREATE EXTENSION IF NOT EXISTS vector;<br/>
                      -- See backend/supabase_schema.sql for the full table & RPC definition.
                    </code>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LLM Provider Configuration */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', display: 'block', marginBottom: '10px' }}>
              🤖 LLM Generation Engine:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Google Gemini API Key <span style={{ color: '#06b6d4', fontSize: '11px' }}>(Optional - Gemini 2.0 Flash)</span>
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  OpenAI API Key <span style={{ color: '#10b981', fontSize: '11px' }}>(Optional - GPT-4o-mini)</span>
                </label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.08)' }}>
                <Sparkles size={16} color="#06b6d4" />
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  Without an API key, MediQuery uses its built-in high-precision <strong>Clinical Synthesis Engine</strong> with strict source citations.
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {savedSuccess && (
                <>
                  <Check size={16} /> Settings saved successfully!
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
