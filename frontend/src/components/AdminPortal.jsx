import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Users, Files, ShieldCheck, Database, FileCheck, Clock, RefreshCw } from 'lucide-react';

export const AdminPortal = ({ onError }) => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAdminTab, setActiveAdminTab] = useState('users');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, docsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(1, 50),
        api.getAdminDocuments(1, 50),
      ]);
      setStats(statsRes);
      setUsers(usersRes.users || []);
      setDocuments(docsRes.documents || []);
    } catch (e) {
      onError(e.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(15,23,42,0.6) 100%)',
          border: '1px solid rgba(245,158,11,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(245,158,11,0.2)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Admin Control Center</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              System-wide user directory, document audits, and analytics
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="btn btn-secondary"
          style={{ gap: '6px', fontSize: '0.85rem' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div
          className="glass-panel"
          style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(15,23,42,0.4) 100%)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Users size={20} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Registered Users</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats?.total_users ?? 0}</div>
        </div>

        <div
          className="glass-panel"
          style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(15,23,42,0.4) 100%)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Files size={20} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>System Documents</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats?.total_documents ?? 0}</div>
        </div>

        <div
          className="glass-panel"
          style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(15,23,42,0.4) 100%)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <FileCheck size={20} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Completed Extractions</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats?.completed_extractions ?? 0}</div>
        </div>

        <div
          className="glass-panel"
          style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(15,23,42,0.4) 100%)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Database size={20} style={{ color: 'var(--warning)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Words Extracted</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats?.total_words_extracted ?? 0}</div>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveAdminTab('users')}
            className={`btn ${activeAdminTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem' }}
          >
            <Users size={16} /> User Directory ({users.length})
          </button>

          <button
            onClick={() => setActiveAdminTab('documents')}
            className={`btn ${activeAdminTab === 'documents' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem' }}
          >
            <Files size={16} /> System-Wide Documents ({documents.length})
          </button>
        </div>

        {/* Tab 1: User Directory Table */}
        {activeAdminTab === 'users' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>ID</th>
                  <th style={{ padding: '12px' }}>Username</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>Documents</th>
                  <th style={{ padding: '12px' }}>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>#{u.id}</td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{u.username}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${u.is_admin ? 'badge-warning' : 'badge-primary'}`}>
                        {u.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: '700' }}>{u.document_count}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: System Documents Table */}
        {activeAdminTab === 'documents' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Doc ID</th>
                  <th style={{ padding: '12px' }}>Original Filename</th>
                  <th style={{ padding: '12px' }}>Owner User ID</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Upload Date</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>#{d.id}</td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{d.original_filename}</td>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>User #{d.user_id}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${d.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{formatDate(d.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
