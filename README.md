# Synthetica &mdash; Email-Based Website Visit Tracking & Browser Automation Platform

A production-grade full-stack platform built for learning website analytics, email-based test-user tracking, and browser automation in an authorized testing environment.

---

## 🌟 Key Architecture & Capabilities

1. **Modern Dark UI/UX**:
   - Built with **React 18**, **Tailwind CSS**, and **Recharts**.
   - Sleek glassmorphism, responsive cards, live telemetry indicators, and audit badges.
   - Dedicated navigation sections: *Overview*, *Websites & URLs*, *Test Users (CSV)**, *Automation Pipeline*, *Analytics & Reports*, *Target Demo Site*, and *Security & Audit*.

2. **Python + Playwright Automation Engine**:
   - Autonomous Chromium browser worker (`automation/playwright_runner.py`).
   - Injects authorized test identity via cookies (`test_user_email`) and headers (`X-Automated-Test-User`).
   - Supports configurable scroll durations (**10s, 30s, 60s, 120s**) with realistic incremental reading simulation.
   - Measures exact DOM load timing, total page load latency, HTTP status code, and scroll depth percentage.
   - Captures viewport screenshots on session completion (`automation/screenshots/`).
   - Real-time **Pause**, **Resume**, and **Stop** controls via IPC stdin commands.

3. **Email-Based Synthetic Test Identities**:
   - CSV bulk import/export utility with sample dataset (`backend/data/sample_identities.csv`).
   - One-click synthetic identity generator (e.g., `+5 Synthetic Users`).
   - Per-identity session counters, failure logs, and last visited target timestamps.
   - Integrated **Mock Email Sandbox** for simulating email verification workflows.

4. **Security & Reliability**:
   - Strict **SSRF protection**: Blocks AWS/GCP cloud metadata (`169.254.169.254`, `metadata.google.internal`) and unapproved private IP ranges.
   - Target domain verification rules: Browser automation runs only against authorized, verified domains.
   - Rate limiting, concurrency pool controller, and immutable audit logs.

5. **Dual Storage Engine (Zero Configuration Friction)**:
   - Native **MongoDB / Mongoose** support when a MongoDB service is connected.
   - Seamless **Embedded Resilient Storage Engine** fallback: if MongoDB is not running locally, the application automatically persists state to `backend/data/db.json` with standard Mongoose query chains.

6. **Built-in Local Demo Target Website**:
   - Self-hosted benchmark target website at `http://localhost:5000/api/demo/page`.
   - Real-time email-wise visit counters and live visitor audit log.

---

## 📂 Project Structure

```
email-visit-tracker/
├── package.json                   # Root workspace orchestration scripts
├── start-windows.bat              # 1-click Windows Batch launcher
├── start-windows.ps1              # 1-click Windows PowerShell launcher
├── .env.example                   # Master environment template
├── README.md                      # Comprehensive documentation
│
├── automation/                    # Playwright Browser Automation Engine
│   ├── playwright_runner.py       # Python Playwright automation script
│   ├── runner_wrapper.js          # Node.js process manager with SSE streaming
│   ├── requirements.txt           # Python dependencies (playwright, requests)
│   └── screenshots/               # Stored browser session capture artifacts
│
├── backend/                       # Express REST API & Database Models
│   ├── package.json
│   ├── server.js                  # Express server entrypoint
│   ├── .env.example
│   ├── config/
│   │   ├── db.js                  # Database connection & dual-mode detector
│   │   └── storageEngine.js       # Resilient Mongoose-compatible fallback store
│   ├── models/                    # MongoDB schemas
│   │   ├── User.js                # Auth & user credentials
│   │   ├── Website.js             # Authorized targets & verification status
│   │   ├── TestIdentity.js        # Synthetic email identities
│   │   ├── TestSession.js         # Session performance & scroll metrics
│   │   ├── AuditLog.js            # Security logs & SSRF blocks
│   │   └── MockEmail.js           # Sandbox inbox messages
│   ├── middleware/
│   │   ├── auth.js                # JWT token verification
│   │   └── ssrfValidator.js       # SSRF & domain safety validator
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth (login, register, me)
│   │   ├── websiteRoutes.js       # /api/websites
│   │   ├── identityRoutes.js      # /api/identities (CSV, generator)
│   │   ├── automationRoutes.js    # /api/automation (run, pause, resume, stop, SSE)
│   │   ├── analyticsRoutes.js     # /api/analytics (dashboard, reports, CSV)
│   │   ├── mockEmailRoutes.js     # /api/mock-email (sandbox inbox, verify)
│   │   ├── demoTargetRoutes.js    # /api/demo/page (target test site)
│   │   └── auditRoutes.js         # /api/audit
│   └── data/
│       ├── sample_identities.csv  # Pre-seeded test identities
│       └── seed.js                # Database seeder
│
└── frontend/                      # React.js + Tailwind CSS Client
    ├── package.json
    ├── vite.config.js             # Vite configuration with /api proxy
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css              # Custom styling & glassmorphic tokens
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   ├── Sidebar.jsx        # Navigation & live badge
        │   ├── Navbar.jsx         # Telemetry status & quick run
        │   ├── StatCard.jsx       # Reusable KPI card
        │   └── LiveRunnerModal.jsx # Real-time Playwright terminal & controls
        ├── pages/
        │   ├── OverviewDashboard.jsx  # Recharts visualizations & KPIs
        │   ├── WebsitesPage.jsx       # Target URL management & authorization
        │   ├── TestUsersPage.jsx      # CSV import/export & mock inbox
        │   ├── AutomationPage.jsx     # Concurrency pool & batch runner
        │   ├── AnalyticsPage.jsx      # Session table & CSV export
        │   ├── DemoWebsitePage.jsx    # Live target site & visit counters
        │   └── SettingsPage.jsx       # SSRF guardrails & audit logs
        └── services/
            └── api.js                 # Unified API client
```

