import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Resolve the real client IP from proxy headers. */
function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const first = forwarded.split(',')[0].trim();
  if (first) return first;
  return req.headers.get('x-real-ip') || '';
}

/** Geo-lookup via ipapi.co (1 000 req/day free, HTTPS). */
async function getGeoInfo(ip: string): Promise<{ city: string | null; country: string | null }> {
  try {
    // Skip private / loopback addresses
    if (!ip || ip === '::1' || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)) {
      return { city: null, country: null };
    }
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(2500),
      headers: { 'User-Agent': 'scanframe-app/1.0' },
    });
    if (!res.ok) return { city: null, country: null };
    const d = await res.json();
    return {
      city:    typeof d.city         === 'string' ? d.city         : null,
      country: typeof d.country_name === 'string' ? d.country_name : null,
    };
  } catch {
    return { city: null, country: null };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { frameId, visitorId } = await req.json();
    if (!frameId) throw new Error('frameId is required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const ua = (req.headers.get('user-agent') || '').toLowerCase();
    const deviceType = /mobile|android|iphone|ipod/.test(ua)
      ? 'mobile'
      : /tablet|ipad/.test(ua)
      ? 'tablet'
      : 'desktop';

    const ip = getClientIp(req);

    // Run geo-lookup in parallel with DB work
    const geoPromise = getGeoInfo(ip);

    // 1. Atomically increment scan count (UPSERT — no race conditions, no fallback needed)
    await supabase.rpc('increment_scan_count', { p_frame_id: frameId });

    // 2. Activate the scanned frame
    await supabase
      .from('frames')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', frameId);

    // 3. Auto-deactivate stale frames (fire-and-forget, non-blocking)
    supabase.rpc('auto_deactivate_frames').then(() => {}).catch(() => {});

    // 4. Wait for geo, then log the scan
    const geo = await geoPromise;

    await supabase.from('scan_logs').insert({
      frame_id:    frameId,
      visitor_id:  visitorId || null,
      device_type: deviceType,
      user_agent:  req.headers.get('user-agent') || '',
      ip_address:  ip || null,
      city:        geo.city,
      country:     geo.country,
      scanned_at:  new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
