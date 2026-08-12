import React from 'react';
import { DocumentCard } from './DocumentCard';
import { FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';

export const DocumentGrid = ({
  documents = [],
  total = 0,
  page = 1,
  limit = 10,
  onPageChange,
  onViewText,
  onDeleteSuccess,
  onError,
}) => {
  const totalPages = Math.ceil(total / limit) || 1;

  if (!documents.length) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '60px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(99,102,241,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-subtle)',
            marginBottom: '16px',
          }}
        >
          <FolderOpen size={32} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '6px' }}>No documents found</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '360px' }}>
          Upload your PDF, DOCX, or TXT files above to start extracting text automatically.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onViewText={onViewText}
            onDeleteSuccess={onDeleteSuccess}
            onError={onError}
          />
        ))}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '28px',
            paddingTop: '18px',
            borderTop: '1px solid var(--border-glass)',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing Page {page} of {totalPages} ({total} documents total)
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
