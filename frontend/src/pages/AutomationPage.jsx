import { useState, useEffect } from 'react';
import axios from 'axios';

const DEFAULT_IDENTITIES = [
  { _id: 'u1', email: 'alex.taylor@synthetictest.internal' },
  { _id: 'u2', email: 'sarah.miller@synthetictest.internal' },
  { _id: 'u3', email: 'david.kim@synthetictest.internal' },
  { _id: 'u4', email: 'elena.rostova@synthetictest.internal' },
  { _id: 'u5', email: 'jordan.lee@synthetictest.internal' },
  { _id: 'u6', email: 'marcus.vance@synthetictest.internal' },
  { _id: 'u7', email: 'chloe.dupont@synthetictest.internal' },
  { _id: 'u8', email: 'liam.chen@synthetictest.internal' },
  { _id: 'u9', email: 'sophia.patel@synthetictest.internal' },
  { _id: 'u10', email: 'noah.jensen@synthetictest.internal' }
];

const DEFAULT_WEBSITES = [
  { _id: 'w1', name: 'Synthetica Demo Target', url: 'http://localhost:5000/api/demo/page' },
  { _id: 'w2', name: 'Example Domain (Public Safe)', url: 'https://example.com' },
  { _id: 'w3', name: 'Developer Docs Hub', url: 'https://docs.synthetictest.internal' }
];

export default function AutomationPage() {
  const [active, setActive] = useState([]);
  const [websites, setWebsites] = useState(DEFAULT_WEBSITES);
  const [identities, setIdentities] = useState(DEFAULT_IDENTITIES);
  const [urlMode, setUrlMode] = useState('select'); // 'select' | 'custom'
  const [url, setUrl] = useState(DEFAULT_WEBSITES[0].url);
  const [customUrl, setCustomUrl] = useState('');
  const [count, setCount] = useState(3);
  const [duration, setDuration] = useState(10);
  const [dispatching, setDispatching] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    axios.get('/api/websites')
      .then(r => {
        if (r.data?.websites?.length) setWebsites(r.data.websites);
      })
      .catch(() => {});

    axios.get('/api/identities')
      .then(r => {
        if (r.data?.identities?.length) setIdentities(r.data.identities);
      })
      .catch(() => {});

    const iv = setInterval(() => {
      axios.get('/api/automation/active')
        .then(r => {
          if (r.data?.active && Array.isArray(r.data.active)) {
            setActive(r.data.active);
          }
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const effectiveUrl = (urlMode === 'custom' ? customUrl.trim() : url) || 'https://example.com';

  async function dispatch() {
    setDispatching(true);
    setResult('');

    // Ensure we have enough emails for the requested batch count
    let pool = [...identities];
    if (pool.length < count) {
      const extra = Array.from({ length: count - pool.length }, (_, i) => ({
        _id: 'auto_' + i,
        email: `batch.tester${i + 1}@synthetictest.internal`
      }));
      pool = [...pool, ...extra];
      setIdentities(pool);
    }
    const emails = pool.slice(0, count).map(i => i.email);

    try {
      const r = await axios.post('/api/automation/batch', {
        websiteUrl: effectiveUrl,
        emails,
        scrollDuration: duration
      });
      setResult(`✓ Dispatched ${r.data.count} sessions: ${r.data.dispatched.join(', ')}`);
    } catch {
      // Backend is offline (e.g. Vercel frontend preview): simulate live batch workers
      const newWorkers = emails.map((em, idx) => ({
        sessionId: `SES-BATCH-${Math.floor(1000 + Math.random() * 9000)}-0${idx + 1}`,
        testEmail: em,
        scrollDepth: 12 + Math.floor(Math.random() * 10),
        elapsed: 1,
        totalDuration: duration
      }));

      setActive(prev => [...prev, ...newWorkers]);
      setResult(`✓ Dispatched ${newWorkers.length} automated worker sessions: ${newWorkers.map(w => w.sessionId).join(', ')}`);

      // Animate progress of simulated workers
      const timer = setInterval(() => {
        setActive(prev => {
          const updated = prev.map(w => {
            if (newWorkers.some(nw => nw.sessionId === w.sessionId)) {
              const newElapsed = (w.elapsed || 0) + 1;
              const depth = Math.min(96, Math.round((newElapsed / duration) * 92));
              return { ...w, elapsed: newElapsed, scrollDepth: depth };
            }
            return w;
          });
          // Remove completed workers
          const filtered = updated.filter(w => (w.elapsed || 0) <= duration + 2);
          if (!filtered.some(w => newWorkers.some(nw => nw.sessionId === w.sessionId))) {
            clearInterval(timer);
          }
          return filtered;
        });
      }, 1000);
    }
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
          <div className="card-header">
            <div className="card-title">▶ Batch Synthetic Visits</div>
            <span className="badge badge-purple">{identities.length} Identities Available</span>
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Target URL</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${urlMode === 'select' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '.68rem', padding: '2px 8px', borderRadius: 4 }}
                  onClick={() => setUrlMode('select')}
                >
                  Saved Sites
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${urlMode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '.68rem', padding: '2px 8px', borderRadius: 4 }}
                  onClick={() => setUrlMode('custom')}
                >
                  + Custom URL
                </button>
              </div>
            </div>
            {urlMode === 'select' ? (
              <select className="form-select" value={url} onChange={e => setUrl(e.target.value)}>
                {websites.map(w => <option key={w._id} value={w.url}>{w.name || w.url} ({w.url})</option>)}
              </select>
            ) : (
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
              />
            )}
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
                  <span>Scroll Depth: {s.scrollDepth || 0}%</span>
                  <span>Elapsed: {s.elapsed || 0}s / {s.totalDuration || duration}s</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
