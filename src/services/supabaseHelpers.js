import { supabase } from './supabaseClient';

// ============================================
// AUTHENTICATION HELPERS
// ============================================

/**
 * Sign up a new user
//  * @param {string} email - User email
//  * @param {string} password - User password
//  * @param {string} fullName - User full name
//  * @returns {object} - User and error
//  */
// export const signUpUser = async (email, password, fullName) => {
//   try {
//     // Create auth user
//     const { data: authData, error: authError } = await supabase.auth.signUp({
//       email,
//       password,
//     });

//     if (authError) throw authError;

//     // Create user profile in database
//     const { data: userData, error: userError } = await supabase
//       .from('users')
//       .insert([
//         {
//           id: authData.user.id,
//           email,
//           full_name: fullName,
//           is_user: true,
//         },
//       ]);

//     if (userError) throw userError;

//     // Create QR code usage record
//     const { error: qrError } = await supabase
//       .from('qr_code_usage')
//       .insert([
//         {
//           user_id: authData.user.id,
//           free_allocation: 10,
//           free_used: 0,
//           paid_allocation: 0,
//           paid_used: 0,
//         },
//       ]);

//     if (qrError) throw qrError;

//     return { user: authData.user, error: null };
//   } catch (error) {
//     return { user: null, error: error.message };
//   }
// };

// /**
//  * Sign in user with email and password
//  * @param {string} email - User email
//  * @param {string} password - User password
//  * @returns {object} - Session and error
//  */
// export const signInUser = async (email, password) => {
//   try {
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) throw error;

//     return { session: data.session, user: data.user, error: null };
//   } catch (error) {
//     return { session: null, user: null, error: error.message };
//   }
// };

/**
 * Watch authentication state changes
 * @param {function} callback - Function to call when auth state changes
 * @returns {function} - Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(session);
    }
  );

  return () => subscription.unsubscribe();
};

/**
 * Request password reset for email
 * @param {string} email - User email
 * @returns {object} - Error message if any
 */
export const requestPasswordReset = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    return { error: null, message: 'Password reset email sent successfully' };
  } catch (error) {
    return { error: error.message };
  }
};

/**
 * Reset password with token from email
 * @param {string} password - New password
 * @returns {object} - User and error
 */
export const resetPasswordWithToken = async (password) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) throw error;

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

/**
 * Verify email with token (if using email verification)
 * @param {string} token - Verification token from email
 * @param {string} type - Token type ('signup' or 'recovery')
 * @returns {object} - Session and error
 */
export const verifyEmailWithToken = async (token, type = 'signup') => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,  // changed from token to token_hash
      type,
    });

    if (error) throw error;

    return { session: data.session, user: data.user, error: null };
  } catch (error) {
    return { session: null, user: null, error: error.message };
  }
};

/**
 * Resend verification email
 * @returns {object} - Error message if any
 */
