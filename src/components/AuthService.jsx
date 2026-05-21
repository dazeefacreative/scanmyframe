import { supabase } from '../services/supabaseClient';

// Signup with Email — username is collected during onboarding, stored empty for now
export async function handleEmailSignup(email, password) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: '' },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (authError) throw authError;

    // Manually create the users profile row.
    // Some DB triggers may not fire until email is confirmed, so we insert
    // directly to guarantee the row exists before onboarding runs.
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        email,
        full_name: '',
        is_vendor: true,
      }]);

    // 23505 = unique_violation: row already created by a trigger — safe to ignore
    if (profileError && profileError.code !== '23505') throw profileError;

    localStorage.setItem('pendingEmail', email);
    return authData.user;
  } catch (err) {
    throw err;
  }
}

// Login with Email
export async function handleEmailLogin(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return data.user;
  } catch (err) {
    throw err;
  }
}

// Google Login
export async function handleGoogleLogin() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    return data.user;
  } catch (err) {
    throw err;
  }
}

// Microsoft Login
export async function handleMicrosoftLogin() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email profile openid',
      },
    });

    if (error) throw error;

    return data.user;
  } catch (err) {
    throw err;
  }
}

// Apple Login
export async function handleAppleLogin() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    return data.user;
  } catch (err) {
    throw err;
  }
}

// Handle OAuth User Profile Creation (Google, Apple, etc.)
export async function handleOAuthUserProfile(user) {
  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('users')
        .upsert([
          {
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'User',
            avatar_url: user.user_metadata?.avatar_url || null,
            is_user: true,
          },
        ]);

      if (insertError) throw insertError;
    }

    return existingUser;
  } catch (err) {
    console.error('Error handling OAuth user profile:', err);
    return null;
  }
}

// Keep old name as alias so any other imports don't break
export const handleGoogleUserProfile = handleOAuthUserProfile;

// Post Login - Get user profile
export async function handlePostLogin(supabaseUser) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error('Failed to fetch user after login:', err);
    return null;
  }
}
