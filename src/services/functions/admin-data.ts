import { createClient } from 'jsr:@supabase/supabase-js@2';

const ADMIN_PASSWORD = 'Scanframe@2025';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') ?? 'ScanMyFrame <noreply@dazeefa.com>';
const SITE_URL       = 'https://scanframe.ng';

function esc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function loginAlertHtml(name: string, ip: string, deviceInfo?: string): string {
  const locationLine = deviceInfo ? esc(deviceInfo) : esc(ip);
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="color-scheme" content="dark"><title>New Login Detected</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;background:#0a0a0a;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111111;border-radius:20px;overflow:hidden;border:1px solid #222;">
  <tr><td style="background:#0F4C3A;padding:28px 40px;text-align:center;">
    <h1 style="margin:0;font-size:24px;font-weight:700;color:#D4AF37;font-family:Georgia,serif;letter-spacing:0.04em;">SCANMYFRAME</h1>
    <p style="margin:4px 0 0;font-size:11px;color:#FAF5DD;letter-spacing:0.12em;text-transform:uppercase;">Smart QR Frames</p>
  </td></tr>
  <tr><td style="padding:36px 40px;background:#111111;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr><td width="44" height="44" style="background:#2a1a1a;border-radius:22px;text-align:center;vertical-align:middle;font-size:22px;">&#x26A0;</td></tr>
    </table>
    <h2 style="margin:0 0 10px;font-size:20px;color:#FAF5DD;font-family:Georgia,serif;">New login detected, ${esc(name)}!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#aaa;line-height:1.75;">We noticed a login to your ScanMyFrame account from a new device or location:</p>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;">
      <tr><td style="background:#1a1a1a;border-radius:10px;padding:14px 20px;font-size:14px;color:#D4AF37;font-weight:700;border:1px solid #2a2a2a;">${locationLine}</td></tr>
    </table>
    <p style="margin:0 0 12px;font-size:14px;color:#aaa;line-height:1.75;"><strong style="color:#FAF5DD;">If this was you</strong>, no action is needed.</p>
    <p style="margin:0 0 28px;font-size:14px;color:#aaa;line-height:1.75;">If you <strong style="color:#FAF5DD;">don&rsquo;t recognise this activity</strong>, reset your password immediately. Go to your dashboard &rarr; Settings and click <em>&ldquo;Request password reset&rdquo;</em>.</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;"><tr>
      <td style="background:#D4AF37;border-radius:10px;">
        <a href="${SITE_URL}/dashboard" style="display:inline-block;padding:13px 34px;font-size:14px;font-weight:700;color:#0F4C3A;text-decoration:none;">Go to Dashboard</a>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#0a0a0a;padding:20px 40px;border-top:1px solid #222;">
    <p style="margin:0;font-size:11px;color:#444;">&copy; 2026 ScanMyFrame &nbsp;&middot;&nbsp;
      <a href="${SITE_URL}" style="color:#D4AF37;text-decoration:none;">scanframe.ng</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

Deno.serve(async (req: Request) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, x-admin-token, apikey, authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const token = req.headers.get('x-admin-token');
  if (token !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: cors });

  // Multipart file uploads (blog images)
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file') as File;
    const ext  = file.name.split('.').pop();
    const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('media').upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) return json({ error: upErr.message }, 500);
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return json({ url: data.publicUrl });
  }

  // JSON body
  const body = await req.json().catch(() => ({})) as Record<string, any>;
  const { resource } = body;

  // ── Read resources ───────────────────────────────────────────────────────────
  if (resource === 'users') {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, business_name, email, created_at, subscriptions(status, plan_id, billing_cycle, qr_allocated, qr_used, current_period_end)')
      .order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ users: data });
  }

  if (resource === 'newsletter') {
    const { data, error } = await supabase.from('newsletter').select('*').order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ subscribers: data });
  }

  // ── Push notification to targeted audience ───────────────────────────────────
  if (resource === 'push_notification') {
    const { audience, type, message, full_description } = body;
    if (!message?.trim()) return json({ error: 'message is required' }, 400);

    let userIds: string[] = [];

    if (audience === 'all') {
      const { data } = await supabase.from('users').select('id');
      userIds = (data ?? []).map((u: any) => u.id);
    } else if (audience === 'subscribers') {
      const { data } = await supabase.from('subscriptions').select('user_id').eq('status', 'active');
      userIds = (data ?? []).map((s: any) => s.user_id);
    } else {
      // plan-specific: basic | pro | business
      const { data } = await supabase.from('subscriptions').select('user_id')
        .eq('plan_id', audience).eq('status', 'active');
      userIds = (data ?? []).map((s: any) => s.user_id);
    }

    if (userIds.length === 0) return json({ count: 0 });

    const rows = userIds.map((uid: string) => ({
      user_id:          uid,
      type:             type || 'info',
      message,
      full_description: full_description?.trim() || null,
      is_read:          false,
    }));

    const { error } = await supabase.from('notification').insert(rows);
    if (error) return json({ error: error.message }, 500);
    return json({ count: userIds.length });
  }

  // ── Send alert email via Resend ──────────────────────────────────────────────
  if (resource === 'send_alert_email') {
    const { to_email, subject, html_body, name, ip, device_info } = body;
    if (!to_email || !subject) return json({ error: 'to_email and subject are required' }, 400);
    if (!RESEND_API_KEY) return json({ error: 'Email service not configured' }, 503);

    const finalHtml = html_body ?? (ip ? loginAlertHtml(name ?? 'there', ip, device_info) : null);
    if (!finalHtml) return json({ error: 'html_body or ip is required' }, 400);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to_email], subject, html: finalHtml }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Resend alert email error:', err);
      return json({ error: 'Failed to send email' }, 500);
    }
    return json({ sent: true });
  }

  if (resource === 'send_welcome_email') {
    const { to_email, name } = body;
    if (!to_email) return json({ error: 'to_email is required' }, 400);
    if (!RESEND_API_KEY) return json({ error: 'Email service not configured' }, 503);

    const displayName = esc(name ?? 'there');
    const welcomeHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="color-scheme" content="dark"><title>Welcome to ScanMyFrame</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;background:#0a0a0a;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111111;border-radius:20px;overflow:hidden;border:1px solid #222;">
  <tr><td style="background:#0F4C3A;padding:28px 40px;text-align:center;">
    <h1 style="margin:0;font-size:24px;font-weight:700;color:#D4AF37;font-family:Georgia,serif;letter-spacing:0.04em;">SCANMYFRAME</h1>
    <p style="margin:4px 0 0;font-size:11px;color:#FAF5DD;letter-spacing:0.12em;text-transform:uppercase;">Smart QR Frames</p>
  </td></tr>
  <tr><td style="padding:36px 40px;background:#111111;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr><td width="44" height="44" style="background:#1e1a0a;border-radius:22px;text-align:center;vertical-align:middle;font-size:22px;">&#127881;</td></tr>
    </table>
    <h2 style="margin:0 0 10px;font-size:20px;color:#FAF5DD;font-family:Georgia,serif;">Welcome, ${displayName}!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#aaa;line-height:1.75;">Your ScanMyFrame account is ready. You have <strong style="color:#D4AF37;">10 free QR codes</strong> waiting — no credit card needed.</p>
    <p style="margin:0 0 24px;font-size:14px;color:#aaa;line-height:1.75;">Start creating frames and let every piece you sell carry its own digital story.</p>
    <table cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:12px;width:100%;margin:0 0 28px;border:1px solid #2a2a2a;">
      <tr><td style="padding:18px 24px;">
        <p style="margin:0 0 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#D4AF37;">Get started in 3 steps</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="28" valign="top" style="padding-bottom:12px;"><table cellpadding="0" cellspacing="0"><tr><td width="24" height="24" style="background:#0F4C3A;border-radius:12px;text-align:center;vertical-align:middle;font-size:11px;font-weight:700;color:#D4AF37;">1</td></tr></table></td>
            <td style="padding:3px 0 12px 10px;font-size:13px;color:#bbb;">Create a frame and attach your content</td>
          </tr>
          <tr>
            <td width="28" valign="top" style="padding-bottom:12px;"><table cellpadding="0" cellspacing="0"><tr><td width="24" height="24" style="background:#0F4C3A;border-radius:12px;text-align:center;vertical-align:middle;font-size:11px;font-weight:700;color:#D4AF37;">2</td></tr></table></td>
            <td style="padding:3px 0 12px 10px;font-size:13px;color:#bbb;">Generate and download your QR code</td>
          </tr>
          <tr>
            <td width="28" valign="top"><table cellpadding="0" cellspacing="0"><tr><td width="24" height="24" style="background:#0F4C3A;border-radius:12px;text-align:center;vertical-align:middle;font-size:11px;font-weight:700;color:#D4AF37;">3</td></tr></table></td>
            <td style="padding:3px 0 0 10px;font-size:13px;color:#bbb;">Stick it on the frame — your customers do the rest</td>
          </tr>
        </table>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;"><tr>
      <td style="background:#D4AF37;border-radius:10px;">
        <a href="${SITE_URL}/dashboard" style="display:inline-block;padding:13px 34px;font-size:14px;font-weight:700;color:#0F4C3A;text-decoration:none;">Go to my dashboard</a>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#0a0a0a;padding:20px 40px;border-top:1px solid #222;">
    <p style="margin:0;font-size:11px;color:#444;">You received this because you just created a ScanMyFrame account. &nbsp;&middot;&nbsp;
      <a href="${SITE_URL}" style="color:#D4AF37;text-decoration:none;">scanframe.ng</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to_email], subject: 'Welcome to ScanMyFrame — your frames are ready to come alive', html: welcomeHtml }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Resend welcome email error:', err);
      return json({ error: 'Failed to send email' }, 500);
    }
    return json({ sent: true });
  }


  return json({ error: 'Unknown resource' }, 400);
});
