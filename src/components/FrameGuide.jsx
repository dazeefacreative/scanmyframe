import { useState, useEffect, useRef } from 'react';

const GUIDE_KEY      = 'sf_frame_guide_done';
const GUIDE_STEP_KEY = 'sf_frame_guide_step';
const MOBILE_BP      = 1024;
const BLOG_URL       = 'https://scanmyframe.com/blog/4-smart-ways-to-attach-a-qr-code-to-your-frame';
const AUTO_DISMISS_FRAMES = 5;

/*
  Step types
  ──────────
  'auto'    → no guide button; advances automatically when isReady() returns true
  'confirm' → shows a "Next" button; enabled when isReady() returns true (default: always true)
  'info'    → like confirm but shows extra content (blog link) and no isReady check
  'intro'   → special full-screen welcome card
  'nav'     → confirm step that also triggers a navigation side-effect on enter
*/
const STEPS = [
  // 0 ─ Intro
  { id: 'intro', type: 'intro' },

  // 1 ─ Nav (desktop only; mobile auto-skips)
  {
    id: 'nav',
    selector: '[data-guide="nav-create"]',
    title: 'Create your first frame',
    message: 'Click "Create Frame" in the sidebar to get started',
    type: 'auto',
    isReady: () => !!document.querySelector('[data-guide="title"]'),
  },

  // 2 ─ Title
  {
    id: 'title',
    selector: '[data-guide="title"]',
    title: 'Give it a title',
    message: 'Enter a title for your artwork -e.g. "Sunset in Lagos"',
    type: 'confirm',
    isReady: () => (document.querySelector('[data-guide="title"]')?.value || '').trim().length > 0,
  },

  // 3 ─ Story
  {
    id: 'story',
    selector: '[data-guide="story-wrap"]',
    title: 'Tell the story',
    message: 'Describe the artwork -the artist, the occasion, what makes it special',
    type: 'confirm',
    isReady: () => document.querySelector('[data-guide="story-wrap"]')?.dataset.filled === 'true',
  },

  // 4 ─ Owner
  {
    id: 'owner',
    selector: '[data-guide="owner"]',
    title: 'Frame owner',
    message: 'Enter the name of the person this frame belongs to',
    type: 'confirm',
    isReady: () => (document.querySelector('[data-guide="owner"]')?.value || '').trim().length > 0,
  },

  // 5 ─ Next → QRGen Content → Media
  {
    id: 'next1',
    selector: '[data-guide="next-btn"]',
    title: 'Continue to media',
    message: 'All details filled. Click Next to upload the artwork photo',
    type: 'auto',
    isReady: () => !!document.querySelector('[data-guide="artwork-wrap"]'),
  },

  // 6 ─ Artwork upload
  {
    id: 'artwork',
    selector: '[data-guide="artwork-wrap"]',
    title: 'Upload artwork',
    message: 'Upload a clear photo of the frame artwork',
    type: 'confirm',
    isReady: () => document.querySelector('[data-guide="artwork-wrap"]')?.dataset.filled === 'true',
  },

  // 7 ─ Next → QRGen Media → Settings
  {
    id: 'next2',
    selector: '[data-guide="next-btn"]',
    title: 'Almost there!',
    message: 'Artwork uploaded. Click Next to review and finalize your frame',
    type: 'auto',
    isReady: () => !!document.querySelector('[data-guide="submit-btn"]'),
  },

  // 8 ─ Generate Code (wait for QR result to appear)
  {
    id: 'submit',
    selector: '[data-guide="submit-btn"]',
    title: 'Generate your QR code',
    message: "You're all set! Click Generate Code to create your frame's QR code",
    type: 'auto',
    isReady: () => !!document.querySelector('[data-guide="download-btn"]'),
  },

  // 9 ─ Download QR
  {
    id: 'download',
    selector: '[data-guide="download-area"]',
    title: 'Download your QR code',
    message: 'Tap Download PNG to save your QR code image -you\'ll need it for the next step',
    type: 'confirm',
    isReady: () => true,
  },

  // 10 ─ Attach to frame (info + blog link)
  {
    id: 'attach',
    selector: '[data-guide="download-area"]',
    title: 'Attach it to your physical frame',
    type: 'info',
    isReady: () => true,
  },

  // 11 ─ My Frames tab (navigate, then explain)
  {
    id: 'my-frames',
    selector: '[data-guide="nav-frames"]',
    title: 'My Frames -your control centre',
    message: 'This is where all your created frames live. View, edit, share and manage them any time from here.',
    type: 'confirm',
    isReady: () => true,
    navOnEnter: 'frames',
  },

  // 12 ─ Analytics tab (navigate, then explain)
  {
    id: 'analytics',
    selector: '[data-guide="nav-analytics"]',
    title: 'Analytics -track your impact',
    message: 'See how many times each QR code has been scanned, when, and from where. Know when your artwork gets attention.',
    type: 'confirm',
    isReady: () => true,
    navOnEnter: 'analytics',
  },
];

