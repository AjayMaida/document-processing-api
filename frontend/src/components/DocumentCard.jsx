import React, { useState } from 'react';
import { FileText, Download, Eye, Trash2, Calendar, HardDrive, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export const DocumentCard = ({ document, onViewText, onDeleteSuccess, onError }) => {
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await api.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.original_filename || `document_${document.id}`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (e) {
      onError('Failed to download document');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${document.original_filename}"?`)) return;
    setDeleting(true);
    try {
      await api.deleteDocument(document.id);
      onDeleteSuccess(document.id, `Deleted "${document.original_filename}"`);
    } catch (e) {
      onError(e.message || 'Failed to delete document');
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="badge badge-success">
            <CheckCircle2 size={12} /> Extracted
          </span>
        );
      case 'pending':
        return (
          <span className="badge badge-warning">
            <Clock size={12} /> Processing
          </span>
        );
      default:
        return (
          <span className="badge badge-primary">
            <CheckCircle2 size={12} /> Ready
          </span>
        );
    }
  };

  const getFileExt = (filename) => {
    return (filename.split('.').pop() || 'doc').toUpperCase();
  };

  return (
    <div
      className="glass-panel glass-panel-interactive"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        position: 'relative',
      }}
    >
      <div>
        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.75rem',
              color: 'var(--primary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {getFileExt(document.original_filename)}
          </div>
          {getStatusBadge(document.status)}
        </div>

        {/* Filename & Search Snippet */}
        <h4
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={document.original_filename}
        >
          {document.original_filename}
        </h4>

        {document.snippet && (
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--accent-cyan)',
              background: 'rgba(6, 182, 212, 0.1)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '14px',
              fontStyle: 'italic',
            }}
          >
            "...{document.snippet}..."
          </p>
        )}

        {/* Meta Info */}
        <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HardDrive size={12} /> {formatFileSize(document.file_size)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} /> {formatDate(document.created_at)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
        <button
          onClick={() => onViewText(document)}
          className="btn btn-secondary"
          style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem' }}
          title="View Extracted Text"
        >
          <Eye size={14} /> Text
        </button>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn btn-secondary"
          style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem' }}
          title="Download File"
        >
          <Download size={14} /> Download
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn btn-danger btn-icon"
          style={{ width: '34px', height: '34px', flexShrink: 0 }}
          title="Delete Document"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
