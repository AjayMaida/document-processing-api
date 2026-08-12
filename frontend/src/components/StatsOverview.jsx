import React from 'react';
import { Files, FileCheck, Clock, Search } from 'lucide-react';

export const StatsOverview = ({ totalDocs = 0, documents = [] }) => {
  const completedCount = documents.filter((d) => d.status === 'completed').length;
  const pendingCount = documents.filter((d) => d.status === 'pending').length;

  const stats = [
    {
      title: 'Total Documents',
      value: totalDocs,
      icon: <Files size={22} />,
      gradient: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)',
      borderColor: 'rgba(99,102,241,0.3)',
      color: '#a5b4fc',
    },
    {
      title: 'Extracted Content',
      value: completedCount,
      icon: <FileCheck size={22} />,
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)',
      borderColor: 'rgba(16,185,129,0.3)',
      color: '#6ee7b7',
    },
    {
      title: 'Processing Queue',
      value: pendingCount,
      icon: <Clock size={22} />,
      gradient: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)',
      borderColor: 'rgba(245,158,11,0.3)',
      color: '#fde047',
    },
    {
      title: 'Search Index',
      value: `${totalDocs} Indexed`,
      icon: <Search size={22} />,
      gradient: 'linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%)',
      borderColor: 'rgba(6,182,212,0.3)',
      color: '#67e8f9',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
      {stats.map((stat, i) => (
        <div
          key={i}
          className="glass-panel"
          style={{
            padding: '20px',
            background: stat.gradient,
            border: `1px solid ${stat.borderColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: stat.color,
            }}
          >
            {stat.icon}
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              {stat.title}
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
