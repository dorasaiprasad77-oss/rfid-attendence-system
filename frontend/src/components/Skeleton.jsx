import React from 'react';

export function SkeletonCard() {
  return (
    <div className="card">
      <div className="skeleton skeleton-title" style={{ width: '40%' }} />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" style={{ width: '80%' }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="table-container">
      <div style={{ padding: 16 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center' }}>
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="skeleton skeleton-text" style={{ flex: 1 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="stats-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="stat-card">
          <div className="skeleton skeleton-avatar" />
          <div className="stat-info">
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            <div className="skeleton skeleton-title" style={{ height: 28, width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
