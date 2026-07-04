import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import QRCode from 'qrcode';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabaseClient';
import QRCodeGenerator from '../components/QRCodeGenerator';
import FrameEditor from '../components/FrameEditor';
import BillingTab from '../components/BillingTab';
import AIChatWidget from '../components/AIChatWidget';
import FrameGuide, { GuideChip } from '../components/FrameGuide';

import scanFrameLogo from '../assets/images/Scanframe.png';
import scanFrameLogoAlt from '../assets/images/Scanframe alt.png';
import NotificationDropdown from '../components/NotificationDropDown';
import { sendLoginAlertEmail, checkAndUpdateKnownDevices, buildDeviceInfo, sendDeletionRequestEmail } from '../services/supabaseHelpers';

// ?"??"??"? Icon primitive ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
const Icon = ({ path, size = 20, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d={path} />
  </svg>
);
const icons = {
  grid:     'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z',
  frame:    'M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z M8 2v4M16 2v4M8 18v4M16 18v4',
  qr:       'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z',
  chart:    'M18 20V10M12 20V4M6 20v-6',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
  billing:  'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  signout:  'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  sun:      'M12 3v1m0 16v1M4.22 4.22l.71.71m12.02 12.02.71.71M3 12h1m16 0h1M4.22 19.78l.71-.71M18.36 5.64l-.71.71M12 7a5 5 0 100 10A5 5 0 0012 7z',
  moon:     'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  plus:     'M12 5v14M5 12h14',
  edit:     'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:    'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  eye:      'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  scan:     'M4 7V4h3M17 4h3v3M4 17v3h3M17 20h3v-3M9 12h6M12 9v6',
  bell:     'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  menu:     'M4 6h16M4 12h16M4 18h16',
  copy:     'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  pin:      'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z',
  check:    'M5 13l4 4L19 7',
  empty:    'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  close:    'M18 6L6 18M6 6l12 12',
  gift:     'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
};

const NAV = [
  { id: 'overview',  label: 'Overview',     icon: 'grid'     },
  { id: 'frames',    label: 'My Frames',    icon: 'frame'    },
  { id: 'create',    label: 'Create Frame', icon: 'plus'     },
  { id: 'analytics', label: 'Analytics',   icon: 'chart'    },
  { id: 'billing',   label: 'Billing',      icon: 'billing'  },
  { id: 'settings',  label: 'Settings',     icon: 'settings' },
];

const SETTINGS_SECTIONS = [
  { id: 'profile',       label: 'Profile',       icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0' },
  { id: 'branding',      label: 'QR Branding',   icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 17h3v3h-3z', plans: ['business', 'trial'] },
  { id: 'notifications', label: 'Notifications', icon: 'M18 16v-5a6 6 0 10-12 0v5l-2 3h16l-2-3zM10 22a2 2 0 004 0' },
  { id: 'security',      label: 'Security',      icon: 'M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z' },
  { id: 'danger',        label: 'Danger zone',   icon: 'M12 2L1 21h22L12 2zM12 9v5M12 18v.01' },
];

// ?"??"??"? Theme-aware colour tokens (no Tailwind gray) ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
// All colours are explicit hex values so Tailwind's gray override never bites.
const t = {
  // backgrounds
  pageBg:      (d) => d ? '#0a0a0a' : '#f5f5f0',
  sidebarBg:   (d) => d ? '#111111' : '#ffffff',
  switchBG:    (d) => d ? '#a2a0a0' : '#ffffff',
  cardBg:      (d) => d ? '#1a1a1a' : '#ffffff',
  inputBg:     (d) => d ? '#111111' : '#ffffff',
  chipBg:      (d) => d ? '#222222' : '#f0efe9',
  hoverBg:     (d) => d ? '#222222' : '#f5f5f0',
  // borders
  border:      (d) => d ? '#2a2a2a' : '#e8e8e4',
  borderFocus: (d) => d ? '#D4AF37' : '#0F4C3A',
  // text
  textPrimary: (d) => d ? '#ffffff'  : '#0F4C3A',
  textSub:     (d) => d ? '#b0b0b0'  : '#6b6b6b',
  textMuted:   (d) => d ? '#888888'  : '#999999',
  // header
  headerBg:    (d) => d ? '#0d0d0d' : '#f5f5f0',
};

// ?"??"??"? Skeleton ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
const Skeleton = ({ isDark, style }) => (
  <div style={{
    borderRadius: 12,
    background: isDark ? '#1e1e1e' : '#e8e8e4',
    animation: 'pulse 1.5s ease-in-out infinite',
    ...style,
  }} />
);

// ?"??"??"? Helpers ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
const trunc = (str, n = 20) => str && str.length > n ? str.slice(0, n) + '...' : (str ?? '');

function TitleTooltip({ full, children }) {
  const [show, setShow] = useState(false);
  if (!full || full.length <= 20) return children;
  return (
    <div style={{ position: 'relative', display: 'inline-flex', maxWidth: '100%' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
          background: '#1a1a1a', color: '#fff', fontSize: 11, padding: '5px 10px',
          borderRadius: 7, whiteSpace: 'nowrap', zIndex: 200,
          boxShadow: '0 4px 12px rgba(0,0,0,0.35)', pointerEvents: 'none',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {full}
        </div>
      )}
    </div>
  );
}

function MsgTooltip({ full, limit = 60, children }) {
  const [show, setShow] = useState(false);
  if (!full || full.length <= limit) return children;
  return (
    <div style={{ position: 'relative', display: 'block', maxWidth: '100%' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
          background: '#1a1a1a', color: '#fff', fontSize: 11, padding: '7px 10px',
          borderRadius: 7, zIndex: 200, maxWidth: 260, whiteSpace: 'normal',
          lineHeight: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none',
        }}>
          {full}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon, accentBg, delay, isDark, onClick, active, valueTooltip }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 120, damping: 14 }}
      onClick={onClick}
      style={{
        background: t.cardBg(isDark),
        border: active ? `2px solid ${accentBg}` : `1px solid ${t.border(isDark)}`,
        borderRadius: 16, padding: active ? '17px 19px' : '18px 20px',
        display: 'flex', flexDirection: 'column', gap: 12,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: active ? `0 0 0 3px ${accentBg}22` : 'none',
        minWidth: 0, overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: active ? accentBg : t.textMuted(isDark), transition: 'color 0.15s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon path={icons[icon]} size={15} className="text-white" />
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ position: 'relative', minWidth: 0 }}>
          <p
            onMouseEnter={() => valueTooltip && setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            className="db-stat-value"
            style={{ fontWeight: 700, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: valueTooltip ? 'default' : undefined }}
          >{value}</p>
          {showTip && valueTooltip && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 6,
              background: '#1a1a1a', color: '#fff', fontSize: 11, padding: '5px 10px',
              borderRadius: 7, whiteSpace: 'nowrap', zIndex: 200,
              boxShadow: '0 4px 12px rgba(0,0,0,0.35)', pointerEvents: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              {valueTooltip}
            </div>
          )}
        </div>
        {sub && <p style={{ fontSize: 11, marginTop: 4, color: t.textMuted(isDark) }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

// ?"??"??"? Frame card ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
function FrameCard({ frame, isDark, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/frame/${frame.frame_slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnBase = {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 5, padding: '7px 0', borderRadius: 10, fontSize: 11, fontWeight: 600,
    border: `1px solid ${t.border(isDark)}`, background: 'transparent',
    color: t.textSub(isDark), cursor: 'pointer', transition: 'all 0.15s',
  };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
      className="db-frame-card"
      style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, overflow: 'hidden', display: 'flex' }}>
      {/* Thumbnail - left */}
      <div className="db-frame-card-img" style={{ width: 130, flexShrink: 0, background: '#0F4C3A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {frame.media_url ?
          <img src={frame.media_url} alt="Frame thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <Icon path={icons.frame} size={36} style={{ color: '#D4AF37', opacity: 0.5 }} />
        }
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span
            title={frame.status === 'inactive' ? 'No scans on this frame in the past 7 days.' : undefined}
            style={{
              fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
              background: frame.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(120,120,120,0.15)',
              color: frame.status === 'active' ? '#4ade80' : '#888888',
              border: `1px solid ${frame.status === 'active' ? 'rgba(34,197,94,0.3)' : 'rgba(120,120,120,0.3)'}`,
              cursor: frame.status === 'inactive' ? 'help' : 'default',
            }}>{frame.status || 'inactive'}</span>
        </div>
      </div>
      {/* Details - right */}
      <div style={{ flex: 1, minWidth: 0, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: 16, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {frame.title}
        </p>
        <p style={{ fontSize: 12, color: t.textMuted(isDark), marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          /{frame.frame_slug}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, rowGap: 2, fontSize: 12, color: t.textMuted(isDark), marginBottom: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
            <Icon path={icons.scan} size={12} />
            {frame.total_scans ?? 0} scans
          </span>
          <span style={{ whiteSpace: 'nowrap' }}>
            &middot; {new Date(frame.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...btnBase, flex: 'initial', padding: '7px 16px' }} onClick={() => onEdit(frame)}
            onMouseEnter={e => e.currentTarget.style.background = t.hoverBg(isDark)}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Icon path={icons.edit} size={11} /> Edit
          </button>
          <button style={{ ...btnBase, flex: 'initial', padding: '7px 16px', ...(copied ? { borderColor: '#4ade80', color: '#4ade80' } : {}) }} onClick={handleCopy}
            onMouseEnter={e => { if (!copied) e.currentTarget.style.background = t.hoverBg(isDark); }}
            onMouseLeave={e => { if (!copied) e.currentTarget.style.background = 'transparent'; }}>
            <Icon path={copied ? icons.check : icons.copy} size={11} />
            {copied ? 'Copied' : 'Link'}
          </button>
          {/* <button style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border(isDark)}`, background: 'transparent', color: t.textMuted(isDark), cursor: 'pointer', transition: 'all 0.15s' }}
            onClick={() => onDelete(frame)}>
            <Icon path={icons.trash} size={12} />
          </button> */}
        </div>
      </div>
    </motion.div>
  );
}

// ?"??"??"? Empty state ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
function EmptyFrames({ onCreateFrame, isDark }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        gridColumn: '1 / -1', borderRadius: 16, border: `1.5px dashed ${t.border(isDark)}`,
        padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        background: t.cardBg(isDark),
      }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(15, 76, 58, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon path={icons.empty} size={26} style={{ color: isDark ? '#c5c3c3' : '#0F4C3A', opacity: 0.6 }} />
      </div>
      <p style={{ fontWeight: 700, fontSize: 16, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif', marginBottom: 6 }}>Your first frame awaits</p>
      <p style={{ fontSize: 13, color: t.textSub(isDark), maxWidth: 280, marginBottom: 20, lineHeight: 1.5 }}>
        Every great story starts somewhere. Create your first frame and generate a QR code.
      </p>
      <button onClick={onCreateFrame}
        style={{ background: '#0F4C3A', color: '#FAF5DD', fontWeight: 700, padding: '10px 22px', borderRadius: 24, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        <Icon path={icons.plus} size={13} style={{ color: '#FAF5DD' }} /> Create my first frame
      </button>
    </motion.div>
  );
}

// ?"??"??"? Delete modal ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
function DeleteModal({ frame, onConfirm, onCancel, isDark }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ width: '100%', maxWidth: 360, background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 20, padding: 24 }}>
        <p style={{ fontWeight: 700, fontSize: 16, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif', marginBottom: 8 }}>Delete frame?</p>
        <p style={{ fontSize: 13, color: t.textSub(isDark), marginBottom: 20, lineHeight: 1.5 }}>
          "<strong style={{ color: t.textPrimary(isDark) }}>{frame.title}</strong>" will be permanently deleted. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, border: `1px solid ${t.border(isDark)}`, background: 'transparent', color: t.textSub(isDark), cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = t.hoverBg(isDark)}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ?"??"??"? Overview tab ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

// Build an SVG polyline + filled-area path from an array of daily bucket counts.
function buildSparkPath(buckets) {
  if (!buckets || buckets.length < 2) return null;
  const W = 600, H = 160, PAD = 14;
  const max = Math.max(...buckets, 1);
  const n   = buckets.length;
  const pts = buckets.map((v, i) => [
    Math.round((i / (n - 1)) * W),
    Math.round(H - PAD - ((v / max) * (H - PAD * 2))),
  ]);
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  return { line: d, fill: `${d} L${W},${H} L0,${H} Z` };
}

function OverviewTab({ stats, frames, isDark, onNavigate, canViewAnalytics, notificationData }) {
  const [scanPeriod,     setScanPeriod]     = useState('30d');
  const [chartBuckets,   setChartBuckets]   = useState([]);
  const [chartLoading,   setChartLoading]   = useState(false);
  const [comparison,     setComparison]     = useState(null); // { pct, up } | null
  const [recentActivity,   setRecentActivity]   = useState([]);
  const [activityLoading,  setActivityLoading]  = useState(false);
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(false);
  const [scanLogsTotal,    setScanLogsTotal]    = useState(null);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const topFrame    = [...frames].sort((a, b) => (b.total_scans ?? 0) - (a.total_scans ?? 0))[0];
  const totalScansNum = scanLogsTotal !== null
    ? scanLogsTotal
    : typeof stats.totalScans === 'number'
      ? stats.totalScans
      : parseInt(String(stats.totalScans).replace(/,/g, ''), 10) || 0;

  // Fetch scan_logs whenever frames or period changes
  const frameIdsKey = frames.map(f => f.id).join(',');

  // All-time total from scan_logs -filter nulls so it matches the chart's .gte() behaviour
  useEffect(() => {
    if (!frames.length) { setScanLogsTotal(0); return; }
    const ids = frames.map(f => f.id);
    supabase
      .from('scan_logs')
      .select('scanned_at')
      .in('frame_id', ids)
      .not('scanned_at', 'is', null)
      .then(({ data }) => { if (data) setScanLogsTotal(data.length); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameIdsKey]);

  useEffect(() => {
    if (!frames.length) { setChartBuckets([]); setComparison(null); return; }
    const ids  = frames.map(f => f.id);
    const days = scanPeriod === '7d' ? 7 : scanPeriod === '30d' ? 30 : 90;

    setChartLoading(true);
    setComparison(null);

    const now         = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - days);

    // For 7d fetch an extra week back so we can compare
    const fetchFrom = new Date(periodStart);
    if (scanPeriod === '7d') fetchFrom.setDate(fetchFrom.getDate() - 7);

    supabase
      .from('scan_logs')
      .select('scanned_at')
      .in('frame_id', ids)
      .gte('scanned_at', fetchFrom.toISOString())
      .then(({ data, error }) => {
        if (error || !data) { setChartLoading(false); return; }

        // Build empty day buckets for the current period -d <= days so today is always included
        const bucket = {};
        for (let d = 0; d <= days; d++) {
          const day = new Date(periodStart);
          day.setDate(day.getDate() + d);
          bucket[day.toISOString().slice(0, 10)] = 0;
        }

        let currCount = 0;
        let prevCount = 0;

        data.forEach(({ scanned_at }) => {
          if (!scanned_at) return;
          const scanDate = new Date(scanned_at);
          if (scanDate >= periodStart) {
            const key = scanned_at.slice(0, 10);
            if (key in bucket) { bucket[key]++; }
            currCount++;
          } else if (scanPeriod === '7d') {
            prevCount++;
          }
        });

        setChartBuckets(Object.values(bucket));

        if (scanPeriod === '7d') {
          const raw = prevCount === 0
            ? (currCount > 0 ? 100 : 0)
            : Math.round(((currCount - prevCount) / prevCount) * 100);
          setComparison({ pct: Math.abs(raw), up: raw >= 0, curr: currCount, prev: prevCount });
        }

        setChartLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameIdsKey, scanPeriod]);

  // Fetch recent activity -comments + inactive + milestones (no individual scans)
  useEffect(() => {
    if (!frames.length) { setRecentActivity([]); setActivityLoading(false); return; }
    const frameMap   = Object.fromEntries(frames.map(f => [f.id, f]));
    const ids        = frames.map(f => f.id);
    const MILESTONES = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    setActivityLoading(true);

    supabase
      .from('frame_comments')
      .select('frame_id, name, created_at')
      .in('frame_id', ids)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data: commentData }) => {
        const commentItems = (commentData || [])
          .filter(row => frameMap[row.frame_id])
          .map(row => ({ type: 'comment', frame: frameMap[row.frame_id], name: row.name, time: row.created_at }));

        const inactiveItems = frames
          .filter(f => f.status === 'inactive' && f.updated_at)
          .map(f => ({ type: 'inactive', frame: f, time: f.updated_at }));

        const milestoneItems = frames
          .flatMap(f => {
            const reached = MILESTONES.filter(m => (f.total_scans ?? 0) >= m);
            if (!reached.length || !(f.updated_at || f.created_at)) return [];
            return [{ type: 'milestone', frame: f, scans: reached[reached.length - 1], time: f.updated_at || f.created_at }];
          });

        const merged = [...commentItems, ...inactiveItems, ...milestoneItems]
          .sort((a, b) => new Date(b.time) - new Date(a.time));

        setRecentActivity(merged);
        setActivityLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameIdsKey]);

  const notifItems = (notificationData || []).map(n => ({
    type: 'notification',
    notifType: n.type,
    message: n.message,
    time: n.created_at,
    isRead: n.is_read,
    frame: null,
  }));
  const displayActivity = [...recentActivity, ...notifItems]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 5);

  const periodDays  = scanPeriod === '7d' ? 7 : scanPeriod === '30d' ? 30 : 90;
  const periodTotal = chartBuckets.reduce((s, v) => s + v, 0);
  const sparkPaths  = buildSparkPath(chartBuckets);
  const sparkStroke = isDark ? '#D4AF37' : '#0F4C3A';
  const sparkFillId = `sparkfill-${isDark ? 'd' : 'l'}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="db-tab-h2" style={{ fontWeight: 700, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif' }}>
          {greeting()}, {stats.name || 'Vendor'}
        </h2>
        <p style={{ fontSize: 13, color: t.textSub(isDark), marginTop: 4 }}>Here's what's happening with your frames today.</p>
      </motion.div>

      {/* Stat row */}
      <div className="db-stat-grid">
        <StatCard label="Total Scans"   value={totalScansNum.toLocaleString()} sub="all-time QR scans"          icon="scan"    accentBg="#D4AF37"  delay={0.05} isDark={isDark} />
        <StatCard label="Active Frames" value={stats.activeFrames}             sub={`of ${stats.totalFrames} created`} icon="frame"   accentBg="#0F4C3A"  delay={0.10} isDark={isDark} />
        <StatCard label="Top Frame"     value={trunc(topFrame?.title) || '-'}  sub={`${(topFrame?.total_scans ?? 0).toLocaleString()} scans`} icon="chart" accentBg="#7c3aed" delay={0.15} isDark={isDark} valueTooltip={topFrame?.title} />
        <StatCard label="Current Plan"  value={stats.plan}                     sub={stats.plan === 'Business' ? 'Unlimited QR credits' : stats.plan === 'Free' ? (stats.qrCodeLeft > 0 ? `${stats.qrCodeLeft} QR locked` : 'Upgrade to create frames') : `${stats.qrCodeLeft} QR left`} icon="billing" accentBg="#162722" delay={0.20} isDark={isDark} />
      </div>

      {/* Two-up: live sparkline chart + recent activity */}
      <div className="db-overview-twoup">
        {/* Sparkline */}
        <div style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textMuted(isDark) }}>
                Scans, last {periodDays} days
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontFamily: 'Poltawski Nowy, serif', fontSize: 22, color: t.textPrimary(isDark), fontWeight: 700, lineHeight: 1 }}>
                  {chartLoading ? '...' : periodTotal.toLocaleString()}
                </h2>
                {/* 7-day comparison badge */}
                {scanPeriod === '7d' && !chartLoading && comparison !== null && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: comparison.up ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)',
                    color:      comparison.up ? '#4ade80'                : '#ef4444',
                    border:     `1px solid ${comparison.up ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    whiteSpace: 'nowrap',
                  }}>
                    {comparison.up ? '+' : '-'}{comparison.pct}% vs last week
                  </span>
                )}
              </div>
            </div>

            {/* Period toggle */}
            <div style={{ display: 'flex', gap: 4, padding: 4, background: isDark ? '#1e1e1e' : '#f0efe9', borderRadius: 99, fontSize: 11, flexShrink: 0 }}>
              {['7d', '30d', '90d'].map(r => (
                <button key={r} onClick={() => setScanPeriod(r)} style={{
                  padding: '4px 12px', borderRadius: 99, border: 'none',
                  background: r === scanPeriod ? t.cardBg(isDark) : 'transparent',
                  color:      r === scanPeriod ? t.textPrimary(isDark) : t.textMuted(isDark),
                  fontWeight: 600, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                  transition: 'background 0.15s, color 0.15s',
                }}
                  onMouseEnter={e => { if (r !== scanPeriod) e.currentTarget.style.background = t.hoverBg(isDark); }}
                  onMouseLeave={e => { if (r !== scanPeriod) e.currentTarget.style.background = 'transparent'; }}>{r}</button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <svg viewBox="0 0 600 160" style={{ width: '100%', height: 160, opacity: chartLoading ? 0.35 : 1, transition: 'opacity 0.2s' }}>
            <defs>
              <linearGradient id={sparkFillId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={sparkStroke} stopOpacity="0.18" />
                <stop offset="1" stopColor={sparkStroke} stopOpacity="0" />
              </linearGradient>
            </defs>
            {sparkPaths ? (
              <>
                <path d={sparkPaths.fill} fill={`url(#${sparkFillId})`} />
                <path d={sparkPaths.line} fill="none" stroke={sparkStroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </>
            ) : (
              /* flat baseline when no data */
              <path d="M0,140 L600,140" fill="none" stroke={sparkStroke} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.3" />
            )}
          </svg>
        </div>

        {/* Recent activity */}
        <div style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, padding: 24 }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textMuted(isDark) }}>Recent activity</p>
          <h3 style={{ margin: '0 0 14px', fontFamily: 'Poltawski Nowy, serif', fontSize: 16, color: t.textPrimary(isDark), fontWeight: 700 }}>What's happening</h3>
          {activityLoading ? (
            <p style={{ fontSize: 11, color: t.textMuted(isDark) }}>Loading...</p>
          ) : displayActivity.length === 0 ? (
            <p style={{ fontSize: 11, color: t.textMuted(isDark) }}>No activity yet.</p>
          ) : displayActivity.map((a, i) => {
            const isNotif = a.type === 'notification';
            const suffix =
              a.type === 'comment'   ? ` - new comment from ${a.name || 'a visitor'}` :
              a.type === 'milestone' ? ` - reached ${a.scans.toLocaleString()} scans` :
              a.type === 'inactive'  ? ' - is inactive' :
                                       '';
            const dot =
              a.type === 'comment'      ? '#D4AF37'  :
              a.type === 'milestone'    ? '#7c3aed'  :
              a.type === 'notification' ? (
                a.notifType === 'success' ? '#4ade80' :
                a.notifType === 'error'   ? '#f87171' :
                a.notifType === 'alert'   ? '#fb923c' :
                a.notifType === 'update'  ? '#60a5fa' :
                '#D4AF37'
              ) :
                                          '#888';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: i < displayActivity.length - 1 ? `1px dashed ${t.border(isDark)}` : 'none' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, marginTop: 4, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isNotif ? (
                    <MsgTooltip full={a.message}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: t.textSub(isDark), display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
                        {a.message}
                      </span>
                    </MsgTooltip>
                  ) : (
                    <p style={{ margin: 0, fontSize: 11, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
                      <span style={{ fontWeight: 600, color: t.textSub(isDark) }}>{a.frame.title}</span>
                      <span style={{ color: t.textMuted(isDark) }}>{suffix}</span>
                    </p>
                  )}
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: t.textMuted(isDark) }}>{timeAgo(a.time)}</p>
                </div>
              </div>
            );
          })}

          {/* View all footer */}
          {!activityLoading && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.border(isDark)}` }}>
              {showUpgradeNudge ? (
                <div style={{ borderRadius: 10, background: isDark ? 'rgba(212,175,55,0.08)' : 'rgba(15,76,58,0.06)', border: `1px solid ${isDark ? 'rgba(212,175,55,0.2)' : 'rgba(15,76,58,0.15)'}`, padding: '10px 12px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: t.textPrimary(isDark), margin: '0 0 6px' }}>
                    Upgrade to Pro for full activity
                  </p>
                  <p style={{ fontSize: 10, color: t.textMuted(isDark), margin: '0 0 8px', lineHeight: 1.5 }}>
                    See your complete activity history, every scan, comment, and milestone across all frames.
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => onNavigate('billing')}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 8, background: '#0F4C3A', color: '#FAF5DD', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'opacity 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      Upgrade now
                    </button>
                    <button
                      onClick={() => setShowUpgradeNudge(false)}
                      style={{ padding: '6px 10px', borderRadius: 8, background: 'transparent', color: t.textMuted(isDark), fontSize: 11, border: `1px solid ${t.border(isDark)}`, cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = t.hoverBg(isDark)}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => canViewAnalytics ? onNavigate('analytics') : setShowUpgradeNudge(true)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#D4AF37' : '#0F4C3A' }}>
                    View all activity
                  </span>
                  <span style={{ fontSize: 11, color: t.textMuted(isDark), display: 'flex', alignItems: 'center', gap: 4 }}>
                    {canViewAnalytics ? '>' : (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                        Pro
                      </>
                    )}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted(isDark), marginBottom: 10 }}>Quick actions</p>
        <div className="db-actions-grid">
          {[
            { label: 'Create new frame', icon: 'plus',    desc: 'Upload content & generate QR', tab: 'create'    },
            { label: 'View analytics',   icon: 'chart',   desc: 'Scans, devices, geography',    tab: 'analytics', restricted: true },
            { label: 'Manage billing',   icon: 'billing', desc: 'Plans, payments, history',     tab: 'billing'   },
          ].filter(item => !item.restricted || canViewAnalytics).map(item => (
            <button key={item.label} onClick={() => onNavigate(item.tab)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderRadius: 14, border: `1px solid ${t.border(isDark)}`, background: t.cardBg(isDark),
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = t.hoverBg(isDark)}
              onMouseLeave={e => e.currentTarget.style.background = t.cardBg(isDark)}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: isDark ? 'rgba(212,175,55,0.18)' : 'rgba(15,76,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: isDark ? '#D4AF37' : '#0F4C3A' }}>
                <Icon path={icons[item.icon]} size={16} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary(isDark) }}>{item.label}</p>
                <p style={{ fontSize: 11, color: t.textSub(isDark), marginTop: 1 }}>{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent frames */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontFamily: 'Poltawski Nowy, serif', fontSize: 20, color: t.textPrimary(isDark), fontWeight: 700 }}>Recent frames</h2>
          <button onClick={() => onNavigate('frames')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.textPrimary(isDark), fontWeight: 600, fontSize: 12, transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            View all
          </button>
        </div>
        {frames.length === 0
          ? <EmptyFrames onCreateFrame={() => onNavigate('create')} isDark={isDark} />
          : <div className="db-frame-grid">
              {frames.slice(0, 4).map(frame => (
                <FrameCard key={frame.id} frame={frame} isDark={isDark} onEdit={() => onNavigate('frames')} onDelete={() => {}} />
              ))}
            </div>
        }
      </div>
    </div>
  );
}

// ?"??"??"? Frames tab ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
function FramesTab({ frames, isDark, onCreateFrame, onEdit, onDelete }) {
  const [search, setSearch]           = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = frames.filter(f =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.frame_slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (frame) => {
    await supabase.from('frames').delete().eq('id', frame.id);
    onDelete(frame.id);
    setDeleteTarget(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="db-frames-hdr">
        <div>
          <h2 className="db-tab-h2" style={{ fontWeight: 700, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif' }}>My Frames</h2>
          <p style={{ fontSize: 13, color: t.textSub(isDark), marginTop: 2 }}>{frames.length} frame{frames.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="db-search-row">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search frames..."
            className="db-search-input"
            style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${t.border(isDark)}`, background: t.inputBg(isDark), color: t.textPrimary(isDark), fontSize: 13, outline: 'none' }} />
          <button onClick={onCreateFrame}
            style={{ background: '#0F4C3A', color: '#FAF5DD', fontWeight: 700, padding: '8px 18px', borderRadius: 10, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Icon path={icons.plus} size={13} style={{ color: '#FAF5DD' }} /> New Frame
          </button>
        </div>
      </div>

      <div className="db-frame-grid">
        <AnimatePresence>
          {filtered.length === 0
            ? <EmptyFrames onCreateFrame={onCreateFrame} isDark={isDark} />
            : filtered.map(frame => (
              <FrameCard key={frame.id} frame={frame} isDark={isDark}
                onEdit={onEdit} onDelete={() => setDeleteTarget(frame)} />
            ))
          }
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {deleteTarget && <DeleteModal frame={deleteTarget} isDark={isDark} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ?"??"??"? Create / Edit tab ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
function CreateTab({ editingFrame, onSaved, onCreated, isDark, onNavigateToBilling, planId }) {
  const isEdit = !!editingFrame;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 className="db-tab-h2" style={{ fontWeight: 700, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif' }}>
          {isEdit ? 'Edit frame' : 'Create a new frame'}
        </h2>
        <p style={{ fontSize: 13, color: t.textSub(isDark), marginTop: 4, wordBreak: 'break-word' }}>
          {isEdit
            ? `Editing "${editingFrame.title}" -the QR code URL will not change.`
            : 'Fill in the details and generate a QR code.'}
        </p>
      </div>
      <div className="db-card" style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16 }}>
        {isEdit
          ? <FrameEditor editingFrame={editingFrame} onSaved={onSaved} />
          : <QRCodeGenerator onSaved={onCreated} onNavigateToBilling={onNavigateToBilling} planId={planId} />
        }
      </div>
    </div>
  );
}

// ?"??"??"? Analytics tab ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
function AnalyticsTab({ frames, isDark, planId, notificationData }) {
  const [chartPeriod,  setChartPeriod]  = useState(30);
  const [chartData,    setChartData]    = useState([]); // [{date, total, unique}]
  const [chartLoading, setChartLoading] = useState(true);
  const [geoData,      setGeoData]      = useState({});
  const [scanTotals,   setScanTotals]   = useState({});
  const [geoLoading,   setGeoLoading]   = useState(true);
  const [deviceData,   setDeviceData]   = useState({ devices: {}, browsers: {} });
  const [tooltip,         setTooltip]        = useState(null); // {x, y, text} | null
  const [activity,        setActivity]       = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const chartContainerRef = useRef(null);

  const frameIdsKey = frames.map(f => f.id).join(',');

  // Fetch recent activity -comments + inactive + milestones (no individual scans)
  useEffect(() => {
    if (!frames.length) { setActivity([]); setActivityLoading(false); return; }
    const ids        = frames.map(f => f.id);
    const frameMap   = Object.fromEntries(frames.map(f => [f.id, f]));
    const MILESTONES = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    setActivityLoading(true);

    supabase.from('frame_comments')
      .select('frame_id, name, created_at')
      .in('frame_id', ids)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data: commentData }) => {
        const commentItems = (commentData || [])
          .filter(r => frameMap[r.frame_id])
          .map(r => ({ type: 'comment', frame: frameMap[r.frame_id], name: r.name, time: r.created_at }));
        const inactiveItems = frames
          .filter(f => f.status === 'inactive' && f.updated_at)
          .map(f => ({ type: 'inactive', frame: f, time: f.updated_at }));
        const milestoneItems = frames
          .flatMap(f => {
            const reached = MILESTONES.filter(m => (f.total_scans ?? 0) >= m);
            if (!reached.length || !(f.updated_at || f.created_at)) return [];
            return [{ type: 'milestone', frame: f, scans: reached[reached.length - 1], time: f.updated_at || f.created_at }];
          });
        setActivity(
          [...commentItems, ...inactiveItems, ...milestoneItems]
            .sort((a, b) => new Date(b.time) - new Date(a.time))
        );
        setActivityLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameIdsKey]);

  // Fetch geo + frame totals (all-time, for top locations + top frames)
  useEffect(() => {
    if (!frames.length) { setGeoLoading(false); return; }
    const ids = frames.map(f => f.id);
    supabase
      .from('scan_logs')
      .select('frame_id, city, country, device_type, user_agent')
      .in('frame_id', ids)
      .then(({ data }) => {
        if (!data) { setGeoLoading(false); return; }
        const geoMap   = {};
        const totalMap = {};
        const devices  = {};
        const browsers = {};

        const parseBrowser = (ua = '') => {
          if (!ua) return 'Unknown';
          if (/Edg\//i.test(ua))         return 'Edge';
          if (/OPR\/|Opera/i.test(ua))   return 'Opera';
          if (/Firefox\//i.test(ua))     return 'Firefox';
          if (/Chrome\//i.test(ua))      return 'Chrome';
          if (/Safari\//i.test(ua))      return 'Safari';
          return 'Other';
        };

        data.forEach(({ frame_id, city, country, device_type, user_agent }) => {
          totalMap[frame_id] = (totalMap[frame_id] || 0) + 1;
          if (city) {
            if (!geoMap[frame_id]) geoMap[frame_id] = {};
            const key = `${city}||${country}`;
            if (!geoMap[frame_id][key]) geoMap[frame_id][key] = { city, country, count: 0 };
            geoMap[frame_id][key].count += 1;
          }
          const dev = device_type ? (device_type.charAt(0).toUpperCase() + device_type.slice(1)) : 'Desktop';
          devices[dev] = (devices[dev] || 0) + 1;
          const br = parseBrowser(user_agent);
          browsers[br] = (browsers[br] || 0) + 1;
        });

        const result = {};
        Object.keys(geoMap).forEach(fid => {
          result[fid] = Object.values(geoMap[fid]).sort((a, b) => b.count - a.count);
        });
        setScanTotals(totalMap);
        setGeoData(result);
        setDeviceData({ devices, browsers });
        setGeoLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameIdsKey]);

  // Fetch daily bucketed chart data (total + unique) for selected period
  useEffect(() => {
    if (!frames.length) { setChartData([]); setChartLoading(false); return; }
    setChartLoading(true);
    const ids   = frames.map(f => f.id);
    const since = new Date();
    since.setDate(since.getDate() - chartPeriod);

    supabase
      .from('scan_logs')
      .select('scanned_at, visitor_id, ip_address')
      .in('frame_id', ids)
      .gte('scanned_at', since.toISOString())
      .then(({ data }) => {
        if (!data) { setChartLoading(false); return; }
        const buckets = {};
        for (let d = 0; d <= chartPeriod; d++) {
          const day = new Date(since);
          day.setDate(day.getDate() + d);
          buckets[day.toISOString().slice(0, 10)] = { total: 0, devices: new Set() };
        }
        data.forEach(({ scanned_at, visitor_id, ip_address }) => {
          const key = scanned_at?.slice(0, 10);
          if (key && buckets[key]) {
            buckets[key].total += 1;
            const uid = visitor_id || ip_address;
            if (uid) buckets[key].devices.add(uid);
          }
        });
        setChartData(
          Object.entries(buckets).map(([date, { total, devices }]) => ({ date, total, unique: devices.size }))
        );
        setChartLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameIdsKey, chartPeriod]);

  // Merge notifications into activity feed
  const analyticsNotifItems = (notificationData || []).map(n => ({
    type: 'notification',
    notifType: n.type,
    message: n.message,
    time: n.created_at,
    isRead: n.is_read,
    frame: null,
  }));
  const displayActivity = [...activity, ...analyticsNotifItems]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 30);

  // Chart stats
  const periodTotal = chartData.reduce((s, d) => s + d.total, 0);
  const half        = Math.floor(chartData.length / 2);
  const firstHalf   = chartData.slice(0, half).reduce((s, d) => s + d.total, 0);
  const secondHalf  = chartData.slice(half).reduce((s, d) => s + d.total, 0);
  const growthPct   = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100).toFixed(1) : null;

  // Top locations (flattened, all-time)
  const allLocations = (() => {
    const map = {};
    Object.values(geoData).forEach(entries =>
      entries.forEach(({ city, country, count }) => {
        const key = `${city}||${country}`;
        if (!map[key]) map[key] = { city, country, count: 0 };
        map[key].count += count;
      })
    );
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  })();
  const maxLocCount = allLocations[0]?.count || 1;

  // Top frames (sorted by scan_logs total)
  const frameTotal = (f) => scanTotals[f.id] ?? f.total_scans ?? 0;
  const topFrames  = [...frames].sort((a, b) => frameTotal(b) - frameTotal(a)).slice(0, 5);

  // SVG grouped bar chart
  const showTooltip = (e, text) => {
    const container = chartContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  };

  const renderChart = () => {
    if (!chartData.length) return null;
    const maxVal = Math.max(...chartData.map(d => d.total), 1);
    const W = 800, H = 200, padL = 32, padR = 12, padT = 10, padB = 28;
    const chartW  = W - padL - padR;
    const chartH  = H - padT - padB;
    const groupW  = chartW / chartData.length;
    const barW    = Math.max(2, Math.min(9, groupW * 0.36));
    const gap     = 1.5;
    const labelEvery = chartPeriod <= 7 ? 1 : chartPeriod <= 30 ? 5 : 15;
    const gridPcts   = [0.25, 0.5, 0.75, 1];

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }} onMouseLeave={() => setTooltip(null)}>
        {gridPcts.map(pct => {
          const y = padT + chartH * (1 - pct);
          return (
            <g key={pct}>
              <line x1={padL} x2={W - padR} y1={y} y2={y}
                stroke={isDark ? '#2a2a2a' : '#e8e8e4'} strokeDasharray="3 4" />
              <text x={padL - 4} y={y + 4} fontSize="9" fill={t.textMuted(isDark)} textAnchor="end">
                {Math.round(maxVal * pct)}
              </text>
            </g>
          );
        })}
        {chartData.map((d, i) => {
          const cx  = padL + i * groupW + (groupW - barW * 2 - gap) / 2;
          const h1  = Math.max(1, chartH * (d.total  / maxVal));
          const h2  = Math.max(1, chartH * (d.unique / maxVal));
          const showLabel = i % labelEvery === 0;
          const label = d.date.slice(5).replace('-', '/');
          return (
            <g key={d.date}>
              <rect
                x={cx} y={padT + chartH - h1} width={barW} height={h1}
                fill="#0F4C3A" rx="2" style={{ cursor: 'crosshair' }}
                onMouseEnter={(e) => showTooltip(e, `${d.total.toLocaleString()} scans`)}
                onMouseMove={(e)  => showTooltip(e, `${d.total.toLocaleString()} scans`)}
              />
              <rect
                x={cx + barW + gap} y={padT + chartH - h2} width={barW} height={h2}
                fill="#D4AF37" rx="2" style={{ cursor: 'crosshair' }}
                onMouseEnter={(e) => showTooltip(e, `${d.unique.toLocaleString()} devices`)}
                onMouseMove={(e)  => showTooltip(e, `${d.unique.toLocaleString()} devices`)}
              />
              {showLabel && (
                <text x={cx + barW} y={H - 2} fontSize="10" fill={t.textMuted(isDark)}
                  textAnchor="middle" fontFamily="ui-monospace, monospace">{label}</text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Big chart card */}
      <div style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textMuted(isDark) }}>Scan volume</p>
            <h2 style={{ margin: 0, fontFamily: 'Poltawski Nowy, serif', fontSize: 28, fontWeight: 700 }}
                className={`${isDark? 'text-white' : 'text-primary'}`}>
              {periodTotal.toLocaleString()}
              {growthPct !== null && (
                <span style={{ fontSize: 13, fontWeight: 600, marginLeft: 10, color: Number(growthPct) >= 0 ? '#4ade80' : '#f87171' }}>
                  {Number(growthPct) >= 0 ? '+' : '-'}{Math.abs(Number(growthPct))}%
                </span>
              )}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.textSub(isDark) }}>
                <span style={{ width: 10, height: 10, background: '#0F4C3A', borderRadius: 2, flexShrink: 0 }} /> Scans
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.textSub(isDark) }}>
                <span style={{ width: 10, height: 10, background: '#D4AF37', borderRadius: 2, flexShrink: 0 }} /> Unique
              </span>
            </div>
            <div style={{ display: 'flex', gap: 3, background: isDark ? '#111' : '#f0efe9', borderRadius: 8, padding: 3 }}>
              {[7, 30, 90].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)} style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: chartPeriod === p ? t.cardBg(isDark) : 'transparent',
                  color:      chartPeriod === p ? t.textPrimary(isDark) : t.textMuted(isDark),
                  boxShadow:  chartPeriod === p ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}
                  onMouseEnter={e => { if (chartPeriod !== p) e.currentTarget.style.background = t.hoverBg(isDark); }}
                  onMouseLeave={e => { if (chartPeriod !== p) e.currentTarget.style.background = 'transparent'; }}>{p}d</button>
              ))}
            </div>
          </div>
        </div>
        {chartLoading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: t.textMuted(isDark) }}>Loading...</span>
          </div>
        ) : chartData.every(d => d.total === 0) ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: t.textMuted(isDark) }}>No scans in this period.</span>
          </div>
        ) : (
          <div ref={chartContainerRef} style={{ position: 'relative' }}>
            {renderChart()}
            {tooltip && (
              <div style={{
                position: 'absolute',
                left: tooltip.x,
                top: tooltip.y - 38,
                transform: 'translateX(-50%)',
                background: isDark ? '#1a1a1a' : '#ffffff',
                border: `1px solid ${t.border(isDark)}`,
                borderRadius: 8,
                padding: '5px 10px',
                fontSize: 12,
                fontWeight: 700,
                color: t.textPrimary(isDark),
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
                zIndex: 10,
              }}>
                {tooltip.text}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Two-up: top locations + top frames */}
      <style>{`
        .db-analytics-twoup { display:grid; grid-template-columns:1.2fr 1fr; gap:16px; }
        @media(max-width:639px){ .db-analytics-twoup { grid-template-columns:1fr; } }
        .db-activity-scroll::-webkit-scrollbar { width: 4px; }
        .db-activity-scroll::-webkit-scrollbar-track { background: transparent; }
        .db-activity-scroll::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.35); border-radius: 99px; }
        .db-activity-scroll::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.65); }
        .db-activity-scroll { scrollbar-width: thin; scrollbar-color: rgba(212,175,55,0.35) transparent; }
      `}</style>
      <div className="db-analytics-twoup">
        {/* Top locations */}
        <div style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, padding: 24 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textMuted(isDark) }}>Where</p>
          <h3 style={{ margin: '0 0 20px', fontFamily: 'Poltawski Nowy, serif', fontSize: 18, fontWeight: 700 }}
              className={`${isDark? 'text-white' : 'text-primary'}`}>Top locations</h3>
          {geoLoading ? (
            <p style={{ fontSize: 13, color: t.textMuted(isDark) }}>Loading...</p>
          ) : allLocations.length === 0 ? (
            <p style={{ fontSize: 13, color: t.textMuted(isDark) }}>No location data yet.</p>
          ) : allLocations.map((loc, i) => {
            const pct = Math.round((loc.count / maxLocCount) * 100);
            return (
              <div key={`${loc.city}-${loc.country}`} style={{ marginBottom: i < allLocations.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: t.textPrimary(isDark) }}>
                    <span style={{ fontWeight: 600 }}>{loc.city}</span>
                    {loc.country && <span style={{ color: t.textMuted(isDark), marginLeft: 6 }}>{loc.country}</span>}
                  </span>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: t.textSub(isDark) }}>{loc.count.toLocaleString()}</span>
                </div>
                <div style={{ height: 6, background: isDark ? '#2a2a2a' : '#e8e8e4', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: i === 0 ? '#D4AF37' : '#0F4C3A', borderRadius: 99 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top frames */}
        <div style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, padding: 24 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textMuted(isDark) }}>What</p>
          <h3 style={{ margin: '0 0 20px', fontFamily: 'Poltawski Nowy, serif', fontSize: 18, fontWeight: 700 }}
            className={`${isDark? 'text-white' : 'text-primary'}`}>Top frames</h3>
          {topFrames.length === 0 ? (
            <p style={{ fontSize: 13, color: t.textMuted(isDark) }}>No scan data yet.</p>
          ) : topFrames.map((frame, i) => (
            <div key={frame.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < topFrames.length - 1 ? `1px dashed ${t.border(isDark)}` : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0F4C3A', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon path={icons.frame} size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TitleTooltip full={frame.title}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: t.textPrimary(isDark), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trunc(frame.title)}</p>
                </TitleTooltip>
                <p style={{ margin: 0, fontSize: 11, color: t.textMuted(isDark) }}>{frame.type || frame.frame_type || 'Frame'}</p>
              </div>
              <p style={{ margin: 0, fontFamily: 'ui-monospace, monospace', fontSize: 13, color: t.textSub(isDark), fontWeight: 600, flexShrink: 0 }}>{frameTotal(frame).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Device & browser breakdown */}
      {!geoLoading && (Object.keys(deviceData.devices).length > 0 || Object.keys(deviceData.browsers).length > 0) && (() => {
        const devEntries = Object.entries(deviceData.devices).sort((a, b) => b[1] - a[1]);
        const brEntries  = Object.entries(deviceData.browsers).sort((a, b) => b[1] - a[1]);
        const devTotal   = devEntries.reduce((s, [, n]) => s + n, 0) || 1;
        const brTotal    = brEntries.reduce((s, [, n]) => s + n, 0) || 1;
        const devColors  = ['#0F4C3A', '#D4AF37', '#6B7280'];
        const brColors   = ['#0F4C3A', '#D4AF37', '#6B7280', '#9CA3AF', '#D1D5DB'];
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
               className="db-analytics-twoup">
            {/* Devices */}
            <div style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, padding: 24 }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textMuted(isDark) }}>Who</p>
              <h3 style={{ margin: '0 0 20px', fontFamily: 'Poltawski Nowy, serif', fontSize: 18, fontWeight: 700 }}
                  className={isDark ? 'text-white' : 'text-primary'}>Devices</h3>
              {devEntries.map(([name, count], i) => {
                const pct = Math.round((count / devTotal) * 100);
                return (
                  <div key={name} style={{ marginBottom: i < devEntries.length - 1 ? 16 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary(isDark) }}>{name}</span>
                      <span style={{ fontSize: 12, color: t.textSub(isDark), fontFamily: 'ui-monospace, monospace' }}>{pct}% / {count.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 6, background: isDark ? '#2a2a2a' : '#e8e8e4', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: devColors[i] || '#9CA3AF', borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Browsers */}
            <div style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, padding: 24 }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textMuted(isDark) }}>How</p>
              <h3 style={{ margin: '0 0 20px', fontFamily: 'Poltawski Nowy, serif', fontSize: 18, fontWeight: 700 }}
                  className={isDark ? 'text-white' : 'text-primary'}>Browsers</h3>
              {brEntries.map(([name, count], i) => {
                const pct = Math.round((count / brTotal) * 100);
                return (
                  <div key={name} style={{ marginBottom: i < brEntries.length - 1 ? 16 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary(isDark) }}>{name}</span>
                      <span style={{ fontSize: 12, color: t.textSub(isDark), fontFamily: 'ui-monospace, monospace' }}>{pct}% / {count.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 6, background: isDark ? '#2a2a2a' : '#e8e8e4', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: brColors[i] || '#9CA3AF', borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Recent activity */}
      <div style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textMuted(isDark) }}>When</p>
            <h3 style={{ margin: 0, fontFamily: 'Poltawski Nowy, serif', fontSize: 18, color: t.textPrimary(isDark), fontWeight: 700 }}>Recent activity</h3>
          </div>
          {displayActivity.length > 0 && (
            <span style={{ fontSize: 11, color: t.textMuted(isDark) }}>{displayActivity.length} events</span>
          )}
        </div>

        {activityLoading ? (
          <p style={{ fontSize: 13, color: t.textMuted(isDark) }}>Loading...</p>
        ) : displayActivity.length === 0 ? (
          <p style={{ fontSize: 13, color: t.textMuted(isDark) }}>No activity yet. Share your QR codes to start tracking.</p>
        ) : (
          <div className="db-activity-scroll" style={{ overflowY: 'auto', maxHeight: 494, paddingRight: 6 }}>
            {displayActivity.map((a, i) => {
              const isNotif = a.type === 'notification';
              const suffix =
                a.type === 'comment'   ? ` - comment from ${a.name || 'a visitor'}` :
                a.type === 'milestone' ? ` - reached ${a.scans.toLocaleString()} scans` :
                a.type === 'inactive'  ? ' - is inactive' :
                                         '';
              const dot =
                a.type === 'comment'      ? '#D4AF37'  :
                a.type === 'milestone'    ? '#7c3aed'  :
                a.type === 'notification' ? (
                  a.notifType === 'success' ? '#4ade80' :
                  a.notifType === 'error'   ? '#f87171' :
                  a.notifType === 'alert'   ? '#fb923c' :
                  a.notifType === 'update'  ? '#60a5fa' :
                  '#D4AF37'
                ) :
                                            '#888';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: i < displayActivity.length - 1 ? `1px dashed ${t.border(isDark)}` : 'none' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isNotif ? (
                      <MsgTooltip full={a.message}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: t.textSub(isDark), display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
                          {a.message}
                        </span>
                      </MsgTooltip>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
                        <span style={{ fontWeight: 600, color: t.textSub(isDark) }}>{a.frame.title}</span>
                        <span style={{ color: t.textMuted(isDark) }}>{suffix}</span>
                      </p>
                    )}
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: t.textMuted(isDark) }}>{timeAgo(a.time)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


// ?"??"??"? Settings tab ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
function AccountIdField({ userId, isDark, labelStyle }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div>
      <label style={labelStyle}>Account ID</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8}}>
        <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.border(isDark)}`, background: t.inputBg(isDark), fontSize: 11, fontFamily: 'monospace', color: t.textMuted(isDark), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        className='max-w-[220px] sm:max-w-full' >
          {userId || '-'}
          
        </div>
        <button onClick={copy} style={{ flexShrink: 0, padding: '9px 14px', borderRadius: 10, border: `1px solid ${t.border(isDark)}`, background: copied ? '#0F4C3A' : 'transparent', color: copied ? '#FAF5DD' : t.textSub(isDark), fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5 }}
          onMouseEnter={e => { if (!copied) e.currentTarget.style.background = t.hoverBg(isDark); }}
          onMouseLeave={e => { if (!copied) e.currentTarget.style.background = 'transparent'; }}>
          {copied ? (
            <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg> Copied</>
          ) : (
            <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy</>
          )}
        </button>
      </div>
      <p style={{ fontSize: 11, color: t.textMuted(isDark), marginTop: 5 }}>Share this with support when required.</p>
    </div>
  );
}

async function compressQRLogo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
        resolve(e.target.result); // SVG: use as data URI directly
        return;
      }
      // PNG: resize to max 80?-80 to hit ~10-15 KB
      const img = new Image();
      img.onload = () => {
        const MAX = 80;
        const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Exact same constants as QRCodeGenerator.jsx
const SF_SYMBOL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 215.88 255.99"><rect fill="#d3af37" x="87.69" y="154.96" width="40.5" height="40.5" rx="13.21" ry="13.21"/><path fill="#d3af37" d="m206.07,0H9.81C4.4,0,0,4.4,0,9.81v236.38c0,5.41,4.4,9.81,9.81,9.81h196.26c5.41,0,9.81-4.4,9.81-9.81V9.81c0-5.41-4.4-9.81-9.81-9.81ZM26.4,230.71V27.47h162.49v203.24H26.4Z"/></svg>`;
const SF_SYMBOL_URI  = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SF_SYMBOL_SVG)}`;
const SF_ICON_ASPECT = 255.99 / 215.88; // height/width of the SF symbol

function QRPreview({ fg, bg, stroke, logoUrl }) {
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function build() {
      // Match QRCodeGenerator constants exactly (scaled down for preview)
      const SCALE        = 0.55;
      const QR_SIZE      = Math.round(400 * SCALE);
      const PADDING      = Math.round(24  * SCALE);
      const BORDER_W     = Math.round(6   * SCALE);
      const BORDER_R     = Math.round(20  * SCALE);
      const TOTAL        = QR_SIZE + PADDING * 2 + BORDER_W * 2;

      const qrData = await QRCode.toDataURL('https://scanmyframe.com/frame/preview', {
        width: QR_SIZE, margin: 2,
        color: { dark: fg, light: bg },
        errorCorrectionLevel: 'H',
      });

      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = TOTAL;
      const ctx = canvas.getContext('2d');

      const clip = new Path2D();
      clip.roundRect(0, 0, TOTAL, TOTAL, BORDER_R);
      ctx.clip(clip);

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, TOTAL, TOTAL);

      const offset = BORDER_W + PADDING;
      await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, offset, offset, QR_SIZE, QR_SIZE); res(); };
        img.onerror = rej;
        img.src = qrData;
      });

      ctx.strokeStyle = stroke;
      ctx.lineWidth   = BORDER_W * 2;
      ctx.beginPath();
      ctx.roundRect(0, 0, TOTAL, TOTAL, BORDER_R);
      ctx.stroke();

      // Centre icon: user logo (square) or ScanMyFrame symbol
      const iconSrc    = logoUrl || SF_SYMBOL_URI;
      const iconAspect = logoUrl ? 1 : SF_ICON_ASPECT;
      const ICON_W     = Math.round(QR_SIZE * 0.20);
      const ICON_H     = Math.round(ICON_W * iconAspect);
      const ICON_PAD   = Math.round(10 * SCALE);
      const BG_W       = ICON_W + ICON_PAD * 2;
      const BG_H       = ICON_H + ICON_PAD * 2;
      const cx         = TOTAL / 2;
      const cy         = TOTAL / 2;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(cx - BG_W / 2, cy - BG_H / 2, BG_W, BG_H, Math.round(12 * SCALE));
      ctx.fill();

      await new Promise((res) => {
        const icon = new Image();
        icon.crossOrigin = 'anonymous';
        icon.onload = () => { ctx.drawImage(icon, cx - ICON_W / 2, cy - ICON_H / 2, ICON_W, ICON_H); res(); };
        icon.onerror = res; // skip icon on error
        icon.src = iconSrc;
      });

      if (!cancelled) setImgUrl(canvas.toDataURL('image/png'));
    }
    build().catch(() => {});
    return () => { cancelled = true; };
  }, [fg, bg, stroke, logoUrl]);

  return (
    <div style={{ textAlign: 'center' }}>
      {imgUrl
        ? <img src={imgUrl} alt="QR preview" style={{ width: 200, height: 200, display: 'block', margin: '0 auto' }} />
        : <div style={{ width: 200, height: 200, borderRadius: 14, background: bg, border: `4px solid ${stroke}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${stroke}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
          </div>
      }
    </div>
  );
}

function Tog({ isDark, on, fn, dis }) {
  return (
    <button onClick={() => !dis && fn(!on)} style={{ flexShrink:0, width:44, height:24, borderRadius:12, border:'none', cursor: dis?'not-allowed':'pointer', background: on?'#0F4C3A':t.border(isDark), position:'relative', transition:'background 0.2s, opacity 0.15s', opacity: dis?0.6:1 }}
      onMouseEnter={e => { if (!dis) e.currentTarget.style.opacity = '0.8'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = dis ? '0.6' : '1'; }}>
      <span style={{ position:'absolute', top:3, left: on?23:3, width:18, height:18, borderRadius:9, background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

function SCard({ isDark, title, eyebrow, children, footer }) {
  return (
    <div style={{ background:t.cardBg(isDark), border:`1px solid ${t.border(isDark)}`, borderRadius:16, overflow:'hidden', marginBottom:16 }}>
      <div style={{ padding:'20px 22px 0' }}>
        {eyebrow && <p style={{ margin:'0 0 3px', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:t.textMuted(isDark) }}>{eyebrow}</p>}
        <p style={{ margin:0, fontSize:15, fontWeight:700, color:t.textPrimary(isDark), fontFamily:'Poltawski Nowy, serif' }}>{title}</p>
      </div>
      <div style={{ padding:'16px 22px' }}>{children}</div>
      {footer && <div style={{ padding:'12px 22px', background: isDark?'rgba(255,255,255,0.02)':'#f8f7f4', borderTop:`1px solid ${t.border(isDark)}`, display:'flex', justifyContent:'flex-end', gap:10 }}>{footer}</div>}
    </div>
  );
}

function LockedAnalyticsTab({ isDark, onUpgrade }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SCard isDark={isDark} title="Analytics" eyebrow="Pro & Business only">
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 14px' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif' }}>
            Upgrade to unlock analytics
          </p>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: t.textSub(isDark), lineHeight: 1.6 }}>
            Detailed scan analytics, location, browser and device reports are available on Pro & Business plans.
          </p>
          <button onClick={onUpgrade} style={{ background: '#D4AF37', color: '#0F4C3A', fontWeight: 700, padding: '10px 24px', borderRadius: 12, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'opacity 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            View upgrade plans
          </button>
        </div>
      </SCard>
    </div>
  );
}

function SettingsTab({ user, userProfile, isDark, onResetPassword, onDeleteAccount, onCancelDeletion, onProfileUpdated, notificationData, onMarkNotificationRead, onDeleteNotification, onClearAllNotifications, section = 'profile', planId = 'free' }) {

  // Profile state
  const [name,         setName]         = useState(userProfile?.full_name      || '');
  const [bizName,      setBizName]      = useState(userProfile?.business_name  || '');
  const [bizEmail,     setBizEmail]     = useState(userProfile?.business_email || '');
  const [phone,        setPhone]        = useState(userProfile?.phone          || '');
  const [logoUrl,      setLogoUrl]      = useState(userProfile?.business_logo  || null);
  const [logoUploading,setLogoUploading]= useState(false);
  const [logoError,    setLogoError]    = useState('');
  const [emailQR,      setEmailQR]      = useState(userProfile?.qr_email_enabled ?? true);
  const [saved,        setSaved]        = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState('');
  const [qrToggling,   setQrToggling]   = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [expandedNotifId, setExpandedNotifId] = useState(null);
  const logoInputRef = useRef(null);

  // QR Branding state (localStorage keyed by user ID)
  const QR_BRAND_KEY = `sf_qr_brand_${user?.id}`;
  const loadBrand = (k, def) => { try { return JSON.parse(localStorage.getItem(QR_BRAND_KEY) || '{}')[k] || def; } catch { return def; } };
  const [qrFg,        setQrFg]        = useState(() => loadBrand('fg',      '#000000'));
  const [qrBg,        setQrBg]        = useState(() => loadBrand('bg',      '#ffffff'));
  const [qrStroke,    setQrStroke]    = useState(() => loadBrand('stroke',  '#0F4C3A'));
  const [qrLogo,      setQrLogo]      = useState(() => loadBrand('logo',    null));
  const [qrLogoError, setQrLogoError] = useState('');
  const [qrLogoLoading, setQrLogoLoading] = useState(false);
  const qrLogoInputRef = useRef(null);

  async function handleQrLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrLogoError('');
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    const isPng = file.type === 'image/png';
    if (!isSvg && !isPng) { setQrLogoError('Only SVG or PNG files are allowed.'); e.target.value = ''; return; }
    if (file.size > 100 * 1024) { setQrLogoError('File must be under 100 KB.'); e.target.value = ''; return; }
    setQrLogoLoading(true);
    try {
      const dataUrl = await compressQRLogo(file);
      setQrLogo(dataUrl);
    } catch { setQrLogoError('Could not process the file. Try a different one.'); }
    setQrLogoLoading(false);
    e.target.value = '';
  }
  const [brandSaved, setBrandSaved] = useState(false);

  const canQRBrand = ['business', 'trial'].includes(planId);

  // Reset QR branding when user loses access (e.g. downgrade from Business)
  useEffect(() => {
    if (!canQRBrand && user?.id) {
      const key = `sf_qr_brand_${user.id}`;
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      if (stored.fg || stored.bg !== '#ffffff' || stored.stroke !== '#0F4C3A' || stored.logo) {
        const defaults = { fg: '#000000', bg: '#ffffff', stroke: '#0F4C3A', logo: null };
        localStorage.setItem(key, JSON.stringify(defaults));
        setQrFg(defaults.fg); setQrBg(defaults.bg); setQrStroke(defaults.stroke);
        setQrLogo(null);
      }
    }
  }, [canQRBrand, user?.id]);

  function saveQRBrand() {
    localStorage.setItem(QR_BRAND_KEY, JSON.stringify({ fg: qrFg, bg: qrBg, stroke: qrStroke, logo: qrLogo || null }));
    setBrandSaved(true);
    setTimeout(() => setBrandSaved(false), 2000);
  }

  // Compute restriction info from last update
  const lastUpdated = userProfile?.settings_updated_at ? new Date(userProfile.settings_updated_at) : null;
  const daysSinceLast = lastUpdated ? Math.floor((Date.now() - lastUpdated.getTime()) / 86400000) : null;
  const daysRemaining = lastUpdated ? Math.max(0, 14 - daysSinceLast) : 0;
  const isRestricted = daysRemaining > 0;
  const nextUpdateDate = lastUpdated ? new Date(lastUpdated.getTime() + 14 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  const handleSaveClick = () => {
    setSaveError('');
    if (isRestricted) {
      setSaveError(`Settings locked. You can update again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} (${nextUpdateDate}).`);
      return;
    }
    setShowSaveConfirm(true);
  };

  const handleSaveConfirm = async () => {
    setShowSaveConfirm(false);
    setSaving(true);
    setSaveError('');
    const { data, error } = await supabase.rpc('update_user_settings', {
      p_full_name:     name,
      p_business_name: bizName,
      p_business_email: bizEmail.trim() || null,
      p_business_logo: logoUrl,
    });
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    if (data?.error === 'restriction') {
      setSaveError(`Settings locked. You can update again in ${data.days_remaining} day${data.days_remaining !== 1 ? 's' : ''}.`);
      return;
    }
    if (!data?.success) { setSaveError('Something went wrong. Please try again.'); return; }
    // Save phone separately (not covered by the RPC)
    await supabase.from('users').update({ phone: phone.trim() || null, updated_at: new Date().toISOString() }).eq('id', user.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onProfileUpdated?.(prev => ({ ...prev, full_name: name, business_name: bizName, business_email: bizEmail.trim() || null, phone: phone.trim() || null, settings_updated_at: new Date().toISOString() }));
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');

    // JPG only
    if (!['image/jpeg', 'image/jpg'].includes(file.type)) {
      setLogoError('Only JPG files are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('File must be under 2 MB.');
      e.target.value = '';
      return;
    }

    setLogoUploading(true);
    const path = `logos/${user.id}-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from('media').upload(path, file, { upsert: true, contentType: 'image/jpeg' });
    if (upErr) { setLogoError(upErr.message); setLogoUploading(false); return; }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
    const newUrl = urlData.publicUrl;

    const { error: dbErr } = await supabase.from('users').update({ business_logo: newUrl, updated_at: new Date().toISOString() }).eq('id', user.id);
    if (dbErr) { setLogoError(dbErr.message); setLogoUploading(false); return; }

    setLogoUrl(newUrl);
    onProfileUpdated?.(prev => ({ ...prev, business_logo: newUrl }));
    setLogoUploading(false);
    e.target.value = '';
  };

  const handleQRToggle = async () => {
    const next = !emailQR;
    setEmailQR(next);
    setQrToggling(true);
    await supabase.from('users').update({ qr_email_enabled: next, updated_at: new Date().toISOString() }).eq('id', user.id);
    setQrToggling(false);
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10,
    border: `1px solid ${t.border(isDark)}`, background: t.inputBg(isDark),
    color: t.textPrimary(isDark), fontSize: 13, outline: 'none', fontFamily: 'inherit',
  };
  const labelStyle = { display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted(isDark), marginBottom: 6 };

  const Card = ({ title, eyebrow, children, footer }) => (
    <div style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '22px 24px 0' }}>
        {eyebrow && <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textMuted(isDark) }}>{eyebrow}</p>}
        <p style={{ margin: '0 0 0', fontSize: 15, fontWeight: 700, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif' }}>{title}</p>
      </div>
      <div style={{ padding: '18px 24px' }}>{children}</div>
      {footer && <div style={{ padding: '12px 24px', background: isDark ? 'rgba(255,255,255,0.02)' : '#f8f7f4', borderTop: `1px solid ${t.border(isDark)}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>{footer}</div>}
    </div>
  );

  const Toggle = ({ on, onChange, disabled }) => (
    <button onClick={() => !disabled && onChange(!on)} style={{ flexShrink: 0, width: 44, height: 24, borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', background: on ? '#0F4C3A' : t.border(isDark), position: 'relative', transition: 'background 0.2s, opacity 0.15s', opacity: disabled ? 0.6 : 1 }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.8'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = disabled ? '0.6' : '1'; }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: 9, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  );

  const Row = ({ title, sub, control }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: `1px dashed ${t.border(isDark)}` }}>
      <div style={{ flex: 1, paddingRight: 20 }}>
        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: t.textPrimary(isDark) }}>{title}</p>
        <p style={{ margin: 0, fontSize: 12, color: t.textSub(isDark), lineHeight: 1.5 }}>{sub}</p>
      </div>
      {control}
    </div>
  );

  const saveBtn = (
    <button onClick={handleSaveClick} disabled={saving} style={{ background: isRestricted?(isDark?'#2a2a2a':'#e8e8e4'):'#0F4C3A', color: isRestricted?t.textMuted(isDark):'#FAF5DD', fontWeight:700, padding:'9px 20px', borderRadius:10, fontSize:12, border:'none', cursor: isRestricted?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, transition:'opacity 0.15s' }}
      onMouseEnter={e => { if (!isRestricted) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
      {saved ? <><Icon path={icons.check} size={12} style={{ color:'#FAF5DD' }} /> Saved!</> : saving ? 'Saving...' : 'Save changes'}
    </button>
  );

  const navSections = [
    { id:'profile',       label:'Profile',       icon:'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0' },
    { id:'branding',      label:'QR Branding',   icon:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 17h3v3h-3z' },
    { id:'notifications', label:'Notifications', icon:'M18 16v-5a6 6 0 10-12 0v5l-2 3h16l-2-3zM10 22a2 2 0 004 0' },
    { id:'security',      label:'Security',      icon:'M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z' },
    { id:'danger',        label:'Danger zone',   icon:'M12 2L1 21h22L12 2zM12 9v5M12 18v.01' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <h2 className="db-tab-h2" style={{ fontWeight:700, color:t.textPrimary(isDark), fontFamily:'Poltawski Nowy, serif' }}>Settings</h2>

      <div>

          {/* Profile */}
          {section === 'profile' && (
            <>
              <SCard isDark={isDark} title="Your profile" eyebrow="Personal details" footer={saveBtn}>
                <div className="db-profile-row" style={{ display:'flex', gap:32, alignItems:'flex-start' }}>

                  {/* Fields */}
                  <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:12 }}>
                    <AccountIdField userId={user?.id} isDark={isDark} labelStyle={labelStyle} />
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }} className="db-2col">
                      <div><label style={labelStyle}>Username</label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. dazeefa_studio" /></div>
                      <div><label style={labelStyle}>Account email</label><input style={{ ...inputStyle, opacity:0.5 }} value={user?.email||''} disabled /></div>
                    </div>

                    <div style={{ height:1, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)', margin:'4px 0 2px' }} />
                    <p style={{ margin:0, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:t.textMuted(isDark) }}>Business details</p>
                    <p className={`font-poltawski text-md ${isDark? 'text-white' : 'text-[#444]'}`}>Your contact card</p>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }} className="db-2col">
                      <div><label style={labelStyle}>Business name</label><input style={inputStyle} value={bizName} onChange={e => setBizName(e.target.value)} placeholder="Your business name" /></div>
                      <div><label style={labelStyle}>Phone</label><input style={inputStyle} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000" /></div>
                    </div>
                    <div>
                      <label style={labelStyle}>Business email</label>
                      <input style={inputStyle} type="email" value={bizEmail} onChange={e => setBizEmail(e.target.value)} placeholder="contact@yourbusiness.com" />
                      <p style={{ fontSize:11, color:t.textMuted(isDark), marginTop:4 }}>Shown publicly on your frame pages.</p>
                    </div>
                    {saveError && <p style={{ fontSize:12, color:'#ef4444', padding:'8px 12px', background:'rgba(239,68,68,0.08)', borderRadius:8, border:'1px solid rgba(239,68,68,0.2)', margin:0 }}>{saveError}</p>}
                    {lastUpdated && !isRestricted && <p style={{ fontSize:11, color:t.textMuted(isDark), margin:0 }}>Last updated {lastUpdated.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}.</p>}
                  </div>

                  {/* Logo upload ??" fills empty right space */}
                  <div className="db-profile-photo" style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:10, paddingTop:2 }}>
                    {/* Image box */}
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      style={{ width:110, height:110, borderRadius:14, background: isDark?'#1e1e1e':'#f0efe9', border:`1.5px dashed ${t.border(isDark)}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', cursor:'pointer', flexShrink:0, transition:'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#D4AF37'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = t.border(isDark)}
                    >
                      {logoUrl
                        ? <img src={logoUrl} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                            <Icon path={icons.frame} size={22} style={{ color:t.textMuted(isDark), opacity:0.4 }} />
                          </div>
                      }
                    </div>
                    <input ref={logoInputRef} type="file" accept=".jpg,.jpeg" onChange={handleLogoChange} style={{ display:'none' }} />

                    {/* Controls + label */}
                    <div className="db-profile-info" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                      {logoUploading
                        ? <p style={{ margin:0, fontSize:11, color:t.textMuted(isDark) }}>Uploading...</p>
                        : logoUrl
                          ? <button onClick={async () => { await supabase.from('users').update({ business_logo:null, updated_at:new Date().toISOString() }).eq('id',user.id); setLogoUrl(null); onProfileUpdated?.(prev=>({...prev,business_logo:null})); }} style={{ background:'transparent', border:'1px solid rgba(239,68,68,0.35)', color:'#ef4444', fontWeight:600, padding:'5px 14px', borderRadius:8, fontSize:11, cursor:'pointer', transition:'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Remove</button>
                          : <button onClick={() => logoInputRef.current?.click()} style={{ background:'#0F4C3A', color:'#FAF5DD', fontWeight:600, padding:'5px 14px', borderRadius:8, fontSize:11, border:'none', cursor:'pointer', transition:'opacity 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Upload</button>
                      }
                      <label style={{ ...labelStyle, margin:0 }}>Profile photo</label>
                      <p style={{ margin:0, fontSize:10, color:t.textMuted(isDark), textAlign:'center', lineHeight:1.4 }}>JPG only &middot; max 500kb</p>
                      {logoError && <p style={{ margin:0, fontSize:11, color:'#ef4444', textAlign:'center' }}>{logoError}</p>}
                    </div>
                  </div>

                </div>
                <style>{`
                  @keyframes spin { to { transform: rotate(360deg); } }
                  @media(max-width:639px) {
                    .db-profile-row { flex-direction: column !important; }
                    .db-profile-photo { flex-direction: row !important; align-items: flex-start !important; width: 100% !important; padding-top: 0 !important; gap: 14px !important; }
                    .db-profile-info { align-items: flex-start !important; }
                    .db-2col { grid-template-columns: 1fr !important; }
                  }
                `}</style>
              </SCard>
            </>
          )}

          {/* QR Branding */}
          {section === 'branding' && !canQRBrand && (
            <SCard isDark={isDark} title="QR code branding" eyebrow="Business only">
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:'block', margin:'0 auto 14px' }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <p style={{ margin:'0 0 6px', fontSize:15, fontWeight:700, color:t.textPrimary(isDark), fontFamily:'Poltawski Nowy, serif' }}>Upgrade to unlock QR Branding</p>
                <p style={{ margin:'0 0 20px', fontSize:13, color:t.textSub(isDark), lineHeight:1.6 }}>Customise your QR code colours, border and logo with a Business plan.</p>
                <button onClick={() => {}} style={{ background:'#D4AF37', color:'#0F4C3A', fontWeight:700, padding:'10px 24px', borderRadius:12, fontSize:13, border:'none', cursor:'pointer', transition:'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>View Business plan</button>
              </div>
            </SCard>
          )}
          {section === 'branding' && canQRBrand && (
            <SCard isDark={isDark} title="QR code branding" eyebrow="Customise your code"
              footer={<>
                <button onClick={() => { setQrFg('#000000'); setQrBg('#ffffff'); setQrStroke('#0F4C3A'); setQrLogo(null); setQrLogoError(''); }} style={{ padding:'9px 16px', borderRadius:10, border:`1px solid ${t.border(isDark)}`, background:'transparent', color:t.textSub(isDark), fontSize:12, fontWeight:600, cursor:'pointer', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg(isDark)}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Reset to default</button>
                <button onClick={saveQRBrand} style={{ background:'#0F4C3A', color:'#FAF5DD', fontWeight:700, padding:'9px 20px', borderRadius:10, fontSize:12, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  {brandSaved ? <><Icon path={icons.check} size={12} style={{ color:'#FAF5DD' }} /> Saved!</> : 'Save branding'}
                </button>
              </>}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'flex-start' }} className="db-brand-grid">
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                  {/* Colours */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }} className="db-brand-colors">
                    {[
                      { label:'Foreground', val:qrFg,     set:setQrFg     },
                      { label:'Background', val:qrBg,     set:setQrBg     },
                      { label:'Border',     val:qrStroke, set:setQrStroke },
                    ].map(({ label, val, set }) => (
                      <div key={label}>
                        <label style={labelStyle}>{label}</label>
                        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', border:`1px solid ${t.border(isDark)}`, borderRadius:10, background:t.inputBg(isDark) }}>
                          <input type="color" value={val} onChange={e => set(e.target.value)} style={{ width:28, height:28, padding:2, border:'none', borderRadius:6, cursor:'pointer', background:'transparent' }} />
                          <span style={{ fontSize:11, fontFamily:'monospace', color:t.textPrimary(isDark) }}>{val}</span>
                        </div>
                      </div>
                    ))}
                  </div>


                  {/* Brand logo */}
                  <div>
                    <label style={labelStyle}>Brand logo <span style={{ textTransform:'none', fontWeight:400, letterSpacing:0 }}>(recommended) - Type: SVG or PNG, Size: 24px by 24px, max 100 KB </span></label>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      {/* Current logo preview */}
                      <div style={{ width:60, height:60, borderRadius:10, background: isDark?'#2a2a2a':'#f0efe9', border:`1px solid ${t.border(isDark)}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                        {qrLogo
                          ? <img src={qrLogo} alt="brand logo" style={{ width:'100%', height:'100%', objectFit:'contain', padding:4 }} />
                          : <svg viewBox="0 0 215.88 255.99" width="22" height="22" style={{ opacity:0.5 }}><rect fill="#d3af37" x="87.69" y="154.96" width="40.5" height="40.5" rx="13.21"/><path fill="#d3af37" d="m206.07,0H9.81C4.4,0,0,4.4,0,9.81v236.38c0,5.41,4.4,9.81,9.81,9.81h196.26c5.41,0,9.81-4.4,9.81-9.81V9.81c0-5.41-4.4-9.81-9.81-9.81ZM26.4,230.71V27.47h162.49v203.24H26.4Z"/></svg>
                        }
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        <p style={{ margin:0, fontSize:12, color:t.textSub(isDark) }}>{qrLogo ? 'Custom logo active' : 'ScanMyFrame logo (default)'}</p>
                        <div style={{ display:'flex', gap:8 }}>
                          <input ref={qrLogoInputRef} type="file" accept=".svg,.png,image/svg+xml,image/png" onChange={handleQrLogoUpload} style={{ display:'none' }} />
                          <button onClick={() => qrLogoInputRef.current?.click()} disabled={qrLogoLoading} style={{ background:'#0F4C3A', color:'#FAF5DD', fontWeight:700, padding:'6px 14px', borderRadius:8, fontSize:11, border:'none', cursor: qrLogoLoading?'not-allowed':'pointer', opacity: qrLogoLoading?0.6:1, transition:'opacity 0.15s' }}
                            onMouseEnter={e => { if (!qrLogoLoading) e.currentTarget.style.opacity = '0.85'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = qrLogoLoading ? '0.6' : '1'; }}>
                            {qrLogoLoading ? 'Processing...' : qrLogo ? 'Change' : 'Upload'}
                          </button>
                          {qrLogo && <button onClick={() => { setQrLogo(null); setQrLogoError(''); }} style={{ background:'transparent', border:'1px solid rgba(239,68,68,0.35)', color:'#ef4444', fontWeight:600, padding:'5px 12px', borderRadius:8, fontSize:11, cursor:'pointer', transition:'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Remove</button>}
                        </div>
                        {qrLogoError && <p style={{ margin:0, fontSize:11, color:'#ef4444' }}>{qrLogoError}</p>}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding:'10px 14px', borderRadius:10, background: isDark?'rgba(212,175,55,0.06)':'rgba(15,76,58,0.04)', border:`1px solid ${isDark?'rgba(212,175,55,0.2)':'rgba(15,76,58,0.1)'}` }}>
                    <p style={{ margin:0, fontSize:12, color:t.textSub(isDark), lineHeight:1.6 }}>Applies to new QR codes only. Existing printed codes are not affected.</p>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label style={{ ...labelStyle, marginBottom:10 }}>Preview</label>
                  <QRPreview fg={qrFg} bg={qrBg} stroke={qrStroke} logoUrl={qrLogo} />
                </div>
              </div>
            </SCard>
          )}

          {/* Notifications */}
          {section === 'notifications' && (
            <>
              <SCard isDark={isDark} title="Email preferences" eyebrow="Delivery">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0' }}>
                  <div style={{ flex:1, paddingRight:20 }}>
                    <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:600, color:t.textPrimary(isDark) }}>Email QR code on creation</p>
                    <p style={{ margin:0, fontSize:12, color:t.textSub(isDark), lineHeight:1.5 }}>{emailQR ? "QR codes will be sent to your inbox after each generation. Check spam if missing." : "Currently off -QR codes won't be emailed."}</p>
                  </div>
                  <Tog isDark={isDark} on={emailQR} fn={() => handleQRToggle()} dis={qrToggling} />
                </div>
              </SCard>
              <SCard isDark={isDark} title="Notifications" eyebrow="Inbox"
                footer={notificationData?.length > 0 ? <button onClick={onClearAllNotifications} style={{ fontSize:11, fontWeight:600, color:'#ef4444', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'6px 14px', cursor:'pointer', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>Clear all</button> : null}>
                {!notificationData || notificationData.length === 0 ? (
                  <p style={{ fontSize:13, color:t.textSub(isDark), textAlign:'center', padding:'16px 0', margin:0 }}>No notifications yet.</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {notificationData.map(n => {
                      const isExp = expandedNotifId === n.id;
                      const bc = ({ info:{bg:'rgba(59,130,246,0.1)',color:'#3b82f6'}, success:{bg:'rgba(34,197,94,0.1)',color:'#22c55e'}, error:{bg:'rgba(239,68,68,0.1)',color:'#ef4444'}, alert:{bg:'rgba(234,179,8,0.1)',color:'#ca8a04'}, update:{bg:'rgba(168,85,247,0.1)',color:'#a855f7'} })[n.type] || {bg:'rgba(59,130,246,0.1)',color:'#3b82f6'};
                      return (
                        <div key={n.id} style={{ borderRadius:10, border:`1px solid ${n.is_read?t.border(isDark):'rgba(212,175,55,0.3)'}`, background: n.is_read?'transparent':(isDark?'rgba(212,175,55,0.04)':'rgba(212,175,55,0.06)'), overflow:'hidden' }}>
                          <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px' }}>
                            <span style={{ width:7, height:7, borderRadius:'50%', marginTop:5, flexShrink:0, background: n.is_read?'transparent':'#D4AF37', border: n.is_read?`1.5px solid ${t.border(isDark)}`:'none' }} />
                            <span style={{ flexShrink:0, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:6, background:bc.bg, color:bc.color, textTransform:'capitalize' }}>{n.type}</span>
                            <button onClick={() => { if(!n.is_read) onMarkNotificationRead(n.id,true); setExpandedNotifId(prev => prev===n.id?null:n.id); }} style={{ flex:1, textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:0, fontSize:12, color:t.textPrimary(isDark), lineHeight:1.5, transition:'opacity 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>{n.message}</button>
                            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                              <button onClick={() => onMarkNotificationRead(n.id,!n.is_read)} style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:6, background:'transparent', border:`1px solid ${t.border(isDark)}`, color:t.textMuted(isDark), cursor:'pointer', whiteSpace:'nowrap', transition:'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = t.hoverBg(isDark)}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{n.is_read?'Unread':'Read'}</button>
                              <button onClick={() => onDeleteNotification(n.id)} style={{ width:26, height:26, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', cursor:'pointer', transition:'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Icon path={icons.trash} size={11} /></button>
                            </div>
                          </div>
                          <AnimatePresence>
                            {isExp && n.full_description && (
                              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} transition={{ duration:0.18 }} style={{ overflow:'hidden', borderTop:`1px solid ${t.border(isDark)}`, padding:'10px 12px 10px 39px', fontSize:12, color:t.textSub(isDark), lineHeight:1.6 }}>
                                {n.full_description}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </SCard>
            </>
          )}

          {/* Security */}
          {section === 'security' && (
            <SCard isDark={isDark} title="Password & access" eyebrow="Security">
              <p style={{ margin:'0 0 16px', fontSize:13, color:t.textSub(isDark) }}>We'll send a reset link to <strong style={{ color:t.textPrimary(isDark) }}>{user?.email}</strong>.</p>
              <button onClick={onResetPassword} style={{ background:'#0F4C3A', color:'#FAF5DD', fontWeight:700, padding:'10px 22px', borderRadius:12, fontSize:13, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Request password reset</button>
            </SCard>
          )}

          {/* Danger zone */}
          {section === 'danger' && (
            <div style={{ background:t.cardBg(isDark), border:'1px solid rgba(239,68,68,0.25)', borderRadius:16, overflow:'hidden' }}>
              <div style={{ padding:'20px 22px 0' }}>
                <p style={{ margin:'0 0 3px', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#ef4444' }}>Danger zone</p>
                <p style={{ margin:0, fontSize:15, fontWeight:700, color:'#ef4444', fontFamily:'Poltawski Nowy, serif' }}>Delete your account</p>
              </div>
              <div style={{ padding:'14px 22px 20px' }}>
                {userProfile?.deletion_requested_at ? (
                  <div>
                    <p style={{ fontSize:12, color:t.textSub(isDark), marginBottom:12, lineHeight:1.6 }}>
                      Your account is scheduled for deletion on{' '}
                      <strong style={{ color:'#ef4444' }}>
                        {new Date(new Date(userProfile.deletion_requested_at).getTime() + 30*24*60*60*1000)
                          .toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
                      </strong>.
                      Your clients' QR codes will keep working after deletion.
                    </p>
                    <button onClick={onCancelDeletion} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:10, border:'1px solid rgba(15,76,58,0.4)', background:'transparent', color:'#0F4C3A', fontSize:13, fontWeight:600, cursor:'pointer', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,76,58,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      Cancel scheduled deletion
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize:12, color:t.textSub(isDark), marginBottom:14, lineHeight:1.6 }}>
                      Your account will be permanently deleted after a 30-day grace period. You can cancel at any time before then. Your clients' QR codes will keep working - only your personal data is removed.
                    </p>
                    <button onClick={onDeleteAccount} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:10, border:'1px solid rgba(239,68,68,0.35)', background:'transparent', color:'#ef4444', fontSize:13, fontWeight:600, cursor:'pointer', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Icon path={icons.trash} size={13} style={{ color:'#ef4444' }} /> Request account deletion
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

      </div>

      {/* 14-day save confirmation modal */}
      <AnimatePresence>
        {showSaveConfirm && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setShowSaveConfirm(false)} style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(3px)' }} />
            <div style={{ position:'fixed', inset:0, zIndex:2001, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <motion.div initial={{ opacity:0, scale:0.94, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.94, y:16 }} transition={{ type:'spring', stiffness:340, damping:28 }} style={{ pointerEvents:'all', width:'min(400px,90vw)', background: isDark?'#111':'#fff', border:`1px solid ${isDark?'#2a2a2a':'#e8e8e4'}`, borderRadius:20, padding:28, boxShadow:'0 24px 72px rgba(0,0,0,0.28)' }}>
                <div style={{ width:44, height:44, borderRadius:22, background:'rgba(212,175,55,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}><Icon path={icons.settings} size={20} style={{ color:'#D4AF37' }} /></div>
                <p style={{ fontSize:16, fontWeight:700, color: isDark?'#fff':'#0F4C3A', marginBottom:8 }}>Confirm settings update</p>
                <p style={{ fontSize:13, color: isDark?'#aaa':'#666', lineHeight:1.6, marginBottom:6 }}>After saving, your account settings will be <strong style={{ color:'#D4AF37' }}>locked for 14 days</strong>.</p>
                <p style={{ fontSize:13, color: isDark?'#aaa':'#666', lineHeight:1.6, marginBottom:22 }}>Make sure everything looks correct before continuing.</p>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setShowSaveConfirm(false)} style={{ flex:1, padding:'10px 0', borderRadius:12, fontSize:13, fontWeight:600, border:`1px solid ${isDark?'#2a2a2a':'#e8e8e4'}`, background:'transparent', color: isDark?'#aaa':'#555', cursor:'pointer', transition:'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg(isDark)}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Cancel</button>
                  <button onClick={handleSaveConfirm} style={{ flex:1, padding:'10px 0', borderRadius:12, fontSize:13, fontWeight:600, background:'#0F4C3A', color:'#FAF5DD', border:'none', cursor:'pointer', transition:'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Save &amp; lock</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ?"??"??"? Main Dashboard ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
export default function Dashboard() {
  const navigate               = useNavigate();
  const { user, signOut, }      = useAuth();
  const { isDark, toggleTheme } = useTheme();
  
  const [notification, setNotification] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting,        setDeleting]        = useState(false);
  const [deleteError,     setDeleteError]     = useState('');

  const [sub,         setSub]          = useState(() => {
    const cached = localStorage.getItem('sf_plan_id');
    return cached ? { subscription: { plan_id: cached } } : null;
  });
  const [notificationData, setNotificationData] = useState([])
  const [activeTab,      setActiveTab]      = useState('overview');
  const [settingsSection, setSettingsSection] = useState('profile');
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const loginAlertSent    = useRef(false);
  const notifContainerRef = useRef(null);
  const [guideActive,  setGuideActive]  = useState(false);
  const [guideSkipped, setGuideSkipped] = useState(false);
  const [guideStep,    setGuideStep]    = useState(0);

  // Close notification dropdown on outside click
  useEffect(() => {
    if (!notification) return;
    const handler = (e) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setNotification(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notification]);

  // Pick up the PWA install prompt captured globally in main.jsx
  useEffect(() => {
    if (window.__pwaInstallPrompt) setDeferredPrompt(window.__pwaInstallPrompt);
    const onReady     = () => setDeferredPrompt(window.__pwaInstallPrompt);
    const onInstalled = () => { setDeferredPrompt(null); window.__pwaInstallPrompt = null; };
    window.addEventListener('pwainstallready', onReady);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('pwainstallready', onReady);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [deferredPrompt,    setDeferredPrompt]    = useState(null);
  const [installDismissed,  setInstallDismissed]  = useState(() => {
    try {
      const raw = localStorage.getItem('pwa_install_dismissed');
      if (!raw) return false;
      const { ts } = JSON.parse(raw);
      return Date.now() - ts < 30 * 24 * 60 * 60 * 1000; // re-show after 30 days
    } catch { return false; }
  });
  const [frames,       setFrames]       = useState([]);

  const [userProfile,  setUserProfile]  = useState(null);
  const [loadingData,  setLoadingData]  = useState(true);
  const [editingFrame, setEditingFrame] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingData(true);
      try {
      const [framesRes, profileRes, subscriptionRes, notificationRes] = await Promise.all([
        supabase.from('frames').select('*, analytics(total_scans), media(media_url, media_type)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('notification').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (framesRes.data) setFrames(
        framesRes.data.map(f => ({
          ...f,
          total_scans: Array.isArray(f.analytics) ? f.analytics.reduce((s, r) => s + (r.total_scans || 0), 0) : (f.analytics?.total_scans ?? 0),
          media_url: f.media?.find(m => m.media_type === 'image')?.media_url || null,
          width: f.size?.width || 0,
          height: f.size?.height || 0
        }))
      );
      if (profileRes.data) {
        setUserProfile(profileRes.data);

        // ?"??"? Frame creation guide for new users ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
        const guideDone      = !!profileRes.data.frame_guide_done;
        const guideSavedStep = parseInt(localStorage.getItem('sf_frame_guide_step') || '0', 10);
        const guideResuming  = !guideDone && guideSavedStep > 0;
        const guideNewUser   = !guideDone && !framesRes.data?.length;
        if (guideNewUser || guideResuming) setGuideActive(true);

        // ?"??"? Login-from-new-device alert ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
        if (!loginAlertSent.current) {
          loginAlertSent.current = true;
          (async () => {
            try {
              const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) });
              if (!ipRes.ok) return;
              const { ip } = await ipRes.json();
              if (!ip) return;

              const { isNewDevice, isFirstDevice, browser, device } = await checkAndUpdateKnownDevices(user.id, ip, navigator.userAgent);

              // Skip if same device as before, or if this is their very first login
              if (!isNewDevice || isFirstDevice) return;

              let locationStr = '';
              try {
                const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(4000) });
                if (geoRes.ok) {
                  const geo = await geoRes.json();
                  const parts = [geo.city, geo.country_name].filter(Boolean);
                  if (parts.length) locationStr = parts.join(', ');
                }
              } catch (_) { /* geo lookup optional */ }

              const deviceTitle = device.charAt(0).toUpperCase() + device.slice(1);
              const browserTitle = browser.charAt(0).toUpperCase() + browser.slice(1);
              const deviceInfo = locationStr
                ? `${deviceTitle}, ${browserTitle} in ${locationStr}`
                : `${deviceTitle}, ${browserTitle}`;

              {
                const loginAt = new Date().toLocaleString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                  timeZone: 'UTC', timeZoneName: 'short',
                });

                const { data: newNotif } = await supabase.from('notification').insert({
                  user_id:          user.id,
                  type:             'alert',
                  message:          `We noticed a login to your ScanMyFrame account from a new device or location on ${loginAt}.`,
                  full_description: `From ${deviceInfo} on ${loginAt}.\n\nIf this was you, no action is needed. If you don't recognise this activity, reset your password immediately - go to Settings > Security and click "Request password reset".`,
                  is_read:          false,
                }).select().single();

                if (newNotif) setNotificationData(prev => [newNotif, ...prev]);

                sendLoginAlertEmail({
                  toEmail:    user.email,
                  userName:   profileRes.data.full_name || profileRes.data.business_name || 'there',
                  deviceInfo,
                  loginAt,
                  ip,
                });
              }
            } catch (_) { /* silently ignore IP fetch failures */ }
          })();
        }
      }
        if (subscriptionRes.data) {
          setSub(prev => ({ ...prev, subscription: subscriptionRes.data }));
          localStorage.setItem('sf_plan_id', subscriptionRes.data.plan_id);
        }
        if (notificationRes.data) setNotificationData(notificationRes.data);
      } catch (_) {
        // Prevent uncaught errors from leaving the dashboard stuck in loading state
      } finally {
        setLoadingData(false);
      }
    })();
  }, [user?.id]);

  // Refetch frames when visiting Frames or Analytics tab -guarantees fresh data
  useEffect(() => {
    if ((activeTab === 'frames' || activeTab === 'analytics') && user && !loadingData) refetchFrames();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const [billingRefreshTrigger, setBillingRefreshTrigger] = useState(0);
  useEffect(() => {
    if (activeTab === 'billing' && !loadingData) setBillingRefreshTrigger(n => n + 1);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const rawPlanId    = sub?.subscription?.plan_id || 'free';
  // Period has ended if current_period_end is in the past -regardless of status field
  const periodEnded  = rawPlanId !== 'free' && rawPlanId !== 'trial' &&
    sub?.subscription?.current_period_end &&
    new Date(sub.subscription.current_period_end) < new Date();
  // Trial drops to free once its period ends
  const trialExpired = rawPlanId === 'trial' &&
    sub?.subscription?.current_period_end &&
    new Date(sub.subscription.current_period_end) < new Date();
  const currentPlanId    = (periodEnded || trialExpired) ? 'free' : rawPlanId;
  const canViewAnalytics = ['trial', 'pro', 'business'].includes(currentPlanId);

  const effectivePlanLabel = currentPlanId.charAt(0).toUpperCase() + currentPlanId.slice(1);
  const effectiveQrLeft = sub?.subscription?.qr_allocated && sub.subscription.qr_allocated !== -1
    ? Math.max(0, sub.subscription.qr_allocated - (sub.subscription.qr_used || 0))
    : 0;

  const stats = {
    name:         userProfile?.business_name || userProfile?.full_name || '',
    totalFrames:  frames.length,
    totalScans:   frames.reduce((s, f) => s + (f.total_scans || 0), 0),
    activeFrames: frames.filter(f => (f.status || 'active') === 'active').length,
    plan:         effectivePlanLabel,
    qrCodeLeft:   effectiveQrLeft,
  };

  const navTo = (tab) => {
    if (tab === 'analytics' && !canViewAnalytics) {
      if (tab !== 'create') setEditingFrame(null);
      setActiveTab('analytics');
      setSidebarOpen(false);
      setSettingsExpanded(false);
      return;
    }
    if (tab !== 'create') setEditingFrame(null);
    setActiveTab(tab);
    setSidebarOpen(false);
    setSettingsExpanded(tab === 'settings');
    if (tab === 'frames') refetchFrames();
  };

  const handleNotification = () => {setNotification(!notification)}

  const handleResetPassword = ()=>{ signOut(); navigate('/forgot-password')}

  const handleDeleteAccount = () => { setDeleteError(''); setShowDeleteModal(true); };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const { error } = await supabase.rpc('request_account_deletion');
      if (error) throw new Error(error.message);

      // Refetch profile to get deletion_requested_at
      const { data: updated } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (updated) setUserProfile(updated);

      setShowDeleteModal(false);

      // Send confirmation email (fire-and-forget)
      const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      sendDeletionRequestEmail({
        toEmail:      user.email,
        userName:     userProfile?.full_name || userProfile?.business_name || 'there',
        deletionDate,
      });
    } catch (err) {
      setDeleteError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    try {
      const { error } = await supabase.rpc('cancel_account_deletion');
      if (error) throw new Error(error.message);
      const { data: updated } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (updated) setUserProfile(updated);
    } catch (err) {
      console.error('[cancelDeletion]', err.message);
    }
  };

  const handleSignOut = () => { signOut(); navigate('/signin'); };

  const handleMarkNotificationRead = async (id, isRead) => {
    setNotificationData(prev => prev.map(n => n.id === id ? { ...n, is_read: isRead } : n));
    const { error } = await supabase.from('notification').update({ is_read: isRead }).eq('id', id).eq('user_id', user.id);
    if (error) console.error('[notif:markRead]', error.message);
  };

  const handleDeleteNotification = async (id) => {
    setNotificationData(prev => prev.filter(n => n.id !== id));
    const { error } = await supabase.from('notification').delete().eq('id', id).eq('user_id', user.id);
    if (error) console.error('[notif:delete]', error.message);
  };

  const handleClearAllNotifications = async () => {
    if (!user) return;
    setNotificationData([]);
    const { error } = await supabase.from('notification').delete().eq('user_id', user.id);
    if (error) console.error('[notif:clearAll]', error.message);
  };

  const handleEditFrame = (frame) => { setEditingFrame(frame); setActiveTab('create'); };

  const handleDeleteFrame = (frameId) => setFrames(prev => prev.filter(f => f.id !== frameId));

  const refetchFrames = async () => {
    const { data } = await supabase.from('frames').select('*, analytics(total_scans), media(media_url, media_type)').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setFrames(data.map(f => ({
      ...f,
      total_scans: Array.isArray(f.analytics) ? f.analytics.reduce((s, r) => s + (r.total_scans || 0), 0) : f.analytics?.total_scans || 0,
      media_url: f.media?.find(m => m.media_type === 'image')?.media_url || null,
      width: f.size?.width || 0,
      height: f.size?.height || 0,
    })));
  };

  // Called by QRCodeGenerator after QR is generated -re-fetch only, stay on Create tab
  const handleFrameCreated = () => { refetchFrames(); };

  // Called by FrameEditor after an edit is saved -re-fetch and navigate back to frames
  const handleFrameSaved = async () => {
    setEditingFrame(null);
    await refetchFrames();
    setActiveTab('frames');
  };

  // ?"??"? Sidebar content ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"?
  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '22px 20px 16px', marginBottom: 6 }}>
        <img src={isDark? scanFrameLogo : scanFrameLogoAlt} alt="ScanMyFrame Logo" style={{ width: 'auto', height: 28 }} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 10px' }}>
        {NAV.map(item => {
          const active = activeTab === item.id;
          const isSettings = item.id === 'settings';

          if (isSettings) {
            return (
              <div key="settings">
                <button onClick={() => { if (activeTab === 'settings') { setSettingsExpanded(prev => !prev); } else { navTo('settings'); } }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.hoverBg(isDark); }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 2, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: active ? '#0F4C3A' : 'transparent', color: active ? '#FAF5DD' : t.textSub(isDark), transition: 'all 0.15s' }}>
                  <Icon path={icons.settings} size={15} />
                  Settings
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: settingsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.6 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {settingsExpanded && (
                  <div style={{ paddingLeft: 10, marginBottom: 4 }}>
                    {SETTINGS_SECTIONS.map(sub => {
                      const isPlanLocked = sub.plans && !sub.plans.includes(currentPlanId);
                      const subActive = settingsSection === sub.id;
                      return (
                        <button key={sub.id}
                          onClick={() => { setSettingsSection(sub.id); setSidebarOpen(false); }}
                          onMouseEnter={e => { if (!subActive) e.currentTarget.style.background = t.hoverBg(isDark); }}
                          onMouseLeave={e => { if (!subActive) e.currentTarget.style.background = 'transparent'; }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, marginBottom: 1, fontSize: 12, fontWeight: subActive ? 600 : 400, border: 'none', cursor: 'pointer', background: subActive ? 'rgba(212,175,55,0.12)' : 'transparent', color: sub.id === 'danger' ? '#ef4444' : subActive ? '#D4AF37' : t.textSub(isDark), transition: 'all 0.15s', textAlign: 'left' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d={sub.icon}/>
                          </svg>
                          {sub.label}
                          {isPlanLocked && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', opacity: 0.4 }}>
                              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button key={item.id} onClick={() => navTo(item.id)}
              {...(item.id === 'create'    ? { 'data-guide': 'nav-create'    } : {})}
              {...(item.id === 'frames'    ? { 'data-guide': 'nav-frames'    } : {})}
              {...(item.id === 'analytics' ? { 'data-guide': 'nav-analytics' } : {})}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.hoverBg(isDark); }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 2, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: active ? '#0F4C3A' : 'transparent', color: active ? '#FAF5DD' : t.textSub(isDark), transition: 'all 0.15s' }}>
              <Icon path={icons[item.icon]} size={15} />
              {item.label}
              {item.id === 'analytics' && !canViewAnalytics && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', opacity: 0.55 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              )}
              {item.id === 'create' && (
                <span style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: 9, background: '#D4AF37', color: '#0F4C3A', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="db-sidebar-bottom" style={{ padding: '10px 10px 16px', borderTop: `1px solid ${t.border(isDark)}`, marginTop: 8 }}>
        {/* User chip ??' Settings */}
        <button onClick={() => navTo('settings')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: t.chipBg(isDark), marginBottom: 6, border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: '#0F4C3A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {userProfile?.business_logo
              ? <img src={userProfile.business_logo} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 11, fontWeight: 700, color: '#FAF5DD' }}>
                  {(userProfile?.business_name || userProfile?.full_name || user?.email || 'V')[0].toUpperCase()}
                </span>
            }
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: t.textPrimary(isDark), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userProfile?.business_name || userProfile?.full_name || 'Vendor'}
            </p>
            <p style={{ fontSize: 10, color: t.textMuted(isDark), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          </div>
          <Icon path={icons.settings} size={12} style={{ color: t.textMuted(isDark), flexShrink: 0 }} />
        </button>
        {/* Help / Support */}
        <Link 
          to="/contact"
          target='blank'
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 9, fontSize: 11, border: `1px solid ${t.border(isDark)}`, background: 'transparent', color: t.textSub(isDark), cursor: 'pointer', textDecoration: 'none', marginBottom: 6 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Help &amp; Support
        </Link>

        {/* Referrals & Partnership */}
        <Link
          to="/referrals"
          target='blank_'
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 9, fontSize: 11, border: `1px solid ${t.border(isDark)}`, background: 'transparent', color: t.textSub(isDark), cursor: 'pointer', textDecoration: 'none', marginBottom: 6 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <Icon path={icons.gift} size={12} />
          Referrals
        </Link>

        {/* Install app - shows when browser has a deferred prompt */}
        {deferredPrompt && (
          <button
            onClick={async () => {
              deferredPrompt.prompt();
              const { outcome } = await deferredPrompt.userChoice;
              setDeferredPrompt(null);
              if (outcome === 'dismissed') {
                setInstallDismissed(true);
                localStorage.setItem('pwa_install_dismissed', JSON.stringify({ ts: Date.now() }));
              }
            }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 9, fontSize: 11, border: `1px solid ${t.border(isDark)}`, background: 'transparent', color: t.textSub(isDark), cursor: 'pointer', marginBottom: 6 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
            Install app
          </button>
        )}

        {/* Theme + signout */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: isDark ? 'Light' : 'Dark', icon: isDark ? 'sun' : 'moon', action: toggleTheme },
            { label: 'Sign out', icon: 'signout', action: handleSignOut },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 0', borderRadius: 9, fontSize: 11, border: `1px solid ${t.border(isDark)}`, background: 'transparent', color: t.textSub(isDark), cursor: 'pointer' }}>
              <Icon path={icons[btn.icon]} size={12} />
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const SIDEBAR_W = 220;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', background: t.pageBg(isDark), transition: 'background 0.2s' }}>
      <Helmet>
        <title>Dashboard - ScanMyFrame</title>        
      </Helmet>

      {/* Desktop sidebar */}
      <aside style={{ width: SIDEBAR_W, flexShrink: 0, position: 'fixed', top: 0, left: 0, overflow: 'hidden', background: t.sidebarBg(isDark), borderRight: `1px solid ${t.border(isDark)}`, zIndex: 30, display: 'none' }}
        className="lg-sidebar db-sidebar-h">
        <style>{`.lg-sidebar { display: block !important; } @media(max-width:1023px){.lg-sidebar{display:none!important}}`}</style>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} />
            <motion.aside initial={{ x: -SIDEBAR_W }} animate={{ x: 0 }} exit={{ x: -SIDEBAR_W }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="db-sidebar-h"
              style={{ position: 'fixed', top: 0, left: 0, width: SIDEBAR_W, overflow: 'hidden', zIndex: 50, background: t.sidebarBg(isDark), borderRight: `1px solid ${t.border(isDark)}` }}>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        className="main-offset">
        <style>{`
          @media(min-width:1024px){.main-offset{margin-left:${SIDEBAR_W}px!important}}
          .db-sidebar-h { position:fixed; top:0; bottom:0; }
          @media(max-width:1023px){.db-sidebar-bottom{padding-bottom:calc(24px + env(safe-area-inset-bottom,0px))!important;}}

          /* ?"??"? Responsive grid systems ?"??"? */
          .db-stat-grid      { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:14px; }
          .db-stat-value     { font-size:26px; margin:0; }
          .db-actions-grid   { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; }
          .db-frame-grid     { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
          .db-frame-card-img { aspect-ratio:2/3; height:auto; }
          .db-overview-twoup { display:grid; grid-template-columns:2fr 1fr; gap:16px; }
          .db-settings-grid  { display:grid; grid-template-columns:180px 1fr; gap:24px; align-items:flex-start; }
          .db-brand-grid     { display:grid; grid-template-columns:1fr auto; gap:24px; align-items:flex-start; }
          .db-2col           { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

          /* ?"??"? Responsive layout helpers ?"??"? */
          .db-main     { padding:24px 20px; }
          .db-card     { padding:24px; }
          .db-tab-h2   { font-size:22px; }
          .db-frames-hdr   { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; }
          .db-search-row   { display:flex; gap:8px; }
          .db-search-input { width:180px; }
          .db-logo-row     { display:flex; align-items:center; gap:14px; }
          .db-overview-frame-right { display:flex; align-items:center; gap:10px; flex-shrink:0; padding-left:16px; }

          /* ─── Mid (... 1100px) ─── */
          @media(max-width:1100px){
            .db-frame-grid     { grid-template-columns:repeat(2,1fr); }
          }

          /* ?"??"? Tablet (... 768px) ?"??"? */
          @media(max-width:768px){
            .db-main           { padding:20px 16px; }
            .db-overview-twoup { grid-template-columns:1fr; }
            .db-frame-grid     { grid-template-columns:1fr; }
          }

          /* ?"??"? Mobile (... 600px) ?"??"? */
          @media(max-width:600px){
            .db-main          { padding:16px 12px; }
            .db-card          { padding:16px; }
            .db-tab-h2        { font-size:19px; }
            .db-stat-grid     { grid-template-columns:repeat(2,1fr); gap:10px; }
            .db-stat-value    { font-size:18px !important; }
            .db-frame-grid    { gap:12px; }
            .db-frame-card-img { width:90px!important; }
            .db-actions-grid  { grid-template-columns:1fr; gap:8px; }
            .db-frames-hdr    { flex-direction:column; }
            .db-search-row    { width:100%; }
            .db-search-input  { width:100% !important; flex:1; }
            .db-logo-row      { flex-direction:column; align-items:flex-start; }
            .db-settings-grid  { grid-template-columns:1fr !important; }
            .db-brand-grid     { grid-template-columns:1fr !important; }
            .db-2col           { grid-template-columns:1fr !important; }
            .db-brand-colors   { grid-template-columns:1fr !important; }
            .db-overview-frame-right { padding-left:8px; gap:6px; }
          }

          /* ?"??"? Tiny (... 380px) ?"??"? */
          @media(max-width:380px){
            .db-stat-grid     { grid-template-columns:1fr; gap:8px; }
            .db-main          { padding:12px 10px; }
          }
        `}</style>

        {/* Top bar */}
        <header style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: `1px solid ${t.border(isDark)}`, background: t.headerBg(isDark) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setSidebarOpen(true)}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              style={{ padding: 8, borderRadius: 10, border: 'none', background: 'transparent', color: t.textSub(isDark), cursor: 'pointer' }}
              className="lg-hidden">
              <style>{`@media(min-width:1024px){.lg-hidden{display:none!important}}`}</style>
              <Icon path={icons.menu} size={20} />
            </button>
            <h1 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Poltawski Nowy, serif', color: t.textPrimary(isDark), textTransform: 'capitalize' }}>
              {activeTab === 'create' && editingFrame ? 'Edit frame' : NAV.find(n => n.id === activeTab)?.label}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Guide resume chip -shown when guide is active but skipped */}
            {guideActive && guideSkipped && (
              <GuideChip
                stepIdx={guideStep}
                onResume={() => setGuideSkipped(false)}
              />
            )}
            <div ref={notifContainerRef} style={{ position: 'relative' }}>
              <NotificationDropdown notification={notification} notificationData={notificationData} setNotificationData={setNotificationData} isDark={isDark} user={user}/>
              <button onClick={handleNotification}
                className="db-bell-btn"
                style={{ padding: 8, borderRadius: 10, border: 'none', background: 'transparent', color: t.textSub(isDark), cursor: 'pointer', position: 'relative' }}>
                <style>{`
                  @keyframes dbBellRing {
                    0%, 100% { transform: rotate(0deg); }
                    20%      { transform: rotate(15deg); }
                    40%      { transform: rotate(-12deg); }
                    60%      { transform: rotate(8deg); }
                    80%      { transform: rotate(-4deg); }
                  }
                  .db-bell-btn:hover .db-bell-icon { animation: dbBellRing 0.5s ease; transform-origin: top center; }
                `}</style>
                <Icon path={icons.bell} size={18} className="db-bell-icon" />
                {notificationData?.some(n => !n.is_read) &&
                <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3, background: '#D4AF37' }} />}
              </button>
            </div>
            {/* Upgrade button -hidden on Business plan */}
            {currentPlanId !== 'business' && (
              <button onClick={() => navTo('billing')}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', fontWeight: 700, padding: '7px 14px', borderRadius: 10, fontSize: 12, border: '1px solid rgba(212,175,55,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', transition: 'opacity 0.15s' }}
                title={currentPlanId === 'pro' ? 'Upgrade to Business' : 'Upgrade to Pro'}
                                className='hidden sm:flex'>
                <span className="hide-label-mobile">{currentPlanId === 'pro' ? 'Upgrade to Business' : 'Upgrade to Pro'}</span>
                <style>{`@media(max-width:639px){.hide-label-mobile{display:none}}`}</style>
              </button>
            )}
            <button onClick={() => {navTo('create'); setEditingFrame(null);}}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              style={{background: '#0F4C3A', color: '#FAF5DD', fontWeight: 700, padding: '7px 16px', borderRadius: 10, fontSize: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'opacity 0.15s' }}
              >
              <Icon path={icons.plus} size={12} style={{ color: '#FAF5DD' }} /> <span className='hide-label-mobile'>New Frame</span>
            </button>
          </div>
        </header>

        {/* AI Chat Widget - visible to everyone, usable on trial, pro & business */}
        <AIChatWidget
          userId={user?.id}
          locked={!['trial', 'pro', 'business'].includes(currentPlanId) }
          onUpgrade={() => navTo('billing')}
        />

        {/* Deletion scheduled banner */}
        {userProfile?.deletion_requested_at && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)',
            padding: '10px 20px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 13, color: '#ef4444', lineHeight: 1.5 }}>
              Your account is scheduled for deletion on{' '}
              <strong>
                {new Date(new Date(userProfile.deletion_requested_at).getTime() + 30 * 24 * 60 * 60 * 1000)
                  .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </strong>.
              Your clients' QR codes will keep working.
            </span>
            <button
              onClick={handleCancelDeletion}
              style={{
                padding: '5px 14px', borderRadius: 8, border: '1px solid #ef4444',
                background: 'transparent', color: '#ef4444',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Cancel deletion
            </button>
          </div>
        )}

        {/* PWA Install Banner */}
        {deferredPrompt && !installDismissed && (
          <div style={{ background: isDark ? 'rgba(15,76,58,0.18)' : 'rgba(15,76,58,0.07)', borderBottom: `1px solid rgba(15,76,58,0.2)`, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: isDark ? '#6ee7b7' : '#0F4C3A', display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.5 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              Install ScanMyFrame for quick access to your dashboard
            </span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={async () => {
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  setDeferredPrompt(null);
                  if (outcome === 'dismissed') {
                    setInstallDismissed(true);
                    localStorage.setItem('pwa_install_dismissed', JSON.stringify({ ts: Date.now() }));
                  }
                }}
                style={{ padding: '5px 14px', borderRadius: 8, border: 'none', background: '#0F4C3A', color: '#FAF5DD', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                Install app
              </button>
              <button
                onClick={() => { setInstallDismissed(true); localStorage.setItem('pwa_install_dismissed', JSON.stringify({ ts: Date.now() })); }}
                style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${t.border(isDark)}`, background: 'transparent', color: t.textSub(isDark), fontSize: 12, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = t.hoverBg(isDark)}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                aria-label="Dismiss">
                x
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="db-main" style={{ flex: 1, maxWidth: 900, margin: '0 auto', width: '100%' }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab + (editingFrame?.id || '')}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.16 }}>
              {loadingData
                ? <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Skeleton isDark={isDark} style={{ height: 32, width: 200 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
                      {[...Array(4)].map((_, i) => <Skeleton key={i} isDark={isDark} style={{ height: 110 }} />)}
                    </div>
                    <Skeleton isDark={isDark} style={{ height: 180 }} />
                  </div>
                : <>
                    {activeTab === 'overview'  && <OverviewTab stats={stats} frames={frames} isDark={isDark} onNavigate={navTo} canViewAnalytics={canViewAnalytics} notificationData={notificationData} />}
                    {activeTab === 'frames'    && <FramesTab frames={frames} isDark={isDark} onCreateFrame={() => navTo('create')} onEdit={handleEditFrame} onDelete={handleDeleteFrame} />}
                    {activeTab === 'create'    && <CreateTab editingFrame={editingFrame} onSaved={handleFrameSaved} onCreated={handleFrameCreated} isDark={isDark} onNavigateToBilling={() => navTo('billing')} planId={currentPlanId} />}
                    {activeTab === 'analytics' && (
                      canViewAnalytics
                        ? <AnalyticsTab frames={frames} isDark={isDark} planId={currentPlanId} notificationData={notificationData} />
                        : <LockedAnalyticsTab isDark={isDark} onUpgrade={() => navTo('billing')} />
                    )}
                    {activeTab === 'billing'   && null}
                    {activeTab === 'settings'  && <SettingsTab user={user} userProfile={userProfile} isDark={isDark} onResetPassword={handleResetPassword} onDeleteAccount={handleDeleteAccount} onCancelDeletion={handleCancelDeletion} onProfileUpdated={setUserProfile} notificationData={notificationData} onMarkNotificationRead={handleMarkNotificationRead} onDeleteNotification={handleDeleteNotification} onClearAllNotifications={handleClearAllNotifications} section={settingsSection} planId={currentPlanId} />}
                  </>
              }
            </motion.div>
          </AnimatePresence>

          {/* BillingTab kept mounted to avoid losing local state on tab switch */}
          <div style={{ display: activeTab === 'billing' ? 'block' : 'none' }}>
            <BillingTab refreshTrigger={billingRefreshTrigger} />
          </div>
        </main>
      </div>

      {/* ?"??"? Request Account Deletion Modal ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"? */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => !deleting && setShowDeleteModal(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
            />
            <div style={{ position: 'fixed', inset: 0, zIndex: 2001, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                style={{ pointerEvents: 'all', width: 'min(440px, 92vw)', background: isDark ? '#111' : '#fff', border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e4'}`, borderRadius: 20, padding: 28, boxShadow: '0 24px 72px rgba(0,0,0,0.28)' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon path={icons.trash} size={22} style={{ color: '#ef4444' }} />
                </div>

                <p style={{ fontSize: 17, fontWeight: 700, color: isDark ? '#fff' : '#0F4C3A', margin: '0 0 10px', fontFamily: 'Poltawski Nowy, serif' }}>
                  Request account deletion
                </p>

                {/* Grace period callout */}
                <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
                  <p style={{ margin: 0, fontSize: 12, color: isDark ? '#D4AF37' : '#a8862a', fontWeight: 700, marginBottom: 4 }}>30-day grace period</p>
                  <p style={{ margin: 0, fontSize: 12, color: isDark ? '#bbb' : '#666', lineHeight: 1.6 }}>
                    Your account won't be deleted immediately. You have 30 days to change your mind - cancel any time from this settings page.
                  </p>
                </div>

                <p style={{ fontSize: 13, color: isDark ? '#aaa' : '#666', lineHeight: 1.6, margin: '0 0 6px' }}>
                  After 30 days, your personal details, subscription, and login access will be permanently erased.
                </p>
                <p style={{ fontSize: 13, color: isDark ? '#aaa' : '#666', lineHeight: 1.6, margin: '0 0 20px' }}>
                  <strong style={{ color: isDark ? '#fff' : '#0F4C3A' }}>Your clients' QR codes keep working.</strong> Every frame you've created stays accessible - only your account information is removed.
                </p>

                {deleteError && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: '#ef4444' }}>
                    {deleteError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowDeleteModal(false)} disabled={deleting}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`, background: 'transparent', color: isDark ? '#ccc' : '#555', fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.5 : 1, transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = t.hoverBg(isDark); }}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Cancel
                  </button>
                  <button onClick={confirmDeleteAccount} disabled={deleting}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1, transition: 'opacity 0.15s' }}
                    onMouseEnter={e => { if (!deleting) e.currentTarget.style.opacity = '0.85'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = deleting ? '0.7' : '1'; }}>
                    {deleting ? 'Scheduling...' : 'Schedule deletion'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ?"??"? First-frame creation guide ?"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"??"? */}
      {guideActive && (
        <FrameGuide
          onNavToCreate={() => { navTo('create'); setEditingFrame(null); }}
          onNavToFrames={() => navTo('frames')}
          onNavToAnalytics={() => navTo('analytics')}
          frameCount={frames.length}
          onComplete={() => {
            setGuideActive(false);
            setGuideSkipped(false);
            localStorage.removeItem('sf_frame_guide_step');
            if (user) supabase.from('users').update({ frame_guide_done: true }).eq('id', user.id);
          }}
          skippedExternal={guideSkipped}
          onSkippedChange={(s) => { setGuideSkipped(s); }}
          onStepChange={(idx) => setGuideStep(idx)}
        />
      )}
    </main>
  );
}
