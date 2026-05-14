import { supabase } from '../services/supabaseClient';

// Signup with Email
export async function handleEmailSignup(name, email, password, newsletterOptIn = false) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, newsletter_opt_in: newsletterOptIn },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (authError) throw authError;
    localStorage.setItem('pendingEmail', email); // save email
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
