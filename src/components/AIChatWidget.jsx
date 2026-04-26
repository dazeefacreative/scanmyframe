/**
 * AIChatWidget.jsx
 * Floating AI chat icon (bottom-right of Dashboard).
 * Calls the ai-chat Supabase Edge Function → Groq (Llama 3.3 70B).
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabaseClient';

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

function storageKey(userId) {
  return userId ? `sf_chat_history_${userId}` : null;
}

export default function AIChatWidget({ userId }) {
  const { isDark } = useTheme();
  const [open,     setOpen]    = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]   = useState('');
  const [loading,  setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Load the correct history whenever the logged-in user changes
  useEffect(() => {
    const key = storageKey(userId);
    if (!key) { setMessages([]); return; }
    try {
      const saved = localStorage.getItem(key);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setMessages([]);
    }
  }, [userId]);

  // Persist messages to the user-scoped key
  useEffect(() => {
    const key = storageKey(userId);
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(messages));
  }, [messages, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function clearChat() {
    setMessages([]);
    const key = storageKey(userId);
    if (key) localStorage.removeItem(key);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Request failed');

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const bg     = isDark ? '#111111' : '#ffffff';
  const border = isDark ? '#2a2a2a' : '#e8e8e4';
  const msgBg  = isDark ? '#1e1e1e' : '#f0efe9';
  const textC  = isDark ? '#ffffff' : '#0F4C3A';
  const inputBg = isDark ? '#0a0a0a' : '#f5f5f0';

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0,  scale: 1 }}
            exit={{   opacity: 0, x: 40,  scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'fixed', bottom: 90, right: 20,
              width: 360, maxHeight: 530,
              zIndex: 1000, background: bg,
              border: `1px solid ${border}`, borderRadius: 20,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 18px', background: '#0F4C3A',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 17,
                  background: '#D4AF37', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: '#0F4C3A', fontWeight: 700,
                }}>
                  ✦
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#FAF5DD', fontFamily: 'Poltawski Nowy, serif', margin: 0 }}>
                    AI Guide
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(250,245,221,0.55)', margin: 0 }}>
                    Platform guide &amp; story assistant
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  style={{
                    background: 'transparent', border: 'none',
                    color: 'rgba(250,245,221,0.55)', cursor: 'pointer',
                    padding: '4px 6px', borderRadius: 6, lineHeight: 1,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(250,245,221,0.9)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(250,245,221,0.55)'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                </button>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: 'transparent', border: 'none',
                    color: 'rgba(250,245,221,0.65)', cursor: 'pointer',
                    fontSize: 22, lineHeight: 1, padding: '2px 4px',
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '14px 14px 8px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              {messages.length === 0 && (
                <div style={{ padding: '20px 4px' }}>
                  <div style={{ fontSize: 26, marginBottom: 10, textAlign: 'center', color: isDark ? '#ccc' : '#0F4C3A' }}>✦</div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#ccc' : '#0F4C3A', margin: '0 0 10px', textAlign: 'center' }}>
                    How can I help you today?
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {[
                      { label: 'Generate a story',    desc: 'Write a publish-ready artwork story for a client' },
                      { label: 'Polish my draft',     desc: 'I have a rough story that needs refining' },
                      { label: 'Create a client form',desc: 'Questions to collect story details from my client' },
                      { label: 'How do I create a frame?', desc: 'Walk me through the platform step by step' },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={() => { setInput(item.label); }}
                        style={{
                          textAlign: 'left', padding: '9px 12px', borderRadius: 10,
                          border: `1px solid ${isDark ? '#2a2a2a' : '#e8e8e4'}`,
                          background: isDark ? '#1a1a1a' : '#f5f5f0',
                          cursor: 'pointer', transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#D4AF37'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = isDark ? '#2a2a2a' : '#e8e8e4'}
                      >
                        <p style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#fff' : '#0F4C3A', margin: '0 0 2px' }}>{item.label}</p>
                        <p style={{ fontSize: 11, color: isDark ? '#777' : '#999', margin: 0 }}>{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '82%',
                    padding: '9px 13px',
                    borderRadius: msg.role === 'user'
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? '#0F4C3A' : msgBg,
                    color:      msg.role === 'user' ? '#FAF5DD' : textC,
                    fontSize: 13, lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '16px 16px 16px 4px',
                    background: msgBg,
                    display: 'flex', gap: 5, alignItems: 'center',
                  }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: 3,
                        background: '#D4AF37', display: 'inline-block',
                        animation: `sfChatBounce 1s ${i * 0.15}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '10px 14px 14px',
              borderTop: `1px solid ${border}`,
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything…"
                  rows={2}
                  style={{
                    flex: 1, padding: '9px 12px',
                    borderRadius: 12, border: `1px solid ${border}`,
                    background: inputBg, color: textC,
                    fontSize: 13, resize: 'none', outline: 'none',
                    fontFamily: 'inherit', lineHeight: 1.4,
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: '#0F4C3A', border: 'none',
                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'opacity 0.15s',
                    opacity: loading || !input.trim() ? 0.45 : 1,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#FAF5DD" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating trigger button ─────────────────────────────────────────── */}
      <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => setOpen(v => !v)}
          style={{
            position: 'fixed', bottom: 24, right: 24,
            width: 52, height: 52, borderRadius: 26,
            background: '#0F4C3A', border: '2px solid #D4AF37',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1001,
            boxShadow: '0 4px 24px rgba(15,76,58,0.45)',
            fontSize: 20, color: '#D4AF37', fontWeight: 700,
            transition: 'box-shadow 0.2s',
          }}
        >
          {open ? '×' : '✦'}
        </motion.button>


      <style>{`
        @keyframes sfChatBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
