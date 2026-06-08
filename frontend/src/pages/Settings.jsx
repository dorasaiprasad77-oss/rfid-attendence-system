import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function Settings() {
  const { user, apiFetch, fetchProfile } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      await fetchProfile();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
        }),
      });
      toast.success('Password changed');
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Profile</h3>
        <div className="settings-card">
          <form onSubmit={handleProfileUpdate}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Security</h3>
        <div className="settings-card">
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" value={password.confirmPassword} onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">About</h3>
        <div className="settings-card">
          <div className="settings-field">
            <div>
              <div className="settings-field-label">Version</div>
              <div className="settings-field-desc">RFID Smart Attendance Management System</div>
            </div>
            <div>v1.0.0</div>
          </div>
          <div className="settings-field">
            <div>
              <div className="settings-field-label">Account</div>
              <div className="settings-field-desc">{user?.email}</div>
            </div>
            <div className="badge badge-success">Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
