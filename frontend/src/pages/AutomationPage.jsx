import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AutomationPage() {
  const [active, setActive] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [identities, setIdentities] = useState([]);
  const [url, setUrl] = useState('http://localhost:5000/api/demo/page');
  const [count, setCount] = useState(2);
  const [duration, setDuration] = useState(10);
  const [dispatching, setDispatching] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    axios.get('/api/websites').then(r => setWebsites(r.data.websites || []));
    axios.get('/api/identities').then(r => setIdentities(r.data.identities || []));
    const iv = setInterval(() => {
      axios.get('/api/automation/active').then(r => setActive(r.data.active || []));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  async function dispatch() {
    setDispatching(true); setResult('');
    const emails = identities.slice(0, count).map(i => i.email);
    if (!emails.length) { setResult('No identities available. Generate some first.'); setDispatching(false); return; }
    try {
      const r = await axios.post('/api/automation/batch', { websiteUrl: url, emails, scrollDuration: duration });
      setResult(`✓ Dispatched ${r.data.count} sessions: ${r.data.dispatched.join(', ')}`);
    } catch (e) { setResult(`✗ ${e.response?.data?.error || e.message}`); }
    setDispatching(false);
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">⚙ Concurrency Guardrails</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
            {[['Max Concurrent', '3', 'var(--accent)'], ['Queue Depth', active.length, 'var(--yellow)'], ['SSRF Shield', 'Active', 'var(--green)']].map(([l, v, c]) => (
              <div key={l} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 10px' }}>
                <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>{l}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">▶ Batch Synthetic Visits</div></div>
          <div className="form-group">
            <label className="form-label">Target URL</label>
            <select className="form-select" value={url} onChange={e => setUrl(e.target.value)}>
              <option value="http://localhost:5000/api/demo/page">Synthetica Demo Target</option>
              {websites.map(w => <option key={w._id} value={w.url}>{w.name || w.url}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Sessions to Dispatch</label>
              <select className="form-select" value={count} onChange={e => setCount(Number(e.target.value))}>
                {[1,2,3,5,10].map(n => <option key={n} value={n}>{n} session{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Scroll Duration</label>
              <select className="form-select" value={duration} onChange={e => setDuration(Number(e.target.value))}>
                <option value={10}>10s — Rapid</option>
                <option value={30}>30s — Standard</option>
                <option value={60}>60s — Extended</option>
                <option value={120}>120s — Deep</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={dispatch} disabled={dispatching}>
            {dispatching ? 'Dispatching...' : `▶ Dispatch ${count} Automated Session${count > 1 ? 's' : ''}`}
          </button>
          {result && <div style={{ marginTop: 10, fontSize: '.8rem', color: result.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{result}</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">◎ Active Automation Workers</div>
          <span className="badge badge-blue">{active.length} running</span>
        </div>
        {active.length === 0 ? (
          <div className="empty-state"><div className="icon">▶</div><p>No active sessions. Dispatch a batch to see live workers here.</p></div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {active.map(s => (
              <div key={s.sessionId} style={{ background: 'var(--bg)', border: '1px solid var(--border-bright)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '.8rem', color: 'var(--accent-light)' }}>{s.sessionId}</span>
                  <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{s.testEmail}</span>
                </div>
                <div className="progress-bar" style={{ marginBottom: 6 }}>
                  <div className="progress-fill" style={{ width: `${s.scrollDepth || 5}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--text-muted)' }}>
                  <span>Scroll: {s.scrollDepth || 0}%</span>
                  <span>Elapsed: {s.elapsed}s</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
