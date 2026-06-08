import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';

export default function Devices() {
  const { apiFetch } = useAuth();
  const toast = useToast();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', deviceId: '', location: '', deviceType: 'reader', ipAddress: '', port: '',
  });

  const loadDevices = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/devices?page=${page}&limit=10`);
      setDevices(data.data.devices);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, toast]);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiFetch(`/devices/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        toast.success('Device updated');
      } else {
        await apiFetch('/devices', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        toast.success('Device created');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ name: '', deviceId: '', location: '', deviceType: 'reader', ipAddress: '', port: '' });
      loadDevices();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openEdit = (device) => {
    setEditing(device);
    setForm({
      name: device.name,
      deviceId: device.deviceId,
      location: device.location || '',
      deviceType: device.deviceType,
      ipAddress: device.ipAddress || '',
      port: device.port?.toString() || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this device?')) return;
    try {
      await apiFetch(`/devices/${id}`, { method: 'DELETE' });
      toast.success('Device deactivated');
      loadDevices(pagination.page);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Devices</h2>
          <p className="page-subtitle">Manage RFID reader devices</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', deviceId: '', location: '', deviceType: 'reader', ipAddress: '', port: '' }); setShowModal(true); }}>
          + Add Device
        </button>
      </div>

      {loading ? <SkeletonTable /> : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Device ID</th>
                <th>Location</th>
                <th>Type</th>
                <th>IP Address</th>
                <th>Last Heartbeat</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state">No devices found</div></td></tr>
              ) : devices.map((device) => (
                <tr key={device.id}>
                  <td><strong>{device.name}</strong></td>
                  <td><code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>{device.deviceId}</code></td>
                  <td>{device.location || '-'}</td>
                  <td><span className="badge badge-info">{device.deviceType}</span></td>
                  <td>{device.ipAddress || '-'}</td>
                  <td>{device.lastHeartbeat ? new Date(device.lastHeartbeat).toLocaleString() : 'Never'}</td>
                  <td><span className={`badge badge-${device.isActive ? 'success' : 'danger'}`}>{device.isActive ? 'Online' : 'Offline'}</span></td>
                  <td className="actions-cell">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(device)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(device.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">Page {pagination.page} of {pagination.totalPages}</div>
              <div className="pagination-buttons">
                <button className="pagination-btn" disabled={pagination.page <= 1} onClick={() => loadDevices(pagination.page - 1)}>Prev</button>
                <button className="pagination-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => loadDevices(pagination.page + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? 'Edit Device' : 'Add Device'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowModal(false); setEditing(null); }}>Cancel</button>
            <button className="btn btn-primary" form="device-form">Save</button>
          </>
        }
      >
        <form id="device-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Device ID *</label>
              <input className="form-input" value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} required disabled={!!editing} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Device Type</label>
              <select className="form-select" value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })}>
                <option value="reader">Reader</option>
                <option value="gate">Gate</option>
                <option value="scanner">Scanner</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">IP Address</label>
              <input className="form-input" value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Port</label>
              <input type="number" className="form-input" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
