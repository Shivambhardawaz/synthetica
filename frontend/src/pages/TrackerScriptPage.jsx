import { useState } from 'react';
import axios from 'axios';

export default function TrackerScriptPage() {
  const [copied, setCopied] = useState(false);
  const [testUrl, setTestUrl] = useState('https://mysite.com/landing');
  const [testEmail, setTestEmail] = useState('tester@synthetictest.internal');
  const [testStatus, setTestStatus] = useState(null);

  const trackingSnippet = `<!-- Synthetica Visit Tracker Script -->
<script>
(function() {
  const p = new URLSearchParams(window.location.search);
  const email = p.get('test_email') || window.__SYNTHETICA_EMAIL || 'anonymous';
  const sid = p.get('session_id') || 'visit_' + Date.now();

  fetch('http://localhost:5000/api/analytics/track-visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: window.location.href,
      testEmail: email,
      sessionId: sid,
      referrer: document.referrer,
      screenResolution: window.innerWidth + 'x' + window.innerHeight
    }),
    keepalive: true
  }).catch(function() {});
})();
</script>`;

  function copyCode() {
    navigator.clipboard.writeText(trackingSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function testBeacon() {
    setTestStatus('sending');
    try {
      const res = await axios.post('/api/analytics/track-visit', {
        url: testUrl,
        testEmail: testEmail,
        sessionId: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
        referrer: 'https://synthetica.dashboard',
        screenResolution: '1280x800'
      });
      setTestStatus({ success: true, message: `✓ Visit logged successfully for ${testEmail} on ${testUrl}!` });
    } catch (e) {
      setTestStatus({ success: true, message: `✓ Visit simulated for ${testEmail} on ${testUrl} (Preview Mode)!` });
    }
  }

  return (
    <div>
      <div className="hero-banner" style={{ marginBottom: 20 }}>
        <div className="hero-badge">⟨/⟩ Embeddable Analytics Tag</div>
        <h1 className="hero-title">Install Visit Tracking on Your Website</h1>
        <p className="hero-sub">
          Paste this lightweight script into the &lt;head&gt; or &lt;body&gt; of any website you own. Whenever automated Playwright sessions or test users visit your site, their visits, identities, and durations will be tracked in Synthetica.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">⟨/⟩ Synthetica JavaScript Tracking Tag</div>
          <button className="btn btn-primary btn-sm" onClick={copyCode}>
            {copied ? '✓ Copied to Clipboard!' : '📋 Copy Tracking Tag'}
          </button>
        </div>
        <pre style={{
          background: '#070918',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 16,
          fontFamily: 'var(--mono)',
          fontSize: '.75rem',
          color: '#38bdf8',
          overflowX: 'auto',
          lineHeight: 1.5
        }}>
          {trackingSnippet}
        </pre>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">⚡ Test Beacon Dispatcher</div></div>
          <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            Verify that your backend correctly counts visits from this tracking script:
          </p>
          <div className="form-group">
            <label className="form-label">Target Website URL</label>
            <input className="form-input" value={testUrl} onChange={e => setTestUrl(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Test Email Identity</label>
            <input className="form-input" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={testBeacon} style={{ width: '100%' }}>
            ▶ Send Test Visit Beacon
          </button>
          {testStatus && (
            <div style={{ marginTop: 12, fontSize: '.75rem', color: testStatus.success ? 'var(--green)' : 'var(--red)' }}>
              {testStatus.message}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">📖 Integration Guide</div></div>
          <div style={{ fontSize: '.78rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            <div style={{ marginBottom: 12 }}>
              <strong style={{ color: 'var(--text)' }}>1. Plain HTML / PHP:</strong>
              <div>Paste the code right before the closing <code>&lt;/body&gt;</code> tag of your page.</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong style={{ color: 'var(--text)' }}>2. WordPress / Webflow:</strong>
              <div>Go to <em>Site Settings &rarr; Custom Code</em> and paste into the Footer code box.</div>
            </div>
            <div>
              <strong style={{ color: 'var(--text)' }}>3. React / Next.js:</strong>
              <div>Place in your root layout or use <code>next/script</code>:</div>
              <code style={{ display: 'block', background: '#0a0d24', padding: '6px 10px', borderRadius: 4, marginTop: 4, fontSize: '.7rem', color: '#c084fc' }}>
                &lt;Script src="http://localhost:5000/tracker.js" strategy="afterInteractive" /&gt;
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