export const resendVerificationEmail = async (email) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,  // use the passed email directly
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`, // add this
      },
    });

    if (error) throw error;

    return { error: null, message: 'Verification email sent successfully' };
  } catch (error) {
    return { error: error.message };
  }
};

// ============================================
// FRAME HELPERS
// ============================================

/**
 * Create a new frame
 * @param {object} frameData - Frame details
 * @returns {object} - Frame and error
 */
export const createFrame = async (frameData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('frames')
      .insert([
        {
          user_id: user.id,
          title: frameData.title,
          description: frameData.description,
          client_name: frameData.client_name,
          size: {
            width: frameData.width,
            height: frameData.height,
          },
          frame_slug: frameData.frame_slug,
          frame_features: frameData.frame_features || [],
        },
      ])
      .select();

    if (error) throw error;

    return { frame: data[0], error: null };
  } catch (error) {
    return { frame: null, error: error.message };
  }
};

/**
 * Get frame by slug (for public access)
 * @param {string} frameSlug - Frame slug
 * @returns {object} - Frame and error
 */
export const getFrameBySlug = async (frameSlug) => {
  try {
    const { data, error } = await supabase
      .from('frames')
      .select(
        `
        id,
        user_id,
        title,
        description,
        client_name,
        size,
        frame_features,
        is_password_protected,
        comments_enabled,
        created_at,
        users (
          full_name,
          business_name,
          business_logo,
          business_email,
          phone,
          business_type,
          country
        ),
        media (
          id,
          media_type,
          media_url,
          caption,
          display_order
        ),
        analytics (
          total_scans
        )
      `
      )
      .eq('frame_slug', frameSlug)
      .single();

    if (error) throw error;

    return { frame: data, error: null };
  } catch (error) {
    return { frame: null, error: error.message };
  }
};

/**
 * Get user's frames
 * @returns {object} - Frames and error
 */
export const getUserFrames = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('frames')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { frames: data || [], error: null };
  } catch (error) {
    return { frames: [], error: error.message };
  }
};

// ─── Deduct a QR code (called when a frame is created) ───────────────────────
// Uses direct table query instead of RPC to avoid schema-cache issues.
export const consumeQRCode = async (userId) => {
  try {
    // 1. Fetch current subscription row
    const { data: sub, error: fetchErr } = await supabase
      .from('subscriptions')
      .select('id, qr_allocated, qr_used, status, current_period_end, plan_id')
      .eq('user_id', userId)
      .single();

    if (fetchErr) return { success: false, error: fetchErr.message };
    if (!sub)     return { success: false, error: 'No subscription found.' };

    const { qr_allocated, qr_used, status, current_period_end, plan_id } = sub;
    const isUnlimited = qr_allocated === -1;

    // 2. Guard: block if billing period has expired, regardless of status field
    const now = new Date();
    const periodExpired = current_period_end && new Date(current_period_end) < now;
    if (periodExpired || !['active', 'cancelled', 'trial'].includes(status)) {
      return { success: false, error: 'Your subscription has ended. Please renew your plan to create QR codes.' };
    }

    // 3. Guard: check quota
    if (!isUnlimited && qr_used >= qr_allocated) {
      return { success: false, error: 'QR code limit reached. Please upgrade your plan.' };
    }

    // 3. Increment qr_used
    const newUsed = isUnlimited ? qr_used : qr_used + 1;
    const { error: updateErr } = await supabase
      .from('subscriptions')
      .update({ qr_used: newUsed, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateErr) return { success: false, error: updateErr.message };

    return {
      success:      true,
      qr_used:      newUsed,
      qr_allocated: qr_allocated,
      plan_id:      plan_id,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Update frame
 * @param {string} frameId - Frame ID
 * @param {object} updates - Fields to update
 * @returns {object} - Updated frame and error
 */
export const updateFrame = async (frameId, updates) => {
  try {
    const { data, error } = await supabase
      .from('frames')
      .update(updates)
      .eq('id', frameId)
      .select();

    if (error) throw error;

    return { frame: data[0], error: null };
  } catch (error) {
    return { frame: null, error: error.message };
  }
};

/**
 * Delete frame
 * @param {string} frameId - Frame ID
 * @returns {object} - Error (if any)
 */
export const deleteFrame = async (frameId) => {
  try {
    const { error } = await supabase
      .from('frames')
      .delete()
      .eq('id', frameId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// ============================================
// MEDIA HELPERS
// ============================================

/**
 * Upload media file to Supabase storage
 * @param {File} file - File to upload
 * @param {string} frameId - Frame ID
 * @returns {object} - Public URL and error
 */
export const uploadMedia = async (file, frameId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${frameId}-${Date.now()}.${fileExt}`;
    const filePath = `frames/${frameId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error.message };
  }
};

/**
 * Add media record to frame
 * @param {string} frameId - Frame ID
 * @param {object} mediaData - Media details
 * @returns {object} - Media and error
 */
export const addMediaToFrame = async (frameId, mediaData) => {
  try {
    const { data, error } = await supabase
      .from('media')
      .insert([
        {
          frame_id: frameId,
          media_type: mediaData.media_type,
          media_url: mediaData.media_url,
          caption: mediaData.caption,
        },
      ])
      .select();

    if (error) throw error;

    return { media: data[0], error: null };
  } catch (error) {
    return { media: null, error: error.message };
  }
};

// ============================================
// COMMENT HELPERS
// ============================================

/**
 * Add comment to frame
 * @param {string} frameId - Frame ID
 * @param {object} commentData - Comment details
 * @returns {object} - Comment and error
 */
export const addCommentToFrame = async (frameId, commentData) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          frame_id: frameId,
          visitor_name: commentData.visitor_name,
          visitor_email: commentData.visitor_email,
          comment_text: commentData.comment_text,
        },
      ])
      .select();

    if (error) throw error;

    return { comment: data[0], error: null };
  } catch (error) {
    return { comment: null, error: error.message };
  }
};

/**
 * Get comments for frame
 * @param {string} frameId - Frame ID
 * @returns {object} - Comments and error
 */
export const getFrameComments = async (frameId) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('frame_id', frameId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { comments: data || [], error: null };
  } catch (error) {
    return { comments: [], error: error.message };
  }
};

// ============================================
// ANALYTICS HELPERS
// ============================================

/**
 * Record a QR code scan (calls edge function so it works for anonymous visitors)
 * @param {string} frameId - Frame ID
 * @returns {object} - Error (if any)
 */
export const recordQRScan = async (frameId, visitorId) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/record-scan`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ frameId, visitorId: visitorId || null }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to record scan');
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

