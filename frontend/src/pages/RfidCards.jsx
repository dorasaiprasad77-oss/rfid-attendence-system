import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';

export default function RfidCards() {
  const { apiFetch } = useAuth();
  const toast = useToast();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ uid: '', studentId: '', cardType: 'student' });

  const loadCards = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const data = await apiFetch(`/rfid-cards?${params}`);
      setCards(data.data.cards);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, apiFetch, toast]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/rfid-cards', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast.success('Card assigned');
      setShowModal(false);
      setForm({ uid: '', studentId: '', cardType: 'student' });
      loadCards();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleCardStatus = async (card) => {
    try {
      await apiFetch(`/rfid-cards/${card.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !card.isActive }),
      });
      toast.success(`Card ${card.isActive ? 'deactivated' : 'activated'}`);
      loadCards(pagination.page);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">RFID Cards</h2>
          <p className="page-subtitle">Manage registered RFID cards</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Assign Card</button>
      </div>

      <div className="filters-bar" style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <span className="search-bar-icon">{'\uD83D\uDD0D'}</span>
          <input
            placeholder="Search by UID or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadCards()}
          />
        </div>
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? <SkeletonTable /> : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>UID</th>
                <th>Assigned To</th>
                <th>Student ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Lost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state">No cards found</div></td></tr>
              ) : cards.map((card) => (
                <tr key={card.id}>
                  <td><code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>{card.uid}</code></td>
                  <td>{card.student ? `${card.student.firstName} ${card.student.lastName}` : '-'}</td>
                  <td>{card.student?.studentId || '-'}</td>
                  <td><span className="badge badge-info">{card.cardType}</span></td>
                  <td><span className={`badge badge-${card.isActive ? 'success' : 'danger'}`}>{card.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td><span className={`badge badge-${card.isLost ? 'warning' : 'neutral'}`}>{card.isLost ? 'Yes' : 'No'}</span></td>
                  <td className="actions-cell">
                    <button className={`btn btn-sm btn-${card.isActive ? 'warning' : 'success'}`} onClick={() => toggleCardStatus(card)}>
                      {card.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="pagination-buttons">
                <button className="pagination-btn" disabled={pagination.page <= 1} onClick={() => loadCards(pagination.page - 1)}>Prev</button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`pagination-btn ${p === pagination.page ? 'active' : ''}`} onClick={() => loadCards(p)}>{p}</button>
                ))}
                <button className="pagination-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => loadCards(pagination.page + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Assign New Card"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" form="card-form">Assign</button>
          </>
        }
      >
        <form id="card-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Card UID *</label>
            <input className="form-input" value={form.uid} onChange={(e) => setForm({ ...form, uid: e.target.value })} required placeholder="e.g. A1:B2:C3:D4" />
          </div>
          <div className="form-group">
            <label className="form-label">Student ID *</label>
            <input className="form-input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required placeholder="e.g. STU0001" />
          </div>
          <div className="form-group">
            <label className="form-label">Card Type</label>
            <select className="form-select" value={form.cardType} onChange={(e) => setForm({ ...form, cardType: e.target.value })}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