---

## 🛠️ Prerequisites & Setup on Windows

Ensure you have installed:
- **Node.js** (v18.0 or newer)
- **Python** (v3.10 or newer)
- **Git** (optional)

### 1. Install Dependencies

Open **PowerShell** or **Command Prompt** in the project directory:

```powershell
cd C:\Users\singh\.gemini\antigravity-ide\scratch\email-visit-tracker

# 1. Install Backend Dependencies
cd backend
npm install
cd ..

# 2. Install Frontend Dependencies
cd frontend
npm install
cd ..

# 3. Install Python Playwright & Chromium
python -m pip install -r automation/requirements.txt
python -m playwright install chromium
```

---

## 🚀 Running the Application

### Option A: 1-Click Launchers (Windows)
Double-click `start-windows.bat` or run:
```powershell
.\start-windows.ps1
```

### Option B: Manual Execution in 2 Terminal Windows

**Terminal 1 (Backend API):**
```powershell
cd backend
npm start
```
*Backend will start on `http://localhost:5000` and automatically seed initial data.*

**Terminal 2 (Frontend React App):**
```powershell
cd frontend
npm run dev
```
*Frontend will start on `http://localhost:3000`.*

---

## 🌐 Application Endpoints

| Service | URL | Purpose |
| :--- | :--- | :--- |
| **Frontend Dashboard** | `http://localhost:3000` | Main React Dashboard |
| **Target Demo Website** | `http://localhost:5000/api/demo/page` | Authorized target site with live counters |
| **Demo Site Live Stats** | `http://localhost:5000/api/demo/stats` | JSON telemetry of email-wise visits |
| **SSE Stream** | `http://localhost:5000/api/automation/stream` | Real-time Server-Sent Events |
| **Health Check** | `http://localhost:5000/health` | Health & DB connection status |

---

## 🧪 Testing Walkthrough: Observing Email-Wise Visit Counters

1. Navigate to the **Target Demo Site** tab in the dashboard. Notice the baseline visits and email counts.
2. Click **Simulate Visit Now** (or **New Test Session**).
3. Select:
   - Target URL: `http://localhost:5000/api/demo/page`
   - Test User: `sarah.visit2@synthetictest.internal`
   - Scroll Duration: `10s` or `30s`
   - Mode: `Headless` (or headed to view the browser window)
4. Click **Start Automated Session**:
   - The live progress bar advances as Playwright connects.
   - Notice the incremental scroll depth meter advancing.
   - You can test **Pause**, **Resume**, or **Stop Test** in real-time.
