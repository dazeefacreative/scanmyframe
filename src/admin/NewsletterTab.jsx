/* global React, AdminHeader */

function NewsletterTab() {
  const subs = [
    { email: 'amaka.obi@gmail.com', date: '2026-04-30' },
    { email: 'studio@nkechi.ng', date: '2026-04-28' },
    { email: 'tunde.balogun@yahoo.com', date: '2026-04-25' },
    { email: 'orders@framelagos.com', date: '2026-04-22' },
    { email: 'okechukwu@gallery.io', date: '2026-04-19' },
    { email: 'hello@bolamemories.ng', date: '2026-04-15' },
    { email: 'kemi@kemiprints.com', date: '2026-04-12' },
    { email: 'press@punch.ng', date: '2026-04-08' },
  ];
  return (
    <>
      <AdminHeader
        title="Newsletter"
        eyebrow="Audience"
        kpis={[
          { label: 'Total subscribers', value: '2,418', sub: 'all-time' },
          { label: 'Last 30 days', value: '+184', sub: '+8.2% MoM' },
          { label: 'This week', value: '+27', sub: 'on track' },
          { label: 'Open rate', value: '38%', sub: 'last campaign' },
        ]}
        action={
          <button className="sf-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Download CSV
          </button>
        }
      />
      <div style={{ padding: '0 36px 32px', flex: 1, background: 'var(--bg)', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--sf-primary)' }}>Recent subscribers</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)' }}>
                <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)', width: 50 }}>#</th>
                <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px', color: 'var(--fg-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{String(i + 1).padStart(3, '0')}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--fg-body)', fontSize: 13 }}>{s.email}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--fg-sub)', fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Growth chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Growth, 8 weeks</p>
          <h3 style={{ margin: '0 0 18px', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--sf-primary)' }}>2,418</h3>
          <svg viewBox="0 0 240 120" style={{ width: '100%', height: 120 }}>
            <defs>
              <linearGradient id="nlfill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#0F4C3A" stopOpacity="0.18"/>
                <stop offset="1" stopColor="#0F4C3A" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,90 L30,80 L60,75 L90,55 L120,60 L150,40 L180,35 L210,25 L240,15 L240,120 L0,120 Z" fill="url(#nlfill)"/>
            <path d="M0,90 L30,80 L60,75 L90,55 L120,60 L150,40 L180,35 L210,25 L240,15" fill="none" stroke="#0F4C3A" strokeWidth="2"/>
            <circle cx="240" cy="15" r="4" fill="#D4AF37"/>
          </svg>
          <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-subtle)', borderRadius: 10 }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Top source</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--sf-primary)' }}>Marketplace waitlist</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fg-sub)' }}>1,840 of 2,418 (76%)</p>
          </div>
        </div>
      </div>
    </>
  );
}

window.NewsletterTab = NewsletterTab;
