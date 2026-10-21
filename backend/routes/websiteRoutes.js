const express = require('express');
const router = express.Router();
const Website = require('../models/Website');
const AuditLog = require('../models/AuditLog');
const { validateURL } = require('../middleware/ssrfValidator');

// GET all websites
router.get('/', async (req, res) => {
  try {
    const websites = await Website.find().sort({ createdAt: -1 });
    res.json({ websites });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST add website
router.post('/', async (req, res) => {
  try {
    const { url, name, description } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    const check = validateURL(url);
    if (!check.valid) return res.status(403).json({ error: check.reason });
    const site = await Website.create({ url, name: name || url, description: description || '', status: 'authorized', addedAt: new Date().toISOString() });
    await AuditLog.create({ action: 'website_added', detail: `Added ${url}`, status: 'success', timestamp: new Date().toISOString() });
    res.status(201).json({ website: site });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE website
router.delete('/:id', async (req, res) => {
  try {
    await Website.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
