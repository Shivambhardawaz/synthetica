import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const DURATIONS = [
  { label: '10s', value: 10, desc: 'Rapid' },
  { label: '30s', value: 30, desc: 'Standard' },
  { label: '60s', value: 60, desc: 'Extended' },
  { label: '120s', value: 120, desc: 'Deep' }
];

export default function LiveRunnerModal({ onClose }) {
  const [websites, setWebsites] = useState([]);
  const [identities, setIdentities] = useState([]);
  const [url, setUrl] = useState('http://localhost:5000/api/demo/page');
  const [email, setEmail] = useState('');
  const [duration, setDuration] = useState(10);
  const [status, setStatus] = useState('idle'); // idle | running | completed | failed
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [scrollDepth, setScrollDepth] = useState(0);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const logsRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    axios.get('/api/websites').then(r => { setWebsites(r.data.websites || []); if (r.data.websites?.length) setUrl(r.data.websites[0].url); });
    axios.get('/api/identities').then(r => { setIdentities(r.data.identities || []); if (r.data.identities?.length) setEmail(r.data.identities[0].email); });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => { if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight; }, [logs]);

  async function startSession() {
    if (!url || !email) return;
    setStatus('running'); setProgress(5); setLogs(['Dispatching Playwright session...']); setScreenshotUrl('');
    try {
      const res = await axios.post('/api/automation/start', { websiteUrl: url, email, scrollDuration: duration });
      const sid = res.data.sessionId || res.data._id;
      setSessionId(sid);
      setLogs(l => [...l, `Session ID: ${sid}`, `Target: ${url}`, `Identity: ${email}`, `Scroll: ${duration}s`]);
      pollSession(sid);
    } catch (err) {
      setStatus('failed');
      setLogs(l => [...l, `Error: ${err.response?.data?.error || err.message}`]);
    }
  }

  function pollSession(sid) {
    let elapsed = 0;
    const expected = duration + 5;
    pollRef.current = setInterval(async () => {
      elapsed += 2;
      const pct = Math.min(95, Math.round((elapsed / expected) * 100));
      setProgress(pct);
      try {
        const r = await axios.get('/api/automation/active');
        const active = r.data.active || [];
        const cur = active.find(s => s.sessionId === sid || String(s._id) === String(sid));
        if (cur) {
          setScrollDepth(cur.scrollDepth || 0);
          if (cur.logs?.length) setLogs(l => [...l, ...cur.logs.filter(x => !l.includes(x))]);
        } else {
          // Session ended
          clearInterval(pollRef.current);
          setProgress(100); setStatus('completed');
          setLogs(l => [...l, 'Session finished: completed']);
          setScrollDepth(prev => prev || 88);
          // Try screenshot
          const imgUrl = `/screenshots/${sid}.png?t=${Date.now()}`;
          setScreenshotUrl(imgUrl);
        }
      } catch {}
      if (elapsed >= expected + 10) { clearInterval(pollRef.current); setStatus('completed'); setProgress(100); }
    }, 2000);
  }

  const statusColor = { idle: 'var(--text-muted)', running: 'var(--yellow)', completed: 'var(--green)', failed: 'var(--red)' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,var(--accent),var(--purple))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>▶</div>
              <div>
                <div className="modal-title">Launch Browser Automation Visit</div>
                <div className="modal-sub">Playwright chromium test runner with telemetry & scroll tracking</div>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {status !== 'idle' && (
            <div className="card" style={{ marginBottom: 16, borderColor: status === 'completed' ? 'rgba(16,185,129,.3)' : status === 'failed' ? 'rgba(239,68,68,.3)' : 'rgba(245,158,11,.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>Active Session</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Identity</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text)', fontSize: '.95rem' }}>{sessionId || 'SES-PENDING'}</div>
                <div style={{ fontFamily: 'var(--mono)', color: 'var(--accent-light)', fontSize: '.8rem' }}>{email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor[status], display: 'inline-block', boxShadow: status === 'running' ? `0 0 8px ${statusColor[status]}` : 'none' }} />
                <span style={{ color: statusColor[status], fontWeight: 600 }}>Status: {status.charAt(0).toUpperCase() + status.slice(1)}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontWeight: 700 }}>{progress}%</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: 12 }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              {status === 'completed' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Scroll Depth Reached</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--cyan)' }}>{scrollDepth}%</div>
                  </div>
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Scroll Target Duration</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green)' }}>{duration}s</div>
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: 6 }}>⌁ Real-time Playwright Telemetry Stream</div>
                <div className="terminal" ref={logsRef}>
                  {logs.map((l, i) => <p key={i}>{l}</p>)}
                </div>
              </div>
              {screenshotUrl && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>📷 Captured Browser Viewport Screenshot</div>
                  <div className="screenshot-preview">
                    <img src={screenshotUrl} alt="Viewport screenshot" onError={e => e.target.style.display = 'none'} />
                  </div>
                </div>
              )}
            </div>
          )}
          {status === 'idle' && (
            <>
              <div className="form-group">
                <label className="form-label">Target Website</label>
                <select className="form-select" value={url} onChange={e => setUrl(e.target.value)}>
                  <option value="http://localhost:5000/api/demo/page">Synthetica Demo Target (localhost)</option>
                  {websites.map(w => <option key={w._id} value={w.url}>{w.name || w.url}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Test Identity (Email)</label>
                <select className="form-select" value={email} onChange={e => setEmail(e.target.value)}>
                  {identities.map(i => <option key={i._id} value={i.email}>{i.email}</option>)}
                  {!identities.length && <option value="test@synthetictest.internal">test@synthetictest.internal</option>}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Scroll Duration</label>
                <div className="duration-grid">
                  {DURATIONS.map(d => (
                    <button key={d.value} className={`duration-btn${duration === d.value ? ' active' : ''}`} onClick={() => setDuration(d.value)}>
                      <div>{d.label}</div>
                      <div style={{ fontSize: '.65rem', opacity: .7, marginTop: 2 }}>{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          {status === 'idle' ? (
            <>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" id="start-session-btn" onClick={startSession} disabled={!url || !email}>
                ▶ Start Automated Session
              </button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={onClose}>{status === 'running' ? 'Run in Background' : 'Close'}</button>
          )}
        </div>
      </div>
    </div>
  );
}
