import { useState } from 'react';
import SEO from '../components/SEO';
import scanMyFrameLogo from '../assets/images/Scanframe alt.png';

const INVESTOR_PASSWORD = 'Investor@2026';
const SESSION_KEY       = 'sf_investor';

function PasswordGate({ onUnlock }) {
  const [pwd,  setPwd]  = useState('');
  const [show, setShow] = useState(false);
  const [err,  setErr]  = useState('');

  function submit(e) {
    e.preventDefault();
    if (pwd === INVESTOR_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onUnlock();
    } else {
      setErr('Incorrect password. Please try again.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0F4C3A' }}>

      {/* ── Left brand panel ── */}
      <div style={{
        flex: 1, padding: '56px 64px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        overflow: 'hidden',
      }} className="hidden md:flex">
        <img
          src={scanMyFrameLogo}
          alt="ScanMyFrame"
          style={{ width: 60, filter: 'brightness(0) invert(1)', opacity: 0.9 }}
        />

        <div>
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            padding: '6px 16px', borderRadius: 999,
            color: '#D4AF37', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)', marginBottom: 24,
          }}>
            Confidential · Investors &amp; Advisors
          </span>
          <h1 style={{
            margin: '0 0 16px', fontFamily: 'Georgia, serif',
            fontSize: 44, color: '#F7F5EE', fontWeight: 700,
            lineHeight: 1.08, maxWidth: 440,
          }}>
            Turn every frame you sell into a digital experience.
          </h1>
          <p style={{ margin: 0, color: 'rgba(250,245,221,0.65)', fontSize: 15, lineHeight: 1.6, maxWidth: 400 }}>
            Pre-seed investor brief and UX specification &mdash; May 2026.
          </p>
        </div>

        <p style={{ margin: 0, fontSize: 11, color: 'rgba(250,245,221,0.4)', fontFamily: 'Menlo, monospace' }}>
          v1.0 &middot; scanmyframe.com
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        width: 480, background: '#fff', padding: '60px 56px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        flexShrink: 0,
      }} className="w-full md:w-[480px] px-6 md:px-14">
        <p style={{
          margin: '0 0 8px', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af',
        }}>Investor access</p>
        <h2 style={{
          margin: '0 0 32px', fontFamily: 'Georgia, serif',
          fontSize: 26, color: '#0F4C3A', fontWeight: 700,
        }}>Enter your access code.</h2>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#6b7280', marginBottom: 8,
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'}
                value={pwd}
                onChange={e => { setPwd(e.target.value); setErr(''); }}
                autoFocus
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 56px 12px 16px', borderRadius: 12,
                  border: err ? '1px solid #ef4444' : '1px solid #e5e7eb',
                  fontSize: 14, color: '#111', outline: 'none',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#0F4C3A'}
                onBlur={e => e.target.style.borderColor = err ? '#ef4444' : '#e5e7eb'}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 700, color: '#9ca3af',
                  letterSpacing: '0.08em',
                }}>
                {show ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          {err && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: 12, color: '#ef4444',
            }}>{err}</div>
          )}

          <button
            type="submit"
            style={{
              marginTop: 8, padding: '14px 20px',
              background: '#0F4C3A', color: '#F7F5EE',
              border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => e.target.style.opacity = '0.88'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            View document
          </button>
        </form>

        <p style={{ marginTop: 32, fontSize: 11, color: '#9ca3af', lineHeight: 1.6 }}>
          This document is confidential and intended only for authorised investors and advisors.
          Contact <a href="mailto:dazeefa@scanmyframe.com" style={{ color: '#0F4C3A' }}>dazeefa@scanmyframe.com</a> to request access.
        </p>
      </div>
    </div>
  );
}

export default function Investor() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');

  if (!authed) return (
    <>
      <SEO
        title="Investor Access · ScanMyFrame"
        description="Restricted document. Authorised investors and advisors only."
        url="/investor"
        noIndex
      />
      <PasswordGate onUnlock={() => setAuthed(true)} />
    </>
  );

  return (
    <>
      <SEO
        title="Investor & UX Specification · ScanMyFrame"
        description="ScanMyFrame investor brief and UX specification — B2B SaaS for frame vendors across West Africa. Pre-seed round."
        url="/investor"
        noIndex
      />
      <iframe
        src="/investor-spec.html"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 'none' }}
        title="ScanMyFrame — Investor & UX Specification"
      />
    </>
  );
}
