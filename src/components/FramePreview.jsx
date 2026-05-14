import { useParams, Link } from 'react-router-dom';
import logo from '../assets/images/Scanframe alt.png';

// ─── iPhone 17 Pro Max Live Preview ──────────────────────────────────────────
function parseStoryContent(markdown) {
  if (!markdown) return [];

  const lines = markdown.split('\n');
  const blocks = [];
  let currentList = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === '---') {
      if (currentList.length) blocks.push({ type: 'list', items: currentList }), currentList = [];
      blocks.push({ type: 'hr' });
    } else if (line.startsWith('# ')) {
      if (currentList.length) blocks.push({ type: 'list', items: currentList }), currentList = [];
      blocks.push({ type: 'h2', text: line.slice(2) });
    } else if (line.startsWith('## ')) {
      if (currentList.length) blocks.push({ type: 'list', items: currentList }), currentList = [];
      blocks.push({ type: 'h3', text: line.slice(3) });
    } else if (line.startsWith('> ')) {
      if (currentList.length) blocks.push({ type: 'list', items: currentList }), currentList = [];
      blocks.push({ type: 'blockquote', text: line.slice(2) });
    } else if (line.startsWith('- ')) {
      currentList.push(line.slice(2));
    } else if (line.trim() === '') {
      if (currentList.length) blocks.push({ type: 'list', items: currentList }), currentList = [];
    } else {
      if (currentList.length) blocks.push({ type: 'list', items: currentList }), currentList = [];
      if (line.trim()) blocks.push({ type: 'p', text: line });
    }
  }

  if (currentList.length) blocks.push({ type: 'list', items: currentList });
  return blocks;
}

function renderStoryBlock(block, idx) {
  const baseStyle = { fontSize: 12, color: '#4a7c6f', lineHeight: 1.6, margin: '8px 0' };
  const key = `story-${idx}`;

  switch (block.type) {
    case 'h2':
      return <h2 key={key} style={{ ...baseStyle, fontSize: 14, fontWeight: 700, color: '#0F4C3A', margin: '10px 0 6px' }}>{block.text}</h2>;
    case 'h3':
      return <h3 key={key} style={{ ...baseStyle, fontSize: 13, fontWeight: 600, color: '#0F4C3A', margin: '8px 0 4px' }}>{block.text}</h3>;
    case 'p':
      return <p key={key} style={{ ...baseStyle, margin: '6px 0' }}>{block.text}</p>;
    case 'blockquote':
      return <blockquote key={key} style={{ ...baseStyle, borderLeft: '3px solid #D4AF37', paddingLeft: 10, fontStyle: 'italic', color: '#6b7280' }}>{block.text}</blockquote>;
    case 'list':
      return (
        <ul key={key} style={{ ...baseStyle, margin: '8px 0', paddingLeft: 20 }}>
          {block.items.map((item, i) => <li key={i} style={{ margin: '3px 0' }}>{item}</li>)}
        </ul>
      );
    case 'hr':
      return <hr key={key} style={{ border: 'none', borderTop: '1px solid rgba(15,76,58,0.08)', margin: '8px 0' }} />;
    default:
      return null;
  }
}

