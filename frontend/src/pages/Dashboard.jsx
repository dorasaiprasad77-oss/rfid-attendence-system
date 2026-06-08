import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { BarChartWidget, PieChartWidget } from '../components/ChartWidget';
import { SkeletonStats } from '../components/Skeleton';

export default function Dashboard() {
  const { apiFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          apiFetch('/attendance/stats'),
          apiFetch('/attendance/today'),
        ]);
        setStats(statsRes.data);
        setRecent((recentRes.data?.records || []).slice(0, 10));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <SkeletonStats />;

  const today = stats?.today || {};
  const weekly = stats?.weekly || [];
  const totalStudents = stats?.totalStudents || 0;

  const pieData = [
    { name: 'Present', value: today.present || 0 },
    { name: 'Late', value: today.late || 0 },
    { name: 'Absent', value: Math.max(0, totalStudents - (today.total || 0)) },
  ];

  const weeklyData = weekly.map((d) => ({
    day: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
    Present: d.present,
    Late: d.late,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Attendance overview and statistics</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={'\uD83C\uDF93'}
          label="Total Students"
          value={totalStudents}
          color="primary"
        />
        <StatCard
          icon={'\u2713'}
          label="Present Today"
          value={today.present || 0}
          change={`${totalStudents > 0 ? Math.round((today.present / totalStudents) * 100) : 0}% rate`}
          color="success"
        />
        <StatCard
          icon={'\u26A0'}
          label="Late Today"
          value={today.late || 0}
          color="warning"
        />
        <StatCard
          icon={'\u2717'}
          label="Absent Today"
          value={Math.max(0, totalStudents - (today.total || 0))}
          color="danger"
        />
      </div>

      <div className="grid-2">
        <BarChartWidget
          data={weeklyData}
          xKey="day"
          yKey="Present"
          title="Weekly Attendance"
        />
        <PieChartWidget
          data={pieData}
          title="Today's Breakdown"
        />
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3 className="card-title">Recent Scans</h3>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{'\uD83D\uDCCB'}</div>
            <div className="empty-state-text">No scans recorded today</div>
          </div>
        ) : (
          recent.map((record) => (
            <div key={record.id} className="scan-item">
              <div className={`scan-item-status ${record.status}`} />
              <div className="scan-item-info">
                <div className="scan-item-name">
                  {record.student?.firstName} {record.student?.lastName}
                </div>
                <div className="scan-item-detail">
                  {record.student?.studentId} | {record.student?.class?.name}
                </div>
              </div>
              <div className="scan-item-time">
                {new Date(record.scanTime).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