5. Once completed, a viewport screenshot is displayed in the modal.
6. Check the **Target Demo Site** counters: `sarah.visit2@synthetictest.internal`'s visit counter will have incremented by 1, and the visitor log will display the session ID and user agent!

---

## 📊 MongoDB Schemas

### 1. `TestSession`
```javascript
{
  sessionId: { type: String, required: true, unique: true },
  websiteUrl: { type: String, required: true },
  domain: { type: String, required: true },
  testEmail: { type: String, required: true },
  testIdentityName: { type: String },
  status: { type: String, enum: ['queued', 'running', 'paused', 'completed', 'failed', 'stopped'] },
  scrollDurationTarget: { type: Number, default: 30 },
  actualDurationSeconds: { type: Number },
  scrollDepthPercent: { type: Number },
  httpStatusCode: { type: Number },
  pageTitle: { type: String },
  domContentLoadedMs: { type: Number },
  loadTimeMs: { type: Number },
  navigationError: { type: String, default: null },
  screenshotPath: { type: String },
  trafficType: { type: String, default: 'synthetic_automated' },
  logs: [{ timestamp: Number, stage: String, message: String, percent: Number }],
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}
```

### 2. `TestIdentity`
```javascript
{
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String },
  department: { type: String },
  status: { type: String, enum: ['active', 'paused', 'revoked'] },
  isSynthetic: { type: Boolean, default: true },
  verificationStatus: { type: String, enum: ['verified', 'unverified', 'pending'] },
  totalSessions: { type: Number, default: 0 },
  successfulSessions: { type: Number, default: 0 },
  failedSessions: { type: Number, default: 0 },
  lastSessionAt: { type: Date },
  lastTargetUrl: { type: String }
}
```

### 3. `Website`
```javascript
{
  name: { type: String, required: true },
  url: { type: String, required: true },
  domain: { type: String, required: true, unique: true },
  status: { type: String, enum: ['verified', 'pending_verification', 'blocked'] },
  isAuthorized: { type: Boolean, default: true },
  defaultScrollDuration: { type: Number, default: 30 },
  concurrencyLimit: { type: Number, default: 2 },
  totalVisits: { type: Number, default: 0 },
  avgLoadTimeMs: { type: Number, default: 0 }
}
```

### 4. `AuditLog`
```javascript
{
  action: { type: String, required: true },
  details: { type: String, required: true },
  status: { type: String, enum: ['info', 'success', 'warning', 'danger'] },
  ip: { type: String },
  userEmail: { type: String },
  metadata: { type: Object },
  timestamp: { type: Date, default: Date.now }
}
```

---

## 🔒 Security Compliance Checklist

- [x] **SSRF Guard**: Prohibits `169.254.169.254` (cloud metadata) and private IPs when production mode is set.
- [x] **Authorized Target Enforcement**: Only URLs with verified domain authorization flags can be queued.
- [x] **Rate Limiting**: Configured express rate limiter on API endpoints.
- [x] **Audit Trail**: Every session creation, stop, and SSRF attempt is logged to the `AuditLog` collection.
- [x] **Non-Malicious Automation**: User agent and cookies clearly identify test traffic (`TestAutomator/2.0`); does not attempt to evade bot detection or bypass third-party restrictions.

---

## 🚀 Live Deployments & Repository

- **GitHub Repository**: [https://github.com/Shivambhardawaz/synthetica](https://github.com/Shivambhardawaz/synthetica)
- **Vercel Production UI**: [https://synthetica-eight.vercel.app](https://synthetica-eight.vercel.app)

---

## ⟨/⟩ Embeddable Tracking Script for Your Own Websites

To count visits on websites you control, paste this snippet before `</body>`:

```html
<script>
(function() {
  const p = new URLSearchParams(window.location.search);
  const email = p.get('test_email') || window.__SYNTHETICA_EMAIL || 'anonymous';
  const sid = p.get('session_id') || 'visit_' + Date.now();

  fetch('http://localhost:5000/api/analytics/track-visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: window.location.href,
      testEmail: email,
      sessionId: sid,
      referrer: document.referrer,
      screenResolution: window.innerWidth + 'x' + window.innerHeight
    }),
    keepalive: true
  }).catch(function() {});
})();
</script>
```
When Playwright visits your site, it passes `test_email` and `session_id` automatically, and Synthetica logs the visitor.
