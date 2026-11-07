import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Bookmark,
  Activity,
  HelpCircle,
  FileText,
  Trash2,
  ShieldAlert,
  ExternalLink,
  Upload
} from 'lucide-react';
import type { ChatMessage, Citation, DocumentItem } from '../types';
import { api } from '../services/api';

interface Props {
  documents: DocumentItem[];
  selectedDocId: string | null;
  setSelectedDocId: (id: string | null) => void;
  onInspectCitation: (citation: Citation) => void;
  onOpenDisclaimer: () => void;
  onOpenUpload: () => void;
}

const SAMPLE_PROMPTS = [
  "What is my hemoglobin value and is it normal?",
  "Explain my latest lipid panel (Cholesterol, LDL, HDL)",
  "What medications and dosages were prescribed by Dr. Patel?",
  "Compare my cholesterol levels between January and August",
  "Are any of my lab parameters flagged as abnormal?"
];

export const ChatInterface: React.FC<Props> = ({
  documents,
  selectedDocId,
  setSelectedDocId,
  onInspectCitation,
  onOpenDisclaimer,
  onOpenUpload,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello! I'm **MediQuery**, your AI medical document assistant. 

Upload your blood tests, diagnostic reports, or prescriptions, and ask me anything in plain English. Every response will cite the exact **source document, page number, and clinical section**.

*Try asking one of the suggested questions below to get started!*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggested_followups: SAMPLE_PROMPTS.slice(0, 3),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const text = questionText || inputQuery;
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      // Build history
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome-msg')
        .slice(-4)
        .map((m) => ({ role: m.role, content: m.content }));

      const filterDocs = selectedDocId ? [selectedDocId] : undefined;
      const res = await api.sendQuery(text.trim(), filterDocs, historyPayload);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: res.citations || [],
        detected_biomarkers: res.detected_biomarkers || [],
        suggested_followups: res.suggested_followups || [],
        disclaimer: res.disclaimer,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error executing RAG search: ${err.message || 'Unable to retrieve answer.'}. Please ensure your backend is active and documents are indexed.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: `Chat session refreshed. Ask a new question about your indexed medical reports!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggested_followups: SAMPLE_PROMPTS.slice(0, 3),
      },
    ]);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      
      {/* Scope Filter & Upload Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>Search Scope:</span>
          <select
            value={selectedDocId || ''}
            onChange={(e) => setSelectedDocId(e.target.value ? e.target.value : null)}
            className="glass-input"
            style={{ fontSize: '13px', padding: '6px 12px', minWidth: '220px', cursor: 'pointer' }}
          >
            <option value="">🌐 All Uploaded Documents ({documents.length})</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                📄 {d.name} ({d.category})
              </option>
            ))}
          </select>

          <button
            onClick={onOpenUpload}
            className="btn-primary"
            style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px' }}
            title="Upload a new medical report or prescription"
          >
            <Upload size={14} /> Upload New Report
          </button>
        </div>

        <button
          onClick={handleClearChat}
          className="btn-ghost"
          style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Trash2 size={14} /> Clear Conversation
        </button>
      </div>

      {/* Messages Scroll Container */}
      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '16px' }}>
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="animate-fade-in"
            style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: msg.role === 'user' ? '80%' : '100%',
            }}
          >
            {/* Avatar */}
            {msg.role === 'assistant' && (
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#ffffff',
                boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
              }}>
                <Bot size={20} />
              </div>
            )}

            {/* Message Bubble */}
            <div
              style={{
                borderRadius: '16px',
                padding: '16px 20px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                  : 'rgba(15, 23, 42, 0.85)',
                border: msg.role === 'user'
                  ? '1px solid rgba(56, 189, 248, 0.3)'
                  : '1px solid rgba(148, 163, 184, 0.12)',
                color: '#ffffff',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                flex: 1,
              }}
            >
              {/* Header Timestamp */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '11px', color: msg.role === 'user' ? '#bae6fd' : '#64748b' }}>
                <span style={{ fontWeight: '600' }}>{msg.role === 'user' ? 'You' : 'MediQuery RAG Assistant'}</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Detected Biomarkers Chips (if any) */}
              {msg.detected_biomarkers && msg.detected_biomarkers.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', padding: '10px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', width: '100%', marginBottom: '4px' }}>
                    <Activity size={13} /> Extracted Clinical Biomarkers:
                  </span>
                  {msg.detected_biomarkers.map((b, bIdx) => (
                    <div
                      key={bIdx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.15)',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ fontWeight: '600', color: '#f8fafc' }}>{b.name}:</span>
                      <span style={{ color: '#38bdf8', fontWeight: '700' }}>{b.value} {b.unit}</span>
                      <span className={`badge-status badge-${b.status.toLowerCase()}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Content / Markdown format */}
              <div className="prose-medical" dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(msg.content) }} />

              {/* Citations Badges */}
              {msg.citations && msg.citations.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Bookmark size={14} color="#06b6d4" />
                    Verified Grounded Source Citations ({msg.citations.length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {msg.citations.map((c, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => onInspectCitation(c)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(6, 182, 212, 0.1)',
                          border: '1px solid rgba(6, 182, 212, 0.25)',
                          color: '#38bdf8',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        className="glass-panel-hover"
                        title="Click to view full cited text chunk and page number"
                      >
                        <FileText size={13} />
                        <span style={{ fontWeight: '600' }}>{c.document_name}</span>
                        <span style={{ color: '#94a3b8' }}>• P.{c.page_number}</span>
                        <ExternalLink size={12} style={{ opacity: 0.7 }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Followups */}
              {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {msg.suggested_followups.map((fPrompt, fIdx) => (
                    <button
                      key={fIdx}
                      onClick={() => handleSend(fPrompt)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '999px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(148, 163, 184, 0.15)',
                        color: '#cbd5e1',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      className="glass-panel-hover"
                    >
                      <Sparkles size={12} color="#06b6d4" />
                      <span>{fPrompt}</span>
                    </button>
                  ))}
                </div>
              )}

            </div>

            {msg.role === 'user' && (
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#38bdf8',
              }}>
                <User size={20} />
              </div>
            )}
          </div>
        ))}

        {/* Loading Animated Bubble */}
        {loading && (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }} className="animate-fade-in">
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}>
              <Bot size={20} />
            </div>
            <div style={{ padding: '12px 18px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4', animation: 'pulseGlow 1s infinite' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4', animation: 'pulseGlow 1s infinite 0.2s' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4', animation: 'pulseGlow 1s infinite 0.4s' }} />
              </div>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Scanning vectors & synthesizing grounded clinical response...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Pills */}
      {messages.length <= 2 && (
        <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HelpCircle size={13} /> Suggested Queries:
          </span>
          {SAMPLE_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="btn-ghost"
              style={{
                fontSize: '12px',
                padding: '4px 12px',
                borderRadius: '999px',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                color: '#94a3b8',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}
      >
        <button
          type="button"
          onClick={onOpenUpload}
          className="btn-secondary"
          style={{
            padding: '14px',
            borderRadius: '12px',
            color: '#38bdf8',
            borderColor: 'rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Upload / Attach medical report"
        >
          <Upload size={18} />
        </button>

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder={selectedDocId ? "Ask a question about the selected document..." : "Ask any question about your medical reports (e.g. 'What is my hemoglobin value?')..."}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="glass-input"
            style={{
              width: '100%',
              paddingRight: '48px',
              paddingTop: '14px',
              paddingBottom: '14px',
              fontSize: '14px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="btn-primary"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '36px',
              height: '36px',
              padding: 0,
              borderRadius: '10px',
              opacity: inputQuery.trim() && !loading ? 1 : 0.4,
            }}
            title="Send query"
          >
            <Send size={16} />
          </button>
        </div>
      </form>

      {/* Persistent safety notice */}
      <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <ShieldAlert size={12} color="#fb7185" />
        <span>MediQuery is an informational retrieval tool, not a diagnostic device.</span>
        <button onClick={onOpenDisclaimer} style={{ color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
          Read Safety Notice
        </button>
      </div>

    </div>
  );
};

// Helper for formatting basic Markdown elements safely in chat
function formatMarkdownToHtml(markdownText: string): string {
  let html = markdownText
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/g, '<br/><br/>');

  // Wrap list items in <ul>
  if (html.includes('<li>')) {
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  }

  return html;
}
