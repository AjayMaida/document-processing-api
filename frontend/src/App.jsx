import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { UploadZone } from './components/UploadZone';
import { StatsOverview } from './components/StatsOverview';
import { SearchBar } from './components/SearchBar';
import { DocumentGrid } from './components/DocumentGrid';
import { TextViewerModal } from './components/TextViewerModal';
import { Toast } from './components/Toast';
import { api } from './services/api';
import { Sparkles, ShieldAlert } from 'lucide-react';

const DashboardContent = () => {
  const { isAuthenticated } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchMatchesCount, setSearchMatchesCount] = useState(null);

  // Modals & Toast state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [extractedTextData, setExtractedTextData] = useState(null);

  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchDocuments = useCallback(async (targetPage = 1) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await api.getDocuments(targetPage, 10);
      setDocuments(data.documents || []);
      setTotalDocs(data.total || 0);
      setPage(data.page || 1);
    } catch (err) {
      showToast(err.message || 'Failed to fetch documents', 'error');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments(1);
    } else {
      setDocuments([]);
      setTotalDocs(0);
    }
  }, [isAuthenticated, fetchDocuments]);

  // Handle Search
  const handleSearch = async (query) => {
    if (!isAuthenticated) {
      setAuthMode('login');
      setAuthModalOpen(true);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.searchDocuments(query, 1, 10);
      setDocuments(res.results || []);
      setSearchMatchesCount(res.total || 0);
    } catch (err) {
      showToast(err.message || 'Search failed', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchMatchesCount(null);
    fetchDocuments(1);
  };

  // View Text Modal
  const handleViewText = async (doc) => {
    setSelectedDoc(doc);
    setTextModalOpen(true);
    setExtractedTextData(null);

    try {
      const res = await api.getDocumentText(doc.id);
      setExtractedTextData(res);
    } catch (err) {
      showToast('Extracted text not ready or failed', 'error');
    }
  };

  // Delete handler
  const handleDeleteSuccess = (docId, msg) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setTotalDocs((prev) => Math.max(0, prev - 1));
    showToast(msg, 'success');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
      />

      <main className="container" style={{ flex: 1, padding: '32px 24px 60px 24px' }}>
        {/* Banner Section */}
        <div style={{ marginBottom: '36px', textAlign: 'center' }}>
          <div
            className="badge badge-primary"
            style={{ padding: '6px 16px', marginBottom: '14px', fontSize: '0.8rem' }}
          >
            <Sparkles size={14} /> AI-Powered Asynchronous Extraction
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '12px' }} className="gradient-text">
            Smart Document Intelligence
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Upload PDFs, Word docs, and plain text files. Extract content asynchronously with Celery and perform instant full-text search.
          </p>
        </div>

        {!isAuthenticated ? (
          /* Unauthenticated Landing / Demo State */
          <div
            className="glass-panel"
            style={{
              padding: '60px 32px',
              textAlign: 'center',
              maxWidth: '680px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'rgba(99,102,241,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                marginBottom: '20px',
              }}
            >
              <ShieldAlert size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '10px' }}>
              Sign In Required to Manage Documents
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.6' }}>
              Documents are strictly scoped to user ownership. Create a free account or log in to upload files, extract text, and run full-text search queries.
            </p>
            <div style={{ display: 'flex', gap: '14px' }}>
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthModalOpen(true);
                }}
                className="btn btn-secondary"
                style={{ padding: '12px 24px' }}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('register');
                  setAuthModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ padding: '12px 24px' }}
              >
                Create Account
              </button>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard Grid */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* KPI Stats */}
            <StatsOverview totalDocs={totalDocs} documents={documents} />

            {/* Upload Dropzone */}
            <UploadZone
              isAuthenticated={isAuthenticated}
              onRequireAuth={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
              onUploadSuccess={(msg) => {
                showToast(msg, 'success');
                fetchDocuments(1);
              }}
              onUploadError={(msg) => showToast(msg, 'error')}
            />

            {/* Search & Document Header */}
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Your Documents</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Total: <strong>{totalDocs}</strong>
                </span>
              </div>

              <SearchBar
                query={searchQuery}
                setQuery={setSearchQuery}
                onSearch={handleSearch}
                onClear={handleClearSearch}
                isSearching={isSearching}
                resultCount={searchMatchesCount}
              />

              <DocumentGrid
                documents={documents}
                total={totalDocs}
                page={page}
                limit={10}
                onPageChange={(newPage) => fetchDocuments(newPage)}
                onViewText={handleViewText}
                onDeleteSuccess={handleDeleteSuccess}
                onError={(msg) => showToast(msg, 'error')}
              />
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
        onSuccess={(msg) => showToast(msg, 'success')}
      />

      {/* Text Reader Modal */}
      <TextViewerModal
        isOpen={textModalOpen}
        onClose={() => setTextModalOpen(false)}
        document={selectedDoc}
        textData={extractedTextData}
      />

      {/* Toast Alert */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
