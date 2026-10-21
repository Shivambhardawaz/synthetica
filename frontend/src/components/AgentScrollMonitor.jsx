import { useState, useEffect } from 'react';

export default function AgentScrollMonitor({ targetUrl, activeWorkers = [], duration = 10 }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 120, y: 80 });

  const currentWorker = activeWorkers[selectedIdx] || activeWorkers[0] || {
    sessionId: 'SES-IDLE-01',
    testEmail: 'agent.emulation@synthetictest.internal',
    scrollDepth: 0,
    elapsed: 0,
    totalDuration: duration
  };

  const isRunning = activeWorkers.length > 0;
  const depth = currentWorker.scrollDepth || 0;

  // Move cursor randomly while scrolling to emulate natural human browsing
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setCursorPos({
        x: Math.floor(60 + Math.random() * 320),
        y: Math.floor(50 + Math.random() * 160)
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Derive domain label
  let hostname = 'demo.internal';
  try {
    hostname = new URL(targetUrl.startsWith('http') ? targetUrl : 'https://' + targetUrl).hostname;
  } catch {
    hostname = targetUrl || 'target-site.com';
  }

  // Calculate simulated pixel scroll offset based on depth (0-100%)
  const maxScrollPx = 700;
  const scrollOffset = Math.round((depth / 100) * maxScrollPx);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-bright)', background: '#080816' }}>
      {/* Browser Window Header */}
      <div style={{ background: '#0e1124', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }} />
          </div>
          <span style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--text-dim)', marginLeft: 8 }}>
            Playwright Headless Chromium (1280×800)
          </span>
        </div>

        {/* Address Bar */}
        <div style={{ flex: 1, maxWidth: 440, background: '#070814', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '.75rem', fontFamily: 'var(--mono)', color: 'var(--accent-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--green)', fontSize: '.7rem' }}>🔒</span>
          <span style={{ color: 'var(--text-muted)' }}>https://</span>
          <span>{hostname}</span>
          <span style={{ color: 'var(--text-dim)', fontSize: '.7rem', marginLeft: 'auto' }}>HTTP 200 OK</span>
        </div>

        {/* Live Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: isRunning ? 'var(--green)' : 'var(--text-muted)', boxShadow: isRunning ? '0 0 8px var(--green)' : 'none' }} />
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: isRunning ? 'var(--green)' : 'var(--text-muted)', letterSpacing: '.05em' }}>
            {isRunning ? 'AGENT SCROLLING' : 'AGENT READY'}
          </span>
        </div>
      </div>

      {/* Multi-Worker Selector Pills (if multiple sessions active) */}
      {activeWorkers.length > 1 && (
        <div style={{ background: '#0a0d1f', padding: '6px 14px', display: 'flex', gap: 6, overflowX: 'auto', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginRight: 4 }}>
            Active Workers:
          </span>
          {activeWorkers.map((w, idx) => (
            <button
              key={w.sessionId || idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              style={{
                fontSize: '.68rem',
                padding: '3px 10px',
                borderRadius: 14,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                background: selectedIdx === idx ? 'var(--accent)' : 'rgba(255,255,255,.06)',
                color: selectedIdx === idx ? '#fff' : 'var(--text-dim)',
                whiteSpace: 'nowrap'
              }}
            >
              Worker #{idx + 1} ({w.scrollDepth || 0}%)
            </button>
          ))}
        </div>
      )}

      {/* Viewport Display Area */}
      <div style={{ position: 'relative', height: 280, overflow: 'hidden', background: '#050611' }}>
        {/* Telemetry HUD Overlay in top right */}
        <div style={{
          position: 'absolute',
          top: 10,
          right: 12,
          zIndex: 30,
          background: 'rgba(10, 14, 34, 0.88)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          backdropFilter: 'blur(8px)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: '.68rem',
          fontFamily: 'var(--mono)',
          lineHeight: 1.5,
          color: 'var(--text)',
          boxShadow: '0 4px 16px rgba(0,0,0,.4)'
        }}>
          <div style={{ color: 'var(--accent-light)', fontWeight: 700 }}>● PLAYWRIGHT AGENT HUD</div>
          <div>Session: <span style={{ color: 'var(--cyan)' }}>{currentWorker.sessionId}</span></div>
          <div>Identity: <span style={{ color: '#fff' }}>{currentWorker.testEmail}</span></div>
          <div>Scroll Depth: <span style={{ color: 'var(--green)', fontWeight: 700 }}>{depth}%</span></div>
          <div>Virtual Scroll: <span style={{ color: 'var(--yellow)' }}>-{scrollOffset}px</span></div>
          <div>Action: <span style={{ color: 'var(--purple)' }}>mouseWheel(deltaY: 120)</span></div>
        </div>

        {/* Laser / Scanner Line at scroll front */}
        {isRunning && (
          <div style={{
            position: 'absolute',
            top: `${Math.min(92, Math.max(8, depth))}%`,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #10b981, #6366f1, transparent)',
            boxShadow: '0 0 10px #10b981',
            zIndex: 25,
            transition: 'top .3s ease-out'
          }} />
        )}

        {/* Animated Virtual Mouse Cursor with Agent Tag */}
        {isRunning && (
          <div style={{
            position: 'absolute',
            left: cursorPos.x,
            top: cursorPos.y,
            zIndex: 35,
            pointerEvents: 'none',
            transition: 'all .8s cubic-bezier(.25,1,.5,1)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 2L18 16L12 17L16 23L13 24L9 18L4 22V2Z" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
            <div style={{
              position: 'absolute',
              left: 18,
              top: 14,
              background: 'rgba(168, 85, 247, 0.92)',
              color: '#fff',
              fontSize: '.6rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,.4)'
            }}>
              Agent Scroll: {currentWorker.testEmail.split('@')[0]}
            </div>
          </div>
        )}

        {/* Simulated Webpage Content that scrolls down */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(-${scrollOffset}px)`,
          transition: 'transform 0.5s ease-out',
          padding: '24px 32px',
          color: '#e2e8f0'
        }}>
          {/* Simulated Webpage Nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: 24 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {hostname.toUpperCase()}
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: '.72rem', color: '#94a3b8' }}>
              <span>Docs</span>
              <span>Features</span>
              <span>API</span>
              <span>Pricing</span>
              <span style={{ color: '#60a5fa', fontWeight: 600 }}>Get Started →</span>
            </div>
          </div>

          {/* Simulated Hero Section */}
          <div style={{ marginBottom: 36 }}>
            <span style={{ display: 'inline-block', fontSize: '.65rem', background: 'rgba(99, 102, 241, 0.18)', color: '#818cf8', padding: '3px 8px', borderRadius: 12, marginBottom: 8, fontWeight: 600 }}>
              ENTERPRISE PLATFORM
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: 8, lineHeight: 1.2 }}>
              Modern Scalable Architecture & Developer Workflows
            </div>
            <p style={{ fontSize: '.78rem', color: '#94a3b8', maxWidth: 480, lineHeight: 1.5, marginBottom: 16 }}>
              Targeting: <span style={{ color: '#38bdf8', fontFamily: 'var(--mono)' }}>{targetUrl}</span>.
              Simulating continuous interaction, reading cadence, scroll tracking, and telemetry beacons.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ background: '#4f46e5', color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: '.72rem', fontWeight: 600 }}>
                Primary Action
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,.15)', color: '#cbd5e1', padding: '6px 14px', borderRadius: 6, fontSize: '.72rem' }}>
                Learn More
              </div>
            </div>
          </div>

          {/* Simulated Feature Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 36 }}>
            {[
              ['⚡ High Throughput', 'Processes telemetry events in real time without lag.'],
              ['🛡 Secure Authentication', 'Hardened authorized domain validations with SSRF shield.'],
              ['📊 Real-time Telemetry', 'Captures DOM load timings, scroll depths, and identities.']
            ].map(([title, desc], i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: '.68rem', color: '#94a3b8', lineHeight: 1.4 }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* Simulated Article / Documentation Body */}
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 20, marginBottom: 36 }}>
            <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
              Continuous Automated Journey Emulation
            </div>
            <p style={{ fontSize: '.72rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 12 }}>
              The Playwright automation runner emulates genuine human browsing behavior. It navigates to the requested target URL, waits for network idle, registers visit counts mapped against the synthetic identity &lt;{currentWorker.testEmail}&gt;, and progressively traverses page content down to the footer.
            </p>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '.68rem', background: '#020617', padding: 10, borderRadius: 6, color: '#38bdf8', border: '1px solid rgba(255,255,255,.05)' }}>
              &gt; await page.goto("{targetUrl}", &#123; waitUntil: "networkidle" &#125;);<br />
              &gt; await page.mouse.wheel(0, 450); // human scroll emulation<br />
              &gt; await page.screenshot(&#123; path: "artifacts/viewport.png" &#125;);
            </div>
          </div>

          {/* Simulated Footer */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 20, textAlign: 'center', color: '#64748b', fontSize: '.68rem' }}>
            © {new Date().getFullYear()} {hostname} — Automated Verification Target. Bottom of page reached (100% Scroll Depth).
          </div>
        </div>
      </div>
    </div>
  );
}
