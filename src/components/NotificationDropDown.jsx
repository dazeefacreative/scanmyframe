import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';

const typeStyles = {
  info:    'bg-blue-500/10 text-blue-500',
  success: 'bg-green-500/10 text-green-500',
  error:   'bg-red-500/10 text-red-500',
  alert:   'bg-yellow-500/10 text-yellow-600',
  update:  'bg-purple-500/10 text-purple-500',
};

export default function NotificationDropdown({ notification, notificationData, setNotificationData, isDark, user }) {
  const [expandedId, setExpandedId] = useState(null);

  const markRead = async (id) => {
    setNotificationData(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    const { error } = await supabase.from('notification').update({ is_read: true }).eq('id', id).eq('user_id', user.id);
    if (error) console.error('[notif:markRead]', error.message);
  };

  const handleClick = (alert) => {
    if (!alert.is_read) markRead(alert.id);
    setExpandedId(prev => (prev === alert.id ? null : alert.id));
  };

  return (
    <AnimatePresence>
      {notification && (
        <motion.ul
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`
            fixed left-0 right-0 top-[57px] mx-3 rounded-xl border p-4 space-y-3 shadow-xl backdrop-blur-md z-50
            sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:mx-0 sm:w-80
            ${isDark ? 'bg-[#1c1c1c]/95 border-white/10 text-white' : 'bg-white/95 border-black/10 text-gray-800'}
          `}
        >
          {notificationData?.length === 0 ? (
            <motion.li
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex items-start gap-3"
            >
              <span className={`min-w-[70px] text-center text-[10px] font-semibold px-2 py-1 rounded-md capitalize tracking-wide ${typeStyles.info}`}>
                cleared
              </span>
              <p className="text-xs leading-relaxed">You're all caught up</p>
            </motion.li>
          ) : (
            notificationData.map((alert, index) => {
              const isExpanded = expandedId === alert.id;
              return (
                <motion.li
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col gap-1"
                >
                  <button
                    onClick={() => handleClick(alert)}
                    className="flex items-start gap-3 w-full text-left"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {/* Type badge */}
                    <span className={`min-w-[70px] text-center text-[10px] font-semibold px-2 py-1 rounded-md capitalize tracking-wide flex-shrink-0 ${typeStyles[alert.type] || typeStyles.info}`}>
                      {alert.type}
                    </span>

                    {/* Message + unread dot */}
                    <div className="flex flex-1 items-start gap-2 min-w-0">
                      <p className="text-xs leading-relaxed flex-1">{alert.message}</p>
                      {!alert.is_read && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D4AF37', flexShrink: 0, marginTop: 3 }} />
                      )}
                    </div>
                  </button>

                  {/* Expanded full description */}
                  <AnimatePresence>
                    {isExpanded && alert.full_description && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ overflow: 'hidden'}}
                      >
                        <p style={{
                          fontSize: 11, lineHeight: 1.6, marginTop: 4,
                          color: isDark ? '#aaa' : '#555',
                          borderLeft: '2px solid rgba(212,175,55,0.4)',
                          paddingLeft: 8,
                        }}>
                          {alert.full_description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })
          )}
        </motion.ul>
      )}
    </AnimatePresence>
  );
}