const REAL_STEPS = STEPS.length - 1; // 12 (excludes intro)

// ─── Guide chip -rendered inside the Dashboard top bar ─────────────────────
// Exported so Dashboard can slot it directly into the header action cluster.
export function GuideChip({ stepIdx, onResume }) {
  const SIZE = 28;
  const R    = 10;
  const C    = 2 * Math.PI * R;
  const pct  = Math.max(0, Math.min(1, (stepIdx - 1) / REAL_STEPS));
  const dash = C * pct;

  return (
    <button
      onClick={onResume}
      title={`Resume guide -step ${Math.max(1, stepIdx)} of ${REAL_STEPS}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 10px 5px 6px',
        borderRadius: 20,
        background: 'rgba(212,175,55,0.10)',
        border: '1px solid rgba(212,175,55,0.35)',
        cursor: 'pointer',
        color: '#D4AF37',
        fontSize: 11, fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {/* circular progress ring */}
      <svg width={SIZE} height={SIZE} style={{ flexShrink: 0 }}>
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="2.5" />
        <circle
          cx={SIZE/2} cy={SIZE/2} r={R}
          fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          transform={`rotate(-90 ${SIZE/2} ${SIZE/2})`}
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
        <text x={SIZE/2} y={SIZE/2 + 4} textAnchor="middle" fontSize="8" fontWeight="700" fill="#D4AF37">
          {Math.max(1, stepIdx)}
        </text>
      </svg>
      {/* label -hidden on very small screens */}
      <span className="guide-chip-label">Resume guide</span>
      <style>{`@media(max-width:480px){.guide-chip-label{display:none}}`}</style>
    </button>
  );
}

// ─── Intro card ───────────────────────────────────────────────────────────────
function IntroCard({ onStart, onSkip }) {
  const vw    = window.innerWidth;
  const cardW = Math.min(340, vw - 40);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 9000, pointerEvents: 'all' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: cardW,
        background: '#fff', borderRadius: 20,
        padding: '28px 24px', zIndex: 9010,
        boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: 'rgba(15,76,58,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 26,
        }}>🖼️</div>

        <div style={{ fontFamily: 'Poltawski Nowy, serif', fontSize: 18, fontWeight: 700, color: '#0F4C3A', marginBottom: 8 }}>
          Let's create your first frame!
        </div>
        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.65, marginBottom: 18 }}>
          We'll walk you through <strong style={{ color: '#0F4C3A' }}>12 simple steps</strong> -from adding your artwork details to downloading your QR code and attaching it to the frame.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 22 }}>
          {['Title', 'Story', 'Owner', 'Artwork', 'Download QR', 'My Frames', 'Analytics'].map(l => (
            <span key={l} style={{
              fontSize: 11, fontWeight: 600,
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(15,76,58,0.08)', color: '#0F4C3A',
            }}>{l}</span>
          ))}
        </div>

        <button onClick={onStart} style={{
          width: '100%', padding: '12px 0', borderRadius: 12,
          background: '#0F4C3A', color: '#FAF5DD',
          fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
          marginBottom: 10,
        }}>
          Let's go →
        </button>
        <button onClick={onSkip} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, color: '#9ca3af',
        }}>
          Skip for now
        </button>
      </div>
    </>
  );
}

// ─── Mobile: highlight ring only (no backdrop so the user can scroll/type) ───
function MobileHighlight({ rect }) {
  if (!rect) return null;
  const PAD = 6;
  return (
    <div style={{
      position: 'fixed',
      top:    rect.top    - PAD,
      left:   rect.left   - PAD,
      width:  rect.width  + PAD * 2,
      height: rect.height + PAD * 2,
      border: '2px solid #D4AF37',
      borderRadius: 10,
      boxShadow: '0 0 0 3000px rgba(0,0,0,0.45)',
      pointerEvents: 'none',
      zIndex: 9001,
      transition: 'all 0.25s ease',
    }} />
  );
}

// ─── Mobile: sticky bottom bar ────────────────────────────────────────────────
function MobileBottomBar({ step, stepNum, ready, onNext, onSkip }) {
  const [barBottom, setBarBottom] = useState(0);

  // Track visual viewport so the bar rises above the keyboard when it opens
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offsetFromBottom = window.innerHeight - (vv.offsetTop + vv.height);
      setBarBottom(Math.max(0, offsetFromBottom));
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  const isInfo    = step.type === 'info';
  const isConfirm = step.type === 'confirm' || isInfo;
  const isAction  = step.type === 'auto';

  return (
    <div style={{
      position: 'fixed',
      bottom: barBottom,
      left: 0, right: 0,
      background: '#0F4C3A',
      color: '#FAF5DD',
      padding: '12px 16px',
      paddingBottom: barBottom > 0 ? 12 : 'max(12px, env(safe-area-inset-bottom, 12px))',
      zIndex: 9010,
      boxShadow: '0 -4px 24px rgba(0,0,0,0.35)',
      transition: 'bottom 0.15s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 3, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Step {stepNum} of {REAL_STEPS}
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, fontFamily: 'Poltawski Nowy, serif' }}>
            {step.title}
          </div>
          {step.message && (
            <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.45 }}>{step.message}</div>
          )}
          {isInfo && (
            <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.45, marginTop: 2 }}>
              Want to know how to attach it?{' '}
              <a href={BLOG_URL} target="_blank" rel="noopener noreferrer"
                style={{ color: '#D4AF37', fontWeight: 700, textDecoration: 'underline' }}>
                Here are 4 ways
              </a>
            </div>
          )}
          {isAction && (
            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 3 }}>Tap the highlighted element above</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onSkip} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 10, color: 'rgba(250,245,221,0.4)', padding: 0,
          }}>Skip</button>
          {isConfirm && (
            <button onClick={ready ? onNext : undefined} style={{
              padding: '8px 14px', borderRadius: 8,
              background: ready ? '#D4AF37' : 'rgba(212,175,55,0.2)',
              color: ready ? '#0F4C3A' : 'rgba(212,175,55,0.45)',
              fontWeight: 700, fontSize: 12, border: 'none',
              cursor: ready ? 'pointer' : 'default', whiteSpace: 'nowrap',
            }}>
              {ready ? 'Next' : 'Fill field'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Backdrop ─────────────────────────────────────────────────────────────────
function Backdrop({ rect }) {
  const PAD = 8;
  const vw  = window.innerWidth;
  const vh  = window.innerHeight;

  if (!rect) {
    return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 9000, pointerEvents: 'all' }} />;
  }

  const t = Math.max(0,  rect.top    - PAD);
  const l = Math.max(0,  rect.left   - PAD);
  const r = Math.min(vw, rect.right  + PAD);
  const b = Math.min(vh, rect.bottom + PAD);

  const q = (top, left, w, h) => ({
    position: 'fixed', top, left, width: w, height: h,
    background: 'rgba(0,0,0,0.72)', zIndex: 9000,
    pointerEvents: 'all', transition: 'all 0.25s ease',
  });

  return (
    <>
      <div style={q(0, 0, '100%', t)} />
      <div style={q(b, 0, '100%', vh - b)} />
      <div style={q(t, 0, l, b - t)} />
      <div style={q(t, r, vw - r, b - t)} />
      <div style={{
        position: 'fixed', top: t, left: l, width: r - l, height: b - t,
        border: '2px solid #D4AF37', borderRadius: 10,
        boxShadow: '0 0 0 4px rgba(212,175,55,0.22)',
        zIndex: 9001, pointerEvents: 'none', transition: 'all 0.25s ease',
      }} />
    </>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ step, stepNum, rect, ready, onNext, onSkip }) {
  const ref      = useRef(null);
  const [h, setH] = useState(160);
  const PAD      = 8;
  const GAP      = 12;
  const vw       = window.innerWidth;
  const vh       = window.innerHeight;
  const tooltipW = Math.min(290, vw - 32);

  useEffect(() => { if (ref.current) setH(ref.current.offsetHeight); });

  if (!rect) return null;

  const spotBottom = Math.min(vh, rect.bottom + PAD);
  const spotTop    = Math.max(0,  rect.top    - PAD);
  const goBelow    = (vh - spotBottom - GAP) >= h || (vh - spotBottom - GAP) > (spotTop - GAP);
  const top        = goBelow ? spotBottom + GAP : Math.max(8, spotTop - GAP - h);
  const centerX    = rect.left + rect.width / 2;
  const left       = Math.max(16, Math.min(vw - tooltipW - 16, centerX - tooltipW / 2));

  const isInfo    = step.type === 'info';
  const isAction  = step.type === 'auto';
  const isConfirm = step.type === 'confirm' || isInfo;

  return (
    <div ref={ref} style={{
      position: 'fixed', top, left, width: tooltipW,
      background: '#0F4C3A', color: '#FAF5DD',
      borderRadius: 14, padding: '14px 16px',
      zIndex: 9010, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      transition: 'top 0.25s ease, left 0.25s ease',
    }}>
      {/* counter + skip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Step {stepNum} of {REAL_STEPS}
        </span>
        <button onClick={onSkip} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 10, color: 'rgba(250,245,221,0.45)', padding: '2px 4px',
        }}>
          Skip guide
        </button>
      </div>

      {/* title */}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, fontFamily: 'Poltawski Nowy, serif' }}>
        {step.title}
      </div>

      {/* message */}
      {step.message && (
        <div style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.85, marginBottom: isInfo ? 10 : 0 }}>
          {step.message}
        </div>
      )}

      {/* info step: attach instructions + blog link */}
      {isInfo && (
        <div style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.85, marginBottom: 10 }}>
          Want to know how to attach it to your frame?{' '}
          <a
            href={BLOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#D4AF37', fontWeight: 700, textDecoration: 'underline' }}
          >
            Here are 4 ways ↗
          </a>
        </div>
      )}

      {/* confirm / info next button */}
      {isConfirm && (
        <button
          onClick={ready ? onNext : undefined}
          style={{
            marginTop: isInfo ? 0 : 12,
            width: '100%', padding: '9px 0', borderRadius: 10,
            fontWeight: 700, fontSize: 12, border: 'none',
            cursor: ready ? 'pointer' : 'default',
            background: ready ? '#D4AF37' : 'rgba(212,175,55,0.25)',
            color: ready ? '#0F4C3A' : 'rgba(212,175,55,0.5)',
            transition: 'all 0.2s',
          }}
        >
          {ready ? (step.id === 'analytics' ? 'Finish guide ✓' : 'Next →') : 'Fill in the field above to continue'}
        </button>
      )}

      {/* auto step tap hint */}
      {isAction && (
        <div style={{ marginTop: 10, fontSize: 11, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', animation: 'gd-tap 1.2s infinite' }}>☝️</span>
          Tap the highlighted button
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function FrameGuide({ onNavToCreate, onNavToFrames, onNavToAnalytics, frameCount, onComplete, onSkippedChange, skippedExternal, onStepChange }) {
  const [stepIdx,    setStepIdx]    = useState(() => {
    const saved = parseInt(localStorage.getItem(GUIDE_STEP_KEY) || '0', 10);
    return isNaN(saved) ? 0 : saved;
  });
  const [targetRect, setTargetRect] = useState(null);
  const [ready,      setReady]      = useState(false);
  // skipped state is lifted to Dashboard via skippedExternal so the chip can live in the header
  const skipped = skippedExternal ?? false;

  const step = STEPS[stepIdx] ?? null;

  // ── On mount: restore navigation context for mid-guide refreshes ────────────
  // Steps 1-10 require the Create tab. Steps 9-10 also need a QR result which
  // is gone after refresh, so drop back to step 8 (Generate Code) so the user
  // re-generates. Steps 11-12 navigate to their own tabs.
  useEffect(() => {
    if (stepIdx === 0) return; // intro handles itself
    if (stepIdx >= 1 && stepIdx <= 8) {
      onNavToCreate();
    } else if (stepIdx === 9 || stepIdx === 10) {
      // QR result is lost on refresh — restart from Generate Code step
      onNavToCreate();
      setStepIdx(8);
    } else if (stepIdx === 11) {
      onNavToFrames?.();
    } else if (stepIdx === 12) {
      onNavToAnalytics?.();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-dismiss when user has AUTO_DISMISS_FRAMES frames ─────────────────
  useEffect(() => {
    if (frameCount >= AUTO_DISMISS_FRAMES) {
      localStorage.removeItem(GUIDE_STEP_KEY);
      onComplete?.(); // Dashboard writes frame_guide_done to DB
    }
  }, [frameCount, onComplete]);

  // ── Persist step + notify Dashboard of current step ──────────────────────
  useEffect(() => {
    if (stepIdx > 0) localStorage.setItem(GUIDE_STEP_KEY, String(stepIdx));
    onStepChange?.(stepIdx);
  }, [stepIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigate side-effects on step enter ───────────────────────────────────
  useEffect(() => {
    if (!step) return;
    if (step.navOnEnter === 'frames')    onNavToFrames?.();
    if (step.navOnEnter === 'analytics') onNavToAnalytics?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  // ── Scroll target into view ───────────────────────────────────────────────
  useEffect(() => {
    if (!step || step.type === 'intro' || !step.selector) return;
    const t = setTimeout(() => {
      const el = document.querySelector(step.selector);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 180);
    return () => clearTimeout(t);
  }, [stepIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poll: rect + isReady + auto-advance ───────────────────────────────────
  useEffect(() => {
    if (!step || step.type === 'intro' || skipped) return;
    const id = setInterval(() => {
      const el = document.querySelector(step.selector);
      setTargetRect(el ? el.getBoundingClientRect() : null);

      if (step.isReady) {
        const r = step.isReady();
        setReady(r);
        if (step.type === 'auto' && r) {
          const next = stepIdx + 1;
          if (next >= STEPS.length) {
            complete();
          } else {
            setStepIdx(next);
            setReady(false);
            setTargetRect(null);
          }
        }
      }
    }, 200);
    return () => clearInterval(id);
  }, [stepIdx, skipped]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recalc rect on scroll / resize / keyboard ────────────────────────────
  useEffect(() => {
    if (!step || step.type === 'intro' || !step.selector || skipped) return;
    const recalc = () => {
      const el = document.querySelector(step.selector);
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    // visualViewport fires on keyboard open/close on iOS - more reliable than resize
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', recalc);
      vv.addEventListener('scroll', recalc);
    }
    document.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      if (vv) {
        vv.removeEventListener('resize', recalc);
        vv.removeEventListener('scroll', recalc);
      }
      document.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [stepIdx, skipped]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Block Escape ─────────────────────────────────────────────────────────
  useEffect(() => {
    const block = e => { if (e.key === 'Escape') e.stopImmediatePropagation(); };
    document.addEventListener('keydown', block, true);
    return () => document.removeEventListener('keydown', block, true);
  }, []);

  function complete() {
    localStorage.removeItem(GUIDE_STEP_KEY);
    onComplete?.(); // Dashboard writes frame_guide_done to DB
  }

  function advance() {
    const next = stepIdx + 1;
    if (next >= STEPS.length) {
      complete();
    } else {
      setStepIdx(next);
      setReady(false);
      setTargetRect(null);
    }
  }

  function handleSkip()   { onSkippedChange?.(true);  }
  function handleResume() { onSkippedChange?.(false); }

  // "Let's go!" from intro
  function handleIntroStart() {
    if (window.innerWidth < MOBILE_BP) {
      onNavToCreate();
      setStepIdx(2); // skip nav step on mobile
    } else {
      setStepIdx(1);
    }
  }

  if (!step) return null;

  // Skipped -overlay hidden; Dashboard renders GuideChip in the header
  if (skipped) return null;

  // Intro
  if (step.type === 'intro') {
    return (
      <>
        <style>{`
  @keyframes gd-tap{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @media(max-width:1023px){
    input,textarea,select{font-size:max(16px,1em)!important}
  }
`}</style>
        <IntroCard onStart={handleIntroStart} onSkip={handleSkip} />
      </>
    );
  }

  const stepNum = stepIdx; // 1-indexed since intro is 0
  const isMobile = window.innerWidth < MOBILE_BP;

  return (
    <>
      <style>{`
  @keyframes gd-tap{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @media(max-width:1023px){
    input,textarea,select{font-size:max(16px,1em)!important}
  }
`}</style>

      {isMobile ? (
        // Mobile: just a highlight ring + bottom bar - no backdrop blocking interaction
        <>
          <MobileHighlight rect={targetRect} />
          <MobileBottomBar
            step={step}
            stepNum={stepNum}
            ready={ready}
            onNext={advance}
            onSkip={handleSkip}
          />
        </>
      ) : (
        // Desktop: full spotlight + floating tooltip
        <>
          <Backdrop rect={targetRect} />
          <Tooltip
            step={step}
            stepNum={stepNum}
            rect={targetRect}
            ready={ready}
            onNext={advance}
            onSkip={handleSkip}
          />
        </>
      )}
    </>
  );
}
