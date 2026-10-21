const express = require('express');
const router = express.Router();

// In-memory visit tracker for the demo page
const visitStats = { totalVisits: 0, emailCounts: {} };

router.get('/stats', (req, res) => {
  res.json(visitStats);
});

router.post('/visit', (req, res) => {
  const { email } = req.body;
  visitStats.totalVisits++;
  if (email) visitStats.emailCounts[email] = (visitStats.emailCounts[email] || 0) + 1;
  res.json({ success: true, stats: visitStats });
});

router.get('/page', (req, res) => {
  const email = req.headers['x-test-email'] || req.query.email || 'anonymous';
  visitStats.totalVisits++;
  if (email !== 'anonymous') visitStats.emailCounts[email] = (visitStats.emailCounts[email] || 0) + 1;
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><title>Synthetica Demo Target Site</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0a0a1a; color:#e2e8f0; font-family:system-ui,sans-serif; min-height:100vh; }
  .hero { background:linear-gradient(135deg,#1e1b4b,#312e81); padding:80px 40px; text-align:center; }
  h1 { font-size:3rem; font-weight:800; background:linear-gradient(90deg,#818cf8,#c084fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:16px; }
  .badge { display:inline-block; background:#312e81; border:1px solid #4f46e5; color:#a5b4fc; padding:6px 16px; border-radius:999px; font-size:.8rem; margin-bottom:24px; }
  .email-box { background:rgba(99,102,241,.15); border:1px solid #4f46e5; border-radius:12px; padding:12px 24px; display:inline-block; margin-top:16px; font-size:.9rem; color:#a5b4fc; }
  .content { max-width:900px; margin:60px auto; padding:0 24px; }
  .card { background:#1e1b4b22; border:1px solid #ffffff11; border-radius:16px; padding:32px; margin-bottom:24px; }
  .card h2 { color:#a5b4fc; margin-bottom:12px; }
  .card p { color:#94a3b8; line-height:1.7; }
  .counter { font-size:2rem; font-weight:700; color:#c084fc; }
  .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin:40px 0; }
  .stat { background:#1e1b4b33; border:1px solid #ffffff0f; border-radius:12px; padding:20px; text-align:center; }
  .stat-label { font-size:.75rem; color:#64748b; text-transform:uppercase; letter-spacing:.1em; margin-bottom:8px; }
  footer { text-align:center; padding:40px; color:#334155; font-size:.8rem; }
</style>
</head>
<body>
<div class="hero">
  <div class="badge">🎯 Authorized Testing Target</div>
  <h1>Synthetica Demo Site</h1>
  <p style="color:#94a3b8;max-width:500px;margin:0 auto">This page is the authorized automation target for Playwright-based synthetic visit testing.</p>
  <div class="email-box">🤖 Test Identity: <strong>${email}</strong></div>
</div>
<div class="content">
  <div class="stats">
    <div class="stat"><div class="stat-label">Total Visits</div><div class="counter">${visitStats.totalVisits}</div></div>
    <div class="stat"><div class="stat-label">Unique Visitors</div><div class="counter">${Object.keys(visitStats.emailCounts).length}</div></div>
    <div class="stat"><div class="stat-label">This Visitor</div><div class="counter">${visitStats.emailCounts[email] || 1}</div></div>
  </div>
  <div class="card"><h2>📋 About This Page</h2><p>This is the authorized demonstration target for the Synthetica platform. Playwright automation sessions navigate here to simulate realistic page visits, scroll behavior, and interaction telemetry. Each visit is attributed to a synthetic test identity.</p></div>
  <div class="card"><h2>🔬 Test Methodology</h2><p>All sessions are clearly marked as synthetic automated tests. No real user data is collected. The platform operates entirely within authorized domains and follows strict SSRF prevention rules.</p></div>
  <div class="card"><h2>📊 Live Stats</h2><p>Visit counts update in real-time as automation sessions complete. Check the Synthetica dashboard for detailed per-identity analytics, load times, and scroll depth metrics.</p></div>
  ${Array.from({length:15},(_,i)=>`<div class="card"><h2>Section ${i+1}</h2><p>Content block ${i+1} — used to test scroll depth tracking. Playwright measures how far the automated session scrolls through the page before completing.</p></div>`).join('')}
</div>
<footer>Synthetica Demo Target — Authorized Testing Environment Only</footer>
</body>
</html>`);
});

module.exports = router;
