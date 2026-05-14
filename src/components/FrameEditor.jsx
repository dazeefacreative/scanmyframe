import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { supabase } from '../services/supabaseClient';
import { uploadMedia, addMediaToFrame } from '../services/supabaseHelpers';
import FramePreview from './FramePreview';

const STORY_QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'link'],
    ['clean'],
  ],
};
const STORY_QUILL_FORMATS = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'blockquote', 'link'];
const STORY_QUILL_STYLES = `
  .sf-story-quill { max-width: 100%; }
  .sf-story-quill .ql-toolbar { border: 1px solid #d1d5db !important; border-bottom: 1px solid #e5e7eb !important; border-radius: 12px 12px 0 0 !important; background: #f9fafb !important; padding: 5px 8px !important; display: flex !important; flex-wrap: wrap !important; align-items: center !important; gap: 0 !important; }
  @media (min-width: 640px) { .sf-story-quill .ql-toolbar { flex-wrap: nowrap !important; } }
  .sf-story-quill .ql-toolbar .ql-formats { margin-right: 6px !important; display: flex !important; align-items: center !important; flex-shrink: 0 !important; }
  .sf-story-quill .ql-toolbar button { padding: 3px !important; width: 26px !important; height: 26px !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important; }
  .sf-story-quill .ql-toolbar button svg { width: 15px !important; height: 15px !important; }
  .sf-story-quill .ql-toolbar .ql-picker { width: 88px !important; min-width: 88px !important; flex-shrink: 0 !important; font-size: 12px !important; }
  .sf-story-quill .ql-toolbar .ql-picker-label { padding: 0 6px !important; height: 26px !important; display: flex !important; align-items: center !important; white-space: nowrap !important; }
  .sf-story-quill .ql-container { border: 1px solid #d1d5db !important; border-top: none !important; border-radius: 0 0 12px 12px !important; max-width: 100% !important; overflow: hidden !important; }
  .sf-story-quill .ql-container.ql-snow { font-family: inherit !important; }
  .sf-story-quill .ql-editor { min-height: 180px !important; font-size: 14px !important; line-height: 1.65 !important; color: #111827 !important; padding: 14px 16px !important; overflow-x: hidden !important; word-break: break-word !important; }
  .sf-story-quill .ql-editor.ql-blank::before { color: #9ca3af !important; font-style: italic !important; }
  .sf-story-quill .ql-editor h2 { font-size: 20px !important; font-weight: 700 !important; color: #0F4C3A !important; margin: 12px 0 6px !important; }
  .sf-story-quill .ql-editor h3 { font-size: 16px !important; font-weight: 700 !important; color: #0F4C3A !important; margin: 10px 0 4px !important; }
  .sf-story-quill .ql-editor blockquote { border-left: 3px solid #D4AF37 !important; padding-left: 12px !important; color: #4a7c6f !important; font-style: italic !important; margin: 8px 0 !important; }
  .sf-story-quill .ql-editor a { color: #0F4C3A !important; }
  .sf-story-quill.sf-story-quill--err .ql-toolbar,
  .sf-story-quill.sf-story-quill--err .ql-container { border-color: #f87171 !important; }
  .sf-story-quill .ql-toolbar button:hover .ql-stroke,
  .sf-story-quill .ql-toolbar button.ql-active .ql-stroke { stroke: #0F4C3A !important; }
  .sf-story-quill .ql-toolbar button:hover .ql-fill,
  .sf-story-quill .ql-toolbar button.ql-active .ql-fill { fill: #0F4C3A !important; }
`;

function stripHtml(html) { return (html || '').replace(/<[^>]*>/g, '').trim(); }

function normalizeStory(text) {
  if (!text) return '';
  if (text.trim().startsWith('<')) return text;
  return '<p>' + text.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
}

