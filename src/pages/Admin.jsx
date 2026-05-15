import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  adminGetAllPosts, adminCreatePost, adminUpdatePost, adminDeletePost,
  adminGetAllUsers, adminDeleteUser, adminSuspendUser, adminUnsuspendUser, adminGetNewsletter, uploadBlogImage, adminPushNotification,
  adminGetFeaturedLogos, adminUploadFeaturedLogo, adminDeleteFeaturedLogo,
  adminAdjustQRCredits,
} from '../services/supabaseHelpers';
import scanMyFrameLogo from '../assets/images/Scanframe alt.png';

const ADMIN_USERNAME = 'scanframe_admin';
const ADMIN_PASSWORD = 'Scanframe@2025';

// ─── CSS Variables ────────────────────────────────────────────────────────────
const ADMIN_STYLES = `
  .sf-admin {
    --bg: #f8f7f4;
    --bg-subtle: #f0efe9;
    --surface: #ffffff;
    --border: rgba(15,76,58,0.12);
    --fg-body: #1a1a1a;
    --fg-sub: #4a7c6f;
    --fg-muted: #9aaea9;
    --sf-primary: #0F4C3A;
    --sf-primary-deep: #0a2e22;
    --sf-secondary: #FAF5DD;
    --sf-gold: #D4AF37;
    --danger: #ef4444;
    --font-body: 'Montserrat Alternates', system-ui, sans-serif;
    --font-display: 'Poltawski Nowy', Georgia, serif;
    --font-mono: 'JetBrains Mono', 'Courier New', monospace;
  }
  .sf-btn-primary {
    background: var(--sf-primary); color: var(--sf-secondary);
    border: none; border-radius: 10px; padding: 10px 18px;
    font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: var(--font-body); transition: opacity 0.15s;
  }
  .sf-btn-primary:hover:not(:disabled) { opacity: 0.85; }
  .sf-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
  .sf-input {
    width: 100%; background: var(--surface);
    border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 14px; font-size: 13px;
    font-family: var(--font-body); color: var(--fg-body);
    outline: none; box-sizing: border-box; transition: border-color 0.15s;
  }
  .sf-input:focus { border-color: var(--sf-primary); }
  .sf-textarea { resize: vertical; min-height: 80px; }
  .sf-admin-mobile-nav { display: none; }
  .sf-admin-cards { display: none; }
  .sf-admin-login-form { width: 480px; background: var(--bg); padding: 60px 56px; display: flex; flex-direction: column; justify-content: center; flex-shrink: 0; }

  /* Layout helpers */
  .sf-admin-header-wrap { padding: 32px 36px 0; background: var(--bg); }
  .sf-admin-kpi-grid    { display: grid; gap: 12px; margin-bottom: 24px; }
  .sf-admin-content     { padding: 0 36px 32px; flex: 1; background: var(--bg); }
  .sf-admin-compose-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px; }
  .sf-admin-modal-inner { width: 100%; max-width: 720px; background: var(--bg); border-radius: 20px; padding: 32px 36px; border: 1px solid var(--border); box-shadow: 0 24px 60px rgba(0,0,0,0.15); }

  @media (max-width: 900px) {
    .sf-admin-aside { display: none !important; }
    .sf-admin-mobile-nav { display: flex !important; }
  }

  @media (max-width: 640px) {
    .sf-admin-login-brand { display: none !important; }
    .sf-admin-login-form  { width: 100% !important; padding: 40px 24px !important; }
    .sf-admin-table       { display: none !important; }
    .sf-admin-cards       { display: block !important; }
    .sf-admin-header-wrap { padding: 20px 16px 0 !important; }
    .sf-admin-content     { padding: 0 16px 20px !important; }
    .sf-admin-kpi-grid    { grid-template-columns: repeat(2, 1fr) !important; }
    .sf-admin-compose-grid { grid-template-columns: 1fr !important; }
    .sf-admin-modal-inner { padding: 20px 16px !important; border-radius: 14px !important; }
    .sf-admin-modal-grid  { grid-template-columns: 1fr !important; }
    .sf-admin-notif-grid  { grid-template-columns: 1fr !important; }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d).toISOString().split('T')[0];
}

function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const csv  = [cols.join(','), ...rows.map(r => cols.map(c => `"${(r[c] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
}

const EMPTY_POST = { title: '', slug: '', excerpt: '', cover_image: '', author: 'ScanMyFrame', status: 'draft', body: [] };

function CopyIdButton({ id }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} title={id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied ? 'rgba(15,76,58,0.08)' : 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: copied ? 'var(--sf-primary)' : 'var(--fg-muted)', fontFamily: 'var(--font-mono)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
      {copied ? (
        <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg> Copied</>
      ) : (
        <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> {id.slice(0, 8)}…</>
      )}
    </button>
  );
}

