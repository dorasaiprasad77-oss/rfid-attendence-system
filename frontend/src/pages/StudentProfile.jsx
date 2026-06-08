import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChartWidget } from '../components/ChartWidget';
import { SkeletonStats } from '../components/Skeleton';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiFetch } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch(`/students/${id}`);
        setStudent(data.data);
      } catch {
        navigate('/students');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <SkeletonStats />;
  if (!student) return null;

  const attendanceByDate = {};
  (student.attendance || []).forEach((a) => {
    const key = new Date(a.scanTime).toLocaleDateString();
    attendanceByDate[key] = (attendanceByDate[key] || 0) + 1;
  });

  const chartData = Object.entries(attendanceByDate).slice(-14).map(([date, count]) => ({
    date,
    scans: count,
  }));

  return (
    <div>
      <button className="btn btn-ghost" onClick={() => navigate('/students')} style={{ marginBottom: 16 }}>
        {'\u2190'} Back to Students
      </button>

      <div className="student-profile-header">
        <div className="avatar-placeholder avatar-xl">
          {student.firstName?.[0]}{student.lastName?.[0]}
        </div>
        <div className="student-profile-info">
          <div className="student-profile-name">
            {student.firstName} {student.lastName}
          </div>
          <div className="student-profile-id">{student.studentId}</div>
          <div className="student-profile-meta">
            <div className="student-profile-meta-item">
              <strong>Class:</strong> {student.class?.name || '-'}
            </div>
            <div className="student-profile-meta-item">
              <strong>Department:</strong> {student.class?.department?.name || '-'}
            </div>
            <div className="student-profile-meta-item">
              <strong>Gender:</strong> {student.gender || '-'}
            </div>
            <div className="student-profile-meta-item">
              <strong>Status:</strong>{' '}
              <span className={`badge badge-${student.isActive ? 'success' : 'danger'}`}>
                {student.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Contact Info</h3>
          </div>
          <div className="form-group">
            <div className="form-label">Email</div>
            <div>{student.email || '-'}</div>
          </div>
          <div className="form-group">
            <div className="form-label">Phone</div>
            <div>{student.phone || '-'}</div>
          </div>
          <div className="form-group">
            <div className="form-label">Guardian</div>
            <div>{student.guardianName || '-'} ({student.guardianPhone || '-'})</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">RFID Cards</h3>
          </div>
          {(student.rfidCards || []).length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-text">No cards assigned</div>
            </div>
          ) : student.rfidCards.map((card) => (
            <div key={card.id} className="scan-item">
              <div className={`scan-item-status ${card.isActive ? 'present' : ''}`} />
              <div className="scan-item-info">
                <div className="scan-item-name">{card.uid}</div>
                <div className="scan-item-detail">
                  {card.cardType} | {card.isActive ? 'Active' : 'Inactive'}{card.isLost ? ' | Lost' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <BarChartWidget data={chartData} xKey="date" yKey="scans" title="Recent Attendance Activity" />
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Attendance History</h3>
        </div>
        {student.attendance.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">No attendance records</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Device</th>
                  <th>Mode</th>
                </tr>
              </thead>
              <tbody>
                {student.attendance.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.scanTime).toLocaleDateString()}</td>
                    <td>{new Date(a.scanTime).toLocaleTimeString()}</td>
                    <td><span className={`badge badge-${a.status === 'present' ? 'success' : a.status === 'late' ? 'warning' : 'danger'}`}>{a.status}</span></td>
                    <td>{a.device?.name || '-'}</td>
                    <td>{a.mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
