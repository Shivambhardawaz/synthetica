const PAGE_META = {
  overview: { title: 'Executive Overview', sub: 'Real-time test telemetry, visitor tracking, and automation benchmarks' },
  websites: { title: 'Websites & URLs', sub: 'Manage authorized test domains with SSRF protection' },
  users: { title: 'Test Users (CSV)', sub: 'Manage synthetic email identities for browser automation' },
  automation: { title: 'Automation Runner', sub: 'Dispatch Playwright sessions with concurrency controls' },
  analytics: { title: 'Analytics & Reports', sub: 'Filter and inspect all test session records' },
  demo: { title: 'Target Demo Site', sub: 'Authorized test target with live per-email visit counters' },
  audit: { title: 'Security & Audit', sub: 'Immutable audit trail of all platform actions' }
};

export default function Topbar({ page, onNewSession }) {
  const meta = PAGE_META[page] || PAGE_META.overview;
  return (
    <header className="topbar">
      <div className="topbar-title">
        <h2>{meta.title}</h2>
        <p>{meta.sub}</p>
      </div>
      <div className="topbar-right">
        <div className="telemetry-badge">
          <span className="telemetry-dot" />Telemetry Live
        </div>
        <button className="btn btn-primary" id="new-test-session-btn" onClick={onNewSession}>
          ▶ New Test Session
        </button>
        <div className="avatar" title="QA Auditor">QA</div>
      </div>
    </header>
  );
}