// ─── KPI Header ───────────────────────────────────────────────────────────────
function AdminHeader({ title, eyebrow, kpis = [], action }) {
  return (
    <div className="sf-admin-header-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{eyebrow}</p>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--sf-primary)' }}>{title}</h1>
        </div>
        {action}
      </div>
      {kpis.length > 0 && (
        <div className="sf-admin-kpi-grid" style={{ gridTemplateColumns: `repeat(${kpis.length}, 1fr)` }}>
          {kpis.map((k, i) => (
            <div key={i} style={{
              background: i === 0 ? 'var(--sf-primary)' : 'var(--surface)',
              color: i === 0 ? 'var(--sf-secondary)' : 'inherit',
              border: i === 0 ? 'none' : '1px solid var(--border)',
              borderRadius: 14, padding: '16px 18px',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: i === 0 ? 'var(--sf-gold)' : 'var(--fg-muted)' }}>{k.label}</p>
              <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: i === 0 ? 'var(--sf-secondary)' : 'var(--sf-primary)', lineHeight: 1.1 }}>{k.value}</p>
              {k.sub && <p style={{ margin: '4px 0 0', fontSize: 11, color: i === 0 ? 'rgba(250,245,221,0.65)' : 'var(--fg-muted)' }}>{k.sub}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quill styles (ScanMyFrame branding) ─────────────────────────────────────
const QUILL_STYLES = `
  .sf-quill-wrapper {
    max-width: 100%;
  }
  .sf-quill-wrapper .ql-toolbar {
    border: 1px solid rgba(15,76,58,0.18) !important;
    border-bottom: 1px solid rgba(15,76,58,0.12) !important;
    border-radius: 10px 10px 0 0 !important;
    background: #f0efe9 !important;
    padding: 10px 8px !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 10 !important;
    box-shadow: 0 2px 8px rgba(15,76,58,0.06) !important;
    flex-wrap: wrap !important;
  }
  .sf-quill-wrapper .ql-container {
    border: 1px solid rgba(15,76,58,0.18) !important;
    border-top: none !important;
    border-radius: 0 0 10px 10px !important;
    font-family: 'Montserrat Alternates', system-ui, sans-serif !important;
    max-width: 100% !important;
    overflow: hidden !important;
  }
  .sf-quill-wrapper .ql-editor {
    min-height: 420px !important;
    font-size: 14px !important;
    line-height: 1.7 !important;
    padding: 20px !important;
    color: #1a1a1a !important;
    overflow-x: hidden !important;
    word-break: break-word !important;
  }
  .sf-quill-wrapper .ql-editor.ql-blank::before {
    color: #9aaea9 !important;
    font-style: italic !important;
  }
  .sf-quill-wrapper .ql-editor h1 { font-family: 'Poltawski Nowy', Georgia, serif !important; font-size: 26px !important; color: #0F4C3A !important; margin: 1.4em 0 0.4em !important; }
  .sf-quill-wrapper .ql-editor h2 { font-family: 'Poltawski Nowy', Georgia, serif !important; font-size: 22px !important; color: #0F4C3A !important; margin: 1.3em 0 0.4em !important; }
  .sf-quill-wrapper .ql-editor h3 { font-family: 'Poltawski Nowy', Georgia, serif !important; font-size: 18px !important; color: #0F4C3A !important; margin: 1.2em 0 0.3em !important; }
  .sf-quill-wrapper .ql-editor p { margin: 0 0 1em 0 !important; }
  .sf-quill-wrapper .ql-editor a { color: #0F4C3A !important; text-decoration: underline !important; }
  .sf-quill-wrapper .ql-editor blockquote { border-left: 4px solid #D4AF37 !important; padding: 12px 16px !important; margin: 16px 0 !important; color: #4a7c6f !important; font-style: italic !important; background: rgba(212,175,55,0.06) !important; border-radius: 0 8px 8px 0 !important; }
  .sf-quill-wrapper .ql-editor img { max-width: 100% !important; margin: 12px 0 !important; display: block !important; }
  .sf-quill-wrapper .ql-editor ul, .sf-quill-wrapper .ql-editor ol { padding-left: 1.5em !important; margin: 0 0 1em 0 !important; }
  .sf-quill-wrapper .ql-toolbar button:hover .ql-stroke,
  .sf-quill-wrapper .ql-toolbar button.ql-active .ql-stroke { stroke: #0F4C3A !important; }
  .sf-quill-wrapper .ql-toolbar button:hover .ql-fill,
  .sf-quill-wrapper .ql-toolbar button.ql-active .ql-fill { fill: #0F4C3A !important; }
  .sf-quill-wrapper .ql-toolbar .ql-picker-label:hover,
  .sf-quill-wrapper .ql-toolbar .ql-picker-label.ql-active { color: #0F4C3A !important; }
  .sf-quill-wrapper .ql-editor::-webkit-scrollbar { width: 6px; }
  .sf-quill-wrapper .ql-editor::-webkit-scrollbar-track { background: #f0efe9; border-radius: 4px; }
  .sf-quill-wrapper .ql-editor::-webkit-scrollbar-thumb { background: #4a7c6f; border-radius: 4px; }
  .sf-quill-wrapper .ql-editor::-webkit-scrollbar-thumb:hover { background: #0F4C3A; }
`;

// ─── Post Modal ───────────────────────────────────────────────────────────────
function quillLinkHandler(value) {
  if (value) {
    const href = prompt('Enter URL:');
    if (href) {
      const url = /^https?:\/\//i.test(href.trim()) ? href.trim() : `https://${href.trim()}`;
      this.quill.format('link', url);
    }
  } else {
    this.quill.format('link', false);
  }
}

const QUILL_MODULES = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote'],
      [{ color: ['#0F4C3A', '#D4AF37', '#FAF5DD', '#4a7c6f', '#0a3329', '#000000', '#ffffff', '#ef4444'] }],
      ['link', 'image', 'video'],
      ['clean'],
    ],
    handlers: { link: quillLinkHandler },
  },
};

const QUILL_FORMATS = ['header','bold','italic','underline','strike','align','list','blockquote','color','link','image','video'];

function PostModal({ post, onClose, onSaved }) {
  const [form, setForm] = useState({
    ...EMPTY_POST,
    ...post,
    body: typeof post?.body === 'string' ? post.body : '',
  });
  const [saving, setSaving] = useState(false);
  const [coverUp, setCoverUp] = useState(false);
  const quillRef = useRef(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function onTitleChange(v) { set('title', v); if (!post?.id) set('slug', slugify(v)); }

  function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const { url, error } = await uploadBlogImage(file);
      if (error) { alert('Upload failed: ' + error); return; }
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'image', url);
      }
    };
  }

  QUILL_MODULES.toolbar.handlers.image = imageHandler;

  async function uploadCover(file) {
    if (!file) return;
    setCoverUp(true);
    const { url, error } = await uploadBlogImage(file);
    setCoverUp(false);
    if (url) set('cover_image', url); else alert('Upload failed: ' + error);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) return alert('Title and slug are required.');
    setSaving(true);
    try {
      const { tags: _t, keywords: _k, ...rest } = form;
      const payload = { ...rest, slug: slugify(form.slug) };
      const { error } = post?.id ? await adminUpdatePost(post.id, payload) : await adminCreatePost(payload);
      if (error) { alert('Error: ' + error); return; }
      onSaved();
    } catch (err) { alert('Unexpected error: ' + err.message); }
    finally { setSaving(false); }
  }

  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-sub)', marginBottom: 8 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(10,46,34,0.55)', backdropFilter: 'blur(4px)', overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 12px' }}>
      <div className="sf-admin-modal-inner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Content</p>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--sf-primary)' }}>{post?.id ? 'Edit post' : 'New post'}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--fg-muted)', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div><label style={lbl}>Title *</label><input className="sf-input" placeholder="Post title" value={form.title} onChange={e => onTitleChange(e.target.value)} required /></div>
          <div><label style={lbl}>Slug *</label><input className="sf-input" placeholder="post-url-slug" value={form.slug} onChange={e => set('slug', slugify(e.target.value))} required /></div>
          <div><label style={lbl}>Excerpt</label><textarea rows={2} className="sf-input sf-textarea" placeholder="Short description…" value={form.excerpt} onChange={e => set('excerpt', e.target.value)} /></div>

          <div>
            <label style={lbl}>Cover image</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="sf-input" style={{ flex: 1 }} placeholder="https://…" value={form.cover_image} onChange={e => set('cover_image', e.target.value)} />
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--sf-primary)', whiteSpace: 'nowrap', opacity: coverUp ? 0.5 : 1 }}>
                {coverUp ? 'Uploading…' : '↑ Upload'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadCover(e.target.files[0])} />
              </label>
            </div>
            {form.cover_image && <img src={form.cover_image} alt="" style={{ marginTop: 8, maxHeight: 120, objectFit: 'cover', borderRadius: 10 }} />}
          </div>

          <div className="sf-admin-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={lbl}>Author</label><input className="sf-input" value={form.author} onChange={e => set('author', e.target.value)} /></div>
            <div>
              <label style={lbl}>Status</label>
              <select className="sf-input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label style={lbl}>Content</label>
            <style>{QUILL_STYLES}</style>
            <div className="sf-quill-wrapper">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={form.body}
                onChange={v => set('body', v)}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="Write your post content here…"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--fg-sub)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} className="sf-btn-primary">{saving ? 'Saving…' : post?.id ? 'Save changes' : 'Create post'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── SEO Modal ────────────────────────────────────────────────────────────────
function SEOModal({ post, onClose, onSaved }) {
  const [tags, setTags]       = useState((post.tags || []).join(', '));
  const [keywords, setKeywords] = useState((post.keywords || []).join(', '));
  const [saving, setSaving]   = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        tags:     tags.split(',').map(t => t.trim()).filter(Boolean),
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      };
      const { error } = await adminUpdatePost(post.id, payload);
      if (error) { alert('Error: ' + error); return; }
      onSaved();
    } catch (err) { alert('Unexpected error: ' + err.message); }
    finally { setSaving(false); }
  }

  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-sub)', marginBottom: 8 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(10,46,34,0.55)', backdropFilter: 'blur(4px)', overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 12px' }}>
      <div className="sf-admin-modal-inner" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>SEO Settings</p>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--sf-primary)', maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'wrap' }}>{post.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--fg-muted)', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={lbl}>Tags (comma-separated)</label>
            <input className="sf-input" placeholder="guide, tips, update" value={tags} onChange={e => setTags(e.target.value)} />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>Shown as clickable filters on the blog. Also used as <code>article:tag</code> meta.</p>
          </div>

          <div>
            <label style={lbl}>Search keywords (comma-separated)</label>
            <input className="sf-input" placeholder="QR frame, photo display, wall art" value={keywords} onChange={e => setKeywords(e.target.value)} />
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>Hidden from readers. Added to JSON-LD schema and meta keywords for Bing.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--fg-sub)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} className="sf-btn-primary">{saving ? 'Saving…' : 'Save SEO'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');

  function submit(e) {
    e.preventDefault();
    if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) { sessionStorage.setItem('sf_admin', '1'); onLogin(); }
    else setErr('Invalid credentials.');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--sf-primary)' }}>
      {/* Left brand panel */}
      <div className="sf-admin-brand sf-admin-login-brand" style={{ flex: 1, padding: '56px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
        <img src={scanMyFrameLogo} alt="ScanMyFrame" style={{ width: 60, filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
        <div>
          <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: 999, color: 'var(--sf-gold)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 24 }}>Internal tool</span>
          <h1 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 44, color: 'var(--sf-secondary)', fontWeight: 700, lineHeight: 1.08, maxWidth: 440 }}>
            Manage every story behind every frame.
          </h1>
          <p style={{ margin: 0, color: 'rgba(250,245,221,0.65)', fontSize: 15, lineHeight: 1.6, maxWidth: 400 }}>
            Posts, vendors, newsletter and notifications - all in one place.
          </p>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'rgba(250,245,221,0.4)', fontFamily: 'var(--font-mono)' }}>v1.0 · scanmyframe.com</p>
      </div>

      {/* Right form panel */}
      <div className="sf-admin-login-form">
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Sign in</p>
        <h2 style={{ margin: '0 0 32px', fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--sf-primary)', fontWeight: 700 }}>Welcome back, admin.</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-sub)', marginBottom: 8 }}>Username</label>
            <input className="sf-input" value={u} onChange={e => setU(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-sub)', marginBottom: 8 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input className="sf-input" style={{ paddingRight: 64 }} type={show ? 'text' : 'password'} value={p} onChange={e => setP(e.target.value)} />
              <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: 'var(--fg-muted)', letterSpacing: '0.08em' }}>
                {show ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>
          {err && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#ef4444' }}>{err}</div>}
          <button type="submit" className="sf-btn-primary" style={{ marginTop: 8, padding: '14px 20px', fontSize: 14 }}>Sign in to admin</button>
        </form>
      </div>
    </div>
  );
}

