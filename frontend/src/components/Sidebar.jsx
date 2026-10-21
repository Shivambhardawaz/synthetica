export default function Sidebar({ current, onNav }) {
  const nav = [
    { id: 'overview', icon: '▦', label: 'Overview' },
    { id: 'websites', icon: '⊕', label: 'Websites & URLs' },
    { id: 'users', icon: '◉', label: 'Test Users (CSV)' },
    { id: 'automation', icon: '▶', label: 'Automation' },
    { id: 'analytics', icon: '▲', label: 'Analytics & Reports' },
    { id: 'demo', icon: '◎', label: 'Target Demo Site', badge: 'Live' },
    { id: 'audit', icon: '◈', label: 'Security & Audit' }
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">⚡</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="logo-text">Synthetica</span>
            <span className="logo-version">V2.4</span>
          </div>
          <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>Visit Tracker & Automation</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-label">Navigation</div>
        {nav.map(n => (
          <button key={n.id} className={`nav-item${current === n.id ? ' active' : ''}`} onClick={() => onNav(n.id)}>
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
            {n.badge && <span className="nav-badge">{n.badge}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="engine-status">
          <span className="status-dot" />Playwright Engine
        </div>
        <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Authorized domains only
        </div>
      </div>
    </aside>
  );
}
