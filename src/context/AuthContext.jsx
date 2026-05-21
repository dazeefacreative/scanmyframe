import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  requestPasswordReset,
  resetPasswordWithToken,
  verifyEmailWithToken,
  resendVerificationEmail,
} from '../services/supabaseHelpers';

const AuthContext = createContext();

const INACTIVITY_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inactivityTimer = useRef(null);

  useEffect(() => {
    // Use getUser() not getSession() — getSession reads localStorage without
    // server validation, so deleted accounts still appear signed in.
    // getUser() confirms with Supabase servers and catches deleted accounts.
    const checkSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          // Stale JWT in localStorage — wipe it so the app clears cleanly
          await supabase.auth.signOut({ scope: 'local' });
          setSession(null);
          setUser(null);
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          setUser(user);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'USER_DELETED' || event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user || null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(async () => {
      await supabase.auth.signOut({ scope: 'local' });
      setSession(null);
      setUser(null);
    }, INACTIVITY_TIMEOUT);
  }, []);

  useEffect(() => {
    if (!user) {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      return;
    }
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach(e => document.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();
    return () => {
      events.forEach(e => document.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user, resetInactivityTimer]);

  const signUp = async (email, password, fullName) => {
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email,
            full_name: fullName,
            is_vendor: true,
          },
        ]);

      if (profileError) throw profileError;

      // QR code usage record is auto-created by trigger
      setUser(authData.user);
      return { user: authData.user, error: null };
    } catch (err) {
      setError(err.message);
      return { user: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSession(data.session);
      setUser(data.user);
      return { user: data.user, error: null };
    } catch (err) {
      setError(err.message);
      return { user: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setSession(null);
      setUser(null);
      return { error: null };
    } catch (err) {
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestPasswordReset(email);
      if (result.error) throw new Error(result.error);
      return { error: null, message: result.message };
    } catch (err) {
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordWithToken = async (password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await resetPasswordWithToken(password);
      if (result.error) throw new Error(result.error);
      setUser(result.user);
      return { user: result.user, error: null };
    } catch (err) {
      setError(err.message);
      return { user: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (token, type = 'signup') => {
    setLoading(true);
    setError(null);
    try {
      const result = await verifyEmailWithToken(token, type);
      if (result.error) throw new Error(result.error);
      setSession(result.session);
      setUser(result.user);
      return { user: result.user, session: result.session, error: null };
    } catch (err) {
      setError(err.message);
      return { user: null, session: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await resendVerificationEmail();
      if (result.error) throw new Error(result.error);
      return { error: null, message: result.message };
    } catch (err) {
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    handlePasswordReset,
    handleResetPasswordWithToken,
    handleVerifyEmail,
    handleResendVerificationEmail,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};