// ─── Tab: Blog Posts ──────────────────────────────────────────────────────────
function PostsTab() {
  const [posts, setPosts]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [modal, setModal]     = useState(null);
  const [seoModal, setSeoModal] = useState(null);
  const [deleting, setDel]    = useState(null);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch] = useState('');

  async function load() {
    setLoad(true);
    const { posts: data } = await adminGetAllPosts();
    setPosts(data); setLoad(false);
  }

  useEffect(() => { load(); }, []);

  async function doDelete(id) {
    if (!confirm('Delete this post permanently?')) return;
    setDel(id); await adminDeletePost(id); setDel(null); load();
  }

  async function togglePin(post) {
    await adminUpdatePost(post.id, { is_pinned: !post.is_pinned }); load();
  }

  const total     = posts.length;
  const published = posts.filter(p => p.status === 'published').length;
  const drafts    = total - published;
  const pinned    = posts.filter(p => p.is_pinned).length;

  const filtered = posts.filter(p => {
    const matchFilter = filter === 'all' || (filter === 'published' && p.status === 'published') || (filter === 'drafts' && p.status !== 'published') || (filter === 'pinned' && p.is_pinned);
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.slug?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <>
      <AdminHeader
        title="Blog posts"
        eyebrow="Content"
        kpis={[
          { label: 'Total',     value: total,     sub: 'all time' },
          { label: 'Published', value: published, sub: 'live on site' },
          { label: 'Drafts',    value: drafts,    sub: 'unpublished' },
          { label: 'Pinned',    value: pinned,    sub: 'on homepage' },
        ]}
        action={
          <button onClick={() => setModal({ ...EMPTY_POST })} className="sf-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New post
          </button>
        }
      />

      <div className="sf-admin-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 28, height: 28, border: '2.5px solid var(--sf-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            {/* Filter + Search bar */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-subtle)', borderRadius: 99 }}>
                {[['all','All'],['published','Published'],['drafts','Drafts'],['pinned','Pinned']].map(([id, label]) => (
                  <button key={id} onClick={() => setFilter(id)} style={{ padding: '5px 14px', borderRadius: 99, border: 'none', background: filter === id ? 'var(--surface)' : 'transparent', color: filter === id ? 'var(--sf-primary)' : 'var(--fg-muted)', fontWeight: 600, fontSize: 11, cursor: 'pointer', boxShadow: filter === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>{label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', minWidth: 220 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--fg-muted)', flexShrink: 0 }}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts…" style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, flex: 1, color: 'var(--fg-body)' }} />
              </div>
            </div>

            {filtered.length === 0 ? (
              <p style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>No posts found.</p>
            ) : (
              <>
                {/* Desktop table */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }} className="sf-admin-table">
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)' }}>
                      {['Title', 'Status', 'Tags', 'Published', ''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} style={{ borderTop: '1px solid var(--border)', background: p.is_pinned ? 'rgba(212,175,55,0.04)' : 'var(--surface)', borderLeft: p.is_pinned ? '3px solid var(--sf-gold)' : '3px solid transparent' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {p.is_pinned && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--sf-gold)" stroke="none" style={{ flexShrink: 0 }}>
                                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6L12 2z"/>
                              </svg>
                            )}
                            <div>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--sf-primary)', fontFamily: 'var(--font-display)' }}>{p.title}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>/blog/{p.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.06em', background: p.status === 'published' ? 'rgba(34,197,94,0.12)' : 'rgba(202,138,4,0.12)', color: p.status === 'published' ? '#16a34a' : '#ca8a04', border: `1px solid ${p.status === 'published' ? 'rgba(34,197,94,0.25)' : 'rgba(202,138,4,0.25)'}` }}>{p.status}</span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(p.tags || []).slice(0, 3).map(t => (
                              <span key={t} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: 'var(--bg-subtle)', color: 'var(--fg-sub)' }}>{t}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--fg-sub)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{fmtDateShort(p.published_at) || '—'}</td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button onClick={() => togglePin(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.is_pinned ? 'var(--sf-gold)' : 'var(--fg-muted)', fontWeight: 600, fontSize: 12, marginRight: 12 }}>{p.is_pinned ? 'Unpin' : 'Pin'}</button>
                          <button onClick={() => setModal(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sf-primary)', fontWeight: 600, fontSize: 12, marginRight: 12 }}>Edit</button>
                          <button onClick={() => setSeoModal(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-sub)', fontWeight: 600, fontSize: 12, marginRight: 12 }}>SEO</button>
                          <button onClick={() => doDelete(p.id)} disabled={deleting === p.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 600, fontSize: 12, opacity: deleting === p.id ? 0.4 : 1 }}>{deleting === p.id ? '…' : 'Delete'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile cards */}
                <div className="sf-admin-cards">
                  {filtered.map((p, i) => (
                    <div key={p.id} style={{ padding: '16px 20px', borderTop: i > 0 ? '1px solid var(--border)' : 'none', borderLeft: p.is_pinned ? '3px solid var(--sf-gold)' : '3px solid transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 13, color: 'var(--sf-primary)', fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                          <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-muted)' }}>/blog/{p.slug}</p>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, textTransform: 'uppercase', background: p.status === 'published' ? 'rgba(34,197,94,0.12)' : 'rgba(202,138,4,0.12)', color: p.status === 'published' ? '#16a34a' : '#ca8a04', flexShrink: 0, marginLeft: 8 }}>{p.status}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{fmtDateShort(p.published_at) || '—'}</span>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button onClick={() => togglePin(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.is_pinned ? 'var(--sf-gold)' : 'var(--fg-muted)', fontWeight: 600, fontSize: 12 }}>{p.is_pinned ? 'Unpin' : 'Pin'}</button>
                          <button onClick={() => setModal(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sf-primary)', fontWeight: 600, fontSize: 12 }}>Edit</button>
                          <button onClick={() => setSeoModal(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-sub)', fontWeight: 600, fontSize: 12 }}>SEO</button>
                          <button onClick={() => doDelete(p.id)} disabled={deleting === p.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 600, fontSize: 12 }}>{deleting === p.id ? '…' : 'Delete'}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {modal !== null && <PostModal post={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {seoModal !== null && <SEOModal post={seoModal} onClose={() => setSeoModal(null)} onSaved={() => { setSeoModal(null); load(); }} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ─── Tab: Users ───────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoad]      = useState(true);
  const [query, setQuery]       = useState('');
  const [deleting, setDeleting]       = useState(null);
  const [suspending, setSuspending]   = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);

  useEffect(() => {
    adminGetAllUsers().then(({ users: data }) => { setUsers(data); setLoad(false); });
  }, []);

  async function doDelete(user) {
    setDeleting(user.id);
    setConfirmUser(null);
    const { error } = await adminDeleteUser(user.id);
    if (error) { alert('Delete failed: ' + error); }
    else { setUsers(prev => prev.filter(u => u.id !== user.id)); }
    setDeleting(null);
  }

  async function toggleSuspend(user) {
    setSuspending(user.id);
    const isSuspended = user.is_suspended;
    const { error } = isSuspended ? await adminUnsuspendUser(user.id) : await adminSuspendUser(user.id);
    if (error) { alert(`Failed: ${error}`); }
    else { setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_suspended: !isSuspended } : u)); }
    setSuspending(null);
  }

  const q = query.trim().toLowerCase();
  const filtered = q ? users.filter(u => u.full_name?.toLowerCase().includes(q) || u.business_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) : users;

  const total   = users.length;
  const active  = users.filter(u => (Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions)?.status === 'active').length;
  const byPlan  = users.reduce((acc, u) => { const s = (Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions) || {}; if (s.plan_id) acc[s.plan_id] = (acc[s.plan_id] || 0) + 1; return acc; }, {});

  const planColor = { basic: '#6366f1', pro: '#D4AF37', business: '#0F4C3A', trial: '#9aaea9', free: '#9aaea9' };

  return (
    <>
      <AdminHeader
        title="Vendors & users"
        eyebrow="Accounts"
        kpis={[
          { label: 'Total',    value: total,              sub: 'all signups' },
          { label: 'Active',   value: active,             sub: 'paying now' },
          { label: 'Pro',      value: byPlan.pro || 0,    sub: 'most popular' },
          { label: 'Business', value: byPlan.business || 0, sub: 'top tier' },
        ]}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 240 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--fg-muted)', flexShrink: 0 }}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or email…" style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, flex: 1 }} />
          </div>
        }
      />

      <div className="sf-admin-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 28, height: 28, border: '2.5px solid var(--sf-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>No users found.</p>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            {/* Desktop */}
            <div className="sf-admin-table">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)' }}>
                    {['Vendor', 'Plan', 'QR usage', 'Status', 'Renews', 'Joined', 'User ID', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => {
                    const sub = (Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions) || {};
                    const name = u.business_name || u.full_name || '—';
                    const pct = sub.qr_allocated > 0 && sub.qr_allocated !== -1 ? (sub.qr_used / sub.qr_allocated) * 100 : 0;
                    const near = sub.qr_allocated !== -1 && pct >= 80;
                    const pColor = planColor[sub.plan_id] || '#9aaea9';
                    return (
                      <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sf-primary)', color: 'var(--sf-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{initials(name)}</div>
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--sf-primary)' }}>{name}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {sub.plan_id ? <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.06em', color: pColor, border: `1px solid ${pColor}`, background: `${pColor}12` }}>{sub.plan_id}</span> : <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>—</span>}
                          {sub.billing_cycle && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'capitalize' }}>{sub.billing_cycle}</p>}
                        </td>
                        <td style={{ padding: '14px 20px', minWidth: 140 }}>
                          {sub.qr_used != null ? (
                            <>
                              <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--fg-body)', fontFamily: 'var(--font-mono)' }}>{sub.qr_used} / {sub.qr_allocated === -1 ? '∞' : sub.qr_allocated}</p>
                              {sub.qr_allocated !== -1 && (
                                <div style={{ height: 4, background: 'var(--bg-subtle)', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: near ? 'var(--sf-gold)' : 'var(--sf-primary)' }} />
                                </div>
                              )}
                            </>
                          ) : <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {sub.status ? <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', background: sub.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: sub.status === 'active' ? '#16a34a' : 'var(--danger)', border: `1px solid ${sub.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` }}>{sub.status === 'past_due' ? 'past due' : sub.status}</span> : <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--fg-sub)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{fmtDateShort(sub.current_period_end)}</td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--fg-sub)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{fmtDateShort(u.created_at)}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <CopyIdButton id={u.id} />
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => toggleSuspend(u)}
                            disabled={suspending === u.id}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: u.is_suspended ? '#16a34a' : '#ca8a04', fontWeight: 600, fontSize: 12, marginRight: 12, opacity: suspending === u.id ? 0.4 : 1 }}
                          >{suspending === u.id ? '…' : u.is_suspended ? 'Unsuspend' : 'Suspend'}</button>
                          <button
                            onClick={() => setConfirmUser(u)}
                            disabled={deleting === u.id}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 600, fontSize: 12, opacity: deleting === u.id ? 0.4 : 1 }}
                          >{deleting === u.id ? '…' : 'Delete'}</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sf-admin-cards">
              {filtered.map((u, i) => {
                const sub = (Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions) || {};
                const name = u.business_name || u.full_name || '—';
                const pct = sub.qr_allocated > 0 && sub.qr_allocated !== -1 ? (sub.qr_used / sub.qr_allocated) * 100 : 0;
                const pColor = planColor[sub.plan_id] || '#9aaea9';
                return (
                  <div key={u.id} style={{ padding: '16px 20px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sf-primary)', color: 'var(--sf-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{initials(name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--sf-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                      </div>
                      {sub.status && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, textTransform: 'uppercase', background: sub.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: sub.status === 'active' ? '#16a34a' : 'var(--danger)', flexShrink: 0 }}>{sub.status === 'past_due' ? 'past due' : sub.status}</span>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11, marginBottom: 10 }}>
                      <div><span style={{ color: 'var(--fg-muted)' }}>Plan: </span><span style={{ fontWeight: 700, color: pColor }}>{sub.plan_id || '—'}</span>{sub.billing_cycle && <span style={{ color: 'var(--fg-muted)' }}> · {sub.billing_cycle}</span>}</div>
                      <div><span style={{ color: 'var(--fg-muted)' }}>QR: </span><span style={{ fontFamily: 'var(--font-mono)' }}>{sub.qr_used != null ? `${sub.qr_used} / ${sub.qr_allocated === -1 ? '∞' : sub.qr_allocated}` : '—'}</span></div>
                      <div><span style={{ color: 'var(--fg-muted)' }}>Renews: </span><span style={{ fontFamily: 'var(--font-mono)' }}>{fmtDateShort(sub.current_period_end)}</span></div>
                      <div><span style={{ color: 'var(--fg-muted)' }}>Joined: </span><span style={{ fontFamily: 'var(--font-mono)' }}>{fmtDateShort(u.created_at)}</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => toggleSuspend(u)}
                        disabled={suspending === u.id}
                        style={{ background: 'none', border: `1px solid ${u.is_suspended ? '#16a34a' : '#ca8a04'}`, borderRadius: 8, cursor: 'pointer', color: u.is_suspended ? '#16a34a' : '#ca8a04', fontWeight: 600, fontSize: 12, padding: '5px 12px', opacity: suspending === u.id ? 0.4 : 1 }}
                      >{suspending === u.id ? '…' : u.is_suspended ? 'Unsuspend' : 'Suspend'}</button>
                      <button
                        onClick={() => setConfirmUser(u)}
                        disabled={deleting === u.id}
                        style={{ background: 'none', border: '1px solid var(--danger)', borderRadius: 8, cursor: 'pointer', color: 'var(--danger)', fontWeight: 600, fontSize: 12, padding: '5px 12px', opacity: deleting === u.id ? 0.4 : 1 }}
                      >{deleting === u.id ? 'Deleting…' : 'Delete'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirm delete modal */}
      {confirmUser && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(10,46,34,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
          <div style={{ background: 'var(--bg)', borderRadius: 16, padding: '28px 28px', width: '100%', maxWidth: 400, border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--danger)' }}>Permanent action</p>
            <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--fg-body)' }}>Delete this user?</h2>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--fg-sub)' }}>
              <strong style={{ color: 'var(--fg-body)' }}>{confirmUser.business_name || confirmUser.full_name || confirmUser.email}</strong>
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
              This permanently deletes their account and all associated data. Their frames will remain public but unmanaged. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmUser(null)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--fg-sub)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => doDelete(confirmUser)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--danger)', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Tab: Newsletter ──────────────────────────────────────────────────────────
