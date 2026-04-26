import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabaseClient';
import QRCodeGenerator from '../components/QRCodeGenerator';
import FrameEditor from '../components/FrameEditor';
import BillingTab from '../components/BillingTab';
import AIChatWidget from '../components/AIChatWidget';

import scanFrameLogo from '../assets/images/Scanframe.png';
import scanFrameLogoAlt from '../assets/images/Scanframe alt.png';
import NotificationDropdown from '../components/NotificationDropDown';
import { sendLoginAlertEmail } from '../services/supabaseHelpers';

// ─── Icon primitive ───────────────────────────────────────────────────────────
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
};

const NAV = [
  { id: 'overview',  label: 'Overview',     icon: 'grid'     },
  { id: 'frames',    label: 'My Frames',    icon: 'frame'    },
  { id: 'create',    label: 'Create Frame', icon: 'plus'     },
  { id: 'analytics', label: 'Analytics',   icon: 'chart'    },
  { id: 'billing',   label: 'Billing',      icon: 'billing'  },
  { id: 'settings',  label: 'Settings',     icon: 'settings' },
];

// ─── Theme-aware colour tokens (no Tailwind gray) ────────────────────────────
// All colours are explicit hex values so Tailwind's gray override never bites.
const t = {
  // backgrounds
  pageBg:      (d) => d ? '#0a0a0a' : '#f5f5f0',
  sidebarBg:   (d) => d ? '#111111' : '#ffffff',
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ isDark, style }) => (
  <div style={{
    borderRadius: 12,
    background: isDark ? '#1e1e1e' : '#e8e8e4',
    animation: 'pulse 1.5s ease-in-out infinite',
    ...style,
  }} />
);

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accentBg, delay, isDark, onClick, active }) {
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
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: active ? accentBg : t.textMuted(isDark), transition: 'color 0.15s' }}>
          {label}
        </span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon path={icons[icon]} size={15} className="text-white" />
        </div>
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 700, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 11, marginTop: 4, color: t.textMuted(isDark) }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Frame card ───────────────────────────────────────────────────────────────
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
      style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, overflow: 'hidden' }}>
      {/* Thumbnail */}
      <div style={{ height: 120, background: '#0F4C3A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
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
      {/* Body */}
      <div style={{ padding: '14px 16px' }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {frame.title}
        </p>
        <p style={{ fontSize: 11, color: t.textMuted(isDark), marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          /{frame.frame_slug}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: t.textMuted(isDark), marginBottom: 12 }}>
          <Icon path={icons.scan} size={11} />
          {frame.total_scans ?? 0} scans
          <span style={{ margin: '0 2px' }}>·</span>
          {new Date(frame.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={btnBase} onClick={() => onEdit(frame)}>
            <Icon path={icons.edit} size={11} /> Edit
          </button>
          <button style={{ ...btnBase, ...(copied ? { borderColor: '#4ade80', color: '#4ade80' } : {}) }} onClick={handleCopy}>
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

// ─── Empty state ──────────────────────────────────────────────────────────────
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
        style={{ background: '#0F4C3A', color: '#FAF5DD', fontWeight: 700, padding: '10px 22px', borderRadius: 24, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon path={icons.plus} size={13} style={{ color: '#FAF5DD' }} /> Create my first frame
      </button>
    </motion.div>
  );
}

// ─── Delete modal ─────────────────────────────────────────────────────────────
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
            style={{ flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, border: `1px solid ${t.border(isDark)}`, background: 'transparent', color: t.textSub(isDark), cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({ stats, frames, isDark, onNavigate, canViewAnalytics }) {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="db-tab-h2" style={{ fontWeight: 700, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif' }}>
          {greeting()}, {stats.name || 'Vendor'}
        </h2>
        <p style={{ fontSize: 13, color: t.textSub(isDark), marginTop: 4 }}>Here's what's happening with your frames today.</p>
      </motion.div>

      {/* Stats */}
      <div className="db-stat-grid">
        <StatCard label="Total Frames"    value={stats.totalFrames}  sub="frames created"          icon="frame"   accentBg="#0F4C3A"  delay={0.05} isDark={isDark} />
        <StatCard label="All-Time Scans"  value={stats.totalScans}   sub="QR code scans"            icon="scan"    accentBg="#D4AF37"  delay={0.10} isDark={isDark} />
        <StatCard label="Active QR Codes" value={stats.activeFrames} sub="live & accessible"        icon="qr"      accentBg="#16a34a"  delay={0.15} isDark={isDark} />
        <StatCard label="Current Plan"    value={stats.plan}         sub={`${stats.plan === 'Business' ? 'Unlimited QR credits' : `${stats.qrCodeLeft} QR left`}`} icon="billing" accentBg="#7c3aed" delay={0.20} isDark={isDark} />
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
              }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted(isDark) }}>Recent frames</p>
          <button onClick={() => onNavigate('frames')} style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View all</button>
        </div>
        {frames.length === 0
          ? <EmptyFrames onCreateFrame={() => onNavigate('create')} isDark={isDark} />
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {frames.slice(0, 4).map(frame => (
                <div key={frame.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, border: `1px solid ${t.border(isDark)}`, background: t.cardBg(isDark) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#0F4C3A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ffffff' }}>
                      <Icon path={icons.frame} size={14} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary(isDark), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{frame.title}</p>
                      <p style={{ fontSize: 11, color: t.textMuted(isDark), overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-all' }}>/{frame.frame_slug}</p>
                    </div>
                  </div>
                  <div className="db-overview-frame-right">
                    <span style={{ fontSize: 12, color: t.textSub(isDark), fontWeight: 600 }}>{frame.total_scans ?? 0} scans</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                      background: frame.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(120,120,120,0.12)',
                      color: frame.status === 'active' ? '#4ade80' : '#888888',
                    }}>{frame.status || 'active'}</span>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

// ─── Frames tab ───────────────────────────────────────────────────────────────
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search frames…"
            className="db-search-input"
            style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${t.border(isDark)}`, background: t.inputBg(isDark), color: t.textPrimary(isDark), fontSize: 13, outline: 'none' }} />
          <button onClick={onCreateFrame}
            style={{ background: '#0F4C3A', color: '#FAF5DD', fontWeight: 700, padding: '8px 18px', borderRadius: 10, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
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

// ─── Create / Edit tab ────────────────────────────────────────────────────────
function CreateTab({ editingFrame, onSaved, isDark, onNavigateToBilling, planId }) {
  const isEdit = !!editingFrame;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 className="db-tab-h2" style={{ fontWeight: 700, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif' }}>
          {isEdit ? 'Edit frame' : 'Create a new frame'}
        </h2>
        <p style={{ fontSize: 13, color: t.textSub(isDark), marginTop: 4 }}>
          {isEdit
            ? `Editing "${editingFrame.title}" - the QR code URL will not change.`
            : 'Fill in the details and generate a QR code.'}
        </p>
      </div>
      <div className="db-card" style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16 }}>
        {isEdit
          ? <FrameEditor editingFrame={editingFrame} onSaved={onSaved} />
          : <QRCodeGenerator onSaved={onSaved} onNavigateToBilling={onNavigateToBilling} planId={planId} />
        }
      </div>
    </div>
  );
}

// ─── Analytics tab ────────────────────────────────────────────────────────────
function AnalyticsTab({ frames, isDark, planId }) {
  const RETENTION_LABEL = (planId === 'business' || planId === 'trial') ? 'All time' : planId === 'pro' ? 'Last 6 months' : 'Last 30 days';
  const [geoData,      setGeoData]      = useState({}); // { [frameId]: [{city, country, count}] }
  const [scanTotals,   setScanTotals]   = useState({}); // { [frameId]: number } — from scan_logs (ground truth)
  const [geoLoading,   setGeoLoading]   = useState(true);
  const [expandedGeo,  setExpandedGeo]  = useState({}); // { [frameId]: bool }
  const [viewMode,     setViewMode]     = useState('recent'); // 'recent' | 'top-frame' | 'top-location'

  useEffect(() => {
    if (!frames.length) { setGeoLoading(false); return; }
    const ids = frames.map(f => f.id);
    // Fetch ALL scan_logs (no city filter) so total and geo come from the same source.
    // This makes geo > total mathematically impossible.
    supabase
      .from('scan_logs')
      .select('frame_id, city, country')
      .in('frame_id', ids)
      .then(({ data }) => {
        if (!data) { setGeoLoading(false); return; }
        const geoMap   = {};
        const totalMap = {};
        data.forEach(({ frame_id, city, country }) => {
          totalMap[frame_id] = (totalMap[frame_id] || 0) + 1;
          if (city) {
            if (!geoMap[frame_id]) geoMap[frame_id] = {};
            const key = `${city}||${country}`;
            geoMap[frame_id][key] = (geoMap[frame_id][key] || { city, country, count: 0 });
            geoMap[frame_id][key].count += 1;
          }
        });
        const result = {};
        Object.keys(geoMap).forEach(fid => {
          result[fid] = Object.values(geoMap[fid]).sort((a, b) => b.count - a.count);
        });
        setScanTotals(totalMap);
        setGeoData(result);
        setGeoLoading(false);
      });
  }, [frames]);

  // scan_logs-derived total per frame (ground truth), falls back to analytics value while loading
  const frameTotal = (f) => scanTotals[f.id] ?? f.total_scans ?? 0;
  const totalScans = frames.reduce((s, f) => s + frameTotal(f), 0);
  const topFrame   = [...frames].sort((a, b) => frameTotal(b) - frameTotal(a))[0];

  // Flatten all geo entries across every frame → global location list
  const allLocations = (() => {
    const map = {};
    Object.entries(geoData).forEach(([, entries]) => {
      entries.forEach(({ city, country, count }) => {
        const key = `${city}||${country}`;
        if (!map[key]) map[key] = { city, country, count: 0 };
        map[key].count += count;
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  })();
  const topLocation = allLocations[0];

  // Frame list ordered by view mode
  const sortedFrames = viewMode === 'top-frame'
    ? [...frames].sort((a, b) => frameTotal(b) - frameTotal(a))
    : frames; // 'recent' keeps original created_at DESC order from the query

  // Panel header labels
  const panelLabel = viewMode === 'top-location' ? 'Top locations' : 'Frame performance';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="db-tab-h2" style={{ fontWeight: 700, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif', marginBottom: 0 }}>Analytics</h2>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, background: planId === 'business' ? 'rgba(212,175,55,0.15)' : planId === 'pro' ? 'rgba(124,58,237,0.12)' : 'rgba(120,120,120,0.1)', color: planId === 'business' ? '#a8862a' : planId === 'pro' ? '#7c3aed' : t.textMuted(isDark), border: `1px solid ${planId === 'business' ? 'rgba(212,175,55,0.3)' : planId === 'pro' ? 'rgba(124,58,237,0.25)' : 'rgba(120,120,120,0.2)'}` }}>
          {RETENTION_LABEL}
        </span>
      </div>

      {/* ── Clickable stat cards acting as view-mode tabs ── */}
      <div className="db-stat-grid">
        <StatCard
          label="Total Scans" value={totalScans.toLocaleString()} sub="all-time"
          icon="scan" accentBg="#0F4C3A" delay={0} isDark={isDark}
          active={viewMode === 'recent'}
          onClick={() => setViewMode('recent')}
        />
        <StatCard
          label="Top Frame" value={topFrame?.title || '-'} sub={`${topFrame ? frameTotal(topFrame).toLocaleString() : 0} scans`}
          icon="chart" accentBg="#7c3aed" delay={0.05} isDark={isDark}
          active={viewMode === 'top-frame'}
          onClick={() => setViewMode('top-frame')}
        />
        <StatCard
          label="Top Location"
          value={topLocation ? `${topLocation.city}${topLocation.country ? `, ${topLocation.country}` : ''}` : (geoLoading ? '…' : '—')}
          sub={topLocation ? `${topLocation.count.toLocaleString()} scans` : 'no data yet'}
          icon="pin" accentBg="#e2a242" delay={0.1} isDark={isDark}
          active={viewMode === 'top-location'}
          onClick={() => setViewMode('top-location')}
        />
      </div>

      {/* ── Performance panel ── */}
      <style>{`
        .af-row      { display:flex; align-items:center; gap:14px; padding:12px 20px; }
        .af-title    { font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .af-status   { flex-shrink:0; font-size:9px; font-weight:700; padding:2px 7px; border-radius:20px; text-transform:uppercase; letter-spacing:0.06em; }
        .af-geo-btn  { flex-shrink:0; font-size:10px; font-weight:700; color:#D4AF37; background:rgba(212,175,55,0.12); border:1px solid rgba(212,175,55,0.25); border-radius:6px; padding:2px 7px; cursor:pointer; white-space:nowrap; }
        .af-geo-btn .af-geo-label { display:inline; }
        .af-scan-ct  { font-size:14px; font-weight:700; }
        .af-geo-wrap { padding:0 20px 14px 64px; }
        .af-loc-name { font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:55%; }
        .af-loc-ct   { font-size:12px; font-weight:700; flex-shrink:0; }
        @media(max-width:479px){
          .af-row      { gap:8px; padding:10px 12px; }
          .af-title    { font-size:11px; }
          .af-status   { display:none; }
          .af-geo-btn  { padding:2px 5px; font-size:9px; }
          .af-geo-btn .af-geo-label { display:none; }
          .af-scan-ct  { font-size:12px; }
          .af-geo-wrap { padding:0 12px 12px 40px; }
          .af-loc-name { font-size:11px; max-width:50%; }
          .af-loc-ct   { font-size:11px; }
        }
      `}</style>

      <div style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${t.border(isDark)}`, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted(isDark) }}>
          {panelLabel}
        </div>

        {/* ── Top locations view ── */}
        {viewMode === 'top-location' && (
          geoLoading
            ? <p style={{ textAlign: 'center', padding: '48px 0', fontSize: 13, color: t.textSub(isDark) }}>Loading…</p>
            : allLocations.length === 0
              ? <p style={{ textAlign: 'center', padding: '48px 0', fontSize: 13, color: t.textSub(isDark) }}>No location data yet.</p>
              : allLocations.map(({ city, country, count }, i) => {
                  const locLabel = `${city}${country ? `, ${country}` : ''}`;
                  const pct = totalScans > 0 ? Math.round((count / totalScans) * 100) : 0;
                  return (
                    <div key={`${city}-${country}`} className="af-row" style={{ borderBottom: i < allLocations.length - 1 ? `1px solid ${t.border(isDark)}` : 'none' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: '#e2a242', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ffffff' }}>
                        <Icon path={icons.pin} size={13} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5, gap: 8 }}>
                          <span className="af-title" style={{ color: t.textPrimary(isDark) }} title={locLabel}>{locLabel}</span>
                          <span className="af-scan-ct" style={{ color: t.textPrimary(isDark), flexShrink: 0 }}>{count.toLocaleString()}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 99, background: isDark ? '#2a2a2a' : '#e8e8e4', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#e2a242', borderRadius: 99 }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 36 }}>
                        <p style={{ fontSize: 10, color: t.textMuted(isDark) }}>{pct}%</p>
                      </div>
                    </div>
                  );
                })
        )}

        {/* ── Frame performance view (recent or top-frame) ── */}
        {viewMode !== 'top-location' && (
          frames.length === 0
            ? <p style={{ textAlign: 'center', padding: '48px 0', fontSize: 13, color: t.textSub(isDark) }}>No scan data yet. Share your QR codes to start tracking.</p>
            : sortedFrames.map((frame, i) => {
                const frameScanCount = frameTotal(frame);
                const pct       = totalScans > 0 ? Math.round((frameScanCount / totalScans) * 100) : 0;
                const locations = geoData[frame.id] || [];
                const expanded  = expandedGeo[frame.id];
                const hasGeo    = locations.length > 0;
                const isActive  = frame.status === 'active';

                return (
                  <div key={frame.id} style={{ borderBottom: i < sortedFrames.length - 1 ? `1px solid ${t.border(isDark)}` : 'none' }}>
                    <div className="af-row">
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: '#0F4C3A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ffffff' }}>
                        <Icon path={icons.frame} size={12} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                          <p className="af-title" style={{ color: t.textPrimary(isDark) }}>{frame.title}</p>
                          <span
                            className="af-status"
                            title={!isActive ? 'No scans on this frame in the past 7 days.' : undefined}
                            style={{
                              background: isActive ? 'rgba(34,197,94,0.12)'  : 'rgba(120,120,120,0.12)',
                              color:      isActive ? '#4ade80'               : '#888888',
                              border:     `1px solid ${isActive ? 'rgba(34,197,94,0.25)' : 'rgba(120,120,120,0.25)'}`,
                              cursor:     !isActive ? 'help' : 'default',
                            }}>
                            {frame.status || 'inactive'}
                          </span>
                          {!geoLoading && hasGeo && (
                            <button
                              className="af-geo-btn"
                              onClick={() => setExpandedGeo(p => ({ ...p, [frame.id]: !p[frame.id] }))}>
                              {expanded ? '▲' : '▼'}
                              <span className="af-geo-label">
                                {expanded ? ' Hide' : ` ${locations.length} region${locations.length > 1 ? 's' : ''}`}
                              </span>
                            </button>
                          )}
                        </div>
                        <div style={{ height: 5, borderRadius: 99, background: isDark ? '#2a2a2a' : '#e8e8e4', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#D4AF37', borderRadius: 99 }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p className="af-scan-ct" style={{ color: t.textPrimary(isDark) }}>{frameScanCount.toLocaleString()}</p>
                        <p style={{ fontSize: 10, color: t.textMuted(isDark) }}>{pct}%</p>
                      </div>
                    </div>

                    {/* Per-frame geo breakdown */}
                    {expanded && hasGeo && (
                      <div className="af-geo-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {locations.map(({ city, country, count }) => {
                          const locPct = frameScanCount > 0 ? Math.round((count / frameScanCount) * 100) : 0;
                          const locLabel = `${city}${country ? `, ${country}` : ''}`;
                          return (
                            <div key={`${city}-${country}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Icon path={icons.pin} size={14} style={{ color: '#247923' }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3, gap: 6 }}>
                                  <span className="af-loc-name" style={{ color: t.textSub(isDark) }} title={locLabel}>{locLabel}</span>
                                  <span className="af-loc-ct" style={{ color: t.textPrimary(isDark) }}>{count.toLocaleString()}×</span>
                                </div>
                                <div style={{ height: 3, borderRadius: 99, background: isDark ? '#2a2a2a' : '#e8e8e4', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${locPct}%`, background: '#0F4C3A', borderRadius: 99 }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
        )}
      </div>
    </div>
  );
}

// ─── Billing tab ──────────────────────────────────────────────────────────────
// function BillingTab({ userProfile, isDark, onNavigateToPricing }) {
//   const plan      = userProfile?.plan || 'Trial Plan';
//   const qrCodeLeft  = userProfile?.qr_codes_remaining ?? 10;
//   const LABELS    = { free: 'Trial Plan', basic: 'Basic', pro: 'Pro', business: 'Business' };
//   const PRICES    = { free: '₦0/mo', basic: '₦3,000/mo', pro: '₦15,000/mo', business: '₦50,000/mo' };

//   const actionBtn = {
//     display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
//     borderRadius: 14, border: `1px solid ${t.border(isDark)}`, background: t.cardBg(isDark),
//     cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s',
//   };

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
//       <h2 style={{ fontSize: 22, fontWeight: 700, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif' }}>Billing</h2>

//       <div style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, padding: 24 }}>
//         <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
//           <div>
//             <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textMuted(isDark), marginBottom: 4 }}>Current plan</p>
//             <h3 style={{ fontSize: 24, fontWeight: 700, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif' }}>{LABELS[plan]}</h3>
//             <p style={{ fontSize: 13, color: t.textSub(isDark), marginTop: 3 }}>{PRICES[plan]}</p>
//           </div>
//           <button onClick={onNavigateToPricing}
//             style={{ background: '#0F4C3A', color: '#FAF5DD', fontWeight: 700, padding: '10px 22px', borderRadius: 12, fontSize: 13, border: 'none', cursor: 'pointer' }}>
//             Upgrade plan
//           </button>
//         </div>
//         {/* Quota bar */}
//         <div style={{ marginTop: 20 }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
//             <span style={{ color: t.textSub(isDark) }}>QR codes remaining</span>
//             <span style={{ fontWeight: 700, color: t.textPrimary(isDark) }}>{qrCodeLeft} left</span>
//           </div>
//           <div style={{ height: 7, borderRadius: 99, background: isDark ? '#2a2a2a' : '#e8e8e4', overflow: 'hidden' }}>
//             <div style={{ height: '100%', width: `${Math.min(100, (qrCodeLeft / 10) * 100)}%`, background: qrCodeLeft <= 2 ? '#ef4444' : '#D4AF37', borderRadius: 99, transition: 'width 0.4s' }} />
//           </div>
//         </div>
//       </div>

//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
//         {[
//           { label: 'Update payment method', desc: 'Change your card on file', icon: 'billing', action: () => {} },
//           { label: 'Billing history',        desc: 'View past invoices',       icon: 'eye',     action: () => {} },
//           { label: 'Cancel subscription',    desc: 'Downgrade to free',        icon: 'close',   action: () => {} },
//           { label: 'Upgrade plan',           desc: 'Get more QR codes',        icon: 'chart',   action: onNavigateToPricing },
//         ].map(item => (
//           <button key={item.label} onClick={item.action} style={actionBtn}>
//             <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(15,76,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//               <Icon path={icons[item.icon]} size={15} style={{ color: '#0F4C3A' }} />
//             </div>
//             <div>
//               <p style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary(isDark) }}>{item.label}</p>
//               <p style={{ fontSize: 11, color: t.textSub(isDark), marginTop: 1 }}>{item.desc}</p>
//             </div>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

// ─── Settings tab ─────────────────────────────────────────────────────────────
function SettingsTab({ user, userProfile, isDark, onResetPassword, onDeleteAccount, onProfileUpdated, notificationData, onMarkNotificationRead, onDeleteNotification, onClearAllNotifications }) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 className="db-tab-h2" style={{ fontWeight: 700, color: t.textPrimary(isDark), fontFamily: 'Poltawski Nowy, serif' }}>Settings</h2>

      <div className="db-card" style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: t.textPrimary(isDark) }}>Account</p>
        <div>
          <label style={labelStyle}>Full name</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label style={labelStyle}>Business name</label>
          <input style={inputStyle} value={bizName} onChange={e => setBizName(e.target.value)} placeholder="Your business name" />
        </div>
        <div>
          <label style={labelStyle}>Business email</label>
          <input style={inputStyle} type="email" value={bizEmail} onChange={e => setBizEmail(e.target.value)} placeholder="contact@yourbusiness.com" />
          <p style={{ fontSize: 11, color: t.textMuted(isDark), marginTop: 5 }}>Shown publicly on your frame pages as a contact address.</p>
        </div>
        <div>
          <label style={labelStyle}>Phone number</label>
          <input style={inputStyle} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000" />
          <p style={{ fontSize: 11, color: t.textMuted(isDark), marginTop: 5 }}>Shown on your frame pages so visitors can call you directly.</p>
        </div>
        <div>
          <label style={labelStyle}>Account email</label>
          <input style={{ ...inputStyle, opacity: 0.5 }} value={user?.email || ''} disabled />
        </div>
        {saveError && (
          <p style={{ fontSize: 12, color: '#ef4444', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
            {saveError}
          </p>
        )}
        {lastUpdated && !isRestricted && (
          <p style={{ fontSize: 11, color: t.textMuted(isDark) }}>
            Last updated {lastUpdated.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
          </p>
        )}
        <button onClick={handleSaveClick} disabled={saving}
          style={{ background: isRestricted ? (isDark ? '#2a2a2a' : '#e8e8e4') : '#0F4C3A', color: isRestricted ? t.textMuted(isDark) : '#FAF5DD', fontWeight: 700, padding: '10px 22px', borderRadius: 12, fontSize: 13, border: 'none', cursor: isRestricted ? 'not-allowed' : 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>
          {saved ? <><Icon path={icons.check} size={13} style={{ color: '#FAF5DD' }} /> Saved!</> : saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Save confirmation modal — 14-day warning */}
      <AnimatePresence>
        {showSaveConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSaveConfirm(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }} />
            <div style={{ position: 'fixed', inset: 0, zIndex: 2001, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                style={{ pointerEvents: 'all', width: 'min(400px, 90vw)', background: isDark ? '#111' : '#fff', border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e4'}`, borderRadius: 20, padding: 28, boxShadow: '0 24px 72px rgba(0,0,0,0.28)' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(212,175,55,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon path={icons.settings} size={20} style={{ color: '#D4AF37' }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#fff' : '#0F4C3A', marginBottom: 8 }}>Confirm settings update</p>
                <p style={{ fontSize: 13, color: isDark ? '#aaa' : '#666', lineHeight: 1.6, marginBottom: 6 }}>
                  After saving, your account settings will be <strong style={{ color: '#D4AF37' }}>locked for 14 days</strong>.
                </p>
                <p style={{ fontSize: 13, color: isDark ? '#aaa' : '#666', lineHeight: 1.6, marginBottom: 22 }}>
                  Make sure everything looks correct before continuing.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowSaveConfirm(false)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e4'}`, background: 'transparent', color: isDark ? '#aaa' : '#555', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveConfirm}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, background: '#0F4C3A', color: '#FAF5DD', border: 'none', cursor: 'pointer' }}>
                    Save &amp; lock
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Business logo upload */}
      <div className="db-card" style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: t.textPrimary(isDark) }}>Business Logo</p>
        <p style={{ fontSize: 12, color: t.textSub(isDark), marginTop: -10, lineHeight: 1.6 }}>
          Your logo appears on public frame pages as your creator identity. JPG only, max 2 MB.
        </p>
        <div className="db-logo-row">
          {/* Preview */}
          <div style={{ width: 64, height: 64, borderRadius: 12, background: isDark ? '#2a2a2a' : '#f0efe9', border: `1px solid ${t.border(isDark)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {logoUrl
              ? <img src={logoUrl} alt="Business logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Icon path={icons.frame} size={22} style={{ color: t.textMuted(isDark), opacity: 0.4 }} />
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              ref={logoInputRef}
              type="file"
              accept=".jpg,.jpeg"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              style={{ background: '#0F4C3A', color: '#FAF5DD', fontWeight: 700, padding: '8px 18px', borderRadius: 10, fontSize: 12, border: 'none', cursor: logoUploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: logoUploading ? 0.6 : 1 }}>
              {logoUploading
                ? <><span style={{ width: 12, height: 12, borderRadius: 6, border: '2px solid #FAF5DD', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Uploading…</>
                : logoUrl ? 'Change logo' : 'Upload logo'
              }
            </button>
            {logoUrl && !logoUploading && (
              <button
                onClick={async () => {
                  await supabase.from('users').update({ business_logo: null, updated_at: new Date().toISOString() }).eq('id', user.id);
                  setLogoUrl(null);
                  onProfileUpdated?.(prev => ({ ...prev, business_logo: null }));
                }}
                style={{ background: 'transparent', border: `1px solid rgba(239,68,68,0.35)`, color: '#ef4444', fontWeight: 600, padding: '6px 14px', borderRadius: 10, fontSize: 11, cursor: 'pointer' }}>
                Remove
              </button>
            )}
          </div>
        </div>
        {logoError && <p style={{ fontSize: 12, color: '#ef4444' }}>{logoError}</p>}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* QR email preference */}
      <div className="db-card" style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: t.textPrimary(isDark), marginBottom: 16 }}>Email preferences</p>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary(isDark), marginBottom: 3 }}>Email QR code on creation</p>
            <p style={{ fontSize: 12, color: t.textSub(isDark), lineHeight: 1.6 }}>
              Every time you generate a new QR frame, we'll send the branded QR code image directly to your inbox so you always have a copy.
              {!emailQR && <span style={{ display: 'block', marginTop: 4, color: '#D4AF37', fontWeight: 600 }}>Currently off — QR codes won't be emailed.</span>}
            </p>
          </div>
          {/* Toggle switch */}
          <button
            onClick={handleQRToggle}
            disabled={qrToggling}
            aria-label={emailQR ? 'Disable QR email' : 'Enable QR email'}
            style={{
              flexShrink: 0, width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: emailQR ? '#0F4C3A' : t.border(isDark),
              position: 'relative', transition: 'background 0.2s', opacity: qrToggling ? 0.6 : 1,
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: emailQR ? 23 : 3,
              width: 18, height: 18, borderRadius: 9, background: '#ffffff',
              transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      </div>

      {/* Notifications management */}
      <div className="db-card" style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: t.textPrimary(isDark) }}>
            Notifications
            {notificationData?.some(n => !n.is_read) && (
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: '#D4AF37', color: '#0F4C3A', padding: '2px 7px', borderRadius: 20 }}>
                {notificationData.filter(n => !n.is_read).length} unread
              </span>
            )}
          </p>
          {notificationData?.length > 0 && (
            <button onClick={onClearAllNotifications}
              style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' }}>
              Clear all
            </button>
          )}
        </div>

        {!notificationData || notificationData.length === 0 ? (
          <p style={{ fontSize: 13, color: t.textSub(isDark), textAlign: 'center', padding: '20px 0' }}>No notifications yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notificationData.map(n => {
              const isExpanded = expandedNotifId === n.id;
              const badgeColors = {
                info:    { bg: 'rgba(59,130,246,0.1)',   color: '#3b82f6' },
                success: { bg: 'rgba(34,197,94,0.1)',    color: '#22c55e' },
                error:   { bg: 'rgba(239,68,68,0.1)',    color: '#ef4444' },
                alert:   { bg: 'rgba(234,179,8,0.1)',    color: '#ca8a04' },
                update:  { bg: 'rgba(168,85,247,0.1)',   color: '#a855f7' },
              };
              const bc = badgeColors[n.type] || badgeColors.info;
              return (
                <div key={n.id} style={{ borderRadius: 10, border: `1px solid ${n.is_read ? t.border(isDark) : 'rgba(212,175,55,0.3)'}`, background: n.is_read ? 'transparent' : (isDark ? 'rgba(212,175,55,0.04)' : 'rgba(212,175,55,0.06)'), overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px' }}>
                    {/* Unread dot */}
                    <span style={{ width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: n.is_read ? 'transparent' : '#D4AF37', border: n.is_read ? `1.5px solid ${t.border(isDark)}` : 'none' }} />
                    {/* Type badge */}
                    <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: bc.bg, color: bc.color, textTransform: 'capitalize' }}>
                      {n.type}
                    </span>
                    {/* Message */}
                    <button
                      onClick={() => {
                        if (!n.is_read) onMarkNotificationRead(n.id, true);
                        setExpandedNotifId(prev => prev === n.id ? null : n.id);
                      }}
                      style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: t.textPrimary(isDark), lineHeight: 1.5 }}
                    >
                      {n.message}
                    </button>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => onMarkNotificationRead(n.id, !n.is_read)}
                        title={n.is_read ? 'Mark as unread' : 'Mark as read'}
                        style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: 'transparent', border: `1px solid ${t.border(isDark)}`, color: t.textMuted(isDark), cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {n.is_read ? 'Unread' : 'Read'}
                      </button>
                      <button
                        onClick={() => onDeleteNotification(n.id)}
                        title="Delete"
                        style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid rgba(239,68,68,0.25)`, color: '#ef4444', cursor: 'pointer' }}>
                        <Icon path={icons.trash} size={11} />
                      </button>
                    </div>
                  </div>
                  {/* Full description */}
                  <AnimatePresence>
                    {isExpanded && n.full_description && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ overflow: 'hidden', borderTop: `1px solid ${t.border(isDark)}`, padding: '10px 12px 10px 39px', fontSize: 12, color: t.textSub(isDark), lineHeight: 1.6 }}>
                        {n.full_description}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="db-card" style={{ background: t.cardBg(isDark), border: `1px solid ${t.border(isDark)}`, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button onClick={onResetPassword}
          style={{ background: '#0F4C3A', color: '#FAF5DD', fontWeight: 700, padding: '10px 22px', borderRadius: 12, fontSize: 13, border: 'none', cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}>
            Request password reset
        </button>
      </div>

      <div className="db-card" style={{ background: t.cardBg(isDark), border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>Danger zone</p>
        <p style={{ fontSize: 12, color: t.textSub(isDark), marginBottom: 14 }}>These actions are permanent and cannot be undone.</p>
        <button onClick={onDeleteAccount}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.35)', background: 'transparent', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Icon path={icons.signout} size={13} style={{ color: '#ef4444' }} /> Delete account
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
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
  const [activeTab,    setActiveTab]    = useState('overview');
  const loginAlertSent  = useRef(false);
  const notifContainerRef = useRef(null);

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
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
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
        supabase.from('frames').select('*, analytics(total_scans), media(media_url)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('notification').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (framesRes.data) setFrames(
        framesRes.data.map(f => ({
          ...f,
          total_scans: Array.isArray(f.analytics) ? f.analytics.reduce((s, r) => s + (r.total_scans || 0), 0) : (f.analytics?.total_scans ?? 0),
          media_url: f.media?.[0]?.media_url || null,
          width: f.size?.width || 0,
          height: f.size?.height || 0
        }))
      );
      if (profileRes.data) {
        setUserProfile(profileRes.data);

        // ── Login-from-new-location alert ───────────────────────────────────
        if (!loginAlertSent.current) {
          loginAlertSent.current = true;
          (async () => {
            try {
              const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) });
              if (!ipRes.ok) return;
              const { ip } = await ipRes.json();
              if (!ip) return;
              const storedIp = profileRes.data.last_known_ip;

              if (storedIp && storedIp !== ip) {
                // New IP — insert in-app notification
                const { data: newNotif } = await supabase.from('notification').insert({
                  user_id:          user.id,
                  type:             'alert',
                  message:          'Login from a new device or location detected.',
                  full_description: `A login to your ScanFrameNG account was detected from IP address ${ip}. If this was you, no action is needed. If you don't recognise this activity, reset your password immediately — go to Settings and click "Request password reset".`,
                  is_read:          false,
                }).select().single();

                // Update stored IP + prepend notification to list
                await supabase.from('users').update({ last_known_ip: ip }).eq('id', user.id);
                if (newNotif) setNotificationData(prev => [newNotif, ...prev]);

                // Fire-and-forget email alert
                sendLoginAlertEmail({
                  toEmail:  user.email,
                  userName: profileRes.data.full_name || profileRes.data.business_name || 'there',
                  ip,
                });
              } else if (!storedIp) {
                // First login — record IP silently, no alert
                await supabase.from('users').update({ last_known_ip: ip }).eq('id', user.id);
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

  const stats = {
    name:         userProfile?.business_name || userProfile?.full_name?.split(' ')[0] || '',
    totalFrames:  frames.length,
    totalScans:   frames.reduce((s, f) => s + (f.total_scans || 0), 0),
    activeFrames: frames.filter(f => (f.status || 'active') === 'active').length,
    plan:         sub?.subscription?.plan_id ? sub.subscription.plan_id.charAt(0).toUpperCase() + sub.subscription.plan_id.slice(1) : 'Free',
    qrCodeLeft:   sub?.subscription?.qr_allocated? sub.subscription.qr_allocated - (sub.subscription.qr_used || 0) : 0,
  };

  const rawPlanId    = sub?.subscription?.plan_id || 'free';
  // If subscription is cancelled and billing period has already ended, treat as free
  const periodEnded  = sub?.subscription?.status === 'cancelled' &&
    sub?.subscription?.current_period_end &&
    new Date(sub.subscription.current_period_end) < new Date();
  // Trial is a 30-day onboarding plan — when the period ends it drops to free
  const trialExpired = rawPlanId === 'trial' &&
    sub?.subscription?.current_period_end &&
    new Date(sub.subscription.current_period_end) < new Date();
  const currentPlanId    = (periodEnded || trialExpired) ? 'free' : rawPlanId;
  const canViewAnalytics = ['trial', 'pro', 'business'].includes(currentPlanId);

  const navTo = (tab) => {
    if (tab === 'analytics' && !canViewAnalytics) { setActiveTab('billing'); setSidebarOpen(false); return; }
    if (tab !== 'create') setEditingFrame(null);
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const handleNotification = () => {setNotification(!notification)}

  const handleResetPassword = ()=>{ signOut(); navigate('/forgot-password')}

  const handleDeleteAccount = () => { setDeleteError(''); setShowDeleteModal(true); };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const { error } = await supabase.rpc('delete_current_user');
      if (error) throw new Error(error.message);
      signOut();
      navigate('/');
    } catch (err) {
      setDeleteError(err.message || 'Something went wrong. Please try again.');
      setDeleting(false);
    }
  };

  const handleSignOut = () => { signOut(); navigate('/'); };

  const handleMarkNotificationRead = async (id, isRead) => {
    setNotificationData(prev => prev.map(n => n.id === id ? { ...n, is_read: isRead } : n));
    await supabase.from('notification').update({ is_read: isRead }).eq('id', id);
  };

  const handleDeleteNotification = async (id) => {
    setNotificationData(prev => prev.filter(n => n.id !== id));
    await supabase.from('notification').delete().eq('id', id);
  };

  const handleClearAllNotifications = async () => {
    if (!user) return;
    setNotificationData([]);
    await supabase.from('notification').delete().eq('user_id', user.id);
  };

  const handleEditFrame = (frame) => { setEditingFrame(frame); setActiveTab('create'); };

  const handleDeleteFrame = (frameId) => setFrames(prev => prev.filter(f => f.id !== frameId));

  const handleFrameSaved = async () => {
    setEditingFrame(null);
    const { data } = await supabase.from('frames').select('*, analytics(total_scans), media(media_url)').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setFrames(data.map(f => ({ 
      ...f,
      total_scans: (f.analytics || []).reduce((s, r) => s + (r.total_scans || 0), 0),
      media_url: f.media?.[0]?.media_url || null,
      width: f.size?.width || 0,
      height: f.size?.height || 0
    })));
    setActiveTab('frames');
  };

  // ── Sidebar content ────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '22px 20px 16px', marginBottom: 6 }}>
        <img src={isDark? scanFrameLogo : scanFrameLogoAlt} alt="ScanFrameNG Logo" style={{ width: 'auto', height: 28 }} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 10px' }}>
        {NAV.filter(item => item.id !== 'analytics' || canViewAnalytics).map(item => {
          const active = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => navTo(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                background: active ? '#0F4C3A' : 'transparent',
                color: active ? '#FAF5DD' : t.textSub(isDark),
                transition: 'all 0.15s',
              }}>
              <Icon path={icons[item.icon]} size={15} />
              {item.label}
              {item.id === 'create' && (
                <span style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: 9, background: '#D4AF37', color: '#0F4C3A', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '10px 10px 16px', borderTop: `1px solid ${t.border(isDark)}`, marginTop: 8 }}>
        {/* User chip → Settings */}
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
        {/* Theme + signout */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: isDark ? 'Light' : 'Dark', icon: isDark ? 'sun' : 'moon', action: toggleTheme },
            { label: 'Sign out', icon: 'signout', action: handleSignOut },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action}
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
    <div style={{ minHeight: '100vh', display: 'flex', background: t.pageBg(isDark), transition: 'background 0.2s' }}>

      {/* Desktop sidebar */}
      <aside style={{ width: SIDEBAR_W, flexShrink: 0, position: 'fixed', top: 0, left: 0, height: '100vh', overflow: 'hidden', background: t.sidebarBg(isDark), borderRight: `1px solid ${t.border(isDark)}`, zIndex: 30, display: 'none' }}
        className="lg-sidebar">
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
              style={{ position: 'fixed', top: 0, left: 0, height: '100vh', width: SIDEBAR_W, overflow: 'hidden', zIndex: 50, background: t.sidebarBg(isDark), borderRight: `1px solid ${t.border(isDark)}` }}>
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

          /* ── Responsive grid systems ── */
          .db-stat-grid    { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:14px; }
          .db-actions-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; }
          .db-frame-grid   { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; }

          /* ── Responsive layout helpers ── */
          .db-main     { padding:24px 20px; }
          .db-card     { padding:24px; }
          .db-tab-h2   { font-size:22px; }
          .db-frames-hdr   { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; }
          .db-search-row   { display:flex; gap:8px; }
          .db-search-input { width:180px; }
          .db-logo-row     { display:flex; align-items:center; gap:14px; }
          .db-overview-frame-right { display:flex; align-items:center; gap:10px; flex-shrink:0; padding-left:16px; }

          /* ── Tablet (≤ 768px) ── */
          @media(max-width:768px){
            .db-main { padding:20px 16px; }
          }

          /* ── Mobile (≤ 600px) ── */
          @media(max-width:600px){
            .db-main          { padding:16px 12px; }
            .db-card          { padding:16px; }
            .db-tab-h2        { font-size:19px; }
            .db-stat-grid     { grid-template-columns:repeat(2,1fr); gap:10px; }
            .db-frame-grid    { grid-template-columns:1fr; gap:12px; }
            .db-actions-grid  { grid-template-columns:1fr; gap:8px; }
            .db-frames-hdr    { flex-direction:column; }
            .db-search-row    { width:100%; }
            .db-search-input  { width:100% !important; flex:1; }
            .db-logo-row      { flex-direction:column; align-items:flex-start; }
            .db-overview-frame-right { padding-left:8px; gap:6px; }
          }

          /* ── Tiny (≤ 380px) ── */
          @media(max-width:380px){
            .db-stat-grid     { grid-template-columns:1fr; gap:8px; }
            .db-main          { padding:12px 10px; }
          }
        `}</style>

        {/* Top bar */}
        <header style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: `1px solid ${t.border(isDark)}`, background: t.headerBg(isDark) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setSidebarOpen(true)}
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
            <div ref={notifContainerRef} style={{ position: 'relative' }}>
              <NotificationDropdown notification={notification} notificationData={notificationData} setNotificationData={setNotificationData} isDark={isDark} user={user}/>
              <button onClick={handleNotification} style={{ padding: 8, borderRadius: 10, border: 'none', background: 'transparent', color: t.textSub(isDark), cursor: 'pointer', position: 'relative' }}>
                <Icon path={icons.bell} size={18} />
                {notificationData?.some(n => !n.is_read) &&
                <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3, background: '#D4AF37' }} />}
              </button>
            </div>
            {/* Upgrade button — hidden on Business plan */}
            {currentPlanId !== 'business' && (
              <button onClick={() => navTo('billing')}
                style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', fontWeight: 700, padding: '7px 14px', borderRadius: 10, fontSize: 12, border: '1px solid rgba(212,175,55,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}
                title={currentPlanId === 'pro' ? 'Upgrade to Business' : 'Upgrade to Pro'}
                                className='hidden md:flex'>
                ✦ <span className="hide-label-mobile">{currentPlanId === 'pro' ? 'Upgrade to Business' : 'Upgrade to Pro'}</span>
                <style>{`@media(max-width:639px){.hide-label-mobile{display:none}}`}</style>
              </button>
            )}
            <button onClick={() => {navTo('create'); setEditingFrame(null);}}
              style={{background: '#0F4C3A', color: '#FAF5DD', fontWeight: 700, padding: '7px 16px', borderRadius: 10, fontSize: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
              >
              <Icon path={icons.plus} size={12} style={{ color: '#FAF5DD' }} /> <span className='hide-label-mobile'>New Frame</span>
            </button>
          </div>
        </header>

        {/* AI Chat Widget — trial, pro, business only */}
        {['trial', 'pro', 'business'].includes(currentPlanId) && <AIChatWidget userId={user?.id} />}

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
                    {activeTab === 'overview'  && <OverviewTab stats={stats} frames={frames} isDark={isDark} onNavigate={navTo} canViewAnalytics={canViewAnalytics} />}
                    {activeTab === 'frames'    && <FramesTab frames={frames} isDark={isDark} onCreateFrame={() => navTo('create')} onEdit={handleEditFrame} onDelete={handleDeleteFrame} />}
                    {activeTab === 'create'    && <CreateTab editingFrame={editingFrame} onSaved={handleFrameSaved} isDark={isDark} onNavigateToBilling={() => navTo('billing')} planId={currentPlanId} />}
                    {activeTab === 'analytics' && canViewAnalytics && <AnalyticsTab frames={frames} isDark={isDark} planId={currentPlanId} />}
                    {activeTab === 'billing'   && <BillingTab />}
                    {activeTab === 'settings'  && <SettingsTab user={user} userProfile={userProfile} isDark={isDark} onResetPassword={handleResetPassword} onDeleteAccount={handleDeleteAccount} onProfileUpdated={setUserProfile} notificationData={notificationData} onMarkNotificationRead={handleMarkNotificationRead} onDeleteNotification={handleDeleteNotification} onClearAllNotifications={handleClearAllNotifications} />}
                  </>
              }
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Delete Account Confirmation Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => !deleting && setShowDeleteModal(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
              }}
            />

            {/* Modal centering wrapper */}
            <div style={{
              position: 'fixed', inset: 0, zIndex: 2001,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              style={{
                pointerEvents: 'all',
                width: 'min(420px, 90vw)',
                background: isDark ? '#111' : '#fff',
                border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e4'}`,
                borderRadius: 20,
                padding: 28,
                boxShadow: '0 24px 72px rgba(0,0,0,0.28)',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 24,
                background: 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Icon path={icons.trash} size={22} style={{ color: '#ef4444' }} />
              </div>

              <p style={{ fontSize: 17, fontWeight: 700, color: isDark ? '#fff' : '#0F4C3A', margin: '0 0 8px' }}>
                Delete your account?
              </p>
              <p style={{ fontSize: 13, color: isDark ? '#aaa' : '#666', lineHeight: 1.6, margin: '0 0 6px' }}>
                This action is <strong style={{ color: '#ef4444' }}>permanent and cannot be undone.</strong>
              </p>
              <p style={{ fontSize: 13, color: isDark ? '#aaa' : '#666', lineHeight: 1.6, margin: '0 0 6px' }}>
                Your account, current plan, and any remaining QR credits will be permanently erased.
              </p>
              <p style={{ fontSize: 13, color: isDark ? '#aaa' : '#666', lineHeight: 1.6, margin: '0 0 22px' }}>
                Your frame pages will remain publicly accessible via their QR codes but will no longer be associated with this account.
              </p>

              {deleteError && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  fontSize: 12, color: '#ef4444',
                }}>
                  {deleteError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
                    background: 'transparent',
                    color: isDark ? '#ccc' : '#555',
                    fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer',
                    opacity: deleting ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    border: 'none',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 13, fontWeight: 700,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    opacity: deleting ? 0.7 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {deleting ? 'Deleting…' : 'Yes, delete my account'}
                </button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}