import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FileText, LogIn, LogOut, User, ShieldCheck } from 'lucide-react';

export const Navbar = ({ onOpenAuth, activeTab, setActiveTab }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [healthStatus, setHealthStatus] = useState('checking');

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const res = await api.getHealth();
        if (res && res.status === 'healthy') {
          setHealthStatus('healthy');
        } else {
          setHealthStatus('offline');
        }
      } catch (e) {
        setHealthStatus('offline');
      }
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        background: 'rgba(9, 13, 22, 0.85)',
        borderBottom: '1px solid var(--border-glass)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
        }}
      >
        {/* Brand Logo & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-cyan) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 15px rgba(99,102,241,0.4)',
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                DocuMind AI
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: healthStatus === 'healthy' ? '#10b981' : '#ef4444',
                    boxShadow: healthStatus === 'healthy' ? '0 0 8px #10b981' : '0 0 8px #ef4444',
                  }}
                />
                <span style={{ color: 'var(--text-subtle)' }}>
                  API {healthStatus === 'healthy' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.84rem' }}
              >
                My Documents
              </button>

              {user?.isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.84rem',
                    background: activeTab === 'admin' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : undefined,
                  }}
                >
                  <ShieldCheck size={16} /> Admin Portal
                </button>
              )}
            </nav>
          )}
        </div>

        {/* User Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthenticated ? (
            <>
              <div
                className={`badge ${user?.isAdmin ? 'badge-warning' : 'badge-primary'}`}
                style={{ padding: '6px 14px', textTransform: 'none', fontSize: '0.85rem', gap: '6px' }}
              >
                {user?.isAdmin ? <ShieldCheck size={14} /> : <User size={14} />}
                <span>{user?.username} {user?.isAdmin && '(Admin)'}</span>
              </div>
              <button
                onClick={logout}
                className="btn btn-secondary"
                style={{ gap: '6px', fontSize: '0.85rem', padding: '8px 14px' }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onOpenAuth('login')}
                className="btn btn-secondary"
                style={{ gap: '6px', fontSize: '0.85rem' }}
              >
                <LogIn size={16} /> Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="btn btn-primary"
                style={{ gap: '6px', fontSize: '0.85rem' }}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
