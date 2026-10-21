const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const TestSession = require('../backend/models/TestSession');
const TestIdentity = require('../backend/models/TestIdentity');
const Website = require('../backend/models/Website');
const AuditLog = require('../backend/models/AuditLog');

class AutomationManager extends EventEmitter {
  constructor() {
    super();
    this.activeRuns = new Map(); // sessionId -> { child, status, sessionData, startTime }
    this.queue = [];
    this.concurrencyLimit = 3;
    this.screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  setConcurrencyLimit(limit) {
    this.concurrencyLimit = Math.max(1, Math.min(10, Number(limit) || 2));
    this.processQueue();
  }

  getActiveSessions() {
    const list = [];
    for (const [id, run] of this.activeRuns.entries()) {
      list.push({
        sessionId: id,
        status: run.status,
        url: run.sessionData.websiteUrl,
        email: run.sessionData.testEmail,
        percent: run.percent || 0,
        scrollPercent: run.scrollPercent || 0,
        latestLog: run.latestLog || 'Running...',
        elapsed: Math.round((Date.now() - run.startTime) / 1000)
      });
    }
    return list;
  }

  async startSession({ websiteUrl, testEmail, scrollDuration = 30, headless = true, userEmail = 'system' }) {
    // Generate unique session ID
    const sessionId = `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const domain = new URL(websiteUrl).hostname;

    const identity = await TestIdentity.findOne({ email: testEmail });
    const website = await Website.findOne({ domain });

    // Create session in DB
    const session = await TestSession.create({
      sessionId,
      websiteId: website?._id || '',
      websiteUrl,
      domain,
      testEmail,
      testIdentityName: identity?.name || 'Synthetic Tester',
      status: 'queued',
      scrollDurationTarget: scrollDuration,
      trafficType: 'synthetic_automated',
      isAutomated: true,
      logs: [{
        timestamp: Date.now(),
        stage: 'queued',
        message: 'Session queued in automation pipeline',
        percent: 0
      }]
    });

    this.queue.push({
      sessionId,
      websiteUrl,
      testEmail,
      scrollDuration,
      headless,
      userEmail,
      sessionRecordId: session._id
    });

    this.emit('session_queued', { sessionId, websiteUrl, testEmail });
    this.processQueue();

    return session;
  }

  async processQueue() {
    if (this.activeRuns.size >= this.concurrencyLimit || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    const { sessionId, websiteUrl, testEmail, scrollDuration, headless, userEmail } = job;

    await TestSession.findOneAndUpdate(
      { sessionId },
      { 
        status: 'running',
        startedAt: new Date(),
        $push: { logs: { timestamp: Date.now(), stage: 'starting', message: 'Spawning Playwright automation engine...', percent: 5 } }
      }
    );

    await AuditLog.create({
      action: 'AUTOMATION_SESSION_STARTED',
      details: `Session ${sessionId} initiated for ${testEmail} on ${websiteUrl}`,
      status: 'info',
      userEmail,
      metadata: { sessionId, websiteUrl, testEmail, scrollDuration }
    });

    const scriptPath = path.join(__dirname, 'playwright_runner.py');
    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';

    const args = [
      scriptPath,
      '--url', websiteUrl,
      '--email', testEmail,
      '--session-id', sessionId,
      '--scroll-duration', String(scrollDuration),
      '--headless', String(headless),
      '--screenshots-dir', this.screenshotsDir
    ];

    let child;
    try {
      child = spawn(pythonExe, args, {
        cwd: path.join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (spawnErr) {
      console.error('[RUNNER] Failed to spawn python:', spawnErr);
      await this.handleSessionFailure(sessionId, spawnErr.message);
      this.processQueue();
      return;
    }

    const runInfo = {
      child,
      status: 'running',
      sessionData: job,
      startTime: Date.now(),
      percent: 5,
      scrollPercent: 0,
      latestLog: 'Connecting...'
    };
    this.activeRuns.set(sessionId, runInfo);

    let outputBuffer = '';

    child.stdout.on('data', async (chunk) => {
      outputBuffer += chunk.toString();
      const lines = outputBuffer.split('\n');
      outputBuffer = lines.pop(); // Keep remaining incomplete line

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const evt = JSON.parse(line.trim());
          await this.handleRunnerEvent(sessionId, evt);
        } catch (jsonErr) {
          console.log(`[PYTHON RAW] ${line}`);
        }
      }
    });

    child.stderr.on('data', (errChunk) => {
      const errText = errChunk.toString().trim();
      if (errText) {
        console.warn(`[PYTHON STDERR ${sessionId}] ${errText}`);
      }
    });

    child.on('close', async (code) => {
      console.log(`[RUNNER] Process for ${sessionId} exited with code ${code}`);
      const run = this.activeRuns.get(sessionId);
      this.activeRuns.delete(sessionId);

      if (run && run.status !== 'completed' && run.status !== 'stopped') {
        const finalStatus = code === 0 ? 'completed' : 'failed';
        await this.finalizeSession(sessionId, finalStatus, {
          exitCode: code,
          message: code === 0 ? 'Process finished cleanly' : `Process exited with error code ${code}`
        });
      }

      this.processQueue();
    });

    this.emit('session_started', { sessionId, websiteUrl, testEmail });
  }

  async handleRunnerEvent(sessionId, evt) {
    const run = this.activeRuns.get(sessionId);

    if (evt.type === 'progress') {
      if (run) {
        run.percent = evt.percent || run.percent;
        run.scrollPercent = evt.scrollPercent || run.scrollPercent;
        run.latestLog = evt.message;
        if (evt.stage === 'paused') run.status = 'paused';
        if (evt.stage === 'scrolling' && run.status === 'paused') run.status = 'running';
      }

      // Update DB session log
      await TestSession.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            scrollDepthPercent: evt.scrollPercent || 0,
            loadTimeMs: evt.loadTimeMs || 0,
            httpStatusCode: evt.statusCode || 200
          },
          $push: {
            logs: {
              timestamp: Date.now(),
              stage: evt.stage || 'progress',
              message: evt.message,
              percent: evt.percent || 0
            }
          }
        }
      );

      this.emit('session_progress', {
        sessionId,
        stage: evt.stage,
        message: evt.message,
        percent: evt.percent,
        scrollPercent: evt.scrollPercent
      });
    } else if (evt.type === 'complete') {
      const status = evt.success ? (evt.metrics?.interrupted ? 'stopped' : 'completed') : 'failed';
      await this.finalizeSession(sessionId, status, evt.metrics, evt.error);
    }
  }

  async pauseSession(sessionId) {
    const run = this.activeRuns.get(sessionId);
    if (!run || !run.child) return false;

    run.status = 'paused';
    run.child.stdin.write("PAUSE\n");
    await TestSession.findOneAndUpdate({ sessionId }, { status: 'paused' });
    this.emit('session_paused', { sessionId });
    return true;
  }

  async resumeSession(sessionId) {
    const run = this.activeRuns.get(sessionId);
    if (!run || !run.child) return false;

    run.status = 'running';
    run.child.stdin.write("RESUME\n");
    await TestSession.findOneAndUpdate({ sessionId }, { status: 'running' });
    this.emit('session_resumed', { sessionId });
    return true;
  }

  async stopSession(sessionId) {
    const run = this.activeRuns.get(sessionId);
    if (!run) {
      // If it's in queue, remove it
      const qIdx = this.queue.findIndex(item => item.sessionId === sessionId);
      if (qIdx !== -1) {
        this.queue.splice(qIdx, 1);
        await TestSession.findOneAndUpdate({ sessionId }, { status: 'stopped' });
        return true;
      }
      return false;
    }

    run.status = 'stopped';
    try {
      run.child.stdin.write("STOP\n");
    } catch (e) {}

    // Allow graceful stop, fallback to kill after 2.5s
    setTimeout(() => {
      try {
        if (run.child && !run.child.killed) {
          run.child.kill('SIGTERM');
        }
      } catch (e) {}
    }, 2500);

    await TestSession.findOneAndUpdate({ sessionId }, { status: 'stopped' });
    this.emit('session_stopped', { sessionId });
    return true;
  }

  async finalizeSession(sessionId, finalStatus, metrics = {}, errorMessage = null) {
    const completedAt = new Date();
    const update = {
      status: finalStatus,
      completedAt,
      actualDurationSeconds: metrics.duration_seconds || 0,
      scrollDepthPercent: metrics.scroll_depth_percent || 0,
      httpStatusCode: metrics.status_code || 200,
      pageTitle: metrics.page_title || '',
      domContentLoadedMs: metrics.dom_content_loaded_ms || 0,
      loadTimeMs: metrics.load_time_ms || 0,
      navigationError: errorMessage || metrics.navigation_error || null,
      screenshotPath: metrics.screenshot_path ? `/screenshots/${path.basename(metrics.screenshot_path)}` : null
    };

    const session = await TestSession.findOneAndUpdate({ sessionId }, update, { new: true });
    if (!session) return;

    // Increment website counters
    if (session.domain) {
      const isSuccess = finalStatus === 'completed';
      await Website.findOneAndUpdate(
        { domain: session.domain },
        {
          $inc: {
            totalVisits: 1,
            successfulVisits: isSuccess ? 1 : 0,
            failedVisits: isSuccess ? 0 : 1
          },
          $set: {
            lastVisitedAt: completedAt,
            avgLoadTimeMs: metrics.load_time_ms || 0
          }
        }
      );
    }

    // Increment identity stats
    if (session.testEmail) {
      const isSuccess = finalStatus === 'completed';
      await TestIdentity.findOneAndUpdate(
        { email: session.testEmail },
        {
          $inc: {
            totalSessions: 1,
            successfulSessions: isSuccess ? 1 : 0,
            failedSessions: isSuccess ? 0 : 1
          },
          $set: {
            lastSessionAt: completedAt,
            lastTargetUrl: session.websiteUrl,
            avgScrollDepthPercent: metrics.scroll_depth_percent || 100
          }
        }
      );
    }

    await AuditLog.create({
      action: finalStatus === 'completed' ? 'AUTOMATION_SESSION_COMPLETED' : 'AUTOMATION_SESSION_FAILED',
      details: `Session ${sessionId} ended with status: ${finalStatus}. Load: ${metrics.load_time_ms || 0}ms, Scroll: ${metrics.scroll_depth_percent || 0}%`,
      status: finalStatus === 'completed' ? 'success' : 'danger',
      userEmail: session.testEmail,
      metadata: { sessionId, metrics, error: errorMessage }
    });

    this.emit('session_completed', { sessionId, status: finalStatus, metrics });
  }

  async handleSessionFailure(sessionId, errMsg) {
    await this.finalizeSession(sessionId, 'failed', {}, errMsg);
  }
}

const runnerManager = new AutomationManager();
module.exports = runnerManager;
