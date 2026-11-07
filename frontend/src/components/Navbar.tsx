import React from 'react';
import {
  FileText,
  MessageSquareText,
  LineChart,
  GitCompare,
  Database,
  Sparkles,
  Settings,
  ShieldAlert,
  Activity,
  Upload
} from 'lucide-react';
import type { SystemConfig } from '../types';

interface Props {
  activeTab: 'chat' | 'vault' | 'trends' | 'compare';
  setActiveTab: (tab: 'chat' | 'vault' | 'trends' | 'compare') => void;
  config: SystemConfig | null;
  docCount: number;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onOpenDisclaimer: () => void;
  onSeedDemo: () => void;
  onResetDemo: () => void;
  loadingSeed: boolean;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  config,
  docCount,
  onOpenUpload,
  onOpenSettings,
  onOpenDisclaimer,
  onSeedDemo,
  loadingSeed,
}) => {
  return (
    <header style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(9, 13, 22, 0.85)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 40 }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('chat')}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
            color: '#ffffff'
          }}>
            <Activity size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff 0%, #bae6fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MediQuery
              </span>
              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                RAG AI
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
              Medical Document Intelligence & Retrieval
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '14px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <button
            onClick={() => setActiveTab('chat')}
            className={activeTab === 'chat' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '13px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <MessageSquareText size={16} />
            <span>Chat & Search</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={activeTab === 'vault' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '13px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <FileText size={16} />
            <span>Document Vault ({docCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('trends')}
            className={activeTab === 'trends' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '13px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <LineChart size={16} />
            <span>Biomarker Trends</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={activeTab === 'compare' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '13px', padding: '8px 14px', borderRadius: '10px' }}
          >
            <GitCompare size={16} />
            <span>Compare Reports</span>
          </button>
        </nav>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Prominent Upload Button */}
          <button
            onClick={onOpenUpload}
            className="btn-primary"
            style={{ fontSize: '13px', padding: '8px 16px', background: 'linear-gradient(135deg, #06b6d4 0%, #0d9488 100%)', boxShadow: '0 0 15px rgba(6, 182, 212, 0.35)' }}
            title="Upload a new medical report, blood test, or prescription"
          >
            <Upload size={15} strokeWidth={2.5} />
            <span>Upload Report</span>
          </button>

          {/* Vector Store status pill */}
          <div
            onClick={onOpenSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '999px',
              background: config?.vector_store_mode === 'supabase' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(6, 182, 212, 0.12)',
              border: config?.vector_store_mode === 'supabase' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600',
              color: config?.vector_store_mode === 'supabase' ? '#34d399' : '#38bdf8',
            }}
            title="Click to configure vector store & API keys"
          >
            <Database size={13} />
            <span>{config?.vector_store_mode === 'supabase' ? 'pgvector' : 'Local Store'}</span>
          </div>

          {/* Quick Demo Seed */}
          <button
            onClick={onSeedDemo}
            disabled={loadingSeed}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
            title="Load sample medical reports (CBC, Lipid Panel, Prescription)"
          >
            <Sparkles size={14} color="#f59e0b" />
            <span>{loadingSeed ? 'Seeding...' : 'Demo Reports'}</span>
          </button>

          {/* Disclaimer Button */}
          <button
            onClick={onOpenDisclaimer}
            className="btn-ghost"
            style={{ color: '#fb7185', background: 'rgba(244, 63, 94, 0.1)', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="View medical safety disclaimer"
          >
            <ShieldAlert size={15} />
            <span style={{ fontWeight: '600' }}>Disclaimer</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="btn-ghost"
            style={{ padding: '8px' }}
            title="Configure Vector Store & LLM Keys"
          >
            <Settings size={18} />
          </button>

        </div>

      </div>
    </header>
  );
};
