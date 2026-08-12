import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, FileCode, FileSpreadsheet } from 'lucide-react';
import { api } from '../services/api';

export const UploadZone = ({ onUploadSuccess, onUploadError, isAuthenticated, onRequireAuth }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const allowedTypes = ['.pdf', '.docx', '.txt'];

  const validateFile = (file) => {
    if (!file) return false;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(ext)) {
      onUploadError(`Invalid file format "${ext}". Allowed: PDF, DOCX, TXT.`);
      return false;
    }
    if (file.size > 15 * 1024 * 1024) {
      onUploadError('File size exceeds 15MB limit.');
      return false;
    }
    return true;
  };

  const handleFileSelect = (file) => {
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }
    if (validateFile(file)) {
      setSelectedFile(file);
      processUpload(file);
    }
  };

  const processUpload = async (file) => {
    setUploading(true);
    setUploadProgress(25);

    try {
      setUploadProgress(60);
      const doc = await api.uploadDocument(file);
      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        setSelectedFile(null);
        setUploadProgress(0);
        onUploadSuccess(`Successfully uploaded "${doc.original_filename}"! Text extraction started.`);
      }, 500);
    } catch (err) {
      setUploading(false);
      setUploadProgress(0);
      onUploadError(err.message || 'Failed to upload document');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '32px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        accept=".pdf,.docx,.txt"
        style={{ display: 'none' }}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary)' : 'rgba(99, 102, 241, 0.25)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging
            ? 'rgba(99, 102, 241, 0.12)'
            : 'linear-gradient(180deg, rgba(15,23,42,0.4) 0%, rgba(30,41,59,0.2) 100%)',
          transition: 'var(--transition)',
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
            background: isDragging
              ? 'var(--primary)'
              : 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(6,182,212,0.2) 100%)',
            border: '1px solid var(--border-glass-bright)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDragging ? '#fff' : 'var(--primary)',
            marginBottom: '16px',
            transition: 'var(--transition)',
            transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <UploadCloud size={32} />
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px' }}>
          {isDragging ? 'Drop your document here' : 'Click or Drag & Drop to Upload'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', marginBottom: '16px' }}>
          Upload PDF, Word (DOCX), or Text files up to 15MB. Async AI text extraction runs automatically.
        </p>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="badge badge-primary">.PDF</span>
          <span className="badge badge-cyan">.DOCX</span>
          <span className="badge badge-success">.TXT</span>
        </div>
      </div>

      {/* Upload Progress Overlay */}
      {uploading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(9, 13, 22, 0.9)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            zIndex: 10,
          }}
        >
          <div style={{ width: '100%', maxWidth: '320px', textAlign: 'center' }}>
            <p style={{ fontWeight: '600', marginBottom: '12px', fontSize: '0.95rem' }}>
              Uploading {selectedFile?.name}...
            </p>
            <div
              style={{
                height: '8px',
                width: '100%',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent-cyan) 100%)',
                  transition: 'width 0.3s ease',
                  borderRadius: '4px',
                }}
              />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
              {uploadProgress}% completed
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
