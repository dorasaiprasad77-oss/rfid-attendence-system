import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '\u2302' },
  { path: '/live-attendance', label: 'Live Attendance', icon: '\u25B6' },
  { path: '/students', label: 'Students', icon: '\u263A' },
  { path: '/rfid-cards', label: 'RFID Cards', icon: '\u25A3' },
  { path: '/devices', label: 'Devices', icon: '\u2699' },
  { path: '/reports', label: 'Reports', icon: '\u2261' },
  { path: '/settings', label: 'Settings', icon: '\u2692' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
    : '';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">RF</div>
        <div>
          <div className="sidebar-logo-text">RFID Attendance</div>
          <div className="sidebar-logo-sub">Management System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Main Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-link ${(isActive || (item.path !== '/' && location.pathname.startsWith(item.path))) ? 'active' : ''}`
              }
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar-placeholder">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
