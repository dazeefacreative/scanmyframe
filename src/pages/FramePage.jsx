import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFrameBySlug, recordQRScan } from '../services/supabaseHelpers';

// Returns a stable UUID for this browser/device (persists in localStorage)
function getVisitorId() {
  const KEY = '_sfvid';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}
import { supabase } from '../services/supabaseClient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import scanMyFrameLogo from '../assets/images/Scanframe alt.png';
import scanMyFrameLogoAlt from '../assets/images/Scanframe.png';

// ─── Image Gallery (manual swipe, no auto-slide) ──────────────────────────────
function ImageGallery({ images, title, cardRing, isDark }) {
  const [current, setCurrent] = useState(0);
  const [fading,  setFading]  = useState(false);
  const touchStartX = useRef(null);
  const imgRef      = useRef(null);

  function goTo(next) {
    if (next === current) return;
    setFading(true);
    // Brief dim, then swap src - the img element stays alive so height is preserved
    setTimeout(() => {
      setCurrent(next);
      setFading(false);
    }, 150);
  }

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 40 && current < images.length - 1) goTo(current + 1);
    if (delta < -40 && current > 0) goTo(current - 1);
    touchStartX.current = null;
  }

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className={`rounded-2xl overflow-hidden ring-2 ${cardRing} shadow-xl`}>
        <img src={images[0].media_url} alt={title} className="w-full object-cover max-h-[560px]" />
      </div>
    );
  }

  return (
    <div>
      {/* Swipe container */}
      <div
        className={`relative rounded-2xl overflow-hidden ring-2 ${cardRing} shadow-xl select-none`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* No key={current} - keep the same DOM element so height never collapses */}
        <img
          ref={imgRef}
          src={images[current].media_url}
          alt={`${title} ${current + 1}`}
          className="w-full object-cover max-h-[560px]"
          style={{ opacity: fading ? 0.4 : 1, transition: 'opacity 0.15s ease' }}
        />

        {/* Left / Right arrow buttons */}
        {current > 0 && (
          <button
            onClick={() => goTo(current - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Previous image"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        )}
        {current < images.length - 1 && (
          <button
            onClick={() => goTo(current + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Next image"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        )}

        {/* Counter badge */}
        <span className="absolute bottom-3 right-3 text-[11px] font-bold bg-black/50 text-white px-2.5 py-1 rounded-full">
          {current + 1} / {images.length}
        </span>
      </div>

      {/* Swipe hint (only shown when there are multiple images) */}
      <p className="text-center text-[11px] text-[#888] mt-2 flex items-center justify-center gap-1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
        </svg>
        Swipe or use arrows to browse images
      </p>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? `w-5 h-2 ${isDark ? 'bg-white' : 'bg-[#0F4C3A]'}`
                : `w-2 h-2 ${isDark ? 'bg-white/25' : 'bg-[#0F4C3A]/25'}`
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Story renderer — HTML (ReactQuill) or legacy plain-text markdown ─────────
function StoryRenderer({ text, textPrim, textSub, isDark }) {
  if (!text) return null;

  // New format: ReactQuill HTML
  if (text.trim().startsWith('<')) {
    return (
      <div
        className={`sf-frame-story text-base leading-relaxed ${isDark ? 'sf-frame-story--dark' : ''}`}
        dangerouslySetInnerHTML={{ __html: text.replace(/&nbsp;| /g, ' ') }}
      />
    );
  }

  // Legacy: plain-text markdown-like format
  const lines = text.split('\n');
  const elements = [];
  let bulletBuffer = [];
  let key = 0;

  function flushBullets() {
    if (!bulletBuffer.length) return;
    elements.push(
      <ul key={key++} className={`list-disc list-outside ml-5 space-y-1 text-base leading-relaxed ${textPrim}`}>
        {bulletBuffer.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    );
    bulletBuffer = [];
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^# /.test(line))        { flushBullets(); elements.push(<h2 key={key++} className={`text-xl font-bold font-[Poltawski_Nowy,serif] mt-5 mb-1 ${textPrim}`}>{line.slice(2)}</h2>); }
    else if (/^## /.test(line))  { flushBullets(); elements.push(<h3 key={key++} className={`text-base font-bold mt-4 mb-1 ${textPrim}`}>{line.slice(3)}</h3>); }
    else if (/^- /.test(line))   { bulletBuffer.push(line.slice(2)); }
    else if (/^> /.test(line))   { flushBullets(); elements.push(<blockquote key={key++} className={`border-l-4 border-[#D4AF37] pl-4 py-2 pr-2 rounded-r-xl italic text-base leading-relaxed ${isDark ? 'text-[#aaa] bg-[#1a1a1a]' : 'text-[#4a7c6f] bg-[#f0f7f4]'}`}>{line.slice(2)}</blockquote>); }
    else if (/^---$/.test(line.trim())) { flushBullets(); elements.push(<hr key={key++} className={`border-none h-px my-2 ${isDark ? 'bg-white/10' : 'bg-[#0F4C3A]/10'}`} />); }
    else if (line.trim() === '') { flushBullets(); }
    else                         { flushBullets(); elements.push(<p key={key++} className={`text-base leading-relaxed ${textPrim}`}>{line}</p>); }
  }

  flushBullets();
  return <div className="flex flex-col gap-2">{elements}</div>;
}

// ─── Session ID (anonymous visitor fingerprint) ───────────────────────────────
function getSessionId() {
  const KEY = 'sf_visitor_id';
  let id = localStorage.getItem(KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(KEY, id); }
  return id;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Reaction buttons ─────────────────────────────────────────────────────────
function ReactionButtons({ likes, dislikes, mine, onReact, small, isDark }) {
  const base = small
    ? 'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all'
    : 'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all';
  const sz = small ? 12 : 15;

  const inactiveDark = { background: 'transparent', border: '1px solid rgba(255,255,255,0.28)', color: 'rgba(255,255,255,0.65)' };

  const likeStyle = mine === 'like'
    ? { background: '#D4AF37', color: '#0F4C3A', border: 'none' }
    : isDark
      ? inactiveDark
      : { background: 'rgba(15,76,58,0.10)', color: '#0F4C3A', border: 'none' };

  const dislikeStyle = mine === 'dislike'
    ? { background: '#ef4444', color: '#fff', border: 'none' }
    : isDark
      ? inactiveDark
      : { background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: 'none' };

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onReact('like')} className={base} style={likeStyle}>
        <svg width={sz} height={sz} viewBox="0 0 24 24"
          fill={mine === 'like' ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
          <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
        </svg>
        {likes}
      </button>
      <button onClick={() => onReact('dislike')} className={base} style={dislikeStyle}>
        <svg width={sz} height={sz} viewBox="0 0 24 24"
          fill={mine === 'dislike' ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/>
          <path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17"/>
        </svg>
        {dislikes}
      </button>
    </div>
  );
}

// ─── Frame-level reactions ────────────────────────────────────────────────────
function FrameReactions({ frameId, isDark, textSub }) {
  const [likes,    setLikes]    = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [mine,     setMine]     = useState(null);

  useEffect(() => {
    const sid = getSessionId();
    supabase.from('frame_reactions').select('reaction, session_id').eq('frame_id', frameId)
      .then(({ data }) => {
        if (!data) return;
        setLikes(data.filter(r => r.reaction === 'like').length);
        setDislikes(data.filter(r => r.reaction === 'dislike').length);
        setMine(data.find(r => r.session_id === sid)?.reaction ?? null);
      });
  }, [frameId]);

  async function handleReact(type) {
    const sid = getSessionId();
    if (mine === type) {
      await supabase.from('frame_reactions').delete().eq('frame_id', frameId).eq('session_id', sid);
      setMine(null);
      type === 'like' ? setLikes(l => l - 1) : setDislikes(d => d - 1);
    } else {
      await supabase.from('frame_reactions')
        .upsert({ frame_id: frameId, session_id: sid, reaction: type }, { onConflict: 'frame_id,session_id' });
      if (mine === 'like')    setLikes(l => l - 1);
      if (mine === 'dislike') setDislikes(d => d - 1);
      type === 'like' ? setLikes(l => l + 1) : setDislikes(d => d + 1);
      setMine(type);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <ReactionButtons likes={likes} dislikes={dislikes} mine={mine} onReact={handleReact} isDark={isDark} />
    </div>
  );
}

// ─── Recursive comment node ───────────────────────────────────────────────────
function CommentNode({ node, depth, reactions, replyingTo, replyTarget,
                       replyName, replyText, setReplyName, setReplyText,
                       replySubmitting, onOpenReply, onReact, onSubmitReply,
                       cardBg, border, textPrim, textSub, isDark, inputCls,
                       isVendor, vendorName, vendorProfile }) {
  const [showReplies, setShowReplies] = useState(false);

  const rxn        = reactions[node.id] ?? { likes: 0, dislikes: 0, mine: null };
  const isRoot     = depth === 0;
  const avatarBg   = isRoot ? (isDark ? '#D4AF37' : '#0F4C3A') : '#D4AF37';
  const avatarTx   = isRoot ? (isDark ? '#0F4C3A' : '#FAF5DD') : '#0F4C3A';
  const avatarSz   = isRoot ? 'w-7 h-7 text-xs' : 'w-6 h-6 text-[10px]';
  const indent     = Math.min(depth, 3) * 20;
  const childCount = node.children?.length ?? 0;

  const replyBtnColor   = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,76,58,0.5)';
  const toggleBtnColor  = isDark ? 'rgba(212,175,55,0.9)'  : '#0F4C3A';

  // Auto-expand only when a NEW reply is added (childCount increases after mount)
  const prevChildCount = useRef(childCount);
  useEffect(() => {
    if (childCount > prevChildCount.current) setShowReplies(true);
    prevChildCount.current = childCount;
  }, [childCount]);

  return (
    <div style={{ marginLeft: indent }}>
      {/* Card */}
      <div className={`${cardBg} border ${border} rounded-2xl px-5 ${isRoot ? 'py-4' : 'py-3'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Avatar: logo image or initial letter */}
            <div className={`${avatarSz} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold`}
              style={{ background: node.avatar_url ? 'transparent' : avatarBg, color: avatarTx }}>
              {node.avatar_url
                ? <img src={node.avatar_url} alt={node.name} className="w-full h-full object-cover" />
                : node.name.charAt(0).toUpperCase()
              }
            </div>
            <span className={`${isRoot ? 'text-sm' : 'text-xs'} font-semibold ${textPrim}`}>{node.name}</span>
            {node.is_vendor && (
              <span className={`text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full ${isDark ? 'bg-gold text-primary' : 'bg-[#0F4C3A] text-[#D4AF37]'}`}>
                Frame Vendor
              </span>
            )}
            {!isRoot && (
              <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded-full">reply</span>
            )}
          </div>
          <span className={`${isRoot ? 'text-[11px]' : 'text-[10px]'} ${textSub} flex-shrink-0`}>{timeAgo(node.created_at)}</span>
        </div>
        <p className={`${isRoot ? 'text-sm' : 'text-xs'} leading-relaxed ${textSub} mb-3`}>{node.comment}</p>
        <div className="flex items-center gap-4 flex-wrap">
          <ReactionButtons likes={rxn.likes} dislikes={rxn.dislikes} mine={rxn.mine}
            onReact={type => onReact(node.id, type)} small isDark={isDark} />
          <button onClick={() => onOpenReply(node.id, node.name)}
            style={{ color: replyBtnColor }}
            className="text-[11px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-70">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/>
            </svg>
            {replyingTo === node.id ? 'Cancel' : 'Reply'}
          </button>
          {childCount > 0 && (
            <button
              onClick={() => setShowReplies(v => !v)}
              style={{ color: toggleBtnColor }}
              className="text-[11px] font-semibold flex items-center gap-1 transition-opacity hover:opacity-70 ml-auto">
              <svg
                width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: 'transform 0.2s', transform: showReplies ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              {showReplies ? 'Hide' : `${childCount} ${childCount === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
        </div>
      </div>

      {/* Reply form */}
      {replyingTo === node.id && (
        <ReplyForm
          target={replyTarget} replyName={replyName} replyText={replyText}
          setReplyName={setReplyName} setReplyText={setReplyText}
          onSubmit={onSubmitReply} submitting={replySubmitting}
          border={border} isDark={isDark} inputCls={inputCls} textPrim={textPrim}
          isVendor={isVendor} vendorName={vendorName} vendorProfile={vendorProfile}
        />
      )}

      {/* Children - collapsed by default, toggled per node */}
      {showReplies && childCount > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {node.children.map(child => (
            <CommentNode key={child.id} node={child} depth={depth + 1}
              reactions={reactions} replyingTo={replyingTo} replyTarget={replyTarget}
              replyName={replyName} replyText={replyText}
              setReplyName={setReplyName} setReplyText={setReplyText}
              replySubmitting={replySubmitting}
              onOpenReply={onOpenReply} onReact={onReact} onSubmitReply={onSubmitReply}
              cardBg={cardBg} border={border} textPrim={textPrim} textSub={textSub}
              isDark={isDark} inputCls={inputCls}
              isVendor={isVendor} vendorName={vendorName} vendorProfile={vendorProfile} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared reply form ────────────────────────────────────────────────────────
function ReplyForm({ target, replyName, replyText, setReplyName, setReplyText, onSubmit, submitting,
                     border, isDark, inputCls, vendorName, vendorProfile, isVendor, textPrim }) {
  return (
    <div className={`ml-6 mt-2 p-4 rounded-2xl border ${border} ${isDark ? 'bg-[#111]' : 'bg-[#f0f0eb]'}`}>
      <div className="flex flex-col gap-2">
        {isVendor ? (
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${isDark ? 'bg-gold' : 'bg-[#0F4C3A]'}`}>
              {vendorProfile?.business_logo
                ? <img src={vendorProfile.business_logo} alt={vendorName} className="w-full h-full object-cover" />
                : <span className={`text-[10px] font-bold ${isDark ? 'text-primary' : 'text-[#FAF5DD]'}`}>{(vendorName || 'V')[0].toUpperCase()}</span>
              }
            </div>
            <span className={`text-xs font-semibold ${textPrim}`}>{vendorName}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-gold text-primary' : 'bg-[#0F4C3A] text-[#D4AF37]'}`}>Frame Vendor</span>
          </div>
        ) : (
          <input type="text" placeholder="Your name" value={replyName} maxLength={60}
            onChange={e => setReplyName(e.target.value)} className={inputCls} />
        )}
        <textarea placeholder={`Replying to ${target}…`} value={replyText} maxLength={500}
          rows={2} onChange={e => setReplyText(e.target.value)} className={`${inputCls} resize-none`} />
        <button onClick={onSubmit}
          disabled={submitting || (!isVendor && !replyName.trim()) || !replyText.trim()}
          className={`self-start px-5 py-2 rounded-xl text-xs font-bold transition-opacity disabled:opacity-40 hover:opacity-90
            ${isDark ? 'bg-[#FAF5DD] text-[#0F4C3A]' : 'bg-[#0F4C3A] text-[#FAF5DD]'}`}>
          {submitting ? 'Posting…' : 'Post Reply'}
        </button>
      </div>
    </div>
  );
}

// ─── Comments section ─────────────────────────────────────────────────────────
function CommentsSection({ frameId, frameOwnerId, isDark, border, cardBg, textPrim, textSub }) {
  const { user }  = useAuth();

  // Only the signed-in user who owns this frame is treated as its vendor.
  // Other signed-in visitors (including partners) comment as regular guests.
  const isOwner = !!user && user.id === frameOwnerId;

  // Fetch vendor profile once when logged in as the frame's owner
  const [vendorProfile, setVendorProfile] = useState(null);
  useEffect(() => {
    if (!isOwner) return;
    supabase.from('users').select('full_name, business_name, business_logo').eq('id', user.id).single()
      .then(({ data }) => { if (data) setVendorProfile(data); });
  }, [isOwner, user?.id]);

  const vendorName = vendorProfile
    ? (vendorProfile.business_name || vendorProfile.full_name || user?.email || '')
    : '';

  const [comments,        setComments]        = useState([]);
  const [reactions,       setReactions]       = useState({});
  const [replyingTo,      setReplyingTo]      = useState(null);
  const [replyParentId,   setReplyParentId]   = useState(null);
  const [replyTarget,     setReplyTarget]     = useState('');
  const [replyName,       setReplyName]       = useState('');
  const [replyText,       setReplyText]       = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [name,            setName]            = useState('');
  const [comment,         setComment]         = useState('');
  const [submitting,      setSubmitting]      = useState(false);
  const [submitted,       setSubmitted]       = useState(false);
  const [error,           setError]           = useState('');
  const [honeypot,        setHoneypot]        = useState(''); // filled only by bots

  const sid = getSessionId();

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors
    ${isDark
      ? 'bg-[#111]/40 border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37]/50'
      : 'bg-[#f5f5f0] border-[#0F4C3A]/15 text-[#0F4C3A] placeholder-[#0F4C3A]/35 focus:border-[#0F4C3A]/40'}`;

  useEffect(() => {
    (async () => {
      const { data: cmts } = await supabase
        .from('frame_comments')
        .select('id, name, comment, parent_id, is_vendor, avatar_url, created_at')
        .eq('frame_id', frameId)
        .order('created_at', { ascending: true });
      if (!cmts || cmts.length === 0) return;
      setComments(cmts);

      const ids = cmts.map(c => c.id);
      const { data: rxns } = await supabase
        .from('comment_reactions').select('comment_id, reaction, session_id').in('comment_id', ids);
      if (rxns) {
        const map = {};
        for (const id of ids) {
          const r = rxns.filter(x => x.comment_id === id);
          map[id] = {
            likes:    r.filter(x => x.reaction === 'like').length,
            dislikes: r.filter(x => x.reaction === 'dislike').length,
            mine:     r.find(x => x.session_id === sid)?.reaction ?? null,
          };
        }
        setReactions(map);
      }
    })();
  }, [frameId]);

  async function handleCommentReact(commentId, type) {
    const cur = reactions[commentId] ?? { likes: 0, dislikes: 0, mine: null };
    if (cur.mine === type) {
      await supabase.from('comment_reactions').delete()
        .eq('comment_id', commentId).eq('session_id', sid);
      setReactions(prev => ({ ...prev, [commentId]: {
        likes:    type === 'like'    ? cur.likes - 1    : cur.likes,
        dislikes: type === 'dislike' ? cur.dislikes - 1 : cur.dislikes,
        mine: null,
      }}));
    } else {
      await supabase.from('comment_reactions')
        .upsert({ comment_id: commentId, session_id: sid, reaction: type }, { onConflict: 'comment_id,session_id' });
      setReactions(prev => ({ ...prev, [commentId]: {
        likes:    (type === 'like'    ? cur.likes + 1    : cur.likes)    - (cur.mine === 'like'    ? 1 : 0),
        dislikes: (type === 'dislike' ? cur.dislikes + 1 : cur.dislikes) - (cur.mine === 'dislike' ? 1 : 0),
        mine: type,
      }}));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // Honeypot: bots fill hidden fields, humans don't
    if (honeypot) { setName(''); setComment(''); return; }
    const displayName = isOwner ? vendorName : name.trim();
    if (!displayName || !comment.trim()) return;
    setSubmitting(true); setError('');
    const { data, error: err } = await supabase
      .from('frame_comments')
      .insert({
        frame_id:   frameId,
        name:       displayName,
        comment:    comment.trim(),
        parent_id:  null,
        is_vendor:  isOwner,
        avatar_url: isOwner ? (vendorProfile?.business_logo || null) : null,
      })
      .select().single();
    if (err) { setError('Could not post comment. Please try again.'); }
    else {
      setComments(prev => [...prev, data]);
      setReactions(prev => ({ ...prev, [data.id]: { likes: 0, dislikes: 0, mine: null } }));
      setName(''); setComment('');
      setSubmitted(true); setTimeout(() => setSubmitted(false), 3000);
    }
    setSubmitting(false);
  }

  function openReplyForm(itemId, authorName) {
    if (replyingTo === itemId) {
      setReplyingTo(null);
    } else {
      setReplyingTo(itemId);
      setReplyTarget(authorName);
      setReplyParentId(itemId);
      setReplyName('');
      setReplyText('');
    }
  }

  async function handleReplySubmit() {
    if (!replyName.trim() || !replyText.trim()) return;
    setReplySubmitting(true);
    const displayReplyName = isOwner ? vendorName : replyName.trim();
    if (!displayReplyName || !replyText.trim()) { setReplySubmitting(false); return; }
    const { data, error: err } = await supabase
      .from('frame_comments')
      .insert({
        frame_id:   frameId,
        name:       displayReplyName,
        comment:    replyText.trim(),
        parent_id:  replyingTo,
        is_vendor:  isOwner,
        avatar_url: isOwner ? (vendorProfile?.business_logo || null) : null,
      })
      .select().single();
    if (!err && data) {
      setComments(prev => [...prev, data]);
      setReactions(prev => ({ ...prev, [data.id]: { likes: 0, dislikes: 0, mine: null } }));
      setReplyName(''); setReplyText(''); setReplyingTo(null);
    }
    setReplySubmitting(false);
  }

  // Build nested tree from flat list - each node gets a .children array
  function buildTree(flat) {
    const map = {};
    flat.forEach(c => { map[c.id] = { ...c, children: [] }; });
    const roots = [];
    flat.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].children.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });
    return roots;
  }

  const roots = buildTree(comments);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
        Comments {comments.length > 0 && `(${comments.length})`}
      </p>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Honeypot - visually hidden, only bots fill this */}
        <input
          type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)}
          tabIndex={-1} autoComplete="off" aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        />
        {/* Name row - locked to vendor identity when the frame owner is signed in */}
        {isOwner ? (
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${isDark ? 'bg-gold' : 'bg-[#0F4C3A]'}`}>
              {vendorProfile?.business_logo
                ? <img src={vendorProfile.business_logo} alt={vendorName} className="w-full h-full object-cover" />
                : <span className={`text-xs font-bold ${isDark ? 'text-primary' : 'text-[#FAF5DD]'}`}>{(vendorName || 'V')[0].toUpperCase()}</span>
              }
            </div>
            <span className={`text-sm font-semibold ${textPrim}`}>{vendorName}</span>
            <span className={`text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full ${isDark ? 'bg-gold text-primary' : 'bg-[#0F4C3A] text-[#D4AF37]'}`}>Frame Vendor</span>
          </div>
        ) : (
          <input type="text" placeholder="Your name" value={name} maxLength={60}
            onChange={e => setName(e.target.value)} className={inputCls} required />
        )}
        <textarea placeholder="Share your thoughts about this artwork…" value={comment}
          maxLength={500} rows={3} onChange={e => setComment(e.target.value)}
          className={`${inputCls} resize-none`} required />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={submitting || (!isOwner && !name.trim()) || !comment.trim()}
          className={`self-start px-6 py-2.5 rounded-xl text-sm font-bold transition-opacity
            disabled:opacity-40 hover:opacity-90
            ${isDark ? 'bg-[#FAF5DD] text-[#0F4C3A]' : 'bg-[#0F4C3A] text-[#FAF5DD]'}`}>
          {submitting ? 'Posting…' : submitted ? '✓ Posted!' : 'Post Comment'}
        </button>
      </form>

      {/* Comments list - recursive tree */}
      {roots.length === 0 ? (
        <p className={`text-sm ${textSub} italic`}>Be the first to leave a comment.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {roots.map(root => (
            <CommentNode
              key={root.id}
              node={root}
              depth={0}
              reactions={reactions}
              replyingTo={replyingTo}
              replyTarget={replyTarget}
              replyName={replyName}
              replyText={replyText}
              setReplyName={setReplyName}
              setReplyText={setReplyText}
              replySubmitting={replySubmitting}
              onOpenReply={openReplyForm}
              onReact={handleCommentReact}
              onSubmitReply={handleReplySubmit}
              cardBg={cardBg}
              border={border}
              textPrim={textPrim}
              textSub={textSub}
              isDark={isDark}
              inputCls={inputCls}
              isVendor={isOwner}
              vendorName={vendorName}
              vendorProfile={vendorProfile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SHA-256 hash (same algo used when setting a password in FrameEditor) ────
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Password Gate ────────────────────────────────────────────────────────────
function PasswordGate({ frameId, frameTitle, isDark, onUnlocked }) {
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [checking,  setChecking]  = useState(false);
  const [error,     setError]     = useState('');
  const [attempts,  setAttempts]  = useState(0);
  const [shake,     setShake]     = useState(false);

  const pageBg   = isDark ? 'bg-primary'   : 'bg-white';
  const textPrim = isDark ? 'text-white'   : 'text-[#0F4C3A]';
  const textSub  = isDark ? 'text-[#b0b0b0]' : 'text-[#4a7c6f]';
  const border   = isDark ? 'border-white/10' : 'border-[#0F4C3A]/10';
  const cardBg   = isDark ? 'bg-[#1a1a1a]'   : 'bg-white';
  const inputCls = `w-full border ${isDark ? 'border-white/15 bg-[#111] text-white placeholder:text-white/30' : 'border-[#0F4C3A]/20 bg-[#f8f7f4] text-[#111] placeholder:text-[#9ca3af]'} rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ${isDark ? 'focus:ring-white/20' : 'focus:ring-[#0F4C3A]/20'} transition-all`;

  async function handleUnlock(e) {
    e.preventDefault();
    if (!password.trim() || checking) return;
    setChecking(true);
    setError('');
    try {
      const hash = await sha256(password.trim());
      const { data, error: rpcErr } = await supabase.rpc('verify_frame_password', {
        p_frame_id:    frameId,
        p_password_hash: hash,
      });
      if (rpcErr) throw rpcErr;
      if (data === true) {
        sessionStorage.setItem(`sf_unlocked_${frameId}`, '1');
        onUnlocked();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPassword('');
        setError(newAttempts >= 3
          ? 'Incorrect password. Contact your vendor for the correct password.'
          : 'Incorrect password. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className={`min-h-screen ${pageBg} flex flex-col items-center justify-center px-6`}>
      <div className={`w-full max-w-sm ${cardBg} border ${border} rounded-3xl p-8 text-center`}
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>

        {/* Lock icon */}
        <div className="w-14 h-14 rounded-full bg-[#0F4C3A]/10 flex items-center justify-center mx-auto mb-5">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="#0F4C3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>

        <h1 className={`text-xl font-bold font-[Poltawski_Nowy,serif] mb-2 ${textPrim}`}>
          {frameTitle || 'Protected Frame'}
        </h1>
        <p className={`text-sm mb-6 ${textSub}`}>
          This frame is password protected. Enter the password your vendor shared with you to view its contents.
        </p>

        <style>{`@keyframes pw-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>
        <form onSubmit={handleUnlock} className="flex flex-col gap-3 text-left">
          <div className="relative" style={shake ? { animation: 'pw-shake 0.5s ease' } : {}}>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter frame password…"
              className={`${inputCls} pr-11 ${error ? 'border-red-400 focus:ring-red-400/30' : ''}`}
              autoFocus
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${textSub} hover:opacity-70 transition-opacity`}>
              {showPw ? (
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

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={checking || !password.trim()}
            className="w-full bg-[#0F4C3A] text-[#FAF5DD] font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-40">
            {checking ? 'Verifying…' : 'Unlock Frame'}
          </button>
        </form>

        <Link to="/" className={`block mt-5 text-xs ${textSub} hover:opacity-70 transition-opacity`}>
          ← Back to ScanMyFrame
        </Link>
      </div>
    </div>
  );
}

export default function FramePage() {
  const { slug }                        = useParams();
  const { isDark, toggleTheme }         = useTheme();
  const [frame,          setFrame]      = useState(null);
  const [loading,        setLoading]    = useState(true);
  const [notFound,       setNotFound]   = useState(false);
  const [unlocked,       setUnlocked]   = useState(false);
  const [vendorPlanId,   setVendorPlanId] = useState('free');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { frame: data, error } = await getFrameBySlug(slug);
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setFrame(data);
        // Check session unlock before recording a scan
        const alreadyUnlocked = !data.is_password_protected ||
          sessionStorage.getItem(`sf_unlocked_${data.id}`) === '1';
        if (alreadyUnlocked) {
          setUnlocked(true);
          recordQRScan(data.id, getVisitorId());
        }
        // Fetch vendor's subscription plan via RPC (bypasses RLS, works for all visitors)
        if (data.user_id) {
          supabase
            .rpc('get_vendor_plan', { target_user_id: data.user_id })
            .then(({ data: planId }) => {
              if (!cancelled && planId) setVendorPlanId(planId);
            });
        }
      }
      if (!cancelled) setLoading(false);
    }
    load();

    return () => { cancelled = true; };
  }, [slug]);

  const isBusinessOrTrial = ['business', 'trial'].includes(vendorPlanId);
  const isPro             = vendorPlanId === 'pro';
  const showVendorCard    = ['trial', 'pro', 'business'].includes(vendorPlanId);

  const pageBg     = isDark ? 'bg-primary'    : 'bg-white';
  const textPrim   = isDark ? 'text-white'       : 'text-[#0F4C3A]';
  const textSub    = isDark ? 'text-[#b0b0b0]'  : 'text-[#4a7c6f]';
  const border     = isDark ? 'border-white/10'  : 'border-[#0F4C3A]/10';
  const cardBg     = isDark ? 'bg-[#1a1a1a]'    : 'bg-white';
  const cardRing   = isDark ? 'ring-white/10'    : 'ring-[#0F4C3A]/10';
  const logo       = isDark ? scanMyFrameLogoAlt  : scanMyFrameLogo;

  if (loading) {
    return (
      <div className={`min-h-screen ${pageBg} flex items-center justify-center`}>
        <div className="w-9 h-9 border-[3px] border-[#0F4C3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Password gate - shown when frame is loaded but not yet unlocked
  if (frame && !unlocked) {
    return (
      <PasswordGate
        frameId={frame.id}
        frameTitle={frame.title}
        isDark={isDark}
        onUnlocked={() => { setUnlocked(true); recordQRScan(frame.id, getVisitorId()); }}
      />
    );
  }

  if (notFound) {
    return (
      <div className={`min-h-screen ${pageBg} flex flex-col items-center justify-center px-6 text-center`}>
        <div className="text-5xl mb-5">🖼</div>
        <h1 className={`text-2xl font-bold ${textPrim} font-[Poltawski_Nowy,serif] mb-2`}>Frame not found</h1>
        <p className={`text-sm ${textSub} mb-8`}>This frame doesn't exist or may have been removed.</p>
        <Link to="/" className="bg-[#0F4C3A] text-[#FAF5DD] px-7 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
          Back to ScanMyFrame
        </Link>
      </div>
    );
  }

  // Separate artwork, extra images, video
  const artwork     = frame.media?.find(m => m.media_type === 'image');
  const extraImages = frame.media?.filter(m => m.media_type === 'extra_image') || [];
  const allImages   = artwork ? [artwork, ...extraImages] : extraImages;
  const video       = frame.media?.find(m => m.media_type === 'video');
  const width       = frame.size?.width  || frame.width;
  const height      = frame.size?.height || frame.height;
  const creatorName    = frame.users?.business_name || frame.users?.full_name || null;
  const businessLogo   = frame.users?.business_logo   || null;
  const businessEmail  = frame.users?.business_email  || null;
  const businessPhone  = frame.users?.phone           || null;
  const businessType   = frame.users?.business_type   || null;
  const businessCountry = frame.users?.country        || null;
  const features       = frame.frame_features || [];

  return (
    <div className={`min-h-screen ${pageBg}`}>

      {/* Header */}
      <header className={`border-b ${border} px-6 py-4 flex items-center justify-between max-w-3xl mx-auto`}>
        {isBusinessOrTrial && businessLogo && 
          <img src={businessLogo} alt={creatorName || 'Vendor'} className="h-8 w-auto object-contain max-w-[140px]" />
          }
        {!isBusinessOrTrial &&
          <Link to="/"><img src={logo} alt="ScanMyFrame" className="h-7 w-auto" /></Link>
        }
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme}
            className={`w-8 h-8 rounded-full flex items-center justify-center border ${border} ${cardBg} ${textSub} hover:opacity-80 transition-opacity`}
            aria-label="Toggle theme">
            {isDark ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-7">
        
        {/* Image gallery */}
        <ImageGallery images={allImages} title={frame.title} cardRing={cardRing} isDark={isDark} />

        {/* Title */}

        <h1 className={`text-3xl font-bold ${textPrim} font-[Poltawski_Nowy,serif] leading-tight`}>{frame.title}</h1>


        {/* Story */}
        {frame.description && (
          <div className="min-w-0">
            <p className="text-md font-bold uppercase tracking-widest text-[#D4AF37] mb-3">The Story</p>
            <StoryRenderer text={frame.description} textPrim={textPrim} textSub={textSub} isDark={isDark} />
          </div>
        )}

        {/* Video */}
        {video && (
          <div className={`rounded-2xl overflow-hidden ring-1 ${cardRing} ${cardBg}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] px-6 pt-5 pb-3">Event Video</p>
            <video src={video.media_url} controls className="w-full" />
          </div>
        )}
        
        <FrameReactions frameId={frame.id} isDark={isDark} textSub={textSub} />

        <hr className={`${isDark? 'text-secondary' : 'text-primary'}`}/>

        {/*owner, size and feature */}
        <div className="text-sm flex flex-col gap-2">
          <span className={`${textPrim}`}>Frame Owner: {frame.client_name}</span>
          {width && height && (
            <span className={`${textPrim} rounded-full tracking-wide`}>
              Frame Size: {width}" × {height}"
            </span>
          )}
          <div className="flex flex-wrap gap-2 items-center">
          <span className={`${textPrim}`}>Frame features:</span>
            {features.map(tag => (
              <span key={tag} className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${textPrim} ${isDark ? 'border-white/15' : 'border-[#0F4C3A]/20'}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Vendor card - Pro & Business plans only */}
        {showVendorCard && creatorName && (
          <div className={`rounded-2xl border ${border} overflow-hidden`}>
            {/* Card header bar */}
            <div className="bg-[#0F4C3A] px-5 py-3 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#D4AF37]">
                Frame Vendor
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#FAF5DD]/70">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Verified on ScanMyFrame
              </span>
            </div>

            {/* Card body */}
            <div className={`${cardBg} px-5 py-5`}>
              <div className="flex items-start gap-4">
                {/* Logo / avatar */}
                <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-[#0F4C3A]/15 flex items-center justify-center bg-[#0F4C3A]/5">
                  {businessLogo
                    ? <img src={businessLogo} alt={creatorName} className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold text-[#0F4C3A]">{creatorName.charAt(0).toUpperCase()}</span>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-base font-bold ${textPrim} leading-tight mb-1`}>{creatorName}</h3>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {businessType && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#a8862a] border border-[#D4AF37]/25">
                        {businessType}
                      </span>
                    )}
                    {businessCountry && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isDark ? 'border-white/10 text-[#888]' : 'border-[#0F4C3A]/15 text-[#4a7c6f]'}`}>
                        {businessCountry}
                      </span>
                    )}
                  </div>

                  <p className={`text-xs leading-relaxed ${textSub} mb-4`}>
                    Interested in a similar frame? Reach out to {creatorName} directly to make order.
                  </p>

                  {/* Contact actions */}
                  <div className="flex flex-wrap gap-2">
                    {businessEmail && (
                      <a
                        href={`mailto:${businessEmail}?subject=Frame enquiry from ScanMyFrame&body=Hi ${creatorName},%0A%0AI saw your frame "${frame.title}" on ScanMyFrame and I'd love to discuss a similar project.%0A%0AThanks`}
                        className="inline-flex items-center gap-1.5 bg-[#0F4C3A] text-[#FAF5DD] text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        Email vendor
                      </a>
                    )}
                    {businessPhone && (
                      <a
                        href={`tel:${businessPhone}`}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-opacity hover:opacity-80
                          ${isDark ? 'border-white/15 text-[#b0b0b0]' : 'border-[#0F4C3A]/20 text-[#0F4C3A]'}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                        </svg>
                        Call vendor
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments - only rendered when vendor has enabled them */}
        {frame.comments_enabled !== false && (
          <div className={`pt-4 border-t ${border}`}>
            <CommentsSection
              frameId={frame.id}
              frameOwnerId={frame.user_id}
              isDark={isDark}
              border={border}
              cardBg={cardBg}
              textPrim={textPrim}
              textSub={textSub}
            />
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center pt-4 border-t ${border} ${isBusinessOrTrial || isPro ? 'justify-between' : 'justify-center'}`}>
          {/* Powered by ScanMyFrame - hidden on Business & Trial */}
          {!isBusinessOrTrial && (
            <Link to="/" className={`flex items-center gap-1.5 text-xs ${textSub} hover:opacity-80 transition-opacity`}>
              <span>Powered by</span>
              <img src={logo} alt="ScanMyFrame" className="h-4 w-auto opacity-60" />
            </Link>
          )}

          {/* Frame by vendor - Business, Trial, Pro */}
          {(isBusinessOrTrial || isPro) && creatorName && (
            <div className="flex items-center gap-1.5">
              {businessLogo && (
                <img src={businessLogo} alt={creatorName} className="h-5 w-5 rounded-full object-cover border border-[#0F4C3A]/10" />
              )}
              <span className={`text-xs ${textSub}`}>
                Frame by <strong className={textPrim}>{creatorName}</strong>
              </span>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
