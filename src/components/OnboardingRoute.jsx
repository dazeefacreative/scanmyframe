/**
 * OnboardingRoute.jsx
 *
 * Guards the /onboarding page.
 * - Not logged in                   → /signin
 * - Logged in, onboarding NOT done  → allow
 * - Logged in, onboarding DONE      → /dashboard
 */

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function OnboardingRoute({ children }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'done' | 'unauthenticated'

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus('unauthenticated'); return; }

      const { data } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      setStatus(data?.onboarding_completed ? 'done' : 'ok');
    }
    check();
  }, []);

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--loading-bg, #0c0c0c)',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #0F4C3A',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (status === 'unauthenticated') return <Navigate to="/signin" replace />;
  if (status === 'done')           return <Navigate to="/dashboard" replace />;

  return children;
}
