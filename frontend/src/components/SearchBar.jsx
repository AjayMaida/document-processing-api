import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export const SearchBar = ({ query, setQuery, onSearch, onClear, isSearching, resultCount }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '16px',
            color: 'var(--text-subtle)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          className="input-field"
          style={{
            paddingLeft: '46px',
            paddingRight: query ? '90px' : '46px',
            height: '48px',
            fontSize: '0.95rem',
            borderRadius: 'var(--radius-md)',
          }}
          placeholder="Search filenames or extracted document text..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) onClear();
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {isSearching && <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary)' }} />}

          {query && (
            <button
              type="button"
              onClick={onClear}
              className="btn btn-secondary btn-icon"
              style={{ width: '28px', height: '28px', borderRadius: '50%' }}
            >
              <X size={14} />
            </button>
          )}

          <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
            Search
          </button>
        </div>
      </div>

      {resultCount !== null && (
        <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: '500' }}>
          Found {resultCount} {resultCount === 1 ? 'match' : 'matches'} for "{query}"
        </div>
      )}
    </form>
  );
};
