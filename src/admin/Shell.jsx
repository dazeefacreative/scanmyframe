/* global React */
const { useState } = React;

function AdminShell({ tab, onTab, children, onSignOut }) {
  const tabs = [
    { id: 'posts', label: 'Blog Posts', icon: 'M4 4h16v4H4zM4 12h16v8H4z' },
    { id: 'users', label: 'Users', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0' },
    { id: 'newsletter', label: 'Newsletter', icon: 'M3 7l9 6 9-6M3 7v10h18V7M3 7l9-4 9 4' },
    { id: 'notifications', label: 'Push', icon: 'M18 16v-5a6 6 0 10-12 0v5l-2 3h16l-2-3zM10 22a2 2 0 004 0' },
  ];
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-subtle)' }}>
      <aside style={{
        width: 240, background: 'var(--sf-primary-deep)', color: 'var(--sf-secondary)',
        padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
      }}>
        <div style={{ padding: '4px 12px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="../../assets/scanframe-logo.png" alt="ScanMyFrame" style={{ height: 22 }} />
        </div>
        <p style={{
          margin: '0 12px 18px', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'var(--sf-gold)',
        }}>Admin console</p>
        {tabs.map(t => (
          <button key={t.id} onClick={() => onTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
            background: tab === t.id ? 'rgba(212,175,55,0.12)' : 'transparent',
            color: tab === t.id ? 'var(--sf-gold)' : 'rgba(250,245,221,0.7)',
            border: tab === t.id ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
            cursor: 'pointer', textAlign: 'left',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: tab === t.id ? 600 : 500,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={onSignOut} style={{
          padding: '10px 12px', borderRadius: 10, background: 'transparent',
          color: 'rgba(250,245,221,0.5)', border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
          textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign out
        </button>
      </aside>
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>{children}</main>
    </div>
  );
}

function AdminHeader({ title, eyebrow, kpis = [], action }) {
  return (
    <div style={{ padding: '32px 36px 0', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{eyebrow}</p>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--sf-primary)' }}>{title}</h1>
        </div>
        {action}
      </div>
      {kpis.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: 12, marginBottom: 24 }}>
          {kpis.map((k, i) => (
            <div key={i} style={{
              background: i === 0 ? 'var(--sf-primary)' : 'var(--surface)',
              color: i === 0 ? 'var(--sf-secondary)' : 'inherit',
              border: i === 0 ? 'none' : '1px solid var(--border)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <p style={{
                margin: '0 0 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: i === 0 ? 'var(--sf-gold)' : 'var(--fg-muted)',
              }}>{k.label}</p>
              <p style={{
                margin: 0, fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700,
                color: i === 0 ? 'var(--sf-secondary)' : 'var(--sf-primary)', lineHeight: 1.1,
              }}>{k.value}</p>
              {k.sub && <p style={{ margin: '4px 0 0', fontSize: 11, color: i === 0 ? 'rgba(250,245,221,0.65)' : 'var(--fg-muted)' }}>{k.sub}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.AdminShell = AdminShell;
window.AdminHeader = AdminHeader;
