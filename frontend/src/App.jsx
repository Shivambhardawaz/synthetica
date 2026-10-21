import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import OverviewDashboard from './pages/OverviewDashboard';
import WebsitesPage from './pages/WebsitesPage';
import TestUsersPage from './pages/TestUsersPage';
import AutomationPage from './pages/AutomationPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TrackerScriptPage from './pages/TrackerScriptPage';
import DemoSitePage from './pages/DemoSitePage';
import AuditPage from './pages/AuditPage';
import LiveRunnerModal from './components/LiveRunnerModal';

export default function App() {
  const [page, setPage] = useState('overview');
  const [showRunner, setShowRunner] = useState(false);

  const pages = {
    overview: <OverviewDashboard />,
    websites: <WebsitesPage />,
    users: <TestUsersPage />,
    automation: <AutomationPage />,
    analytics: <AnalyticsPage />,
    tracker: <TrackerScriptPage />,
    demo: <DemoSitePage />,
    audit: <AuditPage />
  };

  return (
    <div className="app-shell">
      <Sidebar current={page} onNav={setPage} />
      <div className="main-area">
        <Topbar page={page} onNewSession={() => setShowRunner(true)} />
        <div className="page fade-in">{pages[page] || pages.overview}</div>
      </div>
      {showRunner && <LiveRunnerModal onClose={() => setShowRunner(false)} />}
    </div>
  );
}
