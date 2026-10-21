import { useState, useEffect } from 'react';
import axios from 'axios';

const DEFAULT_SESSIONS = [
  { _id: 's1', sessionId: 'SES-9482', testEmail: 'alex.taylor@synthetictest.internal', targetUrl: 'https://demo-site.internal/docs', status: 'completed', duration: 24, pageLoadTime: 285, scrollDepth: 100, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: 's2', sessionId: 'SES-9481', testEmail: 'sarah.miller@synthetictest.internal', targetUrl: 'http://localhost:5000/api/demo/page', status: 'completed', duration: 32, pageLoadTime: 310, scrollDepth: 100, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { _id: 's3', sessionId: 'SES-9480', testEmail: 'david.kim@synthetictest.internal', targetUrl: 'https://authorized-domain.org', status: 'completed', duration: 15, pageLoadTime: 195, scrollDepth: 85, createdAt: new Date(Date.now() - 10800000).toISOString() },
  { _id: 's4', sessionId: 'SES-9479', testEmail: 'elena.rostova@synthetictest.internal', targetUrl: 'https://staging.internal/auth', status: 'failed', duration: 6, pageLoadTime: 850, scrollDepth: 12, createdAt: new Date(Date.now() - 14400000).toISOString() }
];

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState(DEFAULT_SESSIONS);
  const [total, setTotal] = useState(DEFAULT_SESSIONS.length);
  const [status, setStatus] = useState('all');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/analytics/sessions?status=${status}&testEmail=${email}`)
      .then(r => {
        if (r.data && Array.isArray(r.data.sessions)) {
          setSessions(r.data.sessions);
          setTotal(r.data.total ?? r.data.sessions.length);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, email]);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filter-row">
          <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="queued">Queued</option>
          </select>
          <input className="form-input" placeholder="Filter by email..." value={email} onChange={e => setEmail(e.target.value)} />
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '.8rem', whiteSpace: 'nowrap' }}>{total} records</span>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Session ID</th><th>Identity</th><th>Target URL</th><th>Status</th><th>Duration</th><th>Load Time</th><th>Scroll</th><th>Date</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><div className="icon">▲</div><p>No sessions match the current filters.</p></div></td></tr>
              ) : sessions.map(s => (
                <tr key={s._id}>
                  <td><span style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', color: 'var(--accent-light)' }}>{(s.sessionId || s._id || '').slice(0, 18)}</span></td>
                  <td style={{ fontSize: '.78rem' }}>{s.testEmail || '—'}</td>
                  <td style={{ fontSize: '.72rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.targetUrl || '—'}</td>
                  <td><span className={`badge ${s.status === 'completed' ? 'badge-green' : s.status === 'failed' ? 'badge-red' : s.status === 'running' ? 'badge-yellow' : 'badge-blue'}`}>{s.status}</span></td>
                  <td>{s.duration != null ? `${s.duration}s` : '—'}</td>
                  <td>{s.pageLoadTime != null ? `${s.pageLoadTime}ms` : '—'}</td>
                  <td>{s.scrollDepth != null ? `${s.scrollDepth}%` : '—'}</td>
                  <td style={{ fontSize: '.72rem', whiteSpace: 'nowrap' }}>{s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
