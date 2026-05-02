import { useState, useEffect, useRef } from 'react';
import {
  adminGetAllPosts, adminCreatePost, adminUpdatePost, adminDeletePost,
  adminGetAllUsers, adminGetNewsletter, uploadBlogImage, adminPushNotification,
} from '../services/supabaseHelpers';

// ─── Admin credentials (change these to whatever you want) ───────────────────
const ADMIN_USERNAME = 'scanframe_admin';
const ADMIN_PASSWORD = 'Scanframe@2025';
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const csv  = [cols.join(','), ...rows.map(r => cols.map(c => `"${(r[c] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Empty post template ───────────────────────────────────────────────────────
const EMPTY_POST = { title: '', slug: '', excerpt: '', cover_image: '', tags: '', author: 'ScanMyFrame', status: 'draft', body: [] };

// ── Block editor ─────────────────────────────────────────────────────────────
function BlockEditor({ blocks, onChange }) {
  const [uploading, setUploading] = useState({});

  function addBlock(type) {
    const defaults = {
      paragraph: { type: 'paragraph', content: '' },
      h2:        { type: 'h2',        content: '' },
      h3:        { type: 'h3',        content: '' },
      quote:     { type: 'quote',     content: '' },
      list:      { type: 'list',      ordered: false, items: [''] },
      image:     { type: 'image',     url: '', caption: '' },
      divider:   { type: 'divider' },
    };
    onChange([...blocks, defaults[type]]);
  }

  function updateBlock(i, patch) {
    const next = blocks.map((b, idx) => idx === i ? { ...b, ...patch } : b);
    onChange(next);
  }

  function removeBlock(i) {
    onChange(blocks.filter((_, idx) => idx !== i));
  }

  function moveBlock(i, dir) {
    const next = [...blocks];
    const swap = i + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[i], next[swap]] = [next[swap], next[i]];
    onChange(next);
  }

  async function handleImageUpload(i, file) {
    if (!file) return;
    setUploading(u => ({ ...u, [i]: true }));
    const { url, error } = await uploadBlogImage(file);
    setUploading(u => ({ ...u, [i]: false }));
    if (url) updateBlock(i, { url });
    else alert('Upload failed: ' + error);
  }

  const inputCls  = 'w-full bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-[#444] resize-none';
  const labelCls  = 'text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-1.5 block';
  const actionBtn = 'text-[#666] hover:text-white transition-colors p-1';

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => (
        <div key={i} className="bg-[#111] border border-white/8 rounded-xl p-4 flex flex-col gap-3">
          {/* Block header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#555]">
              {block.type === 'h2' ? 'Heading 2' : block.type === 'h3' ? 'Heading 3' : block.type}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => moveBlock(i, -1)} className={actionBtn} title="Move up">↑</button>
              <button type="button" onClick={() => moveBlock(i, 1)}  className={actionBtn} title="Move down">↓</button>
              <button type="button" onClick={() => removeBlock(i)}
                className="text-red-400/60 hover:text-red-400 transition-colors p-1 ml-1" title="Delete">✕</button>
            </div>
          </div>

          {/* Block content fields */}
          {(block.type === 'paragraph') && (
            <textarea rows={4} className={inputCls} placeholder="Paragraph text…"
              value={block.content} onChange={e => updateBlock(i, { content: e.target.value })} />
          )}

          {(block.type === 'h2' || block.type === 'h3') && (
            <input className={inputCls} placeholder="Heading text…"
              value={block.content} onChange={e => updateBlock(i, { content: e.target.value })} />
          )}

          {block.type === 'quote' && (
            <textarea rows={3} className={inputCls} placeholder="Quote text…"
              value={block.content} onChange={e => updateBlock(i, { content: e.target.value })} />
          )}

          {block.type === 'list' && (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-[#aaa]">
                <input type="checkbox" checked={block.ordered} onChange={e => updateBlock(i, { ordered: e.target.checked })}
                  className="accent-[#D4AF37]" />
                Ordered list
              </label>
              {(block.items || []).map((item, j) => (
                <div key={j} className="flex gap-2">
                  <input className={`${inputCls} flex-1`} placeholder={`Item ${j + 1}`}
                    value={item}
                    onChange={e => {
                      const items = [...block.items];
                      items[j] = e.target.value;
                      updateBlock(i, { items });
                    }} />
                  <button type="button"
                    onClick={() => updateBlock(i, { items: block.items.filter((_, k) => k !== j) })}
                    className="text-red-400/50 hover:text-red-400 text-sm">✕</button>
                </div>
              ))}
              <button type="button"
                onClick={() => updateBlock(i, { items: [...(block.items || []), ''] })}
                className="text-[#D4AF37] text-xs hover:opacity-80 text-left mt-1">+ Add item</button>
            </div>
          )}

          {block.type === 'image' && (
            <div className="flex flex-col gap-2">
              <label className={labelCls}>Image URL</label>
              <input className={inputCls} placeholder="https://…"
                value={block.url} onChange={e => updateBlock(i, { url: e.target.value })} />
              <div className="flex items-center gap-3">
                <label className="cursor-pointer text-[11px] text-[#D4AF37] hover:opacity-80">
                  {uploading[i] ? 'Uploading…' : '↑ Upload image'}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => handleImageUpload(i, e.target.files[0])} />
                </label>
              </div>
              {block.url && <img src={block.url} alt="" className="max-h-32 object-contain rounded-lg mt-1" />}
              <input className={inputCls} placeholder="Caption (optional)"
                value={block.caption || ''} onChange={e => updateBlock(i, { caption: e.target.value })} />
            </div>
          )}

          {block.type === 'divider' && (
            <hr className="border-white/10" />
          )}
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex flex-wrap gap-2 mt-1">
        {['paragraph','h2','h3','quote','list','image','divider'].map(type => (
          <button key={type} type="button" onClick={() => addBlock(type)}
            className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#aaa] hover:text-white transition-colors border border-white/8">
            + {type === 'h2' ? 'Heading 2' : type === 'h3' ? 'Heading 3' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Post modal (create / edit) ────────────────────────────────────────────────
function PostModal({ post, onClose, onSaved }) {
  const [form, setForm]         = useState({ ...EMPTY_POST, ...post });
  const [saving, setSaving]     = useState(false);
  const [coverUp, setCoverUp]   = useState(false);
  const fileRef                 = useRef();

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function onTitleChange(v) {
    set('title', v);
    if (!post?.id) set('slug', slugify(v));
  }

  async function uploadCover(file) {
    if (!file) return;
    setCoverUp(true);
    const { url, error } = await uploadBlogImage(file);
    setCoverUp(false);
    if (url) set('cover_image', url);
    else alert('Upload failed: ' + error);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) return alert('Title and slug are required.');
    setSaving(true);

    try {
      const payload = {
        ...form,
        tags: Array.isArray(form.tags)
          ? form.tags
          : form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        slug: slugify(form.slug),
      };

      const { error } = post?.id
        ? await adminUpdatePost(post.id, payload)
        : await adminCreatePost(payload);

      if (error) { alert('Error: ' + error); return; }
      onSaved();
    } catch (err) {
      alert('Unexpected error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-[#444]';
  const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-1.5 block';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-3xl bg-[#0d0d0d] border border-white/10 rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">{post?.id ? 'Edit Post' : 'New Post'}</h2>
            <button onClick={onClose} className="text-[#666] hover:text-white transition-colors text-xl">✕</button>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            {/* Title */}
            <div>
              <label className={labelCls}>Title *</label>
              <input className={inputCls} placeholder="Post title" value={form.title}
                onChange={e => onTitleChange(e.target.value)} required />
            </div>

            {/* Slug */}
            <div>
              <label className={labelCls}>Slug *</label>
              <input className={inputCls} placeholder="post-url-slug" value={form.slug}
                onChange={e => set('slug', slugify(e.target.value))} required />
            </div>

            {/* Excerpt */}
            <div>
              <label className={labelCls}>Excerpt</label>
              <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Short description shown on listing page…"
                value={form.excerpt} onChange={e => set('excerpt', e.target.value)} />
            </div>

            {/* Cover image */}
            <div>
              <label className={labelCls}>Cover Image</label>
              <div className="flex gap-2">
                <input className={`${inputCls} flex-1`} placeholder="https://… or upload below"
                  value={form.cover_image} onChange={e => set('cover_image', e.target.value)} />
                <label className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10 text-sm text-[#D4AF37] hover:bg-white/5 transition-colors whitespace-nowrap ${coverUp ? 'opacity-50 pointer-events-none' : ''}`}>
                  {coverUp ? 'Uploading…' : '↑ Upload'}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => uploadCover(e.target.files[0])} />
                </label>
              </div>
              {form.cover_image && (
                <img src={form.cover_image} alt="" className="mt-2 max-h-32 object-cover rounded-xl" />
              )}
            </div>

            {/* Author + Status in a row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Author</label>
                <input className={inputCls} value={form.author}
                  onChange={e => set('author', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className={labelCls}>Tags (comma-separated)</label>
              <input className={inputCls} placeholder="tips, guide, update"
                value={form.tags} onChange={e => set('tags', e.target.value)} />
            </div>

            {/* Body */}
            <div>
              <label className={labelCls}>Content Blocks</label>
              <BlockEditor blocks={form.body} onChange={v => set('body', v)} />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/8 mt-2">
              <button type="button" onClick={onClose}
                className="px-5 py-2 rounded-lg border border-white/10 text-sm text-[#aaa] hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-6 py-2 rounded-lg bg-[#0F4C3A] text-[#FAF5DD] text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? 'Saving…' : post?.id ? 'Save changes' : 'Create post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Login screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [show, setShow] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
      sessionStorage.setItem('sf_admin', '1');
      onLogin();
    } else {
      setErr('Invalid credentials.');
    }
  }

  const inp = 'w-full bg-[#111] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-[#444]';

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest text-center mb-6">Admin Access</p>
        <h1 className="text-2xl font-bold text-white text-center mb-8">ScanMyFrame Admin</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input className={inp} placeholder="Username" value={u} onChange={e => setU(e.target.value)} autoFocus />
          <div className="relative">
            <input className={`${inp} pr-10`} type={show ? 'text' : 'password'}
              placeholder="Password" value={p} onChange={e => setP(e.target.value)} />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#aaa] text-xs">
              {show ? 'hide' : 'show'}
            </button>
          </div>
          {err && <p className="text-red-400 text-xs text-center">{err}</p>}
          <button type="submit"
            className="bg-[#0F4C3A] text-[#FAF5DD] py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity mt-2">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Tab: Blog Posts ───────────────────────────────────────────────────────────
