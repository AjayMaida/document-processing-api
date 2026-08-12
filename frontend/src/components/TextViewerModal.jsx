import React, { useState } from 'react';
import { X, Copy, Check, FileText, Hash, AlignLeft } from 'lucide-react';

export const TextViewerModal = ({ isOpen, onClose, document, textData }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !document) return null;

  const content = textData?.extracted_text || 'No text extracted yet or extraction is in progress.';
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                {document.original_filename}
              </h3>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span><Hash size={12} style={{ display: 'inline', marginRight: '4px' }} /> ID: {document.id}</span>
                <span><AlignLeft size={12} style={{ display: 'inline', marginRight: '4px' }} /> {wordCount} Words ({charCount} chars)</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              {copied ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>

            <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ borderRadius: '50%' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div
          style={{
            flex: 1,
            background: 'rgba(11, 15, 25, 0.8)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            color: 'var(--text-main)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
};