export default function FramePreview({ form, artworkFile }) {
  const PHONE_W  = 264;
  const PHONE_H  = 560;
  const FRAME_PX = 13;
  const SCREEN_W = PHONE_W - FRAME_PX * 2;
  const SCREEN_H = PHONE_H - FRAME_PX * 2;
  const SCALE    = SCREEN_W / 393; // 393 = iPhone 17 Pro Max logical width

  const title      = form.title      || 'Art Title';
  const frameOwner = form.frameOwner || '';
  const story      = form.story      || '';
  const artworkUrl = artworkFile ? URL.createObjectURL(artworkFile) : null;
  const frameSize  = form.width && form.height ? `${form.width}" × ${form.height}"` : '';
  

  return (
    <div style={{ position: 'sticky', top: 16 }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 14, textAlign: 'center' }}>
        Live Preview
      </p>

      {/* Phone shell */}
      <div style={{
        width: PHONE_W, height: PHONE_H,
        background: 'linear-gradient(160deg, #3a3a3a 0%, #1a1a1a 100%)',
        borderRadius: 44, padding: FRAME_PX,
        boxShadow: '0 0 0 1.5px #555, inset 0 0 0 1px #3a3a3a, 0 30px 70px rgba(0,0,0,0.55)',
        position: 'relative', boxSizing: 'border-box',
      }}>
        {/* Side buttons (decorative) */}
        <div style={{ position: 'absolute', left: -3, top: 100, width: 3, height: 30, background: '#444', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: -3, top: 140, width: 3, height: 50, background: '#444', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: -3, top: 200, width: 3, height: 50, background: '#444', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', right: -3, top: 140, width: 3, height: 60, background: '#444', borderRadius: '0 2px 2px 0' }} />

        {/* Dynamic Island */}
        <div style={{
          position: 'absolute', top: FRAME_PX + 10, left: '50%', transform: 'translateX(-50%)',
          width: 110, height: 30, background: '#111', borderRadius: 20, zIndex: 10,
        }} />

        {/* Screen */}
        <div style={{
          width: SCREEN_W, height: SCREEN_H,
          background: '#fff', borderRadius: 32,
          overflow: 'hidden', position: 'relative',
        }}>
          {/* Status bar area (behind Dynamic Island) */}
          <div style={{ height: 50, background: '#fff' }} />

          {/* Scaled FramePage content */}
          <div style={{
            width: 393, overflow: 'hidden',
            transformOrigin: 'top left',
            transform: `scale(${SCALE})`,
            fontFamily: "'Montserrat Alternates', system-ui, sans-serif",
            pointerEvents: 'none', userSelect: 'none',
            height: Math.round((SCREEN_H - 50) / SCALE),
          }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid rgba(15,76,58,0.1)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link to="/"><img src={logo} alt="ScanMyFrame" className="h-7 w-auto" /></Link>
              <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(15,76,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4a7c6f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
                </svg>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Artwork display */}
              <div style={{ borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(135deg, #0F4C3A 0%, #1a6b52 60%, #D4AF37 100%)', minHeight: 210, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' }}>
                {artworkUrl ? (
                  <img src={artworkUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Artwork preview" />
                ) : (
                  <>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>ARTWORK</span>
                  </>
                )}
              </div>

              {/* Title + reactions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0F4C3A', fontFamily: 'Georgia, serif', lineHeight: 1.25 }}>
                  {title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4a7c6f' }}>React</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <span style={{ background: 'rgba(15,76,58,0.1)', color: '#0F4C3A', borderRadius: 7, padding: '3px 8px', fontSize: 10, fontWeight: 700 }}>👍 0</span>
                    <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 7, padding: '3px 8px', fontSize: 10, fontWeight: 700 }}>👎 0</span>
                  </div>
                </div>
              </div>

              {/* Story preview */}
              {story && (
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#D4AF37' }}>The Story</p>
                  <div style={{ fontSize: 12, color: '#4a7c6f', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 8, WebkitBoxOrient: 'vertical' }}>
                    {story.trim().startsWith('<')
                      ? <div dangerouslySetInnerHTML={{ __html: story }} />
                      : parseStoryContent(story).map(renderStoryBlock)
                    }
                  </div>
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid rgba(15,76,58,0.08)', margin: 0 }} />

              {/* Frame details */}
              <div style={{ fontSize: 12, color: '#4a7c6f', lineHeight: 1.6 }}>
                <div>
                  Frame Owner: <strong style={{ color: '#0F4C3A' }}>{frameOwner}</strong>
                  </div>
                <div style={{ marginBottom: 8 }}>
                  Frame Size: <strong style={{ color: '#0F4C3A' }}>{frameSize}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
