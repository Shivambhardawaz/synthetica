const express = require('express');
const router = express.Router();
router.post('/login', (req, res) => res.json({ token: 'demo-token', user: { name: 'QA Auditor', email: 'admin@synthetica.internal', role: 'admin' } }));
router.get('/me', (req, res) => res.json({ user: { name: 'QA Auditor', email: 'admin@synthetica.internal', role: 'admin' } }));
module.exports = router;
