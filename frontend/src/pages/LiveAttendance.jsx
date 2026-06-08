import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { SkeletonStats } from '../components/Skeleton';

export default function LiveAttendance() {
  const { apiFetch } = useAuth();
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState({ present: 0, late: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [simUid, setSimUid] = useState('');
  const [simDevice, setSimDevice] = useState('');
  const wsRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/attendance/today');
        setScans(data.data?.records || []);
        setStats(data.data?.stats || { present: 0, late: 0, total: 0 });
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}`;
    try {
      const ws = new WebSocket(socketUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'attendance:new') {
            setScans((prev) => [msg.data, ...prev].slice(0, 100));
            setStats((prev) => ({
              ...prev,
              total: prev.total + 1,
              present: msg.data.status === 'present' ? prev.present + 1 : prev.present,
              late: msg.data.status === 'late' ? prev.late + 1 : prev.late,
            }));
          }
        } catch {}
      };
      wsRef.current = ws;
    } catch (err) {
      console.error('WebSocket connection error. Using polling as fallback.');
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [scans]);

  const simulateScan = async () => {
    if (!simUid) return;
    try {
      const data = await apiFetch('/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({
          uid: simUid.trim(),
          ...(simDevice && { deviceId: simDevice.trim() }),
        }),
      });
      if (data.success) {
        setScans((prev) => [data.data, ...prev].slice(0, 100));
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          present: data.data.status === 'present' ? prev.present + 1 : prev.present,
          late: data.data.status === 'late' ? prev.late + 1 : prev.late,
        }));
      }
      setSimUid('');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <SkeletonStats />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Live Attendance</h2>
          <p className="page-subtitle">Real-time card scanning and monitoring</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={'\uD83D\uDCCB'} label="Total Scans Today" value={stats.total} color="primary" />
        <StatCard icon={'\u2713'} label="Present" value={stats.present} color="success" />
        <StatCard icon={'\u26A0'} label="Late" value={stats.late} color="warning" />
        <StatCard icon={'\uD83D\uDD0B'} label="Live" value="Active" color="info" />
      </div>

      <div className="live-attendance-container">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h3 className="card-title">Scan Simulator</h3>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                className="form-input"
                placeholder="RFID UID"
                value={simUid}
                onChange={(e) => setSimUid(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && simulateScan()}
                style={{ flex: 1, minWidth: 200 }}
              />
              <input
                className="form-input"
                placeholder="Device ID (optional)"
                value={simDevice}
                onChange={(e) => setSimDevice(e.target.value)}
                style={{ width: 180 }}
              />
              <button className="btn btn-primary" onClick={simulateScan}>Simulate Scan</button>
            </div>
          </div>

          <div className="card">
            <div className="scan-animation">
              <div className="scan-circle">
                <div className="scan-circle-inner">{'\uD83D\uDC4B'}</div>
              </div>
              <div className="scan-title">Waiting for scans...</div>
              <div className="scan-subtitle">Tap an RFID card or use the simulator above</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Scans</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {scans.length} records
            </span>
          </div>
          <div className="scan-history" ref={listRef}>
            {scans.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-text">No scans yet</div>
                <div className="empty-state-subtext">Scan a card to see results here</div>
              </div>
            ) : scans.map((scan) => (
              <div key={scan.id} className="scan-item">
                <div className={`scan-item-status ${scan.status}`} />
                <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: '0.75rem' }}>
                  {scan.student?.firstName?.[0]}{scan.student?.lastName?.[0]}
                </div>
                <div className="scan-item-info">
                  <div className="scan-item-name">
                    {scan.student?.firstName} {scan.student?.lastName}
                  </div>
                  <div className="scan-item-detail">
                    {scan.student?.studentId} | Card: {scan.rfidCard?.uid}
                  </div>
                </div>
                <div className="scan-item-time">
                  {new Date(scan.scanTime).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
