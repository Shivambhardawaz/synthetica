import { useState, useEffect } from 'react';
import axios from 'axios';

export default function TestUsersPage() {
  const [identities, setIdentities] = useState([]);
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = () => axios.get(`/api/identities?search=${search}`).then(r => setIdentities(r.data.identities || []));
  useEffect(() => { load(); }, [search]);

  async function generate() {
    setGenerating(true);
    await axios.post('/api/identities/generate', { count: 5 });
    await load();
    setGenerating(false);
  }

  function exportCSV() {
    const rows = ['email,type,status,sessionCount,createdAt', ...identities.map(i => `${i.email},${i.type},${i.status},${i.sessionCount},${i.createdAt}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'synthetica-identities.csv'; a.click();
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div className="card-title">◉ Synthetic Test Identities ({identities.length})</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="form-input" style={{ width: 240 }} placeholder="Search email..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-secondary" onClick={exportCSV}>⬇ Export CSV</button>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>{generating ? 'Generating...' : '+5 Synthetic Users'}</button>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Email</th><th>Type</th><th>Status</th><th>Sessions</th><th>Created</th></tr></thead>
            <tbody>
              {identities.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><div className="icon">◉</div><p>No identities. Click +5 Synthetic Users to generate.</p></div></td></tr>
              ) : identities.map(i => (
                <tr key={i._id}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '.8rem', color: 'var(--accent-light)' }}>{i.email}</td>
                  <td><span className={`badge ${i.type === 'synthetic' ? 'badge-purple' : 'badge-blue'}`}>{i.type}</span></td>
                  <td><span className={`badge ${i.status === 'active' ? 'badge-green' : 'badge-red'}`}>{i.status}</span></td>
                  <td>{i.sessionCount || 0}</td>
                  <td style={{ fontSize: '.78rem' }}>{i.createdAt ? new Date(i.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
