const express = require('express');
const router = express.Router();
const TestSession = require('../models/TestSession');

// GET dashboard overview stats
router.get('/dashboard-overview', async (req, res) => {
  try {
    const sessions = await TestSession.find().sort({ createdAt: -1 });
    const total = sessions.length;
    const successful = sessions.filter(s => s.status === 'completed').length;
    const failed = sessions.filter(s => s.status === 'failed').length;
    const uniqueEmails = [...new Set(sessions.map(s => s.testEmail).filter(Boolean))];
    const avgDuration = total > 0 ? Math.round(sessions.reduce((a, s) => a + (s.duration || 0), 0) / total) : 0;
    const avgLoad = total > 0 ? Math.round(sessions.reduce((a, s) => a + (s.pageLoadTime || 0), 0) / total) : 0;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

    // Visits over time (last 7 days)
    const now = new Date();
    const visitsOverTime = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = sessions.filter(s => {
        const sd = new Date(s.createdAt);
        return sd.toDateString() === d.toDateString();
      }).length;
      visitsOverTime.push({ date: label, visits: count });
    }

    res.json({
      stats: {
        totalSessions: total,
        uniqueTestUsers: uniqueEmails.length,
        totalPageVisits: total,
        avgSessionDuration: avgDuration,
        avgPageLoad: avgLoad,
        successfulRuns: successful,
        failedRuns: failed,
        successRate
      },
      visitsOverTime,
      recentSessions: sessions.slice(0, 8),
      topWebsites: [...new Set(sessions.map(s => s.targetUrl).filter(Boolean))].slice(0, 5).map(url => ({
        url, visits: sessions.filter(s => s.targetUrl === url).length
      }))
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET sessions with filters
router.get('/sessions', async (req, res) => {
  try {
    const { status = 'all', testEmail = '', url = '', dateFrom = '', dateTo = '', page = 1, limit = 50 } = req.query;
    let sessions = await TestSession.find().sort({ createdAt: -1 });
    if (status !== 'all') sessions = sessions.filter(s => s.status === status);
    if (testEmail) sessions = sessions.filter(s => s.testEmail && s.testEmail.includes(testEmail));
    if (url) sessions = sessions.filter(s => s.targetUrl && s.targetUrl.includes(url));
    if (dateFrom) sessions = sessions.filter(s => new Date(s.createdAt) >= new Date(dateFrom));
    if (dateTo) sessions = sessions.filter(s => new Date(s.createdAt) <= new Date(dateTo));
    const total = sessions.length;
    const paginated = sessions.slice((page - 1) * limit, page * limit);
    res.json({ sessions: paginated, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET email breakdown
router.get('/email-breakdown', async (req, res) => {
  try {
    const sessions = await TestSession.find();
    const map = {};
    sessions.forEach(s => {
      if (!s.testEmail) return;
      if (!map[s.testEmail]) map[s.testEmail] = { email: s.testEmail, total: 0, completed: 0, failed: 0 };
      map[s.testEmail].total++;
      if (s.status === 'completed') map[s.testEmail].completed++;
      if (s.status === 'failed') map[s.testEmail].failed++;
    });
    res.json({ identities: Object.values(map) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
