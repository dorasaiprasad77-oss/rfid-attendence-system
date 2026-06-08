import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const API = import.meta.env.VITE_API_URL || '';

export default function Reports() {
  const { token } = useAuth();
  const toast = useToast();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [format, setFormat] = useState('pdf');
  const [reportType, setReportType] = useState('attendance');
  const [exporting, setExporting] = useState(false);

  const downloadExport = async (params) => {
    setExporting(true);
    try {
      const res = await fetch(`${API}/api/reports/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Export failed');
      }

      const blob = await res.blob();
      const fmt = params.get('format');
      const ext = fmt === 'pdf' ? 'pdf' : fmt === 'excel' ? 'xlsx' : 'csv';
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${fmt.toUpperCase()} report downloaded`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    params.set('format', format);
    params.set('type', reportType);
    downloadExport(params);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Reports</h2>
          <p className="page-subtitle">Export attendance data</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Export Settings</h3>
          </div>

          <div className="form-group">
            <label className="form-label">Report Type</label>
            <select className="form-select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="attendance">Attendance Report</option>
              <option value="students">Student List</option>
              <option value="daily">Daily Summary</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">From Date</label>
              <input type="date" className="form-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">To Date</label>
              <input type="date" className="form-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Export Format</label>
            <div className="report-actions">
              {['pdf', 'excel', 'csv'].map((fmt) => (
                <button
                  key={fmt}
                  className={`btn ${format === fmt ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFormat(fmt)}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleExport}
            disabled={exporting}
            style={{ width: '100%', marginTop: 8 }}
          >
            {exporting ? 'Exporting...' : `Download ${format.toUpperCase()}`}
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Reports</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                const params = new URLSearchParams({ format: 'pdf', type: 'attendance', dateFrom: today, dateTo: today });
                downloadExport(params);
              }}
              disabled={exporting}
            >
              Today's Attendance (PDF)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const start = new Date();
                start.setDate(start.getDate() - 7);
                const today = new Date().toISOString().split('T')[0];
                const params = new URLSearchParams({ format: 'excel', type: 'daily', dateFrom: start.toISOString().split('T')[0], dateTo: today });
                downloadExport(params);
              }}
              disabled={exporting}
            >
              Weekly Summary (Excel)
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const params = new URLSearchParams({ format: 'csv', type: 'students' });
                downloadExport(params);
              }}
              disabled={exporting}
            >
              Student List (CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
