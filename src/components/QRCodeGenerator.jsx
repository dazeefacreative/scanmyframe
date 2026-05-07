import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { createFrame, uploadMedia, addMediaToFrame, consumeQRCode, sendQREmail, sendTrialUpgradeNudge } from '../services/supabaseHelpers';
import { supabase } from '../services/supabaseClient';
import StoryEditor from './StoryEditor';
import FramePreview from './FramePreview';

const BASE_URL = window.location.origin;

const SYMBOL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 215.88 255.99">
  <rect fill="#d3af37" x="87.69" y="154.96" width="40.5" height="40.5" rx="13.21" ry="13.21"/>
  <path fill="#d3af37" d="m206.07,0H9.81C4.4,0,0,4.4,0,9.81v236.38c0,5.41,4.4,9.81,9.81,9.81h196.26c5.41,0,9.81-4.4,9.81-9.81V9.81c0-5.41-4.4-9.81-9.81-9.81ZM26.4,230.71V27.47h162.49v203.24H26.4Z"/>
</svg>`;

const SYMBOL_DATA_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SYMBOL_SVG)}`;
const ICON_ASPECT     = 255.99 / 215.88;
const BORDER_COLOR    = '#0F4C3A';
const BORDER_WIDTH    = 6;
const BORDER_RADIUS   = 20;
const QR_SIZE         = 400;
const PADDING         = 24;

const FEATURE_SUGGESTIONS = [
  'Acrylic glass', 'Black edges', 'White edges', 'Gold edges', 'Silver edges',
  'Copper edges', 'Rose gold edges', 'Bronze edges', 'Natural wood edges',
  'Floating hang-type', 'Wall mount', 'Tabletop stand', 'Shadow box',
  'Dual orientation', 'Magnetic mount', 'Flush mount', 'Easel back',
  'Matte finish', 'Gloss finish', 'Satin finish', 'Brushed finish',
  'Rustic finish', 'Metallic finish', 'Distressed finish',
  'UV print', 'Canvas wrap', 'Metal print',
  'Real glass', 'No glass', 'Frosted glass', 'Tempered glass',
  'Anti-reflective', 'Anti-glare', 'UV protection', 'Shatter-resistant',
  'Wood frame', 'Bamboo frame', 'Aluminum frame', 'MDF frame',
  'Acrylic frame', 'Reclaimed wood', 'Solid oak',
  'Acid-free backing', 'Archival safe', 'Foam core',
  'Snap-open', 'Tool-free assembly', 'Hinged back',
  'Square format', 'Panoramic', 'Custom size', 'A4 size', 'A3 size',
  'Museum grade', 'Waterproof', 'Limited edition', 'Handmade',
  'Eco-friendly', 'Gift-ready', 'Personalized', 'Outdoor-rated',
  'LED lit', 'Engraved', 'Collage frame', 'Multi-opening',
];

