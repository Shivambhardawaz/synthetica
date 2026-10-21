import { useState, useEffect } from 'react';

export default function AgentScrollMonitor({ targetUrl, activeWorkers = [], duration = 10 }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 140, y: 90 });
  const [viewMode, setViewMode] = useState('mirror'); // 'mirror' | 'iframe'

  const currentWorker = activeWorkers[selectedIdx] || activeWorkers[0] || {
    sessionId: 'SES-IDLE-01',
    testEmail: 'agent.emulation@synthetictest.internal',
    scrollDepth: 0,
    elapsed: 0,
    totalDuration: duration
  };

  const isRunning = activeWorkers.length > 0;
  const depth = currentWorker.scrollDepth || 0;

  // Emulate natural human cursor movement
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setCursorPos({
        x: Math.floor(80 + Math.random() * 340),
        y: Math.floor(60 + Math.random() * 200)
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Clean and parse the target URL
  let rawUrl = currentWorker?.targetUrl || targetUrl || 'https://dotnet.microsoft.com';
  let validUrl = rawUrl.trim();
  if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
    validUrl = 'https://' + validUrl;
  }

  let hostname = 'dotnet.microsoft.com';
  let pathname = '/';
  try {
    const parsed = new URL(validUrl);
    hostname = parsed.hostname;
    pathname = parsed.pathname || '/';
  } catch {}

  const isDotNet = /dotnet|microsoft/i.test(validUrl);

  // Bounded scroll: viewport height is 380px, content is 1500px tall
  const viewportHeight = 380;
  const contentHeight = 1500;
  const maxScroll = contentHeight - viewportHeight;
  const scrollOffset = Math.round((Math.min(100, depth) / 100) * maxScroll);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-bright)', background: '#080816' }}>
      {/* Browser Chrome Header */}
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
        <div style={{ flex: 1, maxWidth: 460, background: '#070814', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '.74rem', fontFamily: 'var(--mono)', color: 'var(--accent-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--green)', fontSize: '.7rem' }}>🔒</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{validUrl}</span>
          <a
            href={validUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open real site in new tab"
            style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '.7rem', flexShrink: 0 }}
          >
            Open ↗
          </a>
        </div>

        {/* View Mode Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'mirror' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '.68rem', padding: '3px 8px', borderRadius: 4 }}
            onClick={() => setViewMode('mirror')}
          >
            Site Mirror
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'iframe' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '.68rem', padding: '3px 8px', borderRadius: 4 }}
            onClick={() => setViewMode('iframe')}
            title="Embed direct iframe (Note: sites like Microsoft may block third-party iframes via X-Frame-Options)"
          >
            Direct Iframe
          </button>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: isRunning ? 'var(--green)' : 'var(--text-muted)', boxShadow: isRunning ? '0 0 8px var(--green)' : 'none', marginLeft: 6 }} />
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: isRunning ? 'var(--green)' : 'var(--text-muted)' }}>
            {isRunning ? 'SCROLLING' : 'READY'}
          </span>
        </div>
      </div>

      {/* Multi-Worker Selector Pills */}
      {activeWorkers.length > 1 && (
        <div style={{ background: '#0a0d1f', padding: '6px 14px', display: 'flex', gap: 6, overflowX: 'auto', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginRight: 4, flexShrink: 0 }}>
            Workers ({activeWorkers.length}):
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

      {/* Viewport Area */}
      <div style={{ position: 'relative', height: viewportHeight, overflow: 'hidden', background: '#070914' }}>
        {/* Telemetry HUD Overlay in top right */}
        <div style={{
          position: 'absolute',
          top: 12,
          right: 14,
          zIndex: 40,
          background: 'rgba(8, 12, 30, 0.92)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          backdropFilter: 'blur(8px)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: '.68rem',
          fontFamily: 'var(--mono)',
          lineHeight: 1.5,
          color: 'var(--text)',
          boxShadow: '0 4px 16px rgba(0,0,0,.5)'
        }}>
          <div style={{ color: 'var(--accent-light)', fontWeight: 700 }}>● PLAYWRIGHT AGENT HUD</div>
          <div>Target: <span style={{ color: '#38bdf8' }}>{hostname}</span></div>
          <div>Session: <span style={{ color: 'var(--cyan)' }}>{currentWorker.sessionId}</span></div>
          <div>Identity: <span style={{ color: '#fff' }}>{currentWorker.testEmail}</span></div>
          <div>Scroll Depth: <span style={{ color: 'var(--green)', fontWeight: 700 }}>{depth}%</span></div>
          <div>Offset: <span style={{ color: 'var(--yellow)' }}>-{scrollOffset}px</span></div>
        </div>

        {/* Laser Scanner Line at active scroll depth */}
        {isRunning && (
          <div style={{
            position: 'absolute',
            top: `${Math.min(92, Math.max(8, depth))}%`,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #10b981, #6366f1, transparent)',
            boxShadow: '0 0 10px #10b981',
            zIndex: 35,
            transition: 'top .3s ease-out'
          }} />
        )}

        {/* Animated Virtual Mouse Cursor */}
        {isRunning && (
          <div style={{
            position: 'absolute',
            left: cursorPos.x,
            top: cursorPos.y,
            zIndex: 45,
            pointerEvents: 'none',
            transition: 'all .8s cubic-bezier(.25,1,.5,1)'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 2L18 16L12 17L16 23L13 24L9 18L4 22V2Z" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
            <div style={{
              position: 'absolute',
              left: 20,
              top: 14,
              background: 'rgba(168, 85, 247, 0.95)',
              color: '#fff',
              fontSize: '.62rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,.4)'
            }}>
              Agent: {currentWorker.testEmail}
            </div>
          </div>
        )}

        {/* VIEW MODE 1: Direct Iframe */}
        {viewMode === 'iframe' && (
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <iframe
              src={validUrl}
              title="Live Browser Target"
              style={{
                width: '100%',
                height: '2800px',
                border: 'none',
                position: 'absolute',
                left: 0,
                top: `-${Math.round((depth / 100) * 2000)}px`,
                pointerEvents: 'none',
                transition: 'top 0.4s ease-out',
                background: '#fff'
              }}
            />
            {/* Disclaimer note in iframe mode */}
            <div style={{
              position: 'absolute',
              bottom: 8,
              left: 12,
              zIndex: 30,
              background: 'rgba(0,0,0,0.75)',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: '.65rem',
              color: 'var(--yellow)'
            }}>
              Note: If Microsoft/Google blocks the direct iframe, switch to "Site Mirror" above.
            </div>
          </div>
        )}

        {/* VIEW MODE 2: High-Fidelity Tailored Site Mirror */}
        {viewMode === 'mirror' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: contentHeight,
            transform: `translateY(-${scrollOffset}px)`,
            transition: 'transform 0.5s cubic-bezier(.25,1,.5,1)',
            padding: '24px 32px',
            color: '#e2e8f0',
            background: isDotNet
              ? 'linear-gradient(180deg, #18112e 0%, #0d0f22 25%, #080a18 60%, #050611 100%)'
              : 'linear-gradient(180deg, #0f172a 0%, #090d16 40%, #05070f 100%)'
          }}>
            {/* Top Navigation Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isDotNet ? (
                  <div style={{ background: '#512bd4', color: '#fff', fontWeight: 900, fontSize: '.9rem', padding: '4px 10px', borderRadius: 6, letterSpacing: '.05em' }}>
                    .NET
                  </div>
                ) : (
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#60a5fa' }}>
                    {hostname.toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: '.75rem', color: '#94a3b8' }}>
                  {isDotNet ? 'Microsoft .NET Developer Platform' : hostname}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: '.72rem', color: '#94a3b8' }}>
                <span>Documentation</span>
                <span>Learn</span>
                <span>Downloads</span>
                <span>Community</span>
                <span style={{ color: '#a78bfa', fontWeight: 600 }}>Get Started →</span>
              </div>
            </div>

            {/* Banner: Student Ambassador / Campaign Tracking Notification */}
            {validUrl.includes('wt.mc_id') && (
              <div style={{ background: 'rgba(81, 43, 212, 0.25)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: 8, padding: '8px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.72rem', color: '#e9d5ff' }}>
                  ⚡ <strong>Campaign Referral Tracking Verified:</strong> Registered visit from ambassador link.
                </span>
                <span style={{ fontSize: '.65rem', fontFamily: 'var(--mono)', color: '#c084fc' }}>
                  wt.mc_id tracking active
                </span>
              </div>
            )}

            {/* Hero Section */}
            <div style={{ marginBottom: 36 }}>
              <span style={{ display: 'inline-block', fontSize: '.65rem', background: isDotNet ? 'rgba(81, 43, 212, 0.3)' : 'rgba(99, 102, 241, 0.2)', color: isDotNet ? '#c084fc' : '#818cf8', padding: '3px 10px', borderRadius: 12, marginBottom: 10, fontWeight: 700 }}>
                {isDotNet ? '.NET 9 IS HERE' : 'AUTHORIZED TEST TARGET'}
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: 10, lineHeight: 1.2 }}>
                {isDotNet ? 'Free. Cross-platform. Open source.' : `Welcome to ${hostname}`}
              </div>
              <p style={{ fontSize: '.8rem', color: '#94a3b8', maxWidth: 540, lineHeight: 1.6, marginBottom: 16 }}>
                {isDotNet
                  ? 'A developer platform for building apps for web, mobile, desktop, games, and IoT on Windows, macOS, and Linux with modern C# and F#.'
                  : `Automated Playwright browser runner evaluating target path: ${pathname}. Testing DOM ready times, human scroll progression, and identity tracking.`}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ background: isDotNet ? '#512bd4' : '#4f46e5', color: '#fff', padding: '8px 18px', borderRadius: 6, fontSize: '.75rem', fontWeight: 700 }}>
                  {isDotNet ? 'Download .NET SDK' : 'Explore Platform'}
                </div>
                <div style={{ border: '1px solid rgba(255,255,255,.15)', color: '#cbd5e1', padding: '8px 18px', borderRadius: 6, fontSize: '.75rem' }}>
                  Interactive Tutorial
                </div>
              </div>
            </div>

            {/* Interactive Code / Features Section */}
            {isDotNet ? (
              <div style={{ marginBottom: 36 }}>
                <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 10 }}>
                  Build Modern Cloud-Native Web APIs in Minutes
                </div>
                <div style={{ background: '#0a0d24', border: '1px solid rgba(81, 43, 212, 0.3)', borderRadius: 8, padding: 16, fontFamily: 'var(--mono)', fontSize: '.72rem', color: '#38bdf8', lineHeight: 1.6 }}>
                  <span style={{ color: '#94a3b8' }}>// Program.cs — Minimal ASP.NET Core API</span><br />
                  <span style={{ color: '#c084fc' }}>var</span> builder = WebApplication.CreateBuilder(args);<br />
                  <span style={{ color: '#c084fc' }}>var</span> app = builder.Build();<br /><br />
                  app.MapGet(<span style={{ color: '#34d399' }}>"/"</span>, () =&gt; <span style={{ color: '#34d399' }}>$"Hello from .NET 9! Visitor: {currentWorker.testEmail}"</span>);<br /><br />
                  app.Run();
                </div>
              </div>
            ) : null}

            {/* Feature Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 36 }}>
              {[
                [isDotNet ? '🌐 Web & Cloud' : '⚡ Lightning Fast', 'Blazor and ASP.NET Core deliver industry-leading request throughput.'],
                [isDotNet ? '📱 Cross-Platform MAUI' : '🛡 Enterprise Grade', 'Build native apps for Android, iOS, macOS, and Windows from a single C# codebase.'],
                [isDotNet ? '🤖 Built-in AI Workflows' : '📊 Automated Telemetry', 'Integrate OpenAI, Azure AI, and local LLMs directly into .NET applications.']
              ].map(([t, d], i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>{t}</div>
                  <div style={{ fontSize: '.7rem', color: '#94a3b8', lineHeight: 1.4 }}>{d}</div>
                </div>
              ))}
            </div>

            {/* Extended Documentation Section */}
            <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 22, marginBottom: 36 }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>
                Automated Verification & Telemetry Log
              </div>
              <p style={{ fontSize: '.74rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 12 }}>
                Current simulated session is inspecting: <span style={{ color: '#38bdf8', fontFamily: 'var(--mono)' }}>{validUrl}</span>.
                Synthetic agent &lt;{currentWorker.testEmail}&gt; is scrolling the page to ensure viewability metrics, scroll depth benchmarks, and DOM render stability.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, fontFamily: 'var(--mono)', fontSize: '.68rem' }}>
                <div style={{ background: '#0a0d24', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,.05)' }}>
                  <div style={{ color: '#94a3b8' }}>Session State</div>
                  <div style={{ color: 'var(--green)', fontWeight: 700 }}>{isRunning ? 'ACTIVE (Scrolling)' : 'IDLE'}</div>
                </div>
                <div style={{ background: '#0a0d24', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,.05)' }}>
                  <div style={{ color: '#94a3b8' }}>Scroll Progress</div>
                  <div style={{ color: 'var(--cyan)', fontWeight: 700 }}>{depth}% of page reached</div>
                </div>
                <div style={{ background: '#0a0d24', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,.05)' }}>
                  <div style={{ color: '#94a3b8' }}>Assigned Identity</div>
                  <div style={{ color: '#c084fc', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentWorker.testEmail.split('@')[0]}</div>
                </div>
              </div>
            </div>

            {/* Footer — Bounded Page End */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 24, textAlign: 'center', color: '#64748b', fontSize: '.72rem' }}>
              © {new Date().getFullYear()} {hostname} — Bottom of page reached (100% Scroll Depth). Verified by Synthetica Playwright Runner.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
