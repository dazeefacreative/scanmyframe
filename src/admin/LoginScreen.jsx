/* global React */

function LoginScreen({ onLogin }) {
  const { useState } = React;
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');

  function submit(e) {
    e.preventDefault();
    if (u === 'scanframe_admin' && p === 'Scanframe@2025') onLogin();
    else setErr('Invalid credentials.');
  }

  const inp = {
    width: '100%', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: 12,
    padding: '14px 16px', fontSize: 14,
    fontFamily: 'var(--font-body)', color: 'var(--fg-body)',
    outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--sf-primary)',
    }}>
      {/* Left: brand panel */}
      <div style={{
        flex: 1, padding: '60px 64px', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
      }}>
        <img src="../../assets/scanframe-logo.png" alt="ScanMyFrame" style={{ height: 28 }} />
        <div>
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em',
            textTransform: 'uppercase', padding: '6px 16px', borderRadius: 999,
            color: 'var(--sf-gold)', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)', marginBottom: 24,
          }}>Internal tool</span>
          <h1 style={{
            margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 48,
            color: 'var(--sf-secondary)', fontWeight: 700, lineHeight: 1.05,
            maxWidth: 460, textWrap: 'balance',
          }}>Manage every story behind every frame.</h1>
          <p style={{
            margin: 0, color: 'rgba(250,245,221,0.65)', fontSize: 15,
            lineHeight: 1.6, maxWidth: 420,
          }}>
            Posts, vendors, newsletter and notifications — all in one place.
          </p>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'rgba(250,245,221,0.4)', fontFamily: 'var(--font-mono)' }}>
          v1.0 · admin.scanmyframe.ng
        </p>
      </div>

      {/* Right: form panel */}
      <div style={{
        width: 480, background: 'var(--bg)', padding: '60px 56px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Sign in</p>
        <h2 style={{ margin: '0 0 32px', fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--sf-primary)', fontWeight: 700 }}>Welcome back, admin.</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-sub)', marginBottom: 8 }}>Username</label>
            <input style={inp} value={u} onChange={e => setU(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-sub)', marginBottom: 8 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: 60 }} type={show ? 'text' : 'password'}
                value={p} onChange={e => setP(e.target.value)} />
              <button type="button" onClick={() => setShow(s => !s)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'var(--fg-muted)', fontWeight: 600,
              }}>{show ? 'HIDE' : 'SHOW'}</button>
            </div>
          </div>
          {err && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#ef4444',
            }}>{err}</div>
          )}
          <button type="submit" className="sf-btn-primary" style={{ marginTop: 8, padding: '14px 20px', fontSize: 14 }}>
            Sign in to admin
          </button>
        </form>
        <p style={{ margin: '24px 0 0', fontSize: 11, color: 'var(--fg-muted)', textAlign: 'center' }}>
          Forgot your credentials? Contact the engineering lead.
        </p>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