const STEPS = ['Content', 'Media', 'Settings'];

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateBrandedQR(url, fgColor = '#000000', bgColor = '#ffffff', iconUrl = null, strokeColor = '#0F4C3A') {
  const TOTAL = QR_SIZE + PADDING * 2 + BORDER_WIDTH * 2;
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: QR_SIZE, margin: 2,
    color: { dark: fgColor, light: bgColor },
    errorCorrectionLevel: 'H',
  });

  const canvas = document.createElement('canvas');
  canvas.width  = TOTAL;
  canvas.height = TOTAL;
  const ctx = canvas.getContext('2d');

  const clipPath = new Path2D();
  clipPath.roundRect(0, 0, TOTAL, TOTAL, BORDER_RADIUS);
  ctx.clip(clipPath);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, TOTAL, TOTAL);

  const qrOffset = BORDER_WIDTH + PADDING;
  await new Promise((resolve, reject) => {
    const qrImg = new Image();
    qrImg.onload = () => { ctx.drawImage(qrImg, qrOffset, qrOffset, QR_SIZE, QR_SIZE); resolve(); };
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth   = BORDER_WIDTH * 2;
  ctx.beginPath();
  ctx.roundRect(0, 0, TOTAL, TOTAL, BORDER_RADIUS);
  ctx.stroke();

  const usedIconSrc    = iconUrl || SYMBOL_DATA_URI;
  const usedIconAspect = iconUrl ? 1 : ICON_ASPECT;
  const ICON_W  = Math.round(QR_SIZE * 0.20);
  const ICON_H  = Math.round(ICON_W * usedIconAspect);
  const ICON_PAD = 10;
  const BG_W    = ICON_W + ICON_PAD * 2;
  const BG_H    = ICON_H + ICON_PAD * 2;
  const cx      = TOTAL / 2;
  const cy      = TOTAL / 2;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(cx - BG_W / 2, cy - BG_H / 2, BG_W, BG_H, 12);
  ctx.fill();

  await new Promise((resolve) => {
    const icon = new Image();
    icon.crossOrigin = 'anonymous';
    icon.onload = () => {
      ctx.drawImage(icon, cx - ICON_W / 2, cy - ICON_H / 2, ICON_W, ICON_H);
      resolve();
    };
    icon.onerror = resolve; // skip icon silently on error
    icon.src = usedIconSrc;
  });

  return canvas.toDataURL('image/png');
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="mb-3">
      {label && <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1.5">{label}</label>}
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-500 mt-1">{error}</motion.p>
        )}
      </AnimatePresence>
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
    if (val.endsWith(',')) {
      addTag(val.slice(0, -1).trim());
      return;
    }
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

  function removeTag(tag) {
    onChange(tags.filter(t => t !== tag));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addTag(input); }
    if (e.key === 'Backspace' && !input && tags.length) removeTag(tags[tags.length - 1]);
  }

  return (
    <div className="mb-3">
      <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
        Frame features <span className="normal-case font-normal">(optional)</span>
      </label>
      <p className="text-xs text-neutral-400 mb-2">
        Describe physical features of the frame. Type and press <kbd className="bg-neutral-100 px-1 rounded">Enter</kbd> or use a <kbd className="bg-neutral-100 px-1 rounded">,</kbd> to add tags.
      </p>
      <div className="border border-neutral-300 rounded-xl p-3 focus-within:border-[#0F4C3A] transition-colors">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-[#0F4C3A]/10 text-[#0F4C3A] text-xs font-medium px-2.5 py-1 rounded-full">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-[#0F4C3A]/60 hover:text-[#0F4C3A] ml-0.5 leading-none">×</button>
            </span>
          ))}
        </div>
        <input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length ? 'Add another...' : 'e.g. Acrylic glass, Black edges...'}
          className="w-full text-sm text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-1 border border-neutral-200 rounded-xl bg-white shadow-lg overflow-hidden">
          {suggestions.map(s => (
            <button key={s} type="button" onMouseDown={e => { e.preventDefault(); addTag(s); }}
              className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-[#0F4C3A]/5 hover:text-[#0F4C3A] transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Additional Images Upload ─────────────────────────────────────────────────
function AdditionalImagesInput({ files, onChange, imgMaxMB, imgMaxBytes, maxImages }) {
  const MAX = maxImages;

  function handleAdd(e) {
    const selected = Array.from(e.target.files);
    const valid = selected.filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= imgMaxBytes);
    const combined = [...files, ...valid].slice(0, MAX);
    onChange(combined);
    e.target.value = '';
  }

  function handleRemove(idx) {
    onChange(files.filter((_, i) => i !== idx));
  }

  return (
    <div className="border border-neutral-300 rounded-xl p-4 mb-3">
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">
        Additional images <span className="normal-case font-normal">(optional, up to {MAX})</span>
      </p>
      <p className="text-xs text-neutral-500 mb-3">Extra photos of the frame, packaging, etc. These will appear as a swipeable gallery.</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {files.map((file, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-neutral-200">
            <img src={URL.createObjectURL(file)} alt={`extra-${i}`} className="w-full h-full object-cover" />
            <button type="button" onClick={() => handleRemove(i)}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80">
              ×
            </button>
          </div>
        ))}
        {files.length < MAX && (
          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center cursor-pointer hover:border-[#0F4C3A] transition-colors">
            <span className="text-2xl text-neutral-300">+</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleAdd} className="hidden" />
          </label>
        )}
      </div>
      <p className="text-xs text-neutral-400">JPG/PNG/WebP, max {imgMaxMB}MB each</p>
    </div>
  );
}

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

const DRAFT_KEY    = 'scanframe_qr_draft';
const DRAFT_PENDING = 'scanframe_qr_pending';

// ─── Main component ───────────────────────────────────────────────────────────
export default function QRCodeGenerator({ onNavigateToBilling, planId = 'free' }) {
  const imgMaxMB    = ['trial', 'pro', 'business'].includes(planId) ? 5 : 2;
  const imgMaxBytes = imgMaxMB * 1024 * 1024;
  const vidMaxMB    = (planId === 'business' || planId === 'trial') ? 50 : planId === 'pro' ? 30 : 20;
  const vidMaxBytes = vidMaxMB * 1024 * 1024;
  const maxImages   = (planId === 'business' || planId === 'trial') ? 8 : planId === 'pro' ? 4 : 1;
  const canUsePassword = ['trial', 'pro', 'business'].includes(planId);
  const navigate = useNavigate();
  const rootRef = useRef(null);

  const [step,             setStep]             = useState(0);
  const [form,             setForm]             = useState({ title: '', story: '', frameOwner: '', width: '', height: '' });
  const [artworkFile,      setArtworkFile]      = useState(null);
  const [extraImages,      setExtraImages]      = useState([]);
  const [videoFile,        setVideoFile]        = useState(null);
  const [featureTags,      setFeatureTags]      = useState([]);
  const [artworkError,     setArtworkError]     = useState('');
  const [videoError,       setVideoError]       = useState('');
  const [errors,           setErrors]           = useState({});
  const [loading,          setLoading]          = useState(false);
  const [qrDataUrl,        setQrDataUrl]        = useState(null);
  const [genError,         setGenError]         = useState('');
  const [frameSlug,        setFrameSlug]        = useState('');
  const [modal,            setModal]            = useState(null);
  const [emailStatus,      setEmailStatus]      = useState(null);
  const [draftRestored,    setDraftRestored]    = useState(false);
  const [passwordEnabled,  setPasswordEnabled]  = useState(false);
  const [passwordValue,    setPasswordValue]    = useState('');
  const [showPassword,     setShowPassword]     = useState(false);
  const [commentsEnabled,  setCommentsEnabled]  = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.form)        setForm(draft.form);
      if (draft.featureTags) setFeatureTags(draft.featureTags);
      setDraftRestored(true);
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_PENDING);
      setTimeout(() => rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    } catch (_) {}
  }, []);

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
    if (file.size > imgMaxBytes) { setArtworkError(`Max file size is ${imgMaxMB}MB on your plan.`); return; }
    setArtworkFile(file);
  }

  function handleVideoChange(e) {
    const file = e.target.files[0];
    setVideoError('');
    if (!file) return;
    if (!['video/mpeg', 'video/mp4'].includes(file.type)) { setVideoError('Only MPEG/MP4 files are allowed.'); return; }
    if (file.size > vidMaxBytes) { setVideoError(`Max file size is ${vidMaxMB}MB on your plan.`); return; }
    setVideoFile(file);
  }

  function validateStep(s) {
    const errs = {};
    if (s === 0) {
      if (!form.title.trim())      errs.title      = 'Art title is required.';
      if (!form.story.trim())      errs.story      = 'Story is required.';
      if (!form.frameOwner.trim()) errs.frameOwner = 'Frame owner is required.';
    }
    if (s === 1) {
      if (!artworkFile) errs.artwork = 'Please upload the frame artwork image.';
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
    setGenError('');
    setStep(s => s - 1);
  }

  async function handleSubmit() {
    // Re-validate all required fields before submitting
    const errs = { ...validateStep(0), ...validateStep(1) };
    if (Object.keys(errs).length) { setErrors(errs); setStep(Object.keys(validateStep(0)).length ? 0 : 1); return; }

    setLoading(true);
    setGenError('');
    setQrDataUrl(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setModal('no_user'); setLoading(false); return; }

      const qrResult = await consumeQRCode(user.id);
      if (!qrResult.success) { setModal('limit_reached'); setLoading(false); return; }

      // Fire nudge when trial user hits 8/10 QR codes used
      if (qrResult.plan_id === 'trial' && qrResult.qr_used === 8) {
        sendTrialUpgradeNudge({ userId: user.id, toEmail: user.email, userName: user.user_metadata?.full_name || user.user_metadata?.business_name });
      }

      const slug =
        form.title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') +
        '-' + Date.now();

      const { frame, error: frameError } = await createFrame({
        title:            form.title,
        description:      form.story,
        client_name:      form.frameOwner,
        width:            form.width ? parseInt(form.width) : null,
        height:           form.height ? parseInt(form.height) : null,
        frame_slug:       slug,
        frame_features:   featureTags,
        comments_enabled: commentsEnabled,
      });
      if (frameError || !frame) throw new Error(frameError || 'Failed to create frame.');

      if (passwordEnabled && passwordValue.trim()) {
        const hash = await sha256(passwordValue.trim());
        await supabase.from('frames').update({
          access_password:      hash,
          is_password_protected: true,
        }).eq('id', frame.id);
      }

      const { url: artUrl, error: artUploadErr } = await uploadMedia(artworkFile, frame.id);
      if (artUploadErr) throw new Error(artUploadErr);
      await addMediaToFrame(frame.id, { media_type: 'image', media_url: artUrl, caption: form.title });

      for (const imgFile of extraImages) {
        const { url: extraUrl, error: extraErr } = await uploadMedia(imgFile, frame.id);
        if (!extraErr && extraUrl) {
          await addMediaToFrame(frame.id, { media_type: 'extra_image', media_url: extraUrl, caption: '' });
        }
      }

      if (videoFile) {
        const { url: vidUrl, error: vidUploadErr } = await uploadMedia(videoFile, frame.id);
        if (!vidUploadErr && vidUrl) {
          await addMediaToFrame(frame.id, { media_type: 'video', media_url: vidUrl, caption: '' });
        }
      }

      const qrBrand = (() => { try { return JSON.parse(localStorage.getItem(`sf_qr_brand_${user.id}`) || '{}'); } catch { return {}; } })();
      const brandedDataUrl = await generateBrandedQR(`${BASE_URL}/frame/${slug}`, qrBrand.fg || '#000000', qrBrand.bg || '#ffffff', qrBrand.logo || null, qrBrand.stroke || '#0F4C3A');
      setQrDataUrl(brandedDataUrl);
      setFrameSlug(slug);
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_PENDING);
      onSaved?.(); // notify Dashboard to silently re-fetch frames

      setEmailStatus('sending');
      sendQREmail({
        frameTitle:    form.title,
        frameUrl:      `${BASE_URL}/frame/${slug}`,
        qrDataUrl:     brandedDataUrl,
        frameOwner:    form.frameOwner,
        framePassword: passwordEnabled && passwordValue.trim() ? passwordValue.trim() : null,
      }).then(result => {
        if (result?.skipped) setEmailStatus('skipped');
        else if (result?.sent) setEmailStatus('sent');
        else setEmailStatus('failed');
      });
    } catch (err) {
      setGenError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qr-${frameSlug || 'code'}.png`;
    link.href = qrDataUrl;
    link.click();
  }

  async function handleDownloadSVG() {
    if (!frameSlug) return;
    const url = `${BASE_URL}/frame/${frameSlug}`;
    const svgStr = await QRCode.toString(url, {
      type: 'svg', width: 400, margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });
    const vbMatch = svgStr.match(/viewBox="0 0 (\d+(?:\.\d+)?)/);
    const origSize = vbMatch ? parseFloat(vbMatch[1]) : 37;
    const innerMatch = svgStr.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    const innerSvg = innerMatch ? innerMatch[1] : '';

    const total = QR_SIZE + PADDING * 2 + BORDER_WIDTH * 2;
    const qrOffset = BORDER_WIDTH + PADDING;
    const scale = QR_SIZE / origSize;

    const finalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}">
  <rect width="${total}" height="${total}" rx="${BORDER_RADIUS}" ry="${BORDER_RADIUS}" fill="white"/>
  <rect x="${BORDER_WIDTH / 2}" y="${BORDER_WIDTH / 2}" width="${total - BORDER_WIDTH}" height="${total - BORDER_WIDTH}" rx="${BORDER_RADIUS - 2}" ry="${BORDER_RADIUS - 2}" fill="none" stroke="${BORDER_COLOR}" stroke-width="${BORDER_WIDTH}"/>
  <g transform="translate(${qrOffset},${qrOffset}) scale(${scale})">${innerSvg}</g>
</svg>`;

    const blob = new Blob([finalSvg], { type: 'image/svg+xml' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `qr-${frameSlug || 'code'}.svg`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  function handlePrint() {
    if (!qrDataUrl || !frameSlug) return;
    const frameUrl = `${BASE_URL}/frame/${frameSlug}`;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>QR Code – ${form.title}</title>
  <style>
    @page { size: A4; margin: 25mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; color: #0F4C3A; }
    img { width: 220px; height: 220px; margin-bottom: 20px; border-radius: 12px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; text-align: center; }
    .owner { font-size: 14px; color: #4a7c6f; margin-bottom: 14px; }
    .url { font-size: 10px; color: #888; word-break: break-all; max-width: 300px; text-align: center; margin-bottom: 20px; }
    .brand { font-size: 9px; color: #ccc; letter-spacing: 0.05em; text-transform: uppercase; }
  </style>
</head>
<body>
  <img src="${qrDataUrl}" alt="QR Code"/>
  <h1>${form.title}</h1>
  <p class="owner">Frame Owner: ${form.frameOwner}</p>
  <p class="url">${frameUrl}</p>
  <p class="brand">Created with ScanMyFrame</p>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (win) setTimeout(() => URL.revokeObjectURL(blobUrl), 8000);
  }

  function handleReset() {
    setForm({ title: '', story: '', frameOwner: '', width: '', height: '' });
    setArtworkFile(null);
    setExtraImages([]);
    setVideoFile(null);
    setFeatureTags([]);
    setQrDataUrl(null);
    setFrameSlug('');
    setErrors({});
    setGenError('');
    setArtworkError('');
    setVideoError('');
    setEmailStatus(null);
    setStep(0);
  }

  const inputCls = (hasErr) =>
    `w-full bg-white border rounded-xl px-4 py-3 text-sm text-neutral-900 outline-none transition-colors ${
      hasErr ? 'border-red-400 focus:border-red-500' : 'border-neutral-300 focus:border-[#0F4C3A]'
    }`;

  // ── Success view ──────────────────────────────────────────────────────────
  if (qrDataUrl) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md mx-auto">

        <p className="text-base sm:text-lg font-bold text-neutral-900 mb-1">QR code ready!</p>
        <p className="text-sm text-neutral-500 mb-4">
          Share or download it for <strong className="text-neutral-800">{form.title}</strong>
        </p>

        <AnimatePresence mode="wait">
          {emailStatus === 'sending' && (
            <motion.div key="sending" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs text-[#4a7c6f] bg-[#0F4C3A]/6 border border-[#0F4C3A]/15 rounded-lg px-3 py-2 mb-4">
              <span className="w-3 h-3 border-[1.5px] border-[#0F4C3A] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Sending QR code to your inbox…
            </motion.div>
          )}
          {emailStatus === 'sent' && (
            <motion.div key="sent" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-0.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4">
              <div className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M5 13l4 4L19 7"/></svg>
                QR code sent to your inbox.
              </div>
              <span className="text-emerald-600 pl-5">Not seeing it? Check your spam folder and mark us as safe.</span>
            </motion.div>
          )}
          {emailStatus === 'skipped' && (
            <motion.div key="skipped" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 mb-4">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              Email delivery is off. Enable it in Settings to receive QR codes by email.
            </motion.div>
          )}
          {emailStatus === 'failed' && (
            <motion.div key="failed" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Email delivery failed. Download the QR below to save it.
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex justify-center mb-6">
          <img src={qrDataUrl} alt="Branded QR code" className="w-48 sm:w-56 md:w-64 h-auto rounded-xl shadow-lg" />
        </motion.div>

        <div className="flex flex-col gap-3">
          <div data-guide="download-area" className="flex flex-col sm:flex-row gap-2">
            <button data-guide="download-btn" onClick={handleDownload}
              className="flex-1 bg-[#0F4C3A] text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity">
              Download PNG
            </button>
            {canUsePassword && (
              <>
                <button onClick={handleDownloadSVG}
                  className="flex-1 bg-white border border-[#0F4C3A] text-[#0F4C3A] rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-[#0F4C3A]/5 transition-colors">
                  Download SVG
                </button>
                <button onClick={handlePrint}
                  className="flex-1 bg-white border border-neutral-300 text-neutral-700 rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-neutral-50 transition-colors">
                  Print / PDF
                </button>
              </>
            )}
          </div>
          {!canUsePassword && (
            <p className="text-[11px] text-neutral-400 text-center">
              <span className="font-semibold text-[#7c3aed]">Pro</span> & <span className="font-semibold text-[#7c3aed]">Business</span> plans unlock SVG and print-ready PDF exports.
            </p>
          )}
          <button onClick={handleReset}
            className="w-full bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-xl px-6 py-2.5 text-sm hover:bg-neutral-200 transition-colors">
            Generate another
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Form view ─────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-8 items-start w-full">
    <motion.div ref={rootRef} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md">

      <StepIndicator step={step} />

      {/* Draft restored banner — only on step 0 */}
      <AnimatePresence>
        {draftRestored && step === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 text-xs text-[#4a7c6f] bg-[#0F4C3A]/6 border border-[#0F4C3A]/20 rounded-xl px-3.5 py-3 mb-4"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><path d="M5 13l4 4L19 7"/></svg>
            <span>Your details have been restored. You can continue from where you left off. Please re-upload any images or video.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 0: Content ── */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <Field label={<>Art title <span className="text-red-400">*</span></>} error={errors.title}>
              <div className="relative">
                <input
                  data-guide="title"
                  name="title"
                  placeholder="e.g. Sunset in Lagos, The Golden Bride"
                  value={form.title}
                  onChange={handleChange}
                  maxLength={50}
                  className={`${inputCls(errors.title)} pr-14`}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] pointer-events-none ${form.title.length >= 40 ? 'text-amber-500' : 'text-neutral-300'}`}>
                  {form.title.length}/50
                </span>
              </div>
            </Field>

            <Field label={<>Story <span className="text-red-400">*</span></>} error={errors.story}>
              <div data-guide="story-wrap" data-filled={form.story.trim().length > 0 ? 'true' : 'false'}>
                <StoryEditor
                  value={form.story}
                  onChange={val => setForm(f => ({ ...f, story: val }))}
                  error={errors.story}
                  rows={7}
                />
              </div>
            </Field>

            <Field label={<>Frame owner <span className="text-red-400">*</span></>} error={errors.frameOwner}>
              <input data-guide="owner" name="frameOwner" placeholder="Frame Owner (e.g Mr Scan)" value={form.frameOwner} onChange={handleChange} className={inputCls(errors.frameOwner)} />
            </Field>

            <div className="border border-neutral-300 rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Frame size in inches (optional)</p>
              <div className="flex flex-wrap items-center gap-4">
                {['width', 'height'].map(dim => (
                  <div key={dim} className="flex items-center gap-2">
                    <label className="text-sm text-neutral-600 capitalize">{dim}</label>
                    <input name={dim} type="number" placeholder={dim === 'width' ? '24' : '34'} value={form[dim]} onChange={handleChange}
                      className="w-20 border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-[#0F4C3A] transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 1: Media ── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div data-guide="artwork-wrap" data-filled={artworkFile ? 'true' : 'false'} className="border border-neutral-300 rounded-xl p-4 mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Artwork <span className="text-red-400">*</span></p>
              <p className="text-xs text-neutral-500 mb-3">Upload the actual photo of the frame artwork. This is the main image shown on the frame page.</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="bg-neutral-100 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-neutral-200 transition-colors text-center">
                  {artworkFile ? 'Change artwork' : 'Upload artwork'}
                  <input type="file" accept="image/jpeg,image/png" onChange={handleArtworkChange} className="hidden" />
                </label>
                <span className="text-xs text-neutral-400">JPG/PNG, max {imgMaxMB}MB</span>
              </div>
              {artworkFile && <p className="text-xs text-emerald-600 mt-2">{artworkFile.name}</p>}
              {artworkError && <p className="text-xs text-red-500 mt-1">{artworkError}</p>}
              {errors.artwork && !artworkFile && <p className="text-xs text-red-500 mt-1">{errors.artwork}</p>}
            </div>

            <AdditionalImagesInput files={extraImages} onChange={setExtraImages} imgMaxMB={imgMaxMB} imgMaxBytes={imgMaxBytes} maxImages={maxImages} />

            <div className="border border-neutral-300 rounded-xl p-4 mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">Video <span className="normal-case font-normal text-neutral-400">(optional)</span></p>
              <p className="text-xs text-neutral-500 mb-3 leading-relaxed">Optional event video for a richer experience</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="bg-neutral-100 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-neutral-200 transition-colors text-center">
                  {videoFile ? 'Change video' : 'Upload video'}
                  <input type="file" accept="video/mp4,video/mpeg" onChange={handleVideoChange} className="hidden" />
                </label>
                <span className="text-xs text-neutral-400">MP4/MPEG, max {vidMaxMB}MB</span>
              </div>
              {videoFile && <p className="text-xs text-emerald-600 mt-2">{videoFile.name}</p>}
              {videoError && <p className="text-xs text-red-500 mt-1">{videoError}</p>}
            </div>

            <FeatureTagsInput tags={featureTags} onChange={setFeatureTags} />
          </motion.div>
        )}

        {/* ── Step 2: Password & Comments ── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className={`border rounded-xl p-4 mb-3 ${canUsePassword ? 'border-neutral-300' : 'border-neutral-200 bg-neutral-50'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                      Password Protection <span className="normal-case font-normal">(optional)</span>
                    </p>
                    {!canUsePassword && (
                      <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 flex-shrink-0">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {canUsePassword
                      ? "Require a password before anyone can view this frame's content. Set it on behalf of your client for private or sensitive deliveries."
                      : 'Upgrade to Pro or Business to lock frames with a password, ideal for private or sensitive client deliveries.'}
                  </p>
                </div>

                {canUsePassword ? (
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
                ) : (
                  <div style={{ marginLeft: 16, flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                )}
              </div>

              {canUsePassword && passwordEnabled && (
                <div className="mt-3">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordValue}
                      onChange={e => setPasswordValue(e.target.value)}
                      placeholder="Set a password for this frame…"
                      maxLength={72}
                      className="w-full border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-800 pr-12 outline-none focus:border-[#0F4C3A] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1.5">
                    Share this password privately with your client. ScanMyFrame stores it securely and never shows it again.
                  </p>
                </div>
              )}
            </div>

            <div className="border border-neutral-200 rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-1">Allow comments</p>
                  <p className="text-xs text-neutral-500 leading-relaxed">
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

            <AnimatePresence>
              {genError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-500 mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  ⚠ {genError}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-3 justify-start sm:justify-between mt-5">
        {step > 0 ? (
          <button onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Back
          </button>
        ) : <div />}

        {step < STEPS.length - 1 ? (
          <button data-guide="next-btn" onClick={handleNext}
            className="flex items-center gap-1.5 bg-[#0F4C3A] text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity">
            Next
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        ) : (
          <button data-guide="submit-btn" onClick={handleSubmit} disabled={loading}
            className="bg-[#0F4C3A] text-white rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            {loading ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>) : 'Generate Code'}
          </button>
        )}
      </div>

      {/* Gate modal */}
      <AnimatePresence>
        {modal && (
          <motion.div key="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setModal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              {modal === 'no_user' ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-[#0F4C3A]/10 flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F4C3A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
                    </svg>
                  </div>
                  <p className="text-base font-bold text-neutral-900 mb-2">Sign in to continue</p>
                  <p className="text-sm text-neutral-500 leading-relaxed mb-6">Create a free ScanMyFrame account to continue. Your information is secure, and your progress has been saved.</p>
                  <div className="flex flex-col gap-2.5">
                    <button onClick={() => {
                      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, featureTags }));
                      localStorage.setItem(DRAFT_PENDING, '1');
                      navigate('/signin');
                    }} className="w-full bg-[#0F4C3A] text-white rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-opacity">Sign in</button>
                    <button onClick={() => setModal(null)} className="w-full border border-neutral-200 text-neutral-600 rounded-xl py-2.5 text-sm font-medium hover:bg-neutral-50 transition-colors">Maybe later</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"/>
                    </svg>
                  </div>
                  <p className="text-base font-bold text-neutral-900 mb-2">QR code limit reached</p>
                  <p className="text-sm text-neutral-500 leading-relaxed mb-6">You've used all your allocated QR codes. Upgrade your plan to keep creating frames without limits.</p>
                  <div className="flex flex-col gap-2.5">
                    <button onClick={() => onNavigateToBilling?.()} className="w-full bg-[#0F4C3A] text-white rounded-xl py-2.5 text-sm font-bold hover:opacity-90 transition-opacity">Upgrade plan</button>
                    <button onClick={() => setModal(null)} className="w-full border border-neutral-200 text-neutral-600 rounded-xl py-2.5 text-sm font-medium hover:bg-neutral-50 transition-colors">Maybe later</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
      <div className="hidden lg:block flex-shrink-0">
        <FramePreview form={form} artworkFile={artworkFile} />
      </div>
    </div>
  );
}
