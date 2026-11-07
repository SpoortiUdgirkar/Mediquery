import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import type { BiomarkerTrend } from '../types';
import { api } from '../services/api';

interface Props {
  onAskAboutBiomarker: (biomarkerName: string) => void;
  onSeedDemo: () => void;
}

export const BiomarkerAnalytics: React.FC<Props> = ({ onAskAboutBiomarker, onSeedDemo }) => {
  const [trends, setTrends] = useState<BiomarkerTrend[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeMarkerName, setActiveMarkerName] = useState<string | null>(null);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      const data = await api.getBiomarkerTrends();
      setTrends(data);
      if (data.length > 0) {
        // Pick the first multi-point trend or first marker
        const multiPoint = data.find((d) => d.data_points > 1) || data[0];
        setActiveMarkerName(multiPoint.name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const categories = ['all', ...Array.from(new Set(trends.map((t) => t.category)))];

  const filteredTrends = trends.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  );

  const activeTrend = trends.find((t) => t.name === activeMarkerName) || filteredTrends[0];

  // Calculate summary KPI stats
  const totalTracked = trends.length;
  const abnormalCount = trends.filter((t) => t.latest_status !== 'NORMAL').length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header & Overview Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={24} color="#06b6d4" />
            Longitudinal Biomarker Analytics
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Track and compare physiological lab values across multiple dated test reports over time.
          </p>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="#94a3b8" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="glass-input"
            style={{ fontSize: '13px', padding: '8px 14px', cursor: 'pointer' }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Biomarker Panels' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Total Biomarkers</span>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: 0 }}>{totalTracked}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: abnormalCount > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: abnormalCount > 0 ? '#fb7185' : '#34d399' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Out-of-Range Flags</span>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: abnormalCount > 0 ? '#fb7185' : '#34d399', margin: 0 }}>
              {abnormalCount}
            </h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Normal Range</span>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#34d399', margin: 0 }}>
              {totalTracked - abnormalCount}
            </h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Multi-Date Reports</span>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#818cf8', margin: 0 }}>
              {trends.filter((t) => t.data_points > 1).length}
            </h3>
          </div>
        </div>

      </div>

      {trends.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <Activity size={48} color="#64748b" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
            No biomarker data indexed
          </h3>
          <p style={{ fontSize: '13px', maxWidth: '400px', margin: '0 auto 20px' }}>
            Upload your laboratory blood panels or click below to seed the pre-loaded clinical test dataset.
          </p>
          <button onClick={onSeedDemo} className="btn-primary" style={{ padding: '10px 22px', fontSize: '13px' }}>
            <Sparkles size={16} /> Load Demo Lab Tests & Trends
          </button>
        </div>
      ) : (
        /* Main Layout: Selected Marker Chart + Grid of Biomarkers */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 340px', gap: '20px' }}>
          
          {/* Chart Display Area */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            {activeTrend ? (
              <div>
                {/* Active Marker Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                        {activeTrend.name}
                      </h3>
                      <span className={`badge-status badge-${activeTrend.latest_status.toLowerCase()}`}>
                        {activeTrend.latest_status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>
                      <span>Category: <strong style={{ color: '#e2e8f0' }}>{activeTrend.category}</strong></span>
                      <span>Standard Reference: <strong style={{ color: '#38bdf8' }}>{activeTrend.reference_range} {activeTrend.unit}</strong></span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>
                      {activeTrend.latest_value} <span style={{ fontSize: '13px', fontWeight: '500', color: '#94a3b8' }}>{activeTrend.unit}</span>
                    </div>
                    {activeTrend.data_points > 1 && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: activeTrend.delta < 0 ? (activeTrend.name.includes('Cholesterol') ? '#34d399' : '#fb7185') : '#38bdf8',
                      }}>
                        {activeTrend.delta > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span>{activeTrend.delta > 0 ? `+${activeTrend.delta}` : activeTrend.delta} {activeTrend.unit} ({activeTrend.pct_change}%)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recharts Area Chart */}
                <div style={{ height: '280px', width: '100%', marginTop: '10px', marginBottom: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activeTrend.history.map((h) => ({
                        date: h.date,
                        value: h.value,
                        document_name: h.document_name,
                        status: h.status,
                      }))}
                      margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          borderColor: 'rgba(6, 182, 212, 0.3)',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorVal)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Timeline History Points */}
                <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.12)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '10px' }}>
                    Document Timeline Readings:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeTrend.history.map((h, hIdx) => (
                      <div
                        key={hIdx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(148, 163, 184, 0.08)',
                          fontSize: '12.5px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={14} color="#06b6d4" />
                          <span style={{ color: '#ffffff', fontWeight: '500' }}>{h.document_name}</span>
                          <span style={{ color: '#64748b', fontSize: '11px' }}>({h.date})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: '#38bdf8' }}>{h.value} {activeTrend.unit}</strong>
                          <span className={`badge-status badge-${h.status.toLowerCase()}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                            {h.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ask AI prompt button */}
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => onAskAboutBiomarker(activeTrend.name)}
                    className="btn-primary"
                    style={{ fontSize: '13px', padding: '8px 16px' }}
                  >
                    <Sparkles size={14} /> Ask MediQuery AI about {activeTrend.name}
                  </button>
                </div>

              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                Select a biomarker from the list to view its trend chart.
              </div>
            )}
          </div>

          {/* List of All Tracked Biomarkers */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', maxHeight: '600px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', marginBottom: '14px' }}>
              All Extracted Biomarkers ({filteredTrends.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredTrends.map((t) => (
                <div
                  key={t.name}
                  onClick={() => setActiveMarkerName(t.name)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: activeMarkerName === t.name ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                    border: activeMarkerName === t.name ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid rgba(148, 163, 184, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="glass-panel-hover"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: activeMarkerName === t.name ? '#38bdf8' : '#ffffff' }}>
                      {t.name}
                    </span>
                    <span className={`badge-status badge-${t.latest_status.toLowerCase()}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                      {t.latest_status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#94a3b8' }}>
                    <span>{t.latest_value} {t.unit}</span>
                    <span style={{ color: '#64748b' }}>{t.data_points} test{t.data_points > 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
