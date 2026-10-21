const express = require('express');
const router = express.Router();
const Identity = require('../models/Identity');

const DOMAINS = ['synthetictest.internal', 'playwright.test', 'e2e.local'];
const FIRST = ['alice','bob','carol','dave','eve','frank','grace','henry','iris','jack','kate','leo','mia','noah','olivia','peter','quinn','rachel','sam','tara'];
const LAST = ['alpha','beta','gamma','delta','perf','load','smoke','test','qa','ux'];

function genEmail() {
  const f = FIRST[Math.floor(Math.random()*FIRST.length)];
  const l = LAST[Math.floor(Math.random()*LAST.length)];
  const n = Math.floor(Math.random()*9)+1;
  const d = DOMAINS[Math.floor(Math.random()*DOMAINS.length)];
  return `${f}.${l}${n}@${d}`;
}

// GET all identities
router.get('/', async (req, res) => {
  try {
    const { search = '', status = 'all' } = req.query;
    let identities = await Identity.find().sort({ createdAt: -1 });
    if (search) identities = identities.filter(i => i.email.includes(search));
    if (status !== 'all') identities = identities.filter(i => i.status === status);
    res.json({ identities, total: identities.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST generate synthetic identities
router.post('/generate', async (req, res) => {
  try {
    const count = Math.min(parseInt(req.body.count) || 5, 50);
    const created = [];
    for (let i = 0; i < count; i++) {
      const email = genEmail();
      const doc = await Identity.create({ email, type: 'synthetic', status: 'active', sessionCount: 0, createdAt: new Date().toISOString() });
      created.push(doc);
    }
    const all = await Identity.find().sort({ createdAt: -1 });
    res.json({ created, identities: all });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST import CSV batch
router.post('/import', async (req, res) => {
  try {
    const { emails } = req.body;
    if (!Array.isArray(emails)) return res.status(400).json({ error: 'emails array required' });
    const created = [];
    for (const email of emails.slice(0, 200)) {
      const doc = await Identity.create({ email: email.trim(), type: 'imported', status: 'active', sessionCount: 0, createdAt: new Date().toISOString() });
      created.push(doc);
    }
    res.json({ created, count: created.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE identity
router.delete('/:id', async (req, res) => {
  try {
    await Identity.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
