/* global React, AdminHeader */
const { useState: useNotifState } = React;

const AUDIENCES = [
  { id: 'all', label: 'All users', count: 2418 },
  { id: 'subs', label: 'Active subscribers', count: 1340 },
  { id: 'basic', label: 'Basic plan', count: 612 },
  { id: 'pro', label: 'Pro plan', count: 528 },
  { id: 'biz', label: 'Business plan', count: 200 },
];

const TYPES = [
  { id: 'info', label: 'Info', color: '#3b82f6' },
  { id: 'success', label: 'Success', color: '#16a34a' },
  { id: 'alert', label: 'Alert', color: '#ca8a04' },
  { id: 'error', label: 'Error', color: '#ef4444' },
  { id: 'update', label: 'Update', color: '#a855f7' },
];

function NotificationsTab() {
  const [audience, setAudience] = useNotifState('all');
  const [type, setType] = useNotifState('update');
  const [message, setMessage] = useNotifState("We've shipped real-time location bars in Analytics. Check it out.");
  const [desc, setDesc] = useNotifState("Open Analytics → Top locations to see your scans broken down by city. Available on every plan from today.");
  const aud = AUDIENCES.find(a => a.id === audience);
  const t = TYPES.find(x => x.id === type);

  const inp = {
    width: '100%', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: 10,
    padding: '10px 14px', fontSize: 13,
    fontFamily: 'var(--font-body)', color: 'var(--fg-body)',
    outline: 'none', boxSizing: 'border-box',
  };
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-sub)', marginBottom: 8 };

  return (
    <>
      <AdminHeader
        title="Push notification"
        eyebrow="Broadcast"
        kpis={[
          { label: 'Sent (30d)', value: 7, sub: 'all types' },
          { label: 'Open rate', value: '64%', sub: 'last broadcast' },
          { label: 'Last sent', value: '4d ago', sub: 'Pro plan only' },
        ]}
      />
      <div style={{ padding: '0 36px 32px', flex: 1, background: 'var(--bg)', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* Compose */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Compose</p>
          <h3 style={{ margin: '0 0 24px', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--sf-primary)' }}>New broadcast</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={lbl}>Audience</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {AUDIENCES.map(a => (
                  <button key={a.id} onClick={() => setAudience(a.id)} style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    background: audience === a.id ? 'rgba(15,76,58,0.06)' : 'var(--bg-subtle)',
                    border: audience === a.id ? '1.5px solid var(--sf-primary)' : '1px solid var(--border)',
                    textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontFamily: 'var(--font-body)',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: audience === a.id ? 'var(--sf-primary)' : 'var(--fg-body)' }}>{a.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{a.count.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>Type</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TYPES.map(x => (
                  <button key={x.id} onClick={() => setType(x.id)} style={{
                    padding: '6px 14px', borderRadius: 99,
                    background: type === x.id ? `${x.color}15` : 'var(--bg-subtle)',
                    border: type === x.id ? `1px solid ${x.color}55` : '1px solid var(--border)',
                    color: type === x.id ? x.color : 'var(--fg-sub)',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}>{x.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>Message <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--fg-muted)', letterSpacing: 0 }}>· {message.length}/160</span></label>
              <input style={inp} maxLength={160} value={message} onChange={e => setMessage(e.target.value)} />
            </div>

            <div>
              <label style={lbl}>Full description <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--fg-muted)', letterSpacing: 0 }}>· optional</span></label>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 90 }} value={desc} onChange={e => setDesc(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-muted)' }}>
                Will reach <span style={{ fontWeight: 700, color: 'var(--sf-primary)' }}>{aud.count.toLocaleString()}</span> {aud.label.toLowerCase()}
              </p>
              <button className="sf-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
                Send broadcast
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Preview</p>
            <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--sf-primary)' }}>How vendors will see it</h3>

            <div style={{ background: 'var(--sf-primary-deep)', borderRadius: 14, padding: 18, color: 'var(--sf-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: `${t.color}25`, border: `1px solid ${t.color}55`,
                  color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                }}>!</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: 99, color: t.color, background: `${t.color}1a`,
                      border: `1px solid ${t.color}33`,
                    }}>{t.label}</span>
                    <span style={{ fontSize: 10, color: 'rgba(250,245,221,0.5)', fontFamily: 'var(--font-mono)' }}>now</span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--sf-secondary)', lineHeight: 1.5 }}>{message || <span style={{ color: 'rgba(250,245,221,0.4)' }}>Your message…</span>}</p>
                  {desc && <p style={{ margin: 0, fontSize: 12, color: 'rgba(250,245,221,0.6)', lineHeight: 1.55 }}>{desc}</p>}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Recent broadcasts</p>
            <h3 style={{ margin: '0 0 14px', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--sf-primary)' }}>Last 5</h3>
            {[
              { type: 'info', m: 'New: device breakdown in Analytics', when: '4d ago', to: 'All users' },
              { type: 'alert', m: 'Scheduled maintenance Sun 02:00 WAT', when: '8d ago', to: 'All users' },
              { type: 'update', m: 'Pro plan now includes 50 frames', when: '12d ago', to: 'Pro plan' },
              { type: 'success', m: 'Marketplace waitlist hit 2,000 vendors', when: '18d ago', to: 'All users' },
            ].map((b, i) => {
              const c = TYPES.find(x => x.id === b.type).color;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < 3 ? '1px dashed var(--border)' : 'none' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: c, marginTop: 7, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-body)', lineHeight: 1.4 }}>{b.m}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>{b.to} · {b.when}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

window.NotificationsTab = NotificationsTab;
