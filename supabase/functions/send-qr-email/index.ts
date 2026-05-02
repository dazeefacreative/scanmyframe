import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SVC_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL        = Deno.env.get('FROM_EMAIL') ?? 'ScanMyFrame <noreply@scanmyframe.com>';
const SITE_URL          = 'https://scanmyframe.com';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function buildText(
  name: string,
  frameTitle: string,
  frameUrl: string,
  frameOwner: string | null,
  framePassword: string | null,
): string {
  const lines = [
    `Hi ${name},`,
    ``,
    `Your QR code for "${frameTitle}" is ready. It's attached to this email as a PNG.`,
    ``,
    `View your frame page here:`,
    frameUrl,
  ];
  if (frameOwner) lines.push(``, `Frame Owner: ${frameOwner}`);
  if (framePassword) lines.push(`Frame Password: ${framePassword}`, `(Share this privately with your client — required to view the frame page.)`);
  lines.push(
    ``,
    `If this landed in spam, please mark it as Not Spam.`,
    `To stop receiving QR codes by email, go to Dashboard → Settings and turn off "Email QR code on creation".`,
    ``,
    `— ScanMyFrame`,
    `https://scanmyframe.com`,
  );
  return lines.join('\n');
}

function buildHtml(
  name: string,
  frameTitle: string,
  frameUrl: string,
  frameOwner: string | null,
  framePassword: string | null,
): string {
  const detailsRows = [];

  if (frameOwner) {
    detailsRows.push(`
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#555;border-bottom:1px solid #e8e8e4;width:38%;">
          <strong style="color:#0F4C3A;">Frame Owner</strong>
        </td>
        <td style="padding:8px 0 8px 12px;font-size:13px;color:#333;border-bottom:1px solid #e8e8e4;">${escHtml(frameOwner)}</td>
      </tr>`);
  }

  if (framePassword) {
    detailsRows.push(`
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#555;width:38%;">
          <strong style="color:#0F4C3A;">Frame Password</strong>
        </td>
        <td style="padding:8px 0 8px 12px;">
          <span style="display:inline-block;font-size:13px;font-family:monospace;font-weight:700;color:#0F4C3A;background:#f0efe9;border:1px solid #d4af3740;border-radius:8px;padding:4px 12px;letter-spacing:0.05em;">${escHtml(framePassword)}</span>
          <p style="margin:4px 0 0;font-size:11px;color:#aaa;line-height:1.5;">Share this privately with your client. It is required to view the frame page.</p>
        </td>
      </tr>`);
  }

  const detailsSection = detailsRows.length > 0 ? `
    <hr style="border:none;border-top:1px solid #e8e8e4;margin:0 0 22px;" />
    <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#aaa;">Frame details</p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#555;border-bottom:1px solid #e8e8e4;width:38%;">
          <strong style="color:#0F4C3A;">Frame Title</strong>
        </td>
        <td style="padding:8px 0 8px 12px;font-size:13px;color:#333;border-bottom:1px solid #e8e8e4;">${escHtml(frameTitle)}</td>
      </tr>
      ${detailsRows.join('')}
    </table>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your QR Code is Ready</title></head>
<body style="margin:0;padding:0;background:#f0efe9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0efe9;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08);">

  <!-- Header -->
  <tr>
    <td style="background:#0F4C3A;padding:28px 40px 0;text-align:center;">
      <h1 style="margin:0;font-size:26px;font-weight:700;color:#D4AF37;font-family:Georgia,serif;letter-spacing:0.04em;">SCANMYFRAME</h1>
      <p style="margin:6px 0 0;font-size:11px;color:#FAF5DD;opacity:0.65;letter-spacing:0.12em;text-transform:uppercase;">Smart QR Frames</p>
    </td>
  </tr>

  <!-- QR hero -->
  <tr>
    <td style="background:#0F4C3A;padding:24px 40px 32px;text-align:center;">
      <div style="display:inline-block;background:#FAF5DD;border-radius:16px;padding:20px;">
        <img src="cid:qr-code-image" alt="Your QR Code" width="180" height="180"
             style="display:block;border-radius:10px;border:4px solid #0F4C3A;" />
      </div>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:36px 40px;">
      <h2 style="margin:0 0 10px;font-size:21px;color:#0F4C3A;font-family:Georgia,serif;font-weight:700;">Your QR code is ready, ${escHtml(name)}!</h2>
      <p style="margin:0 0 18px;font-size:14px;color:#555;line-height:1.75;">
        Your branded QR code for <strong style="color:#0F4C3A;">${escHtml(frameTitle)}</strong> is attached
        to this email as a PNG. Print it, stick it on your frame, or share it digitally.
      </p>
      <p style="margin:0 0 28px;font-size:14px;color:#555;line-height:1.75;">
        Anyone who scans it is taken directly to your frame's story page.
      </p>

      <!-- CTA -->
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
        <tr>
          <td style="background:#0F4C3A;border-radius:12px;">
            <a href="${escHtml(frameUrl)}"
               style="display:inline-block;padding:13px 34px;font-size:14px;font-weight:700;color:#FAF5DD;text-decoration:none;letter-spacing:0.03em;">View Frame Page</a>
          </td>
        </tr>
      </table>

      ${detailsSection}

      <hr style="border:none;border-top:1px solid #e8e8e4;margin:0 0 22px;" />

      <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#aaa;">Frame link</p>
      <p style="margin:0;font-size:12px;word-break:break-all;">
        <a href="${escHtml(frameUrl)}" style="color:#0F4C3A;text-decoration:none;">${escHtml(frameUrl)}</a>
      </p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#FAF5DD;padding:20px 40px;border-top:1px solid #e5e8e4;">
      <p style="margin:0 0 6px;font-size:12px;color:#4a7c6f;line-height:1.6;">
        If this email landed in spam, please mark it as <strong>Not Spam</strong> so you never miss your QR codes.
      </p>
      <p style="margin:0 0 6px;font-size:11px;color:#4a7c6f;line-height:1.6;">
        To stop receiving QR codes by email, go to <strong>Dashboard &rarr; Settings</strong> and turn off <em>&ldquo;Email QR code on creation&rdquo;</em>.
      </p>
      <p style="margin:0;font-size:11px;color:#aaa;">
        &copy; 2026 ScanMyFrame &nbsp;&middot;&nbsp;
        <a href="${SITE_URL}" style="color:#0F4C3A;text-decoration:none;">scanmyframe.com</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

  if (!RESEND_API_KEY) return json({ error: 'Email service not configured — add RESEND_API_KEY secret in Supabase' }, 503);

  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SVC_KEY);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, qr_email_enabled')
    .eq('id', user.id)
    .single();

  if (profile?.qr_email_enabled === false) return json({ skipped: true });

  const { frameTitle, frameUrl, qrBase64, frameOwner, framePassword } = await req.json();

  const firstName = (profile?.full_name ?? user.email?.split('@')[0] ?? 'there').split(' ')[0];

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [user.email!],
      subject: `Your QR code for "${frameTitle}" is ready`,
      html: buildHtml(firstName, frameTitle, frameUrl, frameOwner ?? null, framePassword ?? null),
      text: buildText(firstName, frameTitle, frameUrl, frameOwner ?? null, framePassword ?? null),
      attachments: [{ filename: 'qr-code.png', content: qrBase64, content_id: 'qr-code-image' }],
    }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.json().catch(() => ({}));
    console.error('Resend error:', err);
    return json({ error: 'Failed to send email' }, 500);
  }

  return json({ sent: true });
});
