import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { SkeletonTable } from '../components/Skeleton';

export default function Students() {
  const { apiFetch } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    studentId: '', firstName: '', lastName: '', email: '', phone: '',
    gender: '', classId: '', guardianName: '', guardianPhone: '',
  });
  const [classes, setClasses] = useState([]);

  const loadStudents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      const data = await apiFetch(`/students?${params}`);
      setStudents(data.data.students);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, apiFetch, toast]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await apiFetch('/students?limit=1');
        if (data.data.students) {
          const classSet = new Set();
          data.data.students.forEach((s) => {
            if (s.class) classSet.add(JSON.stringify(s.class));
          });
        }
      } catch {}
    };
    loadClasses();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this student?')) return;
    try {
      await apiFetch(`/students/${id}`, { method: 'DELETE' });
      toast.success('Student deactivated');
      loadStudents(pagination.page);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await apiFetch(`/students/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        toast.success('Student updated');
      } else {
        await apiFetch('/students', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        toast.success('Student created');
      }
      setShowModal(false);
      setEditing(null);
      setForm({ studentId: '', firstName: '', lastName: '', email: '', phone: '', gender: '', classId: '', guardianName: '', guardianPhone: '' });
      loadStudents();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openEdit = (student) => {
    setEditing(student);
    setForm({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email || '',
      phone: student.phone || '',
      gender: student.gender || '',
      classId: student.classId || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ studentId: '', firstName: '', lastName: '', email: '', phone: '', gender: '', classId: '', guardianName: '', guardianPhone: '' });
    setShowModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Students</h2>
          <p className="page-subtitle">Manage registered students</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Student</button>
      </div>

      <div className="filters-bar" style={{ marginBottom: 16 }}>
        <div className="search-bar">
          <span className="search-bar-icon">{'\uD83D\uDD0D'}</span>
          <input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadStudents()}
          />
        </div>
      </div>

      {loading ? <SkeletonTable /> : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Gender</th>
                <th>Cards</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state">No students found</div></td></tr>
              ) : students.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.studentId}</strong></td>
                  <td>
                    <a onClick={() => navigate(`/students/${s.id}`)} style={{ cursor: 'pointer', color: 'var(--primary)' }}>
                      {s.firstName} {s.lastName}
                    </a>
                  </td>
                  <td>{s.class?.name || '-'}</td>
                  <td>{s.gender || '-'}</td>
                  <td>{(s.rfidCards || []).length}</td>
                  <td><span className={`badge badge-${s.isActive ? 'success' : 'danger'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="actions-cell">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(s)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="pagination-buttons">
                <button className="pagination-btn" disabled={pagination.page <= 1} onClick={() => loadStudents(pagination.page - 1)}>Prev</button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`pagination-btn ${p === pagination.page ? 'active' : ''}`} onClick={() => loadStudents(p)}>{p}</button>
                ))}
                <button className="pagination-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => loadStudents(pagination.page + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        title={editing ? 'Edit Student' : 'Add Student'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowModal(false); setEditing(null); }}>Cancel</button>
            <button className="btn btn-primary" form="student-form">Save</button>
          </>
        }
      >
        <form id="student-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Student ID *</label>
              <input className="form-input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required disabled={!!editing} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Guardian Name</label>
              <input className="form-input" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Guardian Phone</label>
              <input className="form-input" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
