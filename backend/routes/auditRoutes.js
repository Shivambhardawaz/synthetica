const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

router.get('/', async (req, res) => {
  try {
    const { action = 'all', status = 'all' } = req.query;
    let logs = await AuditLog.find().sort({ timestamp: -1 });
    if (action !== 'all') logs = logs.filter(l => l.action === action);
    if (status !== 'all') logs = logs.filter(l => l.status === status);
    res.json({ logs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const log = await AuditLog.create({ ...req.body, timestamp: new Date().toISOString() });
    res.status(201).json({ log });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