function PostsTab() {
  const [posts, setPosts]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [modal, setModal]   = useState(null); // null | EMPTY_POST | existing post
  const [deleting, setDel]  = useState(null);

  async function load() {
    setLoad(true);
    const { posts: data } = await adminGetAllPosts();
    setPosts(data);
    setLoad(false);
  }

  useEffect(() => { load(); }, []);

  async function doDelete(id) {
    if (!confirm('Delete this post permanently?')) return;
    setDel(id);
    await adminDeletePost(id);
    setDel(null);
    load();
  }

  async function togglePin(post) {
    await adminUpdatePost(post.id, { is_pinned: !post.is_pinned });
    load();
  }

  const th = 'text-left text-[10px] font-bold uppercase tracking-widest text-[#555] pb-3 px-3';
  const td = 'px-3 py-3 text-sm text-[#ccc] align-middle';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-bold text-lg">Blog Posts</h2>
        <button onClick={() => setModal({ ...EMPTY_POST })}
          className="bg-[#0F4C3A] text-[#FAF5DD] px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
          + New post
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#0F4C3A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-[#555] text-sm text-center py-16">No posts yet. Create your first one.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/8">
            <table className="w-full min-w-[600px]">
              <thead className="border-b border-white/8">
                <tr>
                  <th className={th}>Title</th>
                  <th className={th}>Status</th>
                  <th className={th}>Tags</th>
                  <th className={th}>Published</th>
                  <th className={th}></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p, i) => (
                  <tr key={p.id} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        {p.is_pinned && (
                          <span title="Pinned to homepage" className="text-[#D4AF37] text-xs">📌</span>
                        )}
                        <div>
                          <div className="font-semibold text-white line-clamp-1">{p.title}</div>
                          <div className="text-[11px] text-[#555] mt-0.5">/blog/{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className={td}>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full
                        ${p.status === 'published' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1">
                        {(p.tags || []).slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] bg-white/5 text-[#888] px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{fmtDate(p.published_at)}</td>
                    <td className={td}>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => togglePin(p)}
                          title={p.is_pinned ? 'Remove from homepage' : 'Pin to homepage'}
                          className={`text-xs font-medium transition-opacity hover:opacity-70 ${p.is_pinned ? 'text-[#D4AF37]' : 'text-[#555]'}`}>
                          {p.is_pinned ? '📌 Pinned' : '📌 Pin'}
                        </button>
                        <button onClick={() => setModal(p)}
                          className="text-[#D4AF37] text-xs hover:opacity-70 transition-opacity font-medium">Edit</button>
                        <button onClick={() => doDelete(p.id)} disabled={deleting === p.id}
                          className="text-red-400 text-xs hover:opacity-70 transition-opacity font-medium disabled:opacity-40">
                          {deleting === p.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col divide-y divide-white/5 rounded-xl border border-white/8 overflow-hidden">
            {posts.map((p, i) => (
              <div key={p.id} className={`p-4 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {p.is_pinned && <span className="text-[#D4AF37] text-xs">📌</span>}
                      <div className="font-semibold text-white text-sm truncate">{p.title}</div>
                    </div>
                    <div className="text-[11px] text-[#555]">/blog/{p.slug}</div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0
                    ${p.status === 'published' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                    {p.status}
                  </span>
                </div>
                {(p.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(p.tags || []).slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] bg-white/5 text-[#888] px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-[#555]">{fmtDate(p.published_at)}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePin(p)}
                      className={`text-xs font-medium transition-opacity hover:opacity-70 ${p.is_pinned ? 'text-[#D4AF37]' : 'text-[#555]'}`}>
                      {p.is_pinned ? '📌 Pinned' : '📌 Pin'}
                    </button>
                    <button onClick={() => setModal(p)} className="text-[#D4AF37] text-xs hover:opacity-70 font-medium">Edit</button>
                    <button onClick={() => doDelete(p.id)} disabled={deleting === p.id}
                      className="text-red-400 text-xs hover:opacity-70 font-medium disabled:opacity-40">
                      {deleting === p.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modal !== null && (
        <PostModal
          post={modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}

// ── Tab: Users ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [query, setQuery]   = useState('');

  useEffect(() => {
    adminGetAllUsers().then(({ users: data }) => { setUsers(data); setLoad(false); });
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? users.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.business_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
    : users;

  const th = 'text-left text-[10px] font-bold uppercase tracking-widest text-[#555] pb-3 px-3';
  const td = 'px-3 py-3 text-sm text-[#ccc] align-middle';
  const searchInp = 'bg-[#111] border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]/40 placeholder:text-[#444] w-full sm:w-64';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-white font-bold text-lg">
          Users <span className="text-[#555] font-normal text-base ml-1">({filtered.length}{q ? ` of ${users.length}` : ''})</span>
        </h2>
        <div className="relative w-full sm:w-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className={`${searchInp} pl-9`}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#0F4C3A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-[#555] text-sm text-center py-16">{q ? `No users matching "${query}"` : 'No users found.'}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/8">
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-white/8">
                <tr>
                  <th className={th}>Name / Email</th>
                  <th className={th}>Plan</th>
                  <th className={th}>QR Used / Allocated</th>
                  <th className={th}>Sub Status</th>
                  <th className={th}>Renews</th>
                  <th className={th}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const sub = (Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions) || {};
                  return (
                    <tr key={u.id} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                      <td className={td}>
                        <div className="font-semibold text-white">{u.business_name || u.full_name || '—'}</div>
                        <div className="text-[11px] text-[#555]">{u.email || u.full_name}</div>
                      </td>
                      <td className={td}>
                        <div className="text-[11px] font-bold text-[#D4AF37]">{sub.plan_id || '—'}</div>
                        {sub.billing_cycle && (
                          <div className="text-[10px] text-[#555] capitalize">{sub.billing_cycle}</div>
                        )}
                      </td>
                      <td className={td}>
                        {sub.qr_used != null
                          ? `${sub.qr_used} / ${sub.qr_allocated === -1 ? '∞' : sub.qr_allocated}`
                          : '—'}
                      </td>
                      <td className={td}>
                        {sub.status
                          ? <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full
                              ${sub.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                              {sub.status}
                            </span>
                          : '—'}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{fmtDate(sub.current_period_end)}</td>
                      <td className={`${td} whitespace-nowrap`}>{fmtDate(u.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col divide-y divide-white/5 rounded-xl border border-white/8 overflow-hidden">
            {filtered.map((u, i) => {
              const sub = (Array.isArray(u.subscriptions) ? u.subscriptions[0] : u.subscriptions) || {};
              return (
                <div key={u.id} className={`p-4 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-sm truncate">{u.business_name || u.full_name || '—'}</div>
                      <div className="text-[11px] text-[#555] truncate">{u.email}</div>
                    </div>
                    {sub.status && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0
                        ${sub.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {sub.status}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <div>
                      <span className="text-[#555]">Plan: </span>
                      <span className="text-[#D4AF37] font-bold">{sub.plan_id || '—'}</span>
                      {sub.billing_cycle && <span className="text-[#555] capitalize"> · {sub.billing_cycle}</span>}
                    </div>
                    <div>
                      <span className="text-[#555]">QR: </span>
                      <span className="text-[#ccc]">
                        {sub.qr_used != null ? `${sub.qr_used} / ${sub.qr_allocated === -1 ? '∞' : sub.qr_allocated}` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#555]">Renews: </span>
                      <span className="text-[#ccc]">{fmtDate(sub.current_period_end)}</span>
                    </div>
                    <div>
                      <span className="text-[#555]">Joined: </span>
                      <span className="text-[#ccc]">{fmtDate(u.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Newsletter ───────────────────────────────────────────────────────────
function NewsletterTab() {
  const [subs, setSubs]     = useState([]);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    adminGetNewsletter().then(({ subscribers: data }) => { setSubs(data); setLoad(false); });
  }, []);

  function download() {
    downloadCSV(subs.map(s => ({ email: s.email, subscribed_at: s.created_at })), 'newsletter.csv');
  }

  const th = 'text-left text-[10px] font-bold uppercase tracking-widest text-[#555] pb-3 px-3';
  const td = 'px-3 py-3 text-sm text-[#ccc]';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-white font-bold text-lg">
          Newsletter <span className="text-[#555] font-normal text-base ml-1">({subs.length})</span>
        </h2>
        <button onClick={download} disabled={subs.length === 0}
          className="bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity disabled:opacity-30">
          ↓ Download CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-[#0F4C3A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : subs.length === 0 ? (
        <p className="text-[#555] text-sm text-center py-16">No subscribers yet.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/8">
            <table className="w-full min-w-[400px]">
              <thead className="border-b border-white/8">
                <tr>
                  <th className={th}>#</th>
                  <th className={th}>Email</th>
                  <th className={th}>Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s, i) => (
                  <tr key={s.id || i} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                    <td className={`${td} text-[#555]`}>{i + 1}</td>
                    <td className={td}>{s.email}</td>
                    <td className={`${td} whitespace-nowrap`}>{fmtDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col divide-y divide-white/5 rounded-xl border border-white/8 overflow-hidden">
            {subs.map((s, i) => (
              <div key={s.id || i} className={`px-4 py-3 flex items-center justify-between gap-3 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[#555] text-[11px] shrink-0">#{i + 1}</span>
                  <span className="text-sm text-[#ccc] truncate">{s.email}</span>
                </div>
                <span className="text-[11px] text-[#555] whitespace-nowrap shrink-0">{fmtDate(s.created_at)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Push Notifications ───────────────────────────────────────────────────
const AUDIENCE_OPTIONS = [
  { value: 'all',         label: 'All users' },
  { value: 'subscribers', label: 'All active subscribers' },
  { value: 'basic',       label: 'Basic plan only' },
  { value: 'pro',         label: 'Pro plan only' },
  { value: 'business',    label: 'Business plan only' },
];

const TYPE_OPTIONS = [
  { value: 'info',    label: 'Info',    color: '#3b82f6' },
  { value: 'success', label: 'Success', color: '#22c55e' },
  { value: 'alert',   label: 'Alert',   color: '#ca8a04' },
  { value: 'error',   label: 'Error',   color: '#ef4444' },
  { value: 'update',  label: 'Update',  color: '#a855f7' },
];

function NotificationsTab() {
  const [audience,  setAudience]  = useState('all');
  const [type,      setType]      = useState('info');
  const [message,   setMessage]   = useState('');
  const [fullDesc,  setFullDesc]  = useState('');
  const [sending,   setSending]   = useState(false);
  const [result,    setResult]    = useState(null); // { count, error } | null

  const inp  = 'w-full bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-[#444]';
  const lbl  = 'text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-1.5 block';

  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim()) return;
    const audienceLabel = AUDIENCE_OPTIONS.find(o => o.value === audience)?.label ?? audience;
    if (!confirm(`Send "${type}" notification to "${audienceLabel}"?\n\nThis will appear in all targeted users' notification panels and cannot be undone.`)) return;
    setSending(true);
    setResult(null);
    const { count, error } = await adminPushNotification({ audience, type, message: message.trim(), full_description: fullDesc.trim() || null });
    setSending(false);
    setResult({ count, error });
    if (!error) { setMessage(''); setFullDesc(''); }
  }

  const selectedType = TYPE_OPTIONS.find(t => t.value === type);

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-6">
        <h2 className="text-white font-bold text-lg">Push Notification</h2>
        <span className="text-[#555] text-xs">Sends to all matched users simultaneously</span>
      </div>

      <form onSubmit={handleSend} className="flex flex-col gap-5">
        {/* Audience */}
        <div>
          <label className={lbl}>Target audience</label>
          <select className={inp} value={audience} onChange={e => setAudience(e.target.value)}>
            {AUDIENCE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className={lbl}>Notification type</label>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map(o => (
              <button
                key={o.value} type="button"
                onClick={() => setType(o.value)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${type === o.value ? 'border-transparent' : 'border-white/10 text-[#888]'}`}
                style={type === o.value ? { background: `${o.color}22`, color: o.color, borderColor: `${o.color}44` } : {}}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Short message */}
        <div>
          <label className={lbl}>Message <span className="text-[#555] normal-case font-normal">(shown in notification list)</span></label>
          <input
            className={inp} required maxLength={160}
            placeholder="e.g. We've updated our Terms of Service."
            value={message} onChange={e => setMessage(e.target.value)} />
          <p className="text-[#555] text-[11px] mt-1">{message.length}/160</p>
        </div>

        {/* Full description */}
        <div>
          <label className={lbl}>Full description <span className="text-[#555] normal-case font-normal">(shown when user clicks — optional)</span></label>
          <textarea
            className={`${inp} resize-none`} rows={4}
            placeholder="Detailed explanation shown when the user expands the notification…"
            value={fullDesc} onChange={e => setFullDesc(e.target.value)} />
        </div>

        {/* Preview */}
        {message && (
          <div className="rounded-xl border border-white/8 p-4 bg-white/[0.02]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#555] mb-3">Preview</p>
            <div className="flex items-start gap-3">
              <span className="text-[10px] font-bold px-2 py-1 rounded-md capitalize tracking-wide whitespace-nowrap"
                style={{ background: `${selectedType?.color}22`, color: selectedType?.color }}>
                {type}
              </span>
              <div>
                <p className="text-sm text-white">{message}</p>
                {fullDesc && <p className="text-xs text-[#888] mt-1.5 leading-relaxed">{fullDesc}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Result banner */}
        {result && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${result.error ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
            {result.error
              ? `Error: ${result.error}`
              : `✓ Sent to ${result.count} user${result.count !== 1 ? 's' : ''} successfully.`
            }
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-white/8">
          <button type="submit" disabled={sending || !message.trim()}
            className="bg-[#0F4C3A] text-[#FAF5DD] px-8 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40">
            {sending ? 'Sending…' : `Send to ${AUDIENCE_OPTIONS.find(o => o.value === audience)?.label}`}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main Admin component ──────────────────────────────────────────────────────
export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('sf_admin') === '1');
  const [tab, setTab]       = useState('posts');

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const tabs = [
    { id: 'posts',         label: 'Blog Posts' },
    { id: 'users',         label: 'Users' },
    { id: 'newsletter',    label: 'Newsletter' },
    { id: 'notifications', label: 'Push Notifications' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top bar */}
      <header className="border-b border-white/8 max-w-7xl mx-auto">
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="text-white font-bold text-lg tracking-tight">ScanMyFrame Admin</span>
          <button
            onClick={() => { sessionStorage.removeItem('sf_admin'); setAuthed(false); }}
            className="text-[#555] border border-[#555] rounded-md px-3 py-1 hover:text-white hover:border-white text-xs transition-colors"
          >
            Sign out
          </button>
        </div>
        <nav className="flex items-center gap-1 px-4 sm:px-6 pb-2 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                ${tab === t.id ? 'bg-white/10 text-white' : 'text-[#666] hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {tab === 'posts'         && <PostsTab />}
        {tab === 'users'         && <UsersTab />}
        {tab === 'newsletter'    && <NewsletterTab />}
        {tab === 'notifications' && <NotificationsTab />}
      </main>
    </div>
  );
}