const FEATURE_SUGGESTIONS = [
  'Acrylic glass', 'Black edges', 'White edges', 'Gold edges', 'Silver edges',
  'Floating hang-type', 'Wall mount', 'Tabletop stand', 'Shadow box',
  'Matte finish', 'Gloss finish', 'Satin finish', 'UV print',
  'Canvas wrap', 'Metal print', 'Wood frame', 'Bamboo frame',
  'Anti-reflective', 'Museum grade', 'Waterproof', 'Limited edition',
];

const STEPS = ['Content', 'Media', 'Settings'];

const labelCls = 'block text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-1.5';

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  return (
    <div className="flex items-center mb-6">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < step  ? 'bg-[#0F4C3A] text-white' :
              i === step ? 'bg-[#0F4C3A] text-white ring-4 ring-[#0F4C3A]/15' :
              'bg-neutral-100 text-neutral-400'
            }`}>
              {i < step ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              ) : i + 1}
            </div>
            <span className={`text-[10px] font-semibold mt-1 whitespace-nowrap ${i === step ? 'text-[#0F4C3A]' : 'text-neutral-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${i < step ? 'bg-[#0F4C3A]' : 'bg-neutral-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Feature Tags Input ───────────────────────────────────────────────────────
function FeatureTagsInput({ tags, onChange }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);

  function handleInputChange(e) {
    const val = e.target.value;
    if (val.endsWith(',')) { addTag(val.slice(0, -1).trim()); return; }
    setInput(val);
    const q = val.trim().toLowerCase();
    setSuggestions(q.length >= 2
      ? FEATURE_SUGGESTIONS.filter(s => s.toLowerCase().includes(q) && !tags.includes(s)).slice(0, 5)
      : []
    );
  }

  function addTag(value) {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed)) { setInput(''); setSuggestions([]); return; }
    onChange([...tags, trimmed]);
    setInput('');
    setSuggestions([]);
  }

  function removeTag(tag) { onChange(tags.filter(t => t !== tag)); }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addTag(input); }
    if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]);
  }

  return (
    <div className="mb-3">
      <label className={labelCls}>Frame features <span className="normal-case font-normal text-[#9ca3af]">(optional)</span></label>
      <p className="text-xs text-[#6b7280] mb-2">
        Type and press <kbd className="bg-[#f3f4f6] px-1 rounded text-[10px]">Enter</kbd> or <kbd className="bg-[#f3f4f6] px-1 rounded text-[10px]">,</kbd> to add a tag.
      </p>
      <div className="border border-[#d1d5db] rounded-xl p-3 focus-within:border-primary transition-colors">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-[#0F4C3A]/10 text-[#0F4C3A] text-xs font-medium px-2.5 py-1 rounded-full">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-[#0F4C3A]/60 hover:text-[#0F4C3A] ml-0.5 leading-none">×</button>
            </span>
          ))}
        </div>
        <input ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
          placeholder={tags.length ? 'Add another...' : 'e.g. Acrylic glass, Black edges...'}
          className="w-full text-sm text-[#111827] outline-none bg-transparent placeholder:text-[#9ca3af]" />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-1 border border-[#e5e7eb] rounded-xl bg-white shadow-lg overflow-hidden z-10 relative">
          {suggestions.map(s => (
            <button key={s} type="button" onMouseDown={e => { e.preventDefault(); addTag(s); }}
              className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#0F4C3A]/5 hover:text-[#0F4C3A] transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Additional Images Manager ────────────────────────────────────────────────
function AdditionalImagesManager({ frameId, existingExtras, newFiles, onNewFilesChange, onDeleteExisting }) {
  const MAX = 4;
  const remaining = MAX - existingExtras.length - newFiles.length;

  function handleAdd(e) {
    const selected = Array.from(e.target.files);
    const valid = selected.filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 5 * 1024 * 1024);
    onNewFilesChange([...newFiles, ...valid].slice(0, remaining));
    e.target.value = '';
  }

  function removeNew(idx) { onNewFilesChange(newFiles.filter((_, i) => i !== idx)); }

  return (
    <div className="border border-[#d1d5db] rounded-xl p-4 mb-3">
      <label className={labelCls}>Additional images <span className="normal-case font-normal text-[#9ca3af]">(optional, up to {MAX})</span></label>
      <p className="text-xs text-[#6b7280] mb-3">Extra photos. Leave existing ones to keep them, or delete them individually.</p>

      <div className="flex flex-wrap gap-2 mb-2">
        {existingExtras.map(img => (
          <div key={img.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#d1d5db]">
            <img src={img.media_url} alt="extra" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onDeleteExisting(img.id)}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-600">
              ×
            </button>
          </div>
        ))}

        {newFiles.map((file, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-dashed border-[#0F4C3A]/40">
            <img src={URL.createObjectURL(file)} alt={`new-${i}`} className="w-full h-full object-cover" />
            <button type="button" onClick={() => removeNew(i)}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-600">
              ×
            </button>
          </div>
        ))}

        {remaining > 0 && existingExtras.length + newFiles.length < MAX && (
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-[#d1d5db] flex items-center justify-center cursor-pointer hover:border-[#0F4C3A] transition-colors">
            <span className="text-2xl text-[#d1d5db]">+</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleAdd} className="hidden" />
          </label>
        )}
      </div>
      <p className="text-xs text-[#9ca3af]">JPG/PNG/WebP, max 5MB each</p>
    </div>
  );
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function FrameEditor({ editingFrame, onSaved }) {
  const [step,             setStep]             = useState(0);
  const [form,             setForm]             = useState({ title: '', story: '', frameOwner: '', width: '', height: '' });
  const [featureTags,      setFeatureTags]      = useState([]);
  const [artworkFile,      setArtworkFile]      = useState(null);
  const [newExtraFiles,    setNewExtraFiles]     = useState([]);
  const [existingExtras,   setExistingExtras]   = useState([]);
  const [videoFile,        setVideoFile]        = useState(null);
  const [artworkError,     setArtworkError]     = useState('');
  const [videoError,       setVideoError]       = useState('');
  const [errors,           setErrors]           = useState({});
  const [loading,          setLoading]          = useState(false);
  const [saveError,        setSaveError]        = useState('');
  const [saved,            setSaved]            = useState(false);
  const [deletedExtraIds,  setDeletedExtraIds]  = useState([]);
  const [passwordEnabled,  setPasswordEnabled]  = useState(false);
  const [passwordValue,    setPasswordValue]    = useState('');
  const [showPassword,     setShowPassword]     = useState(false);
  const [commentsEnabled,  setCommentsEnabled]  = useState(true);

  useEffect(() => {
    if (!editingFrame) return;
    setForm({
      title:      editingFrame.title       || '',
      story:      normalizeStory(editingFrame.description),
      frameOwner: editingFrame.client_name || '',
      width:      editingFrame.width       || '',
      height:     editingFrame.height      || '',
    });
    setFeatureTags(editingFrame.frame_features || []);
    setPasswordEnabled(!!editingFrame.is_password_protected);
    setCommentsEnabled(editingFrame.comments_enabled ?? true);
    setPasswordValue('');
    setSaved(false);
    setSaveError('');
    setErrors({});
    setArtworkFile(null);
    setNewExtraFiles([]);
    setDeletedExtraIds([]);
    setVideoFile(null);
    setStep(0);

    async function loadMedia() {
      const { data } = await supabase
        .from('media')
        .select('id, media_url, media_type')
        .eq('frame_id', editingFrame.id)
        .eq('media_type', 'extra_image');
      if (data) setExistingExtras(data);
    }
    loadMedia();
  }, [editingFrame?.id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function handleArtworkChange(e) {
    const file = e.target.files[0];
    setArtworkError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) { setArtworkError('Only JPG/PNG files are allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setArtworkError('Max file size is 5MB.'); return; }
    setArtworkFile(file);
  }

  function handleVideoChange(e) {
    const file = e.target.files[0];
    setVideoError('');
    if (!file) return;
    if (!['video/mpeg', 'video/mp4'].includes(file.type)) { setVideoError('Only MPEG/MP4 files are allowed.'); return; }
    if (file.size > 20 * 1024 * 1024) { setVideoError('Max file size is 20MB.'); return; }
    setVideoFile(file);
  }

  function handleDeleteExisting(id) {
    setDeletedExtraIds(prev => [...prev, id]);
    setExistingExtras(prev => prev.filter(img => img.id !== id));
  }

  function validateStep(s) {
    const errs = {};
    if (s === 0) {
      if (!form.title.trim())      errs.title      = 'Art title is required.';
      if (!stripHtml(form.story))  errs.story      = 'Story is required.';
      if (!form.frameOwner.trim()) errs.frameOwner = 'Frame owner is required.';
    }
    return errs;
  }

  function handleNext() {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
  }

  function handleBack() {
    setErrors({});
    setSaveError('');
    setStep(s => s - 1);
  }

  async function handleUpdate() {
    const errs = validateStep(0);
    if (Object.keys(errs).length) { setErrors(errs); setStep(0); return; }

    setLoading(true);
    setSaveError('');

    try {
      const frameId = editingFrame.id;

      let passwordFields = {};
      if (!passwordEnabled) {
        passwordFields = { access_password: null, is_password_protected: false };
      } else if (passwordValue.trim()) {
        const hash = await sha256(passwordValue.trim());
        passwordFields = { access_password: hash, is_password_protected: true };
      } else {
        passwordFields = { is_password_protected: true };
      }

      const { error: updateErr } = await supabase
        .from('frames')
        .update({
          title:            form.title.trim(),
          description:      form.story.trim(),
          client_name:      form.frameOwner.trim(),
          size:             { width: form.width, height: form.height },
          frame_features:   featureTags,
          comments_enabled: commentsEnabled,
          updated_at:       new Date().toISOString(),
          ...passwordFields,
        })
        .eq('id', frameId);

      if (updateErr) throw updateErr;

      if (artworkFile) {
        await supabase.from('media').delete().eq('frame_id', frameId).eq('media_type', 'image');
        const { url: artUrl, error: artErr } = await uploadMedia(artworkFile, frameId);
        if (artErr) throw new Error(artErr);
        await addMediaToFrame(frameId, { media_type: 'image', media_url: artUrl, caption: form.title.trim() });
      }

      for (const id of deletedExtraIds) {
        await supabase.from('media').delete().eq('id', id);
      }

      for (const imgFile of newExtraFiles) {
        const { url: extraUrl, error: extraErr } = await uploadMedia(imgFile, frameId);
        if (!extraErr && extraUrl) {
          await addMediaToFrame(frameId, { media_type: 'extra_image', media_url: extraUrl, caption: '' });
        }
      }

      if (videoFile) {
        await supabase.from('media').delete().eq('frame_id', frameId).eq('media_type', 'video');
        const { url: vidUrl, error: vidErr } = await uploadMedia(videoFile, frameId);
        if (!vidErr && vidUrl) {
          await addMediaToFrame(frameId, { media_type: 'video', media_url: vidUrl, caption: '' });
        }
      }

      setSaved(true);
      setTimeout(() => onSaved?.(), 1200);
    } catch (err) {
      setSaveError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = (hasErr) =>
    `w-full px-4 py-3 rounded-xl border text-sm outline-none font-[inherit] bg-white text-[#111827] transition-colors
     ${hasErr ? 'border-red-500' : 'border-[#d1d5db] focus:border-primary'}`;

  // ── Success screen ─────────────────────────────────────────────────────────
  if (saved) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="bg-white rounded-2xl p-10 flex flex-col items-center text-center max-w-sm mx-auto">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
          className="text-4xl mb-3">✅</motion.div>
        <p className="text-lg font-bold text-[#111827] mb-2">Frame updated!</p>
        <p className="text-sm text-[#6b7280] leading-relaxed">
          Changes to <strong className="text-[#111827]">{form.title}</strong> have been saved.
          Your QR code continues to work unchanged.
        </p>
      </motion.div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-8 items-start w-full">
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-4 sm:p-5 w-full max-w-lg">

      <StepIndicator step={step} />

      {/* ── Step 0: Content ── */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="mb-3">
              <label className={labelCls}>Art title <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  name="title"
                  placeholder="Art Title"
                  value={form.title}
                  onChange={handleChange}
                  maxLength={50}
                  className={`${inputCls(errors.title)} pr-14`}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] pointer-events-none ${form.title.length >= 40 ? 'text-amber-500' : 'text-neutral-300'}`}>
                  {form.title.length}/50
                </span>
              </div>
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div className="mb-3">
              <label className={labelCls}>Story <span className="text-red-400">*</span></label>
              <style>{STORY_QUILL_STYLES}</style>
              <div className={`sf-story-quill${errors.story ? ' sf-story-quill--err' : ''}`}>
                <ReactQuill
                  theme="snow"
                  value={form.story}
                  onChange={val => { setForm(f => ({ ...f, story: val })); setErrors(e => ({ ...e, story: '' })); }}
                  modules={STORY_QUILL_MODULES}
                  formats={STORY_QUILL_FORMATS}
                  placeholder="Tell the story behind this frame…"
                />
              </div>
              {errors.story && <p className="text-xs text-red-500 mt-1">{errors.story}</p>}
            </div>

            <div className="mb-3">
              <label className={labelCls}>Frame owner <span className="text-red-400">*</span></label>
              <input name="frameOwner" placeholder="Frame Owner (e.g Mr Scan)" value={form.frameOwner} onChange={handleChange} className={inputCls(errors.frameOwner)} />
              {errors.frameOwner && <p className="text-xs text-red-500 mt-1">{errors.frameOwner}</p>}
            </div>

            <div className="border border-[#d1d5db] rounded-xl p-4">
              <p className="text-sm font-medium text-[#374151] mb-3">Frame size in inches (optional)</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {['width', 'height'].map(dim => (
                  <div key={dim} className="flex items-center gap-2">
                    <label className="text-sm text-[#374151] capitalize">{dim}</label>
                    <input name={dim} type="number" placeholder={dim === 'width' ? '24' : '34'} value={form[dim]} onChange={handleChange}
                      className="w-full sm:w-20 px-3 py-2 rounded-lg border border-[#d1d5db] text-sm text-[#111827] bg-white outline-none focus:border-primary" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 1: Media ── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="border border-[#d1d5db] rounded-xl p-4 mb-3">
              <label className={labelCls}>Artwork</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="inline-block bg-[#e5e7eb] text-[#374151] px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-[#d1d5db] transition-colors text-center">
                  {artworkFile ? 'Change artwork' : 'Replace artwork'}
                  <input type="file" accept="image/jpeg,image/png" onChange={handleArtworkChange} className="hidden" />
                </label>
                <span className="text-xs text-[#6b7280] break-all">
                  {artworkFile ? artworkFile.name : 'Leave empty to keep existing · JPG/PNG max 5MB'}
                </span>
              </div>
              {artworkError && <p className="text-xs text-red-500 mt-1">{artworkError}</p>}
            </div>

            <AdditionalImagesManager
              frameId={editingFrame?.id}
              existingExtras={existingExtras}
              newFiles={newExtraFiles}
              onNewFilesChange={setNewExtraFiles}
              onDeleteExisting={handleDeleteExisting}
            />

            <div className="border border-[#d1d5db] rounded-xl p-4 mb-3">
              <label className={labelCls}>Video <span className="normal-case font-normal text-[#9ca3af]">(optional)</span></label>
              <p className="text-sm text-[#374151] mb-3 leading-relaxed">Optionally replace the attached video. Leave empty to keep the existing one.</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="inline-block bg-[#e5e7eb] text-[#374151] px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap hover:bg-[#d1d5db] transition-colors text-center">
                  {videoFile ? 'Change video' : 'Replace video'}
                  <input type="file" accept="video/mp4,video/mpeg" onChange={handleVideoChange} className="hidden" />
                </label>
                <span className="text-xs text-[#6b7280] break-all">{videoFile ? videoFile.name : 'mpeg/mp4 · max 20MB'}</span>
              </div>
              {videoError && <p className="text-xs text-red-500 mt-1">{videoError}</p>}
            </div>

            <FeatureTagsInput tags={featureTags} onChange={setFeatureTags} />
          </motion.div>
        )}

        {/* ── Step 2: Password & Comments ── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="border border-[#d1d5db] rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <label className={labelCls}>Password Protection</label>
                  <p className="text-xs text-[#6b7280] leading-relaxed">
                    Require a password before anyone can view this frame's content.
                    Set it on behalf of your client for private or sensitive deliveries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setPasswordEnabled(v => !v); setPasswordValue(''); }}
                  style={{
                    width: 44, height: 24, borderRadius: 12, flexShrink: 0, marginLeft: 16,
                    background: passwordEnabled ? '#0F4C3A' : '#d1d5db',
                    border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                  }}
                  aria-checked={passwordEnabled}
                  role="switch"
                >
                  <span style={{
                    position: 'absolute', top: 3,
                    left: passwordEnabled ? 23 : 3,
                    width: 18, height: 18, borderRadius: 9,
                    background: '#fff', transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>

              {passwordEnabled && (
                <div className="mt-3">
                  {editingFrame?.is_password_protected && !passwordValue && (
                    <p className="text-xs text-[#0F4C3A] bg-[#0F4C3A]/8 border border-[#0F4C3A]/20 rounded-lg px-3 py-2 mb-2">
                      🔒 This frame already has a password. Enter a new one below to change it, or leave blank to keep the current password.
                    </p>
                  )}
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordValue}
                      onChange={e => setPasswordValue(e.target.value)}
                      placeholder={editingFrame?.is_password_protected ? 'Enter new password to change…' : 'Set a password for this frame…'}
                      maxLength={72}
                      className="w-full border border-[#d1d5db] rounded-xl px-4 py-2.5 text-sm text-[#111827] pr-12 outline-none focus:border-[#0F4C3A] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151] transition-colors"
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#9ca3af] mt-1.5">
                    Share this password privately with your client. ScanMyFrame stores it securely and never shows it again.
                  </p>
                </div>
              )}
            </div>

            <div className="border border-[#d1d5db] rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className={labelCls}>Allow comments</label>
                  <p className="text-xs text-[#6b7280] leading-relaxed">
                    When on, visitors can leave comments on this frame. Turn off to hide the comment section entirely.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCommentsEnabled(v => !v)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, flexShrink: 0, marginLeft: 16,
                    background: commentsEnabled ? '#0F4C3A' : '#d1d5db',
                    border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                  }}
                  aria-checked={commentsEnabled}
                  role="switch"
                >
                  <span style={{
                    position: 'absolute', top: 3,
                    left: commentsEnabled ? 23 : 3,
                    width: 18, height: 18, borderRadius: 9,
                    background: '#fff', transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
            </div>

            {saveError && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                ⚠ {saveError}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-3 justify-start sm:justify-between mt-5">
        {step > 0 ? (
          <button onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#111827] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Back
          </button>
        ) : (
          <button onClick={() => onSaved?.()}
            className="text-sm text-[#6b7280] hover:text-[#111827] transition-colors">
            Cancel
          </button>
        )}

        {step < STEPS.length - 1 ? (
          <button onClick={handleNext}
            className="flex items-center gap-1.5 bg-primary text-secondary rounded-xl px-6 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity">
            Next
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        ) : (
          <button onClick={handleUpdate} disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-primary text-secondary text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60">
            {loading ? 'Saving…' : 'Update Details'}
          </button>
        )}
      </div>
    </motion.div>
      <div className="hidden lg:block flex-shrink-0">
        <FramePreview form={form} />
      </div>
    </div>
  );
}
