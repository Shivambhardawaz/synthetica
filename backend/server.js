const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const websiteRoutes = require('./routes/websiteRoutes');
const identityRoutes = require('./routes/identityRoutes');
const automationRoutes = require('./routes/automationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const mockEmailRoutes = require('./routes/mockEmailRoutes');
const demoTargetRoutes = require('./routes/demoTargetRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Screenshots static folder
app.use('/screenshots', express.static(path.join(__dirname, '../automation/screenshots')));

// Health check
app.get('/health', (req, res) => {
  const { getStorageMode } = require('./config/db');
  res.json({ status: 'ok', database: getStorageMode(), timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/identities', identityRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/mock-email', mockEmailRoutes);
app.use('/api/demo', demoTargetRoutes);
app.use('/api/audit', auditRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SERVER_ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Synthetica Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;
