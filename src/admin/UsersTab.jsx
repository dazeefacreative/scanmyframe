/* global React, AdminHeader */

const sampleUsers = [
  { name: 'Adaeze Ezenwa Photography', email: 'adaeze@ezenwastudio.ng', plan: 'Pro', cycle: 'monthly', qrUsed: 18, qrTotal: 25, status: 'active', renews: '2026-05-12', joined: '2025-09-08' },
  { name: 'Frame & Print Lagos', email: 'orders@framelagos.com', plan: 'Business', cycle: 'yearly', qrUsed: 234, qrTotal: -1, status: 'active', renews: '2026-11-02', joined: '2025-04-20' },
  { name: 'Chisom Eze Gallery', email: 'chisom@ezegallery.com', plan: 'Pro', cycle: 'monthly', qrUsed: 22, qrTotal: 25, status: 'active', renews: '2026-05-18', joined: '2025-12-01' },
  { name: 'Tunde Adesanya', email: 'tunde@gmail.com', plan: 'Basic', cycle: 'monthly', qrUsed: 1, qrTotal: 3, status: 'active', renews: '2026-05-09', joined: '2026-02-14' },
  { name: 'Bola Memories', email: 'hello@bolamemories.ng', plan: 'Pro', cycle: 'yearly', qrUsed: 12, qrTotal: 25, status: 'past_due', renews: '2026-04-28', joined: '2025-08-11' },
  { name: 'Emeka Okafor Studio', email: 'emeka@okaforstudio.com', plan: 'Business', cycle: 'monthly', qrUsed: 67, qrTotal: -1, status: 'active', renews: '2026-05-15', joined: '2025-06-03' },
];

function UsersTab() {
  const total = sampleUsers.length;
  const byPlan = sampleUsers.reduce((acc, u) => { acc[u.plan] = (acc[u.plan] || 0) + 1; return acc; }, {});
  const active = sampleUsers.filter(u => u.status === 'active').length;

  const planColor = { Basic: 'var(--sf-third-option)', Pro: 'var(--sf-gold)', Business: 'var(--sf-primary)' };

  return (
    <>
      <AdminHeader
        title="Vendors & users"
        eyebrow="Accounts"
        kpis={[
          { label: 'Total', value: total, sub: 'all signups' },
          { label: 'Active', value: active, sub: 'paying now' },
          { label: 'Pro', value: byPlan.Pro || 0, sub: 'most popular' },
          { label: 'Business', value: byPlan.Business || 0, sub: 'top tier' },
        ]}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 240 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--fg-muted)' }}>
              <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
            </svg>
            <input placeholder="Search by name or email…" style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, flex: 1, fontFamily: 'var(--font-body)', color: 'var(--fg-body)' }}/>
          </div>
        }
      />
      <div style={{ padding: '0 36px 32px', flex: 1, background: 'var(--bg)' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)' }}>
                {['Vendor', 'Plan', 'QR usage', 'Status', 'Renews', 'Joined'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleUsers.map((u, i) => {
                const pct = u.qrTotal === -1 ? 0 : (u.qrUsed / u.qrTotal) * 100;
                const near = u.qrTotal !== -1 && pct >= 80;
                return (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'var(--sf-primary)', color: 'var(--sf-gold)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-body)',
                          flexShrink: 0,
                        }}>{u.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--sf-primary)' }}>{u.name}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: planColor[u.plan], border: `1px solid ${planColor[u.plan]}`,
                        background: 'transparent',
                      }}>{u.plan}</span>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'capitalize' }}>{u.cycle}</p>
                    </td>
                    <td style={{ padding: '14px 20px', minWidth: 160 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--fg-body)', fontFamily: 'var(--font-mono)' }}>
                        {u.qrUsed} / {u.qrTotal === -1 ? '∞' : u.qrTotal}
                      </p>
                      {u.qrTotal !== -1 && (
                        <div style={{ height: 4, background: 'var(--bg-subtle)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: near ? 'var(--sf-gold)' : 'var(--sf-primary)' }} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        background: u.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: u.status === 'active' ? '#16a34a' : 'var(--danger)',
                        border: `1px solid ${u.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                      }}>{u.status === 'past_due' ? 'past due' : u.status}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--fg-sub)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{u.renews}</td>
                    <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--fg-sub)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{u.joined}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

window.UsersTab = UsersTab;
