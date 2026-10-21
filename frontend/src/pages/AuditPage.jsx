import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('all');

  useEffect(() => {
    axios.get(`/api/audit?action=${action}&status=all`).then(r => setLogs(r.data.logs || []));
  }, [action]);

  const actionTypes = ['all', 'website_added', 'session_completed', 'identity_generated'];

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="filter-row">
          <select className="form-select" style={{ maxWidth: 220 }} value={action} onChange={e => setAction(e.target.value)}>
            {actionTypes.map(a => <option key={a} value={a}>{a === 'all' ? 'All Actions' : a}</option>)}
          </select>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '.8rem' }}>{logs.length} entries</span>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Timestamp</th><th>Action</th><th>Detail</th><th>Status</th></tr></thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={4}><div className="empty-state"><div className="icon">◈</div><p>No audit entries found.</p></div></td></tr>
              ) : logs.map(l => (
                <tr key={l._id}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', whiteSpace: 'nowrap' }}>{l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</td>
                  <td><span className="badge badge-blue" style={{ fontSize: '.68rem' }}>{l.action}</span></td>
                  <td style={{ fontSize: '.8rem', color: 'var(--text-dim)' }}>{l.detail}</td>
                  <td><span className={`badge ${l.status === 'success' ? 'badge-green' : 'badge-red'}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
