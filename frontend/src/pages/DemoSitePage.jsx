import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DemoSitePage() {
  const [stats, setStats] = useState({ totalVisits: 0, emailCounts: {} });

  useEffect(() => {
    const load = () => axios.get('/api/demo/stats').then(r => setStats(r.data));
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, []);

  const entries = Object.entries(stats.emailCounts || {});

  return (
    <div>
      <div className="hero-banner" style={{ marginBottom: 20 }}>
        <div className="hero-badge">◎ Authorized Test Target</div>
        <h1 className="hero-title">Synthetica Demo Target Site</h1>
        <p className="hero-sub">The authorized Playwright automation target. Visit counts update live as sessions complete. Open in a new tab to see the full rendered page.</p>
        <div className="hero-actions">
          <a href="http://localhost:5000/api/demo/page" target="_blank" rel="noopener" className="btn btn-primary btn-sm">Open Demo Page ↗</a>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div><div className="stat-label">Total Visits</div><div className="stat-value">{stats.totalVisits}</div><div className="stat-sub">All automation sessions</div></div>
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,.15)' }}><span style={{ color: 'var(--accent)' }}>⊕</span></div>
        </div>
        <div className="stat-card">
          <div><div className="stat-label">Unique Identities</div><div className="stat-value">{entries.length}</div><div className="stat-sub">Distinct email visitors</div></div>
          <div className="stat-icon" style={{ background: 'rgba(168,85,247,.15)' }}><span style={{ color: 'var(--purple)' }}>◉</span></div>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div className="card-title">◉ Per-Identity Visit Counts (Live)</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {entries.map(([em, cnt]) => (
              <div key={em} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '.75rem', color: 'var(--accent-light)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{em}</span>
                <span className="badge badge-purple" style={{ marginLeft: 12, flexShrink: 0 }}>{cnt} visit{cnt > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><div className="card-title">◎ Live Preview</div></div>
        <iframe
          src="http://localhost:5000/api/demo/page"
          style={{ width: '100%', height: 500, border: 'none', borderRadius: 8, background: '#07071a' }}
          title="Demo Target Site Preview"
        />
      </div>
    </div>
  );
}
