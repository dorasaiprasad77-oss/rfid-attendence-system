import React from 'react';

export default function StatCard({ icon, label, value, change, color = 'primary', loading }) {
  if (loading) {
    return (
      <div className="stat-card">
        <div className="skeleton skeleton-avatar" />
        <div className="stat-info">
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          <div className="skeleton skeleton-title" style={{ height: 28, width: '40%' }} />
        </div>
      </div>
    );
  }

  const isPositive = change && change.startsWith('+');
  const isNegative = change && change.startsWith('-');

  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {change && (
          <div className={`stat-change ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
}
