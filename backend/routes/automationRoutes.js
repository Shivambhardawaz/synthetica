const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const TestSession = require('../models/TestSession');
const Identity = require('../models/Identity');
const AuditLog = require('../models/AuditLog');
const { validateURL } = require('../middleware/ssrfValidator');

const RUNNER_PATH = path.join(__dirname, '../../automation/playwright_runner.py');
const CONCURRENCY = parseInt(process.env.CONCURRENCY_LIMIT) || 3;

// In-memory session manager
const manager = { active: {}, queue: [], concurrencyLimit: CONCURRENCY };

function getActiveSessions() { return Object.values(manager.active); }

async function runSession(sessionId, config) {
  const { targetUrl, testEmail, scrollDuration } = config;
  const startTime = Date.now();

  try {
    await TestSession.findByIdAndUpdate(sessionId, { $set: { status: 'running', startedAt: new Date().toISOString() } });

    const py = spawn('python', [RUNNER_PATH, '--url', targetUrl, '--email', testEmail, '--scroll', String(scrollDuration || 10)], {
      cwd: path.dirname(RUNNER_PATH)
    });

    manager.active[sessionId] = { sessionId, testEmail, targetUrl, scrollDuration, startTime, process: py, status: 'running', logs: [], scrollDepth: 0 };

    let pageLoadTime = 0, scrollDepth = 0, error = null;

    py.stdout.on('data', d => {
      const line = d.toString().trim();
      if (manager.active[sessionId]) {
        manager.active[sessionId].logs.push(line);
        if (line.includes('load_time:')) pageLoadTime = parseFloat(line.split('load_time:')[1]) || 0;
        if (line.includes('scroll_depth:')) scrollDepth = parseFloat(line.split('scroll_depth:')[1]) || 0;
        if (manager.active[sessionId]) manager.active[sessionId].scrollDepth = scrollDepth;
      }
    });
    py.stderr.on('data', d => { if (manager.active[sessionId]) manager.active[sessionId].logs.push('[ERR] ' + d.toString().trim()); });

    await new Promise((resolve) => py.on('close', (code) => {
      if (code !== 0) error = `Exit code ${code}`;
      resolve();
    }));

    const duration = Math.round((Date.now() - startTime) / 1000);
    const status = error ? 'failed' : 'completed';

    await TestSession.findByIdAndUpdate(sessionId, {
      $set: { status, duration, pageLoadTime: Math.round(pageLoadTime * 1000), scrollDepth, completedAt: new Date().toISOString(), error }
    });

    await AuditLog.create({ action: 'session_completed', detail: `${sessionId} — ${status}`, status, timestamp: new Date().toISOString() });
    console.log(`[RUNNER] ${sessionId} ${status}`);

  } catch (err) {
    await TestSession.findByIdAndUpdate(sessionId, { $set: { status: 'failed', error: err.message } });
  } finally {
    delete manager.active[sessionId];
    processQueue();
  }
}

function processQueue() {
  while (Object.keys(manager.active).length < manager.concurrencyLimit && manager.queue.length > 0) {
    const next = manager.queue.shift();
    runSession(next.sessionId, next.config);
  }
}

// POST /api/automation/start
router.post('/start', async (req, res) => {
  try {
    const { websiteUrl, email, scrollDuration = 10, mode = 'playwright' } = req.body;
    if (!websiteUrl || !email) return res.status(400).json({ error: 'websiteUrl and email required' });

    const check = validateURL(websiteUrl);
    if (!check.valid) return res.status(403).json({ error: check.reason });

    const sessionId = `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const session = await TestSession.create({
      sessionId, targetUrl: websiteUrl, testEmail: email, scrollDuration,
      status: 'queued', mode, createdAt: new Date().toISOString()
    });

    const config = { targetUrl: websiteUrl, testEmail: email, scrollDuration };
    if (Object.keys(manager.active).length < manager.concurrencyLimit) {
      runSession(session._id, config);
    } else {
      manager.queue.push({ sessionId: session._id, config });
    }

    res.status(202).json({ sessionId, _id: session._id, status: 'queued', message: 'Session dispatched' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/automation/active
router.get('/active', (req, res) => {
  const active = Object.values(manager.active).map(s => ({
    sessionId: s.sessionId, testEmail: s.testEmail, targetUrl: s.targetUrl,
    status: s.status, scrollDepth: s.scrollDepth, logs: s.logs.slice(-5),
    elapsed: Math.round((Date.now() - s.startTime) / 1000)
  }));
  res.json({ active, queueLength: manager.queue.length, concurrencyLimit: manager.concurrencyLimit });
});

// GET /api/automation/stream — SSE for live telemetry
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = () => {
    const data = Object.values(manager.active).map(s => ({
      sessionId: s.sessionId, testEmail: s.testEmail, status: s.status,
      scrollDepth: s.scrollDepth, logs: s.logs.slice(-3),
      elapsed: Math.round((Date.now() - s.startTime) / 1000)
    }));
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  send();
  const iv = setInterval(send, 1500);
  req.on('close', () => clearInterval(iv));
});

// POST /api/automation/batch
router.post('/batch', async (req, res) => {
  try {
    const { websiteUrl, emails, scrollDuration = 10 } = req.body;
    if (!websiteUrl || !Array.isArray(emails)) return res.status(400).json({ error: 'websiteUrl and emails array required' });
    const check = validateURL(websiteUrl);
    if (!check.valid) return res.status(403).json({ error: check.reason });

    const dispatched = [];
    for (const email of emails.slice(0, 10)) {
      const sessionId = `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
      const session = await TestSession.create({ sessionId, targetUrl: websiteUrl, testEmail: email, scrollDuration, status: 'queued', mode: 'playwright', createdAt: new Date().toISOString() });
      const config = { targetUrl: websiteUrl, testEmail: email, scrollDuration };
      if (Object.keys(manager.active).length < manager.concurrencyLimit) {
        runSession(session._id, config);
      } else {
        manager.queue.push({ sessionId: session._id, config });
      }
      dispatched.push(sessionId);
    }
    res.status(202).json({ dispatched, count: dispatched.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
