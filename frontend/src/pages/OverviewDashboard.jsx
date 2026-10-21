import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import axios from 'axios';

const COLORS = ['#6366f1', '#a855f7', '#10b981', '#ef4444', '#f59e0b'];

const DEFAULT_OVERVIEW = {
  stats: {
    totalSessions: 24,
    uniqueTestUsers: 12,
    totalPageVisits: 58,
    avgSessionDuration: 28.5,
    avgPageLoad: 320,
    successfulRuns: 22,
    failedRuns: 2,
    successRate: 92
  },
  visitsOverTime: [
    { date: '10/15', visits: 6, sessions: 2 },
    { date: '10/16', visits: 10, sessions: 3 },
    { date: '10/17', visits: 14, sessions: 4 },
    { date: '10/18', visits: 8, sessions: 2 },
    { date: '10/19', visits: 19, sessions: 6 },
    { date: '10/20', visits: 25, sessions: 7 },
    { date: '10/21', visits: 22, sessions: 6 }
  ],
  recentSessions: [
    { sessionId: 'SES-9482', url: 'https://demo-site.internal/docs', testEmail: 'alex.taylor@synthetictest.internal', duration: 24, status: 'completed', createdAt: new Date().toISOString() },
    { sessionId: 'SES-9481', url: 'http://localhost:5000/api/demo/page', testEmail: 'sarah.miller@synthetictest.internal', duration: 32, status: 'completed', createdAt: new Date().toISOString() },
    { sessionId: 'SES-9480', url: 'https://authorized-domain.org', testEmail: 'david.kim@synthetictest.internal', duration: 15, status: 'completed', createdAt: new Date().toISOString() }
  ],
  topWebsites: [
    { _id: 'http://localhost:5000/api/demo/page', count: 28 },
    { _id: 'https://demo-site.internal/docs', count: 18 },
    { _id: 'https://authorized-domain.org', count: 12 }
  ]
};

export default function OverviewDashboard() {
  const [data, setData] = useState(DEFAULT_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    axios.get('/api/analytics/dashboard-overview')
      .then(r => {
        if (r.data && typeof r.data === 'object' && r.data.stats) {
          setData(r.data);
          setIsLive(true);
        } else {
          setData(DEFAULT_OVERVIEW);
        }
      })
      .catch(() => {
        setData(DEFAULT_OVERVIEW);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const stats = (data && typeof data === 'object' && data.stats) ? data.stats : DEFAULT_OVERVIEW.stats;
  const visitsOverTime = (data && Array.isArray(data.visitsOverTime) && data.visitsOverTime.length > 0)
    ? data.visitsOverTime
    : DEFAULT_OVERVIEW.visitsOverTime;
  const recentSessions = (data && Array.isArray(data.recentSessions))
    ? data.recentSessions
    : DEFAULT_OVERVIEW.recentSessions;
  const topWebsites = (data && Array.isArray(data.topWebsites))
    ? data.topWebsites
    : DEFAULT_OVERVIEW.topWebsites;

  const pieData = [
    { name: 'Completed', value: stats?.successfulRuns || 0 },
    { name: 'Failed', value: stats?.failedRuns || 0 },
  ].filter(d => d.value > 0);

  const statCards = [
    { label: 'Total Test Sessions', value: stats?.totalSessions ?? 0, icon: '▶', color: '#6366f1', sub: 'Automated runs', badge: stats?.successRate === 100 ? '100% OK' : null },
    { label: 'Unique Test Users', value: stats?.uniqueTestUsers ?? 0, icon: '◉', color: '#a855f7', sub: 'Synthetic identities' },
    { label: 'Total Page Visits', value: stats?.totalPageVisits ?? 0, icon: '⊕', color: '#06b6d4', sub: 'Pages rendered' },
    { label: 'Avg Session Duration', value: `${stats?.avgSessionDuration ?? 0}s`, icon: '◷', color: '#f59e0b', sub: 'Per automated run' },
    { label: 'Avg Page Load', value: `${stats?.avgPageLoad ?? 0}ms`, icon: '⚡', color: '#10b981', sub: 'DOM ready time' },
    { label: 'Successful Runs', value: stats?.successfulRuns ?? 0, icon: '✓', color: '#10b981', sub: `${stats?.successRate ?? 0}% success rate` }
  ];

  return (
    <div>
      <div className="hero-banner">
        <div className="hero-badge">{isLive ? '⚡ Live Telemetry Connected' : '⚡ Telemetry Preview Mode'}</div>
        <h1 className="hero-title">Email-Based Website Visit Tracking Platform</h1>
        <p className="hero-sub">Simulate realistic browsing journeys using Python Playwright, track per-identity visitor counts, record DOM render timings, and maintain strict authorized domain boundaries.</p>
        <div className="hero-actions">
          <span style={{ fontSize: '.85rem', color: isLive ? 'var(--green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isLive ? 'var(--green)' : 'var(--accent)' }} />
            {isLive ? 'Automation Engine Ready' : 'Vercel Deployment Active — Connect backend for live workers'}
          </span>
        </div>
      </div>

      <div className="stat-grid">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card">
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">
                {s.sub}
                {s.badge && <span className="badge badge-green" style={{ marginLeft: 8 }}>{s.badge}</span>}
              </div>
            </div>
            <div className="stat-icon" style={{ background: s.color + '22' }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">▲ Visits Over Time (Last 7 Days)</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={visitsOverTime}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0e0e2a', border: '1px solid #1e1e4a', borderRadius: 8, color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="visits" stroke="#6366f1" fill="url(#grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">◉ Session Status</div>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0e0e2a', border: '1px solid #1e1e4a', borderRadius: 8, color: '#e2e8f0' }} />
                <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="icon">◎</div><p>No session data yet</p></div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">◷ Recent Test Sessions</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Session ID</th><th>Identity</th><th>Status</th><th>Duration</th><th>Scroll</th></tr></thead>
              <tbody>
                {recentSessions.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No sessions yet. Launch your first automated test.</td></tr>
                ) : recentSessions.map(s => (
                  <tr key={s._id}>
                    <td><span style={{ fontFamily: 'var(--mono)', fontSize: '.75rem', color: 'var(--accent-light)' }}>{s.sessionId?.slice(0,16) || s._id?.slice(0,12)}</span></td>
                    <td style={{ fontSize: '.8rem' }}>{s.testEmail}</td>
                    <td><span className={`badge ${s.status === 'completed' ? 'badge-green' : s.status === 'failed' ? 'badge-red' : 'badge-yellow'}`}>{s.status}</span></td>
                    <td>{s.duration ? `${s.duration}s` : '—'}</td>
                    <td>{s.scrollDepth ? `${s.scrollDepth}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">⊕ Top Target Websites</div></div>
          {topWebsites.length === 0 ? (
            <div className="empty-state"><div className="icon">⊕</div><p>No visits recorded</p></div>
          ) : topWebsites.map((w, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < topWebsites.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: '.8rem', color: 'var(--text-dim)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.url}</span>
              <span className="badge badge-blue" style={{ marginLeft: 8, flexShrink: 0 }}>{w.visits} visits</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
