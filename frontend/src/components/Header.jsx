import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/': 'Dashboard',
  '/live-attendance': 'Live Attendance',
  '/students': 'Students',
  '/rfid-cards': 'RFID Cards',
  '/devices': 'Devices',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function Header() {
  const { user, logout, apiFetch } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await apiFetch('/notifications');
        if (data.success) setNotifications(data.data || []);
      } catch {}
    };
    fetchNotifications();
  }, []);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const title = Object.entries(pageTitles).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] || 'Dashboard';

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
    : '';

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
      </div>
      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? '\u263D' : '\u2600'}
        </button>
        <button className="notification-btn" title="Notifications">
          {unread > 0 && <span className="notification-dot" />}
          {'\uD83D\uDD14'}
        </button>
        <div className="header-profile" onClick={logout} style={{ cursor: 'pointer' }} title="Logout">
          <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
            {initials}
          </div>
          <div>
            <div className="header-profile-name">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="header-profile-role">{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