/**
 * Get frame analytics
 * @param {string} frameId - Frame ID
 * @returns {object} - Analytics and error
 */
export const getFrameAnalytics = async (frameId) => {
  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('frame_id', frameId)
      .single();

    if (error) throw error;

    return { analytics: data, error: null };
  } catch (error) {
    return { analytics: null, error: error.message };
  }
};

/**
 * Get frame analytics
 * @param {string} reference - Paystack reference
 * @returns {object} - Analytics and error
 */
export const verifyAndActivatePayment = async (reference) => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { reference },
    });

    if (error) throw error;

    if (!data?.success) {
      throw new Error(data?.message || 'Payment verification failed');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================
// FEATURED LOGOS HELPERS
// ============================================

/** Get all featured logos for the homepage marquee */
export const getFeaturedLogos = async () => {
  try {
    const { data, error } = await supabase
      .from('featured_logos')
      .select('logo_url, name')
      .order('name', { ascending: true });
    if (error) throw error;
    return { logos: data || [], error: null };
  } catch (error) {
    return { logos: [], error: error.message };
  }
};

/** Admin: manually adjust a user's qr_allocated by a signed amount (+/-) */
export const adminAdjustQRCredits = async (userId, amount) => {
  try {
    const { data: sub, error: fetchErr } = await supabase
      .from('subscriptions')
      .select('id, qr_allocated')
      .eq('user_id', userId)
      .single();
    if (fetchErr) throw fetchErr;
    if (sub.qr_allocated === -1) return { error: null }; // unlimited - nothing to adjust
    const newAllocated = Math.max(0, sub.qr_allocated + amount);
    const { error } = await supabase
      .from('subscriptions')
      .update({ qr_allocated: newAllocated, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

/** Admin: get all featured logos with id */
export const adminGetFeaturedLogos = async () => {
  try {
    const { data, error } = await supabase
      .from('featured_logos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { logos: data || [], error: null };
  } catch (error) {
    return { logos: [], error: error.message };
  }
};

/** Admin: upload a logo file to storage and insert a row into featured_logos */
export const adminUploadFeaturedLogo = async (file, name) => {
  try {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${name.replace(/\s+/g, '-').toLowerCase()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);

    const { error: insertError } = await supabase
      .from('featured_logos')
      .insert({ logo_url: publicUrl, name });
    if (insertError) throw insertError;

    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

/** Admin: delete a featured logo row and its storage file */
export const adminDeleteFeaturedLogo = async (id, logoUrl) => {
  try {
    const { error } = await supabase.from('featured_logos').delete().eq('id', id);
    if (error) throw error;

    if (logoUrl) {
      const parts = logoUrl.split('/logos/');
      if (parts[1]) await supabase.storage.from('logos').remove([parts[1]]);
    }

    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// ============================================
// BLOG HELPERS
// ============================================

/** Get up to 4 pinned + published posts for the homepage */
export const getPinnedPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, cover_image, tags, keywords, author, published_at, created_at')
      .eq('status', 'published')
      .eq('is_pinned', true)
      .order('published_at', { ascending: false })
      .limit(4);
    if (error) throw error;
    return { posts: data || [], error: null };
  } catch (error) {
    return { posts: [], error: error.message };
  }
};

/** Get all published blog posts (public) */
export const getBlogPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, cover_image, tags, keywords, author, published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (error) throw error;
    return { posts: data || [], error: null };
  } catch (error) {
    return { posts: [], error: error.message };
  }
};

/** Get related published posts by shared tags, excluding the current post */
export const getRelatedPosts = async (currentId, tags = [], limit = 3) => {
  try {
    if (!tags.length) {
      // No tags - fall back to latest posts
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, cover_image, tags, keywords, author, published_at, created_at')
        .eq('status', 'published')
        .neq('id', currentId)
        .order('published_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return { posts: data || [], error: null };
    }

    // Fetch all published posts except the current one
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, cover_image, tags, keywords, author, published_at, created_at')
      .eq('status', 'published')
      .neq('id', currentId)
      .order('published_at', { ascending: false });
    if (error) throw error;

    // Rank by number of shared tags, take top `limit`
    const scored = (data || []).map(p => ({
      ...p,
      _score: (p.tags || []).filter(t => tags.includes(t)).length,
    }));
    scored.sort((a, b) => b._score - a._score || 0);
    return { posts: scored.slice(0, limit), error: null };
  } catch (error) {
    return { posts: [], error: error.message };
  }
};

/** Get single published post by slug (public) */
export const getBlogPostBySlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    if (error) throw error;
    return { post: data, error: null };
  } catch (error) {
    return { post: null, error: error.message };
  }
};

// Admin password - must match Admin.jsx and the edge function
const ADMIN_PASS = 'Scanframe@2025';

/** Upload blog image to storage (routes through admin edge function to bypass storage RLS) */
export const uploadBlogImage = async (file) => {
  try {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`,
      {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'x-admin-token': ADMIN_PASS,
        },
        body: form,
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return { url: data.url, error: null };
  } catch (error) {
    return { url: null, error: error.message };
  }
};

// ============================================
// ADMIN HELPERS (service-role bypasses RLS via anon key + policy)
// ============================================

/** Admin: get all blog posts regardless of status */
export const adminGetAllPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { posts: data || [], error: null };
  } catch (error) {
    return { posts: [], error: error.message };
  }
};

/** Admin: create blog post */
export const adminCreatePost = async (postData) => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.excerpt || '',
        cover_image: postData.cover_image || null,
        body: postData.body || '',
        tags: postData.tags || [],
        keywords: postData.keywords || [],
        author: postData.author || 'ScanMyFrame',
        status: postData.status || 'draft',
        published_at: postData.status === 'published' ? now : null,
        updated_at: now,
      }])
      .select()
      .single();
    if (error) throw error;
    return { post: data, error: null };
  } catch (error) {
    return { post: null, error: error.message };
  }
};

/** Admin: update blog post */
export const adminUpdatePost = async (id, updates) => {
  try {
    const now = new Date().toISOString();
    // Strip primary key and any auto-managed fields to avoid Postgres rejecting the update
    const { id: _id, created_at: _ca, ...rest } = updates;
    const payload = { ...rest, updated_at: now };
    if (updates.status === 'published' && !updates.published_at) {
      payload.published_at = now;
    }
    const { data, error } = await supabase
      .from('blog_posts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { post: data, error: null };
  } catch (error) {
    return { post: null, error: error.message };
  }
};

/** Admin: delete blog post */
export const adminDeletePost = async (id) => {
  try {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

async function adminFetch(resource) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'x-admin-token': ADMIN_PASS,
      },
      body: JSON.stringify({ resource }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Admin fetch failed');
  return data;
}

/** Admin: get all users with subscription info (via edge function to bypass RLS) */
export const adminGetAllUsers = async () => {
  try {
    const data = await adminFetch('users');
    return { users: data.users || [], error: null };
  } catch (error) {
    return { users: [], error: error.message };
  }
};

/** Admin: get newsletter subscribers (via edge function to bypass RLS) */
export const adminGetNewsletter = async () => {
  try {
    const data = await adminFetch('newsletter');
    return { subscribers: data.subscribers || [], error: null };
  } catch (error) {
    return { subscribers: [], error: error.message };
  }
};

// ============================================
// QR EMAIL HELPERS
// ============================================

/**
 * Send the branded QR code PNG to the authenticated user's email via Resend.
 * Fire-and-forget safe - never throws, always returns { sent, skipped, error }.
 */
export const sendQREmail = async ({ frameTitle, frameUrl, qrDataUrl, frameOwner, framePassword }) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: 'Not authenticated' };

    // Strip the data URI prefix - Resend expects raw base64
    const qrBase64 = qrDataUrl.replace(/^data:image\/\w+;base64,/, '');

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-qr-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ frameTitle, frameUrl, qrBase64, frameOwner, framePassword }),
      }
    );

    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Failed to send email' };
    return data; // { sent: true } or { skipped: true }
  } catch (err) {
    return { error: err.message };
  }
};

/** Toggle qr_email_enabled for the current user */
export const updateQREmailPreference = async (userId, enabled) => {
  const { error } = await supabase
    .from('users')
    .update({ qr_email_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('id', userId);
  return { error: error?.message || null };
};

// ============================================
// ADMIN NOTIFICATION HELPERS
// ============================================

const ADMIN_PASS_NOTIF = 'Scanframe@2025';

async function adminDataFetch(payload) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-data`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'x-admin-token': ADMIN_PASS_NOTIF,
      },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/**
 * Push a notification to a targeted audience.
 * audience: 'all' | 'subscribers' | 'basic' | 'pro' | 'business'
 */
export const adminPushNotification = async ({ audience, user_id, type, message, full_description }) => {
  try {
    const data = await adminDataFetch({ resource: 'push_notification', audience, user_id, type, message, full_description });
    return { count: data.count ?? 0, error: null };
  } catch (err) {
    return { count: 0, error: err.message };
  }
};

/**
 * Send a trial upgrade nudge (in-app notification + email) when a trial user
 * reaches 8 of their 10 free QR codes. Fire-and-forget safe - never throws.
 */
export const sendTrialUpgradeNudge = async ({ userId, toEmail, userName }) => {
  const displayName = userName || 'there';

  // 1. In-app notification
  try {
    await supabase.from('notification').insert({
      user_id:          userId,
      type:             'alert',
      message:          "You've used 8 of your 10 free QR codes.",
      full_description: `You have 2 QR codes left on your free trial. Upgrade to a paid plan to keep creating frames without interruption - your existing frames and QR codes will remain active.`,
      is_read:          false,
    });
  } catch (_) {}

  // 2. Upgrade nudge email
  try {
    await adminDataFetch({
      resource:     'send_trial_nudge',
      to_email:     toEmail,
      name:         displayName,
    });
  } catch (_) {}
};

/**
 * Send a login-alert email via Resend (uses admin-data edge function).
 * Fire-and-forget safe - never throws.
 */
export const sendLoginAlertEmail = async ({ toEmail, userName, deviceInfo, loginAt, ip }) => {
  try {
    await adminDataFetch({
      resource:    'send_alert_email',
      to_email:    toEmail,
      subject:     'New login detected on your ScanMyFrame account',
      name:        userName,
      device_info: deviceInfo,
      login_at:    loginAt,
      ip,
    });
  } catch (_) {
    // Silently ignore - email is best-effort
  }
};

/**
 * Send account-deletion confirmation email. Fire-and-forget safe - never throws.
 */
export const sendDeletionRequestEmail = async ({ toEmail, userName, deletionDate }) => {
  try {
    await adminDataFetch({
      resource:      'send_deletion_request_email',
      to_email:      toEmail,
      name:          userName,
      deletion_date: deletionDate,
    });
  } catch (_) {}
};

/**
 * Send a welcome email + insert an in-app notification after onboarding completes.
 * Fire-and-forget safe - never throws.
 */
export const sendWelcomeNotification = async ({ userId, toEmail, userName }) => {
  const displayName = userName || 'there';

  // 1. In-app notification
  try {
    await supabase.from('notification').insert({
      user_id:          userId,
      type:             'info',
      message:          'Welcome to ScanMyFrame!',
      full_description: `Hi ${displayName}, your account is all set. You have 10 free QR codes ready to use. Create your first frame, generate a QR code, and let your work speak for itself. We are excited to have you.`,
      is_read:          false,
    });
  } catch (_) {}

  // 2. Welcome email
  try {
    await adminDataFetch({
      resource:  'send_welcome_email',
      to_email:  toEmail,
      name:      displayName,
    });
  } catch (_) {
    // Silently ignore - email is best-effort
  }
};

// ============================================
// DEVICE TRACKING HELPERS
// ============================================

async function hashDeviceFingerprint(ip, browser, device) {
  const fingerprint = `${ip}::${browser}::${device}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprint));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export function buildDeviceInfo(userAgent) {
  const ua = userAgent || navigator.userAgent;
  const isMobile = /Mobi|Android|iPhone/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
  const browser =
    /Edg/i.test(ua) ? 'edge' :
    /OPR|Opera/i.test(ua) ? 'opera' :
    /Firefox/i.test(ua) ? 'firefox' :
    /Chrome/i.test(ua) ? 'chrome' :
    /Safari/i.test(ua) ? 'safari' : 'browser';
  return { browser, device };
}

export async function checkAndUpdateKnownDevices(userId, currentIp, userAgent) {
  const { browser, device } = buildDeviceInfo(userAgent);
  const hash = await hashDeviceFingerprint(currentIp, browser, device);

  const { data: user, error: fetchErr } = await supabase
    .from('users')
    .select('known_devices')
    .eq('id', userId)
    .single();

  if (fetchErr) throw fetchErr;

  const knownDevices = Array.isArray(user?.known_devices) ? user.known_devices : [];
  const isFirstDevice = knownDevices.length === 0; // no devices recorded yet = very first login
  const existingDeviceIndex = knownDevices.findIndex(d => d.browser === browser && d.device === device);
  const isNewDevice = existingDeviceIndex === -1;

  if (isNewDevice) {
    const newDevice = {
      hash,
      ip: currentIp,
      browser,
      device,
      added_at: new Date().toISOString(),
    };
    const updated = [...knownDevices, newDevice];

    const { error: updateErr } = await supabase
      .from('users')
      .update({ known_devices: updated })
      .eq('id', userId);

    if (updateErr) throw updateErr;
  } else {
    const existing = knownDevices[existingDeviceIndex];
    if (existing.ip !== currentIp) {
      const updatedDevices = [...knownDevices];
      updatedDevices[existingDeviceIndex] = {
        ...existing,
        ip: currentIp,
        last_seen_at: new Date().toISOString(),
      };

      const { error: updateErr } = await supabase
        .from('users')
        .update({ known_devices: updatedDevices })
        .eq('id', userId);

      if (updateErr) throw updateErr;
    }
  }

  return { isNewDevice, isFirstDevice, browser, device };
}