function NewsletterTab() {
  const [subs, setSubs]    = useState([]);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    adminGetNewsletter().then(({ subscribers: data }) => { setSubs(data); setLoad(false); });
  }, []);

  function download() { downloadCSV(subs.map(s => ({ email: s.email, subscribed_at: s.created_at })), 'newsletter.csv'); }

  return (
    <>
      <AdminHeader
        title="Newsletter"
        eyebrow="Audience"
        kpis={[
          { label: 'Total subscribers', value: subs.length, sub: 'all-time' },
          { label: 'This month', value: subs.filter(s => new Date(s.created_at) > new Date(Date.now() - 30*24*60*60*1000)).length, sub: 'new' },
          { label: 'This week', value: subs.filter(s => new Date(s.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length, sub: 'new' },
        ]}
        action={
          <button onClick={download} disabled={subs.length === 0} className="sf-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Download CSV
          </button>
        }
      />

      <div className="sf-admin-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 28, height: 28, border: '2.5px solid var(--sf-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : subs.length === 0 ? (
          <p style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>No subscribers yet.</p>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--sf-primary)' }}>All subscribers</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)', width: 60 }}>#</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s, i) => (
                  <tr key={s.id || i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 20px', color: 'var(--fg-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{String(i + 1).padStart(3, '0')}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--fg-body)', fontSize: 13 }}>{s.email}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--fg-sub)', fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{fmtDateShort(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Tab: Push Notifications ──────────────────────────────────────────────────
const AUDIENCE_OPTIONS = [
  { value: 'all',         label: 'All users' },
  { value: 'subscribers', label: 'All active subscribers' },
  { value: 'free',        label: 'Free plan' },
  { value: 'trial',       label: 'Trial plan' },
  { value: 'basic',       label: 'Basic plan' },
  { value: 'pro',         label: 'Pro plan' },
  { value: 'business',    label: 'Business plan' },
  { value: 'user',        label: 'Specific user' },
];

const TYPE_OPTIONS = [
  { value: 'info',    label: 'Info',    color: '#3b82f6' },
  { value: 'success', label: 'Success', color: '#16a34a' },
  { value: 'alert',   label: 'Alert',   color: '#ca8a04' },
  { value: 'error',   label: 'Error',   color: '#ef4444' },
  { value: 'update',  label: 'Update',  color: '#a855f7' },
];

function NotificationsTab() {
  const [audience, setAudience] = useState('all');
  const [userId,   setUserId]   = useState('');
  const [type,     setType]     = useState('info');
  const [message,  setMessage]  = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState(null);

  const selectedType = TYPE_OPTIONS.find(t => t.value === type);
  const selectedAud  = AUDIENCE_OPTIONS.find(a => a.value === audience);

  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-sub)', marginBottom: 8 };
  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: 'inherit', color: 'var(--fg-body)', outline: 'none', boxSizing: 'border-box' };

  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim()) return;
    if (!confirm(`Send "${type}" notification to "${selectedAud.label}"?\n\nThis cannot be undone.`)) return;
    setSending(true); setResult(null);
    const { count, error } = await adminPushNotification({ audience, user_id: audience === 'user' ? userId.trim() : undefined, type, message: message.trim(), full_description: fullDesc.trim() || null });
    setSending(false); setResult({ count, error });
    if (!error) { setMessage(''); setFullDesc(''); setUserId(''); }
  }

  return (
    <>
      <AdminHeader title="Push notification" eyebrow="Broadcast" kpis={[
        { label: 'Audiences', value: AUDIENCE_OPTIONS.length, sub: 'targeting options' },
        { label: 'Types', value: TYPE_OPTIONS.length, sub: 'info · alert · update…' },
      ]} />

      <div className="sf-admin-content sf-admin-compose-grid">
        {/* Compose */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column' }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Compose</p>
          <h3 style={{ margin: '0 0 24px', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--sf-primary)' }}>New broadcast</h3>

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
            <div>
              <label style={lbl}>Audience</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {AUDIENCE_OPTIONS.map(a => (
                  <button key={a.value} type="button" onClick={() => setAudience(a.value)} style={{ padding: '10px 14px', borderRadius: 10, cursor: 'pointer', background: audience === a.value ? 'rgba(15,76,58,0.06)' : 'var(--bg-subtle)', border: audience === a.value ? '1.5px solid var(--sf-primary)' : '1px solid var(--border)', textAlign: 'left', fontFamily: 'inherit' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: audience === a.value ? 'var(--sf-primary)' : 'var(--fg-body)' }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {audience === 'user' && (
              <div>
                <label style={lbl}>User ID</label>
                <input style={inp} value={userId} onChange={e => setUserId(e.target.value)} placeholder="Paste user UUID here…" />
                <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>Find it in the user's dashboard under Settings → Account ID.</p>
              </div>
            )}

            <div>
              <label style={lbl}>Type</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TYPE_OPTIONS.map(t => (
                  <button key={t.value} type="button" onClick={() => setType(t.value)} style={{ padding: '6px 14px', borderRadius: 99, background: type === t.value ? `${t.color}18` : 'var(--bg-subtle)', border: type === t.value ? `1px solid ${t.color}66` : '1px solid var(--border)', color: type === t.value ? t.color : 'var(--fg-sub)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>{t.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>Message <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0, color: 'var(--fg-muted)' }}>· {message.length}/160</span></label>
              <input style={inp} required maxLength={160} value={message} onChange={e => setMessage(e.target.value)} placeholder="e.g. We've updated our Terms of Service." />
            </div>

            <div>
              <label style={lbl}>Full description <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0, color: 'var(--fg-muted)' }}>· optional</span></label>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 80 }} rows={3} value={fullDesc} onChange={e => setFullDesc(e.target.value)} placeholder="Detailed explanation shown when the user expands the notification…" />
            </div>

            {result && (
              <div style={{ borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600, background: result.error ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: result.error ? '#ef4444' : '#16a34a', border: `1px solid ${result.error ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                {result.error ? `Error: ${result.error}` : `✓ Sent to ${result.count} user${result.count !== 1 ? 's' : ''} successfully.`}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-muted)' }}>Sending to <strong style={{ color: 'var(--sf-primary)' }}>{selectedAud.label}</strong></p>
              <button type="submit" disabled={sending || !message.trim() || (audience === 'user' && !userId.trim())} className="sf-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                {sending ? 'Sending…' : 'Send broadcast'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview */}
        {message && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Preview</p>
            <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--sf-primary)' }}>How vendors will see it</h3>
            <div style={{ background: 'var(--sf-primary-deep)', borderRadius: 14, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: `${selectedType.color}25`, border: `1px solid ${selectedType.color}55`, color: selectedType.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>!</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 99, color: selectedType.color, background: `${selectedType.color}1a`, border: `1px solid ${selectedType.color}33` }}>{type}</span>
                    <span style={{ fontSize: 10, color: 'rgba(250,245,221,0.5)', fontFamily: 'var(--font-mono)' }}>now</span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--sf-secondary)', lineHeight: 1.5 }}>{message}</p>
                  {fullDesc && <p style={{ margin: 0, fontSize: 12, color: 'rgba(250,245,221,0.6)', lineHeight: 1.55 }}>{fullDesc}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`.sf-admin-notif-grid { display:grid; grid-template-columns:1.3fr 1fr; gap:16px; } @media(max-width:700px){ .sf-admin-notif-grid { grid-template-columns:1fr; } }`}</style>
    </>
  );
}

// ─── Tab: Subscriptions ───────────────────────────────────────────────────────
const PLAN_COLOR  = { basic: '#6366f1', pro: '#D4AF37', business: '#0F4C3A', trial: '#3b82f6', free: '#9aaea9' };
const MONTHLY_KOBO        = { basic: 300000,  pro: 1500000,  business: 3000000 };
const YEARLY_MONTHLY_KOBO = { basic: 270000,  pro: 1275000,  business: 2400000 };

function SubscriptionsTab() {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoad]         = useState(true);
  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [creditModal,  setCreditModal]  = useState(null);
  const [creditAmt,    setCreditAmt]    = useState('');
  const [adjusting,    setAdjusting]    = useState(false);

  async function load() {
    setLoad(true);
    const { users: data } = await adminGetAllUsers();
    setUsers(data); setLoad(false);
  }
  useEffect(() => { load(); }, []);

  const now   = new Date();
  const in5   = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  const rows = users.map(u => ({
    u,
    sub: (Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions) || {},
  }));

  const active       = rows.filter(({ sub }) => sub.status === 'active' && sub.current_period_end && new Date(sub.current_period_end) > now);
  const mrr          = active.reduce((t, { sub }) => t + ((sub.billing_cycle === 'yearly' ? YEARLY_MONTHLY_KOBO[sub.plan_id] : MONTHLY_KOBO[sub.plan_id]) || 0), 0);
  const expiringSoon = active.filter(({ sub }) => new Date(sub.current_period_end) <= in5).length;

  const FILTERS = [['all','All'],['active','Active'],['expiring','Expiring soon'],['yearly','Yearly'],['monthly','Monthly'],['basic','Basic'],['pro','Pro'],['business','Business']];

  const filtered = rows.filter(({ u, sub }) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || [u.full_name, u.business_name, u.email].some(v => v?.toLowerCase().includes(q));
    const periodOk    = sub.current_period_end && new Date(sub.current_period_end) > now;
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'active'   ? sub.status === 'active' && periodOk :
      filter === 'expiring' ? sub.status === 'active' && periodOk && new Date(sub.current_period_end) <= in5 :
      filter === 'yearly'   ? sub.billing_cycle === 'yearly' :
      filter === 'monthly'  ? sub.billing_cycle === 'monthly' :
      sub.plan_id === filter;
    return matchSearch && matchFilter;
  });

  async function handleAdjust() {
    const amount = parseInt(creditAmt);
    if (!creditModal || isNaN(amount) || amount === 0) return;
    setAdjusting(true);
    const { error } = await adminAdjustQRCredits(creditModal.u.id, amount);
    setAdjusting(false);
    if (error) { alert('Failed: ' + error); return; }
    setCreditModal(null); setCreditAmt(''); load();
  }

  function fmtN(n) { return `₦${(n / 100).toLocaleString('en-NG')}`; }

  return (
    <>
      <AdminHeader
        title="Subscriptions"
        eyebrow="Revenue"
        kpis={[
          { label: 'Active',   value: active.length,              sub: 'paying now' },
          { label: 'MRR',      value: fmtN(mrr),                  sub: 'monthly recurring' },
          { label: 'ARR',      value: fmtN(mrr * 12),             sub: 'annual recurring' },
          { label: 'Expiring', value: expiringSoon,               sub: 'within 5 days' },
        ]}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 220 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--fg-muted)', flexShrink: 0 }}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subscribers…" style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, flex: 1, color: 'var(--fg-body)' }} />
          </div>
        }
      />

      <div className="sf-admin-content">
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-subtle)', borderRadius: 99, marginBottom: 16, flexWrap: 'wrap' }}>
          {FILTERS.map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{ padding: '5px 14px', borderRadius: 99, border: 'none', background: filter === id ? 'var(--surface)' : 'transparent', color: filter === id ? 'var(--sf-primary)' : 'var(--fg-muted)', fontWeight: 600, fontSize: 11, cursor: 'pointer', boxShadow: filter === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 28, height: 28, border: '2.5px solid var(--sf-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>

            {/* ── Desktop table ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }} className="sf-admin-table">
              <thead>
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  {['Vendor', 'Plan', 'QR usage', 'Status', 'Period end', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>No subscribers found.</td></tr>
                ) : filtered.map(({ u, sub }, i) => {
                  const name          = u.business_name || u.full_name || '—';
                  const pColor        = PLAN_COLOR[sub.plan_id] || '#9aaea9';
                  const pct           = sub.qr_allocated > 0 && sub.qr_allocated !== -1 ? (sub.qr_used / sub.qr_allocated) * 100 : 0;
                  const periodExpired = sub.current_period_end && new Date(sub.current_period_end) < now;
                  const nearExpiry    = !periodExpired && sub.current_period_end && new Date(sub.current_period_end) <= in5;
                  return (
                    <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: nearExpiry ? 'rgba(202,138,4,0.03)' : 'var(--surface)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--sf-primary)' }}>{name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--fg-muted)' }}>{u.email}</p>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {sub.plan_id
                          ? <><span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.06em', color: pColor, border: `1px solid ${pColor}`, background: `${pColor}18` }}>{sub.plan_id}</span>
                              {sub.billing_cycle && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--fg-muted)', textTransform: 'capitalize' }}>{sub.billing_cycle}</p>}</>
                          : <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 20px', minWidth: 130 }}>
                        {sub.qr_used != null ? (
                          <>
                            <p style={{ margin: '0 0 5px', fontSize: 12, color: 'var(--fg-body)', fontFamily: 'var(--font-mono)' }}>{sub.qr_used} / {sub.qr_allocated === -1 ? '∞' : sub.qr_allocated}</p>
                            {sub.qr_allocated !== -1 && (
                              <div style={{ height: 4, background: 'var(--bg-subtle)', borderRadius: 99, overflow: 'hidden', width: 100 }}>
                                <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: pct >= 80 ? 'var(--sf-gold)' : 'var(--sf-primary)', borderRadius: 99 }} />
                              </div>
                            )}
                          </>
                        ) : <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase',
                          background: periodExpired ? 'rgba(239,68,68,0.10)' : sub.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(202,138,4,0.12)',
                          color:      periodExpired ? 'var(--danger)'         : sub.status === 'active' ? '#16a34a'                : '#ca8a04',
                          border:     `1px solid ${periodExpired ? 'rgba(239,68,68,0.25)' : sub.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(202,138,4,0.25)'}` }}>
                          {periodExpired ? 'expired' : sub.status === 'past_due' ? 'past due' : sub.status || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', color: nearExpiry ? '#ca8a04' : 'var(--fg-sub)', fontWeight: nearExpiry ? 700 : 400 }}>
                        {sub.current_period_end ? new Date(sub.current_period_end).toISOString().split('T')[0] : '—'}
                        {nearExpiry && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: 'rgba(202,138,4,0.12)', color: '#ca8a04' }}>SOON</span>}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button onClick={() => { setCreditModal({ u, sub }); setCreditAmt(''); }}
                          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--sf-primary)', fontWeight: 600, fontSize: 11, padding: '5px 12px', fontFamily: 'inherit' }}>
                          + Credits
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* ── Mobile cards ── */}
            <div className="sf-admin-cards">
              {filtered.length === 0
                ? <p style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>No subscribers found.</p>
                : filtered.map(({ u, sub }, i) => {
                  const name = u.business_name || u.full_name || '—';
                  const pColor = PLAN_COLOR[sub.plan_id] || '#9aaea9';
                  const periodExpired = sub.current_period_end && new Date(sub.current_period_end) < now;
                  const nearExpiry    = !periodExpired && sub.current_period_end && new Date(sub.current_period_end) <= in5;
                  return (
                    <div key={u.id} style={{ padding: '16px 20px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 13, color: 'var(--sf-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                        </div>
                        {sub.plan_id && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, textTransform: 'uppercase', color: pColor, border: `1px solid ${pColor}`, background: `${pColor}18`, flexShrink: 0, marginLeft: 8 }}>{sub.plan_id}</span>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11, marginBottom: 10 }}>
                        <div><span style={{ color: 'var(--fg-muted)' }}>Cycle: </span><span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{sub.billing_cycle || '—'}</span></div>
                        <div><span style={{ color: 'var(--fg-muted)' }}>QR: </span><span style={{ fontFamily: 'var(--font-mono)' }}>{sub.qr_used != null ? `${sub.qr_used} / ${sub.qr_allocated === -1 ? '∞' : sub.qr_allocated}` : '—'}</span></div>
                        <div><span style={{ color: 'var(--fg-muted)' }}>Status: </span><span style={{ fontWeight: 700, color: periodExpired ? 'var(--danger)' : sub.status === 'active' ? '#16a34a' : '#ca8a04' }}>{periodExpired ? 'expired' : sub.status || '—'}</span></div>
                        <div><span style={{ color: 'var(--fg-muted)' }}>Ends: </span><span style={{ fontFamily: 'var(--font-mono)', color: nearExpiry ? '#ca8a04' : 'inherit', fontWeight: nearExpiry ? 700 : 400 }}>{sub.current_period_end ? new Date(sub.current_period_end).toISOString().split('T')[0] : '—'}</span></div>
                      </div>
                      <button onClick={() => { setCreditModal({ u, sub }); setCreditAmt(''); }}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--sf-primary)', fontWeight: 600, fontSize: 11, padding: '7px 14px', fontFamily: 'inherit', width: '100%' }}>
                        + Add / Remove Credits
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ── Credit adjustment modal ── */}
      {creditModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(10,46,34,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 12px' }}>
          <div style={{ width: '100%', maxWidth: 400, background: 'var(--bg)', borderRadius: 20, padding: '32px 28px', border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Adjust QR credits</p>
            <h2 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--sf-primary)' }}>
              {creditModal.u.business_name || creditModal.u.full_name}
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
              Allocation: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-body)' }}>{creditModal.sub.qr_allocated === -1 ? '∞ unlimited' : creditModal.sub.qr_allocated}</strong>
              &nbsp;·&nbsp; Used: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-body)' }}>{creditModal.sub.qr_used ?? 0}</strong>
              &nbsp;·&nbsp; Remaining: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--sf-primary)' }}>
                {creditModal.sub.qr_allocated === -1 ? '∞' : Math.max(0, (creditModal.sub.qr_allocated ?? 0) - (creditModal.sub.qr_used ?? 0))}
              </strong>
            </p>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-sub)', marginBottom: 8 }}>
              Amount — use − to remove credits
            </label>
            <input className="sf-input" type="number" placeholder="e.g. +20 or -5" value={creditAmt} onChange={e => setCreditAmt(e.target.value)} autoFocus />
            {creditAmt && !isNaN(parseInt(creditAmt)) && creditModal.sub.qr_allocated !== -1 && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                New allocation: <strong style={{ color: 'var(--sf-primary)', fontFamily: 'var(--font-mono)' }}>
                  {Math.max(0, (creditModal.sub.qr_allocated ?? 0) + parseInt(creditAmt))}
                </strong>
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => { setCreditModal(null); setCreditAmt(''); }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--fg-sub)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdjust} disabled={adjusting || !creditAmt || isNaN(parseInt(creditAmt)) || parseInt(creditAmt) === 0} className="sf-btn-primary" style={{ flex: 1 }}>
                {adjusting ? 'Saving…' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Tab: Featured Logos ─────────────────────────────────────────────────────
function FeaturedLogosTab() {
  const [logos, setLogos]     = useState([]);
  const [loading, setLoad]    = useState(true);
  const [name, setName]       = useState('');
  const [file, setFile]       = useState(null);
  const [uploading, setUpl]   = useState(false);
  const [deleting, setDel]    = useState(null);
  const fileRef               = useRef(null);

  async function load() {
    setLoad(true);
    const { logos: data } = await adminGetFeaturedLogos();
    setLogos(data); setLoad(false);
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file || !name.trim()) return;
    setUpl(true);
    const { error } = await adminUploadFeaturedLogo(file, name.trim());
    setUpl(false);
    if (error) { alert('Upload failed: ' + error); return; }
    setName(''); setFile(null);
    if (fileRef.current) fileRef.current.value = '';
    load();
  }

  async function handleDelete(logo) {
    if (!confirm(`Delete "${logo.name}"?`)) return;
    setDel(logo.id);
    await adminDeleteFeaturedLogo(logo.id, logo.logo_url);
    setDel(null); load();
  }

  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-sub)', marginBottom: 6 };

  return (
    <>
      <AdminHeader
        title="Featured logos"
        eyebrow="Homepage marquee"
        kpis={[{ label: 'Total', value: logos.length, sub: 'logos in marquee' }]}
      />

      <div className="sf-admin-content">
        {/* Upload form */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <p style={{ margin: '0 0 18px', fontSize: 13, fontWeight: 700, color: 'var(--sf-primary)', fontFamily: 'var(--font-display)' }}>Add a logo</p>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={lbl}>Vendor name</label>
              <input className="sf-input" placeholder="e.g. Punch Nigeria" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <label style={lbl}>File (PNG or SVG)</label>
              <input ref={fileRef} type="file" accept="image/png,image/svg+xml" className="sf-input" style={{ padding: '7px 14px' }}
                onChange={e => setFile(e.target.files[0])} required />
            </div>
            <button type="submit" disabled={uploading || !name.trim() || !file} className="sf-btn-primary" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              {uploading
                ? <><span style={{ width: 12, height: 12, border: '2px solid var(--sf-secondary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Uploading…</>
                : '↑ Upload'}
            </button>
          </form>
        </div>

        {/* Logo grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 28, height: 28, border: '2.5px solid var(--sf-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : logos.length === 0 ? (
          <p style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>No logos yet. Upload one above.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {logos.map(logo => (
              <div key={logo.id} style={{ background: 'var(--sf-primary)', borderRadius: 14, padding: '20px 16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative' }}>
                <img src={logo.logo_url} alt={logo.name} style={{ height: 40, width: 'auto', maxWidth: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--sf-secondary)', textAlign: 'center', lineHeight: 1.3 }}>{logo.name}</p>
                <button
                  onClick={() => handleDelete(logo)}
                  disabled={deleting === logo.id}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#fca5a5', fontSize: 10, padding: '3px 7px', fontWeight: 700, lineHeight: 1 }}>
                  {deleting === logo.id ? '…' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Admin ───────────────────────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed]               = useState(() => sessionStorage.getItem('sf_admin') === '1');
  const [tab, setTab]                     = useState('posts');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function signOut() { sessionStorage.removeItem('sf_admin'); setAuthed(false); }

  const tabs = [
    { id: 'posts',         label: 'Blog Posts',        icon: 'M4 4h16v4H4zM4 12h16v8H4z' },
    { id: 'users',         label: 'Users',             icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0' },
    { id: 'newsletter',    label: 'Newsletter',        icon: 'M3 7l9 6 9-6M3 7v10h18V7M3 7l9-4 9 4' },
    { id: 'notifications',  label: 'Push Notifications', icon: 'M18 16v-5a6 6 0 10-12 0v5l-2 3h16l-2-3zM10 22a2 2 0 004 0' },
    { id: 'subscriptions',  label: 'Subscriptions',      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'logos',          label: 'Featured Logos',     icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ];

  if (!authed) return (
    <div className="sf-admin">
      <style>{ADMIN_STYLES}</style>
      <LoginScreen onLogin={() => setAuthed(true)} />
    </div>
  );

  return (
    <div className="sf-admin" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-subtle)' }}>
      <style>{ADMIN_STYLES}</style>

      {/* Sidebar */}
      <aside className="sf-admin-aside" style={{ width: 240, background: 'var(--sf-primary-deep)', color: 'var(--sf-secondary)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '4px 12px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={scanMyFrameLogo} alt="ScanMyFrame" style={{ height: 20, filter: 'brightness(0) invert(1)', opacity: 0.85 }} />
        </div>
        <p style={{ margin: '0 12px 18px', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sf-gold)' }}>Admin console</p>

        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: tab === t.id ? 'rgba(212,175,55,0.12)' : 'transparent', color: tab === t.id ? 'var(--sf-gold)' : 'rgba(250,245,221,0.7)', border: tab === t.id ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: tab === t.id ? 600 : 500, fontFamily: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <button onClick={signOut} style={{ padding: '10px 12px', borderRadius: 10, background: 'transparent', color: 'rgba(250,245,221,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, fontWeight: 500, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          Sign out
        </button>
      </aside>

      {/* Content column: mobile nav stacked above main */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Mobile top nav — dropdown menu */}
        <div className="sf-admin-mobile-nav" style={{ background: 'var(--sf-primary-deep)', position: 'sticky', top: 0, zIndex: 10, flexDirection: 'column' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 10 }}>
            <img src={scanMyFrameLogo} alt="" style={{ height: 18, filter: 'brightness(0) invert(1)', opacity: 0.85, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--sf-gold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tabs.find(t => t.id === tab)?.label}
            </span>
            <button onClick={() => setMobileNavOpen(o => !o)} aria-label="Toggle menu"
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, cursor: 'pointer', padding: '6px 8px', color: 'rgba(250,245,221,0.8)', display: 'flex', alignItems: 'center', lineHeight: 1, flexShrink: 0 }}>
              {mobileNavOpen
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
              }
            </button>
          </div>
          {/* Dropdown */}
          {mobileNavOpen && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setMobileNavOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: tab === t.id ? 'rgba(212,175,55,0.15)' : 'transparent', color: tab === t.id ? 'var(--sf-gold)' : 'rgba(250,245,221,0.65)', border: tab === t.id ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'left', fontFamily: 'inherit' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon}/></svg>
                  {t.label}
                </button>
              ))}
              <button onClick={() => { signOut(); setMobileNavOpen(false); }}
                style={{ marginTop: 4, padding: '10px 12px', borderRadius: 10, background: 'transparent', color: 'rgba(250,245,221,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, fontWeight: 500, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Main content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
          {tab === 'posts'         && <PostsTab />}
          {tab === 'users'         && <UsersTab />}
          {tab === 'newsletter'    && <NewsletterTab />}
          {tab === 'notifications'  && <NotificationsTab />}
          {tab === 'subscriptions'  && <SubscriptionsTab />}
          {tab === 'logos'          && <FeaturedLogosTab />}
        </main>

      </div>
    </div>
  );
}
