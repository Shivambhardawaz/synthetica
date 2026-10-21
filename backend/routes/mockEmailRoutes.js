const express = require('express');
const router = express.Router();
const MockEmail = require('../models/MockEmail');

router.get('/inbox', async (req, res) => {
  try {
    const emails = await MockEmail.find().sort({ sentAt: -1 });
    res.json({ emails });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/send', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const email = await MockEmail.create({ to, subject, body, sentAt: new Date().toISOString(), read: false });
    res.status(201).json({ email });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
