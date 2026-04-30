/**
 * CookieConsent.jsx
 * Cookie consent banner with granular preference controls.
 * Stores consent in localStorage under 'sf_cookie_consent'.
 * Listens for the custom event 'sf:openCookiePrefs' to reopen the modal
 * from footer links without needing a shared context.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const STORAGE_KEY = 'sf_cookie_consent';

function loadConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveConsent(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, consented: true }));
}

const CATEGORIES = [
  {
    id: 'essential',
    label: 'Essential Cookies',
    required: true,
    icon: '🔒',
    description:
      'These cookies are strictly necessary for the website to function and cannot be switched off. They are set in response to actions you take — such as logging in, saving your preferences, or completing a purchase. Without these, core features like your dashboard and QR frame management would not work.',
    examples: 'Session token, authentication state, CSRF protection.',
  },
  {
    id: 'analytics',
    label: 'Analytics Cookies',
    required: false,
    icon: '📊',
    description:
      'Analytics cookies help us understand how visitors interact with ScanMyFrame — which pages are popular, where users drop off, and how they navigate the platform. This data is aggregated and anonymous. Enabling this helps us improve the product for everyone.',
    examples: 'Page views, session duration, traffic sources.',
  },
  {
    id: 'marketing',
    label: 'Marketing Cookies',
    required: false,
    icon: '📣',
    description:
      'Marketing cookies allow us (and our partners) to show you relevant ads and content based on your interests, both on ScanMyFrame and on other sites. They also help us measure the effectiveness of our campaigns. Disabling these will not stop ads — you may just see less relevant ones.',
    examples: 'Ad targeting, retargeting pixels, campaign attribution.',
  },
];

export default function CookieConsent() {
  const { isDark } = useTheme();
  const [visible,      setVisible]      = useState(false);
  const [showPanel,    setShowPanel]    = useState(false);
  const [hasConsented, setHasConsented] = useState(false); // true once user explicitly accepts/rejects
  const [expanded,     setExpanded]     = useState(null);
  const [prefs, setPrefs] = useState({ essential: true, analytics: false, marketing: false });

  useEffect(() => {
    const existing = loadConsent();
    if (!existing) {
      // No choice made yet — show banner on every load
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    // User has already made a choice — load saved prefs, keep banner hidden
    setHasConsented(true);
    setPrefs({
      essential: true,
      analytics: existing.analytics ?? false,
      marketing: existing.marketing ?? false,
    });
  }, []);

  // Listen for 'sf:openCookiePrefs' dispatched from footer links
  useEffect(() => {
    function handleOpen() {
      const existing = loadConsent();
      if (existing) {
        setPrefs({
          essential: true,
          analytics: existing.analytics ?? false,
          marketing: existing.marketing ?? false,
        });
      }
      setVisible(true);
      setShowPanel(true);
    }
    window.addEventListener('sf:openCookiePrefs', handleOpen);
    return () => window.removeEventListener('sf:openCookiePrefs', handleOpen);
  }, []);

  function acceptAll() {
    const all = { essential: true, analytics: true, marketing: true };
    setPrefs(all);
    saveConsent(all);
    setHasConsented(true);
    setVisible(false);
    setShowPanel(false);
  }

  function rejectNonEssential() {
    const minimal = { essential: true, analytics: false, marketing: false };
    setPrefs(minimal);
    saveConsent(minimal);
    setHasConsented(true);
    setVisible(false);
    setShowPanel(false);
  }

  function savePreferences() {
    saveConsent(prefs);
    setHasConsented(true);
    setVisible(false);
    setShowPanel(false);
  }

  // Close panel without saving — if user hasn't consented yet, fall back to banner
  function closePanel() {
    setShowPanel(false);
    if (!hasConsented) {
      // Keep banner visible so they still have to make a choice
      setVisible(true);
    } else {
      setVisible(false);
    }
  }

  function toggle(id) {
    if (id === 'essential') return;
    setPrefs(p => ({ ...p, [id]: !p[id] }));
  }

  if (!visible) return null;

  const bg     = isDark ? '#111111' : '#ffffff';
  const border = isDark ? '#2a2a2a' : '#e8e8e4';
  const textC  = isDark ? '#ffffff' : '#111111';
  const sub    = isDark ? 'rgba(255,255,255,0.55)' : '#666666';
  const cardBg = isDark ? '#1a1a1a' : '#f8f7f4';
  const cardBorder = isDark ? '#2a2a2a' : '#e8e8e4';

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop for panel */}
          {showPanel && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 9998,
              }}
              onClick={closePanel}
            />
          )}

          {showPanel ? (
            /* ── Full preferences panel ────────────────────────────── */
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{   opacity: 0, y: 30,  scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                margin: '0 auto',
                width: '100%', maxWidth: 600,
                maxHeight: '92vh',
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: '20px 20px 0 0',
                zIndex: 9999,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 -8px 48px rgba(0,0,0,0.22)',
              }}
            >
              {/* Panel header */}
              <div style={{
                padding: '20px 24px 16px',
                borderBottom: `1px solid ${border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textC }}>
                    Cookie Preferences
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: sub }}>
                    Manage your consent settings below
                  </p>
                </div>
                <button
                  onClick={closePanel}
                  style={{
                    background: 'transparent', border: 'none',
                    fontSize: 22, color: sub, cursor: 'pointer', lineHeight: 1,
                    padding: '2px 4px',
                  }}
                >
                  ×
                </button>
              </div>

              {/* Categories */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                <p style={{ fontSize: 13, color: sub, lineHeight: 1.6, margin: '0 0 16px' }}>
                  We use cookies to improve your experience on ScanMyFrame, personalise content,
                  and analyse traffic. You can choose which categories to allow below. Your
                  choices are saved for 12 months.{' '}
                  <a href="/privacy" style={{ color: '#D4AF37', textDecoration: 'none' }}>
                    Privacy Policy
                  </a>
                </p>

                {CATEGORIES.map((cat, i) => {
                  const isOn = prefs[cat.id];
                  const isExpanded = expanded === cat.id;

                  return (
                    <div
                      key={cat.id}
                      style={{
                        background: cardBg,
                        border: `1px solid ${cardBorder}`,
                        borderRadius: 14,
                        marginBottom: i < CATEGORIES.length - 1 ? 10 : 0,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Category row */}
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        padding: '14px 16px',
                        gap: 12,
                      }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{cat.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: textC }}>
                              {cat.label}
                            </p>
                            {cat.required && (
                              <span style={{
                                fontSize: 10, fontWeight: 600,
                                background: 'rgba(15,76,58,0.12)',
                                color: '#0F4C3A', padding: '2px 7px',
                                borderRadius: 20, letterSpacing: '0.05em',
                              }}>
                                Always on
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setExpanded(isExpanded ? null : cat.id)}
                            style={{
                              background: 'none', border: 'none', padding: 0,
                              fontSize: 11, color: '#D4AF37', cursor: 'pointer',
                              marginTop: 3, textDecoration: 'underline',
                            }}
                          >
                            {isExpanded ? 'Hide details' : 'What are these?'}
                          </button>
                        </div>

                        {/* Toggle */}
                        <button
                          onClick={() => toggle(cat.id)}
                          disabled={cat.required}
                          title={cat.required ? 'Required — cannot be disabled' : undefined}
                          style={{
                            width: 44, height: 24, borderRadius: 12,
                            background: isOn ? '#0F4C3A' : (isDark ? '#333' : '#ccc'),
                            border: 'none', cursor: cat.required ? 'not-allowed' : 'pointer',
                            position: 'relative', flexShrink: 0,
                            transition: 'background 0.2s',
                            opacity: cat.required ? 0.75 : 1,
                          }}
                          aria-checked={isOn}
                          role="switch"
                        >
                          <span style={{
                            position: 'absolute',
                            top: 3, left: isOn ? 23 : 3,
                            width: 18, height: 18, borderRadius: 9,
                            background: '#fff',
                            transition: 'left 0.2s',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                          }} />
                        </button>
                      </div>

                      {/* Expanded description */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{   height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{
                              padding: '0 16px 16px',
                              borderTop: `1px solid ${cardBorder}`,
                              paddingTop: 12,
                            }}>
                              <p style={{ margin: '0 0 8px', fontSize: 12.5, color: sub, lineHeight: 1.65 }}>
                                {cat.description}
                              </p>
                              <p style={{ margin: 0, fontSize: 11.5, color: sub }}>
                                <strong style={{ color: textC }}>Examples:</strong> {cat.examples}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Panel actions */}
              <div style={{
                padding: '14px 24px 20px',
                borderTop: `1px solid ${border}`,
                display: 'flex', gap: 10, flexShrink: 0,
              }}>
                <button
                  onClick={rejectNonEssential}
                  style={{
                    flex: 1, padding: '11px 0',
                    background: 'transparent',
                    border: `1px solid ${border}`,
                    borderRadius: 12, cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    color: sub,
                  }}
                >
                  Reject all
                </button>
                <button
                  onClick={savePreferences}
                  style={{
                    flex: 1, padding: '11px 0',
                    background: 'transparent',
                    border: `1px solid ${isDark ? '#D4AF37' : '#0F4C3A'}`,
                    borderRadius: 12, cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    color: isDark ? '#D4AF37' : '#0F4C3A',
                  }}
                >
                  Save preferences
                </button>
                <button
                  onClick={acceptAll}
                  style={{
                    flex: 1, padding: '11px 0',
                    background: '#0F4C3A',
                    border: 'none', borderRadius: 12,
                    cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    color: '#FAF5DD',
                  }}
                >
                  Accept all
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── Compact banner ───────────────────────────────────── */
            <motion.div
              key="banner"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{
                position: 'fixed',
                bottom: 20, left: 0, right: 0,
                margin: '0 auto',
                width: 'calc(100% - 32px)', maxWidth: 680,
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 18,
                zIndex: 9999,
                padding: '18px 20px',
                boxShadow: '0 8px 48px rgba(0,0,0,0.18)',
                display: 'flex', gap: 16,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>🍪</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: textC }}>
                  We use cookies
                </p>
                <p style={{ margin: 0, fontSize: 12.5, color: sub, lineHeight: 1.6 }}>
                  ScanMyFrame uses essential cookies to ensure the site works correctly.
                  With your consent, we also use analytics and marketing cookies to improve the
                  platform.{' '}
                  <a href="/privacy" style={{ color: '#D4AF37', textDecoration: 'none' }}>
                    Learn more
                  </a>
                </p>

                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  <button
                    onClick={rejectNonEssential}
                    style={{
                      padding: '9px 16px', borderRadius: 10,
                      background: 'transparent',
                      border: `1px solid ${border}`,
                      cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                      color: sub, whiteSpace: 'nowrap',
                    }}
                  >
                    Reject all
                  </button>
                  <button
                    onClick={() => setShowPanel(true)}
                    style={{
                      padding: '9px 16px', borderRadius: 10,
                      background: 'transparent',
                      border: `1px solid ${isDark ? '#D4AF37' : '#0F4C3A'}`,
                      cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                      color: isDark ? '#D4AF37' : '#0F4C3A', whiteSpace: 'nowrap',
                    }}
                  >
                    Manage preferences
                  </button>
                  <button
                    onClick={acceptAll}
                    style={{
                      padding: '9px 20px', borderRadius: 10,
                      background: '#0F4C3A', border: 'none',
                      cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                      color: '#FAF5DD', whiteSpace: 'nowrap',
                    }}
                  >
                    Accept all
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
