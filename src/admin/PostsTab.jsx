/* global React, AdminHeader */

const samplePosts = [
  { id: 1, title: 'How to set up your first ScanMyFrame', slug: 'first-scanmyframe-setup', status: 'published', tags: ['guide', 'getting-started'], pinned: true, date: '2026-04-22' },
  { id: 2, title: 'Five ways vendors are using QR analytics', slug: 'five-ways-vendors-qr-analytics', status: 'published', tags: ['stories', 'analytics'], pinned: false, date: '2026-04-15' },
  { id: 3, title: 'Coming soon: the marketplace', slug: 'marketplace-coming-soon', status: 'draft', tags: ['product'], pinned: false, date: null },
  { id: 4, title: 'A photographer\'s playbook', slug: 'photographer-playbook', status: 'published', tags: ['stories'], pinned: false, date: '2026-03-30' },
  { id: 5, title: 'Print partner network goes live', slug: 'print-partner-network-live', status: 'published', tags: ['announcement'], pinned: false, date: '2026-03-12' },
];

function PostsTab({ onNew, onEdit }) {
  const total = samplePosts.length;
  const published = samplePosts.filter(p => p.status === 'published').length;
  const drafts = total - published;
  const pinned = samplePosts.filter(p => p.pinned).length;

  return (
    <>
      <AdminHeader
        title="Blog posts"
        eyebrow="Content"
        kpis={[
          { label: 'Total', value: total, sub: 'all time' },
          { label: 'Published', value: published, sub: 'live on site' },
          { label: 'Drafts', value: drafts, sub: 'unpublished' },
          { label: 'Pinned', value: pinned, sub: 'on homepage' },
        ]}
        action={
          <button onClick={onNew} className="sf-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New post
          </button>
        }
      />
      <div style={{ padding: '0 36px 32px', flex: 1, background: 'var(--bg)' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Filter bar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-subtle)', borderRadius: 99 }}>
              {['All', 'Published', 'Drafts', 'Pinned'].map((f, i) => (
                <button key={f} style={{
                  padding: '5px 14px', borderRadius: 99, border: 'none',
                  background: i === 0 ? 'var(--surface)' : 'transparent',
                  color: i === 0 ? 'var(--sf-primary)' : 'var(--fg-muted)',
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11,
                  cursor: 'pointer',
                }}>{f}</button>
              ))}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 10, background: 'var(--bg-subtle)',
              border: '1px solid var(--border)', minWidth: 240,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--fg-muted)' }}>
                <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
              </svg>
              <input placeholder="Search posts…" style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 12, fontFamily: 'var(--font-body)', flex: 1,
                color: 'var(--fg-body)',
              }}/>
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)' }}>
                {['Title', 'Status', 'Tags', 'Published', ''].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 20px',
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'var(--fg-muted)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {samplePosts.map(p => (
                <tr key={p.id} style={{
                  borderTop: '1px solid var(--border)',
                  background: p.pinned ? 'rgba(212,175,55,0.04)' : 'var(--surface)',
                  borderLeft: p.pinned ? '3px solid var(--sf-gold)' : '3px solid transparent',
                }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.pinned && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--sf-gold)" stroke="var(--sf-gold)" strokeWidth="1.5" style={{ flexShrink: 0 }}>
                          <path d="M12 2l2 6h6l-5 4 2 7-5-4-5 4 2-7-5-4h6l2-6z" fill="none"/>
                          <path d="M12 17v5"/>
                        </svg>
                      )}
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--sf-primary)', fontFamily: 'var(--font-display)' }}>{p.title}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>/blog/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: p.status === 'published' ? 'rgba(34,197,94,0.12)' : 'rgba(202,138,4,0.12)',
                      color: p.status === 'published' ? '#16a34a' : '#ca8a04',
                      border: `1px solid ${p.status === 'published' ? 'rgba(34,197,94,0.25)' : 'rgba(202,138,4,0.25)'}`,
                    }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {p.tags.map(t => (
                        <span key={t} style={{
                          fontSize: 10, padding: '3px 8px', borderRadius: 6,
                          background: 'var(--bg-subtle)', color: 'var(--fg-sub)',
                        }}>{t}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--fg-sub)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {p.date || '—'}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button onClick={onEdit} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--sf-primary)', fontWeight: 600, fontSize: 12, marginRight: 12, fontFamily: 'var(--font-body)' }}>Edit</button>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 600, fontSize: 12, fontFamily: 'var(--font-body)' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

window.PostsTab = PostsTab;
