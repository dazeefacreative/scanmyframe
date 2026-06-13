import { supabase } from '../services/supabaseClient';

// Check if an email already exists and which provider it belongs to.
// Uses a SECURITY DEFINER RPC to bypass RLS on auth.identities.
// Returns 'google' | 'email' | null (not found)
export async function checkEmailProvider(email) {
  try {
    const { data, error } = await supabase.rpc('get_email_provider', {
      p_email: email.toLowerCase().trim(),
    });

    if (error || data === undefined) return null;
    return data || null; // 'google', 'email', or null
  } catch {
    return null;
  }
}

// Apply any referral/promo code (from a manually entered code or a stored
// ?ref= link) to the just-created user. Best-effort — never blocks signup.
export async function applyPendingReferralCode(promoCode) {
  try {
    const code = (promoCode || '').trim() || localStorage.getItem('pending_referral_code');
    if (!code) return;

    const { error } = await supabase.rpc('apply_referral_code', { p_code: code.trim() });
    if (!error) localStorage.removeItem('pending_referral_code');
  } catch {
    // ignore — referral attribution is non-critical
  }
}

// Apply a pending partnership application (stored at signup time) once a
// session/auth.uid() is available — email confirmation may delay this.
// Best-effort — never blocks signup or login.
export async function applyPendingPartnerApplication() {
  try {
    const raw = localStorage.getItem('pending_partner_application');
    if (!raw) return;
    const a = JSON.parse(raw);

    // Remove before submitting so a concurrent call (e.g. the auth state
    // listener firing twice on email verification) can't double-submit.
    localStorage.removeItem('pending_partner_application');

    const { error } = await supabase.rpc('submit_partner_application', {
      p_contract_years: a.contract_years,
      p_requested_commission_rate: a.requested_commission_rate,
      p_confidence_level: a.confidence_level,
      p_estimated_monthly_referrals: a.estimated_monthly_referrals,
      p_audience_fit: a.audience_fit,
      p_preferred_code_type: a.preferred_code_type,
      p_preferred_referral_code: a.preferred_referral_code,
      p_applicant_type: a.applicant_type,
      p_team_size: a.team_size ?? null,
    });

    // Submission failed (e.g. no session yet) - restore for a later retry.
    if (error) localStorage.setItem('pending_partner_application', raw);
  } catch {
    // ignore — will retry after email verification
  }
}

// Signup as a Partner — separate account type, agreement form data is
// submitted (or queued) via submit_partner_application.
export async function handlePartnerSignup(email, password, applicationData, fullName = '') {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (authError) throw authError;

    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        email,
        full_name: fullName,
        is_vendor: false,
      }]);

    if (profileError && profileError.code !== '23505') throw profileError;

    localStorage.setItem('pending_partner_application', JSON.stringify(applicationData));
    await applyPendingPartnerApplication();

    localStorage.setItem('pendingEmail', email);
    return authData.user;
  } catch (err) {
    throw err;
  }
}

// Signup with Email — username is collected during onboarding, stored empty for now
export async function handleEmailSignup(email, password, referralCode = '') {
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

    await applyPendingReferralCode(referralCode);

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

      await applyPendingReferralCode();
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
