import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Invalid token');
      const data = await res.json();
      if (data.success) {
        setUser({ ...data.data, role: data.data.role.name });
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      if (!res.ok) {
        throw new Error(`Server error (${res.status}). Make sure the backend server is running.`);
      }
      throw new Error('Invalid response from server');
    }
    if (!data.success) throw new Error(data.message || 'Login failed');
    localStorage.setItem('token', data.data.token);
    setToken(data.data.token);
    setUser({ ...data.data.user, role: data.data.user.role });
    return data.data.user;
  };

  const register = async (email, password, firstName, lastName, institutionName) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName, institutionName }),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      if (!res.ok) {
        throw new Error(`Server error (${res.status}). Make sure the backend server is running.`);
      }
      throw new Error('Invalid response from server');
    }
    if (!data.success) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('token', data.data.token);
    setToken(data.data.token);
    setUser({ ...data.data.user, role: data.data.user.role });
    return data.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const apiFetch = async (endpoint, options = {}) => {
    const headers = { ...options.headers };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${API}/api${endpoint}`, { ...options, headers });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Request failed (${res.status})`);
    }
    if (!data.success) {
      const err = new Error(data.message || 'Request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, apiFetch, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
