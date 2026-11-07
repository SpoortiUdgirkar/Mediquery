import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChatInterface } from './components/ChatInterface';
import { DocumentVault } from './components/DocumentVault';
import { BiomarkerAnalytics } from './components/BiomarkerAnalytics';
import { MultiReportCompare } from './components/MultiReportCompare';
import { CitationInspectorModal } from './components/CitationInspectorModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { MedicalDisclaimerModal } from './components/MedicalDisclaimerModal';
import { SettingsModal } from './components/SettingsModal';
import { UploadModal } from './components/UploadModal';
import type { DocumentItem, Citation, SystemConfig } from './types';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'vault' | 'trends' | 'compare'>('chat');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  
  // Modals
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [activeDocViewer, setActiveDocViewer] = useState<DocumentItem | null>(null);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loadingSeed, setLoadingSeed] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [docs, conf] = await Promise.all([
        api.listDocuments().catch(() => []),
        api.getConfig().catch(() => ({
          vector_store_mode: 'local',
          supabase_configured: false,
          gemini_configured: false,
          openai_configured: false,
          llm_provider: 'auto'
        }))
      ]);
      setDocuments(docs);
      setConfig(conf);
    } catch (err) {
      console.error("Error loading initial data:", err);
    }
  };

  const handleSeedDemo = async () => {
    setLoadingSeed(true);
    try {
      await api.seedDemo();
      await loadInitialData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSeed(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      await api.resetDemo();
      await loadInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await api.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (selectedDocId === docId) setSelectedDocId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectDocForChat = (docId: string) => {
    setSelectedDocId(docId);
    setActiveTab('chat');
  };

  const handleAskBiomarker = (_markerName: string) => {
    setSelectedDocId(null);
    setActiveTab('chat');
  };

  const handleAskComparisonQuery = (_queryText: string) => {
    setSelectedDocId(null);
    setActiveTab('chat');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Background radial mesh styling */}
      <div className="bg-mesh" />

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        docCount={documents.length}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        onSeedDemo={handleSeedDemo}
        onResetDemo={handleResetDemo}
        loadingSeed={loadingSeed}
      />

      {/* Main Tab View */}
      <main style={{ flex: 1 }}>
        {activeTab === 'chat' && (
          <ChatInterface
            documents={documents}
            selectedDocId={selectedDocId}
            setSelectedDocId={setSelectedDocId}
            onInspectCitation={(citation) => setActiveCitation(citation)}
            onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {activeTab === 'vault' && (
          <DocumentVault
            documents={documents}
            onDocumentUploaded={loadInitialData}
            onSelectDocumentForChat={handleSelectDocForChat}
            onViewDocument={(doc) => setActiveDocViewer(doc)}
            onDeleteDocument={handleDeleteDocument}
            onSeedDemo={handleSeedDemo}
          />
        )}

        {activeTab === 'trends' && (
          <BiomarkerAnalytics
            onAskAboutBiomarker={handleAskBiomarker}
            onSeedDemo={handleSeedDemo}
          />
        )}

        {activeTab === 'compare' && (
          <MultiReportCompare
            documents={documents}
            onAskComparisonQuery={handleAskComparisonQuery}
            onSeedDemo={handleSeedDemo}
          />
        )}
      </main>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={loadInitialData}
        onSeedDemo={handleSeedDemo}
      />

      <CitationInspectorModal
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />

      <DocumentViewerModal
        document={activeDocViewer}
        onClose={() => setActiveDocViewer(null)}
      />

      <MedicalDisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigUpdated={loadInitialData}
      />
    </div>
  );
}

export default App;
