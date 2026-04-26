/**
 * OnboardingGuard.jsx
 *
 * Wrap your protected routes with this component.
 * - Not logged in          → /login
 * - Logged in, onboarding not completed → /onboarding
 * - Logged in, onboarding done          → renders children
 *
 * Usage in your router:
 *
 *   <Route element={<OnboardingGuard />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *     <Route path="/frames" element={<Frames />} />
 *     ...
 *   </Route>
 *
 *   // Onboarding sits outside the guard so it's always reachable:
 *   <Route path="/onboarding" element={<OnboardingFlow />} />
 */

import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export default function OnboardingGuard() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'unauthenticated' | 'needs_onboarding' | 'ready'
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    let resolved = false; // prevent double-resolution races

    async function checkUser(userId) {
      const { data: user, error } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

      if (!mounted) return;

      // PGRST116 = no row yet (new user whose trigger hasn't run) → onboarding
      if (error && error.code !== 'PGRST116') {
        setStatus('unauthenticated');
        return;
      }

      if (!user || !user.onboarding_completed) {
        setStatus('needs_onboarding');
      } else {
        setStatus('ready');
      }
    }

    async function check() {
      // getUser() validates the JWT with Supabase servers — no stale cache issues
      const { data: { user } } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        if (!resolved) { resolved = true; setStatus('unauthenticated'); }
        return;
      }

      resolved = true;
      await checkUser(user.id);
    }

    // Run immediately
    check();

    // Also re-run on any auth state change (sign-in, token refresh, sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      resolved = false; // allow re-resolution on auth change
      if (!session) {
        setStatus('unauthenticated');
        return;
      }
      checkUser(session.user.id);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (status === 'loading') {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (status === 'needs_onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

const styles = {
  loading: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--loading-bg, #0c0c0c)',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #0F4C3A',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};