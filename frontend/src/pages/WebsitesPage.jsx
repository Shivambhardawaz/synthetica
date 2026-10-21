import { useState, useEffect } from 'react';
import axios from 'axios';

const DEFAULT_WEBSITES = [
  { _id: 'w1', name: 'Synthetica Demo Target', url: 'https://demo-site.internal/page', addedAt: new Date().toISOString() },
  { _id: 'w2', name: 'Staging Portal', url: 'https://staging.internal/auth', addedAt: new Date().toISOString() },
  { _id: 'w3', name: 'Developer Docs Hub', url: 'https://docs.synthetictest.internal', addedAt: new Date().toISOString() }
];

export default function WebsitesPage() {
  const [websites, setWebsites] = useState(DEFAULT_WEBSITES);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    return axios.get('/api/websites')
      .then(r => {
        if (r.data && Array.isArray(r.data.websites)) {
          setWebsites(r.data.websites);
        }
      })
      .catch(() => {});
  };
  useEffect(() => { load(); }, []);

  async function add() {
    if (!url) return;
    setError(''); setLoading(true);
    try {
      await axios.post('/api/websites', { url, name });
      setUrl(''); setName('');
      await load();
    } catch (e) { setError(e.response?.data?.error || e.message); }
    finally { setLoading(false); }
  }

  async function remove(id) {
    await axios.delete(`/api/websites/${id}`);
    await load();
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">⊕ Add Authorized Website</div></div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Website URL</label>
            <input className="form-input" placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Label (optional)</label>
            <input className="form-input" placeholder="My Site" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={add} disabled={loading}>{loading ? '...' : '+ Add'}</button>
        </div>
        {error && <div style={{ color: 'var(--red)', fontSize: '.8rem', marginTop: 10 }}>⚠ {error}</div>}
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">◎ Authorized Domains</div><span className="badge badge-blue">{websites.length}</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Label</th><th>URL</th><th>Status</th><th>Added</th><th>Action</th></tr></thead>
            <tbody>
              {websites.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><div className="icon">⊕</div><p>No websites yet. Add one above.</p></div></td></tr>
              ) : websites.map(w => (
                <tr key={w._id}>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{w.name || '—'}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', color: 'var(--accent-light)' }}>{w.url}</td>
                  <td><span className="badge badge-green">Authorized</span></td>
                  <td style={{ fontSize: '.78rem' }}>{w.addedAt ? new Date(w.addedAt).toLocaleDateString() : '—'}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => remove(w._id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
