const SITE_URL     = 'https://scanmyframe.com';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const BOT_UAS = [
  'whatsapp', 'facebookexternalhit', 'facebot', 'twitterbot', 'linkedinbot',
  'slackbot', 'telegrambot', 'discordbot', 'skype', 'pinterest',
  'googlebot', 'bingbot', 'applebot', 'iframely', 'embedly', 'vkshare',
  'line-poker', 'tumblr', 'snapchat',
];

function isBot(ua = '') {
  const lower = ua.toLowerCase();
  return BOT_UAS.some(b => lower.includes(b));
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  const slug = req.query.slug;
  if (!slug) { res.status(400).end(); return; }

  const ua  = req.headers['user-agent'] || '';
  const url = `${SITE_URL}/blog/${slug}`;

  // Regular browsers: redirect to ?_spa=1 which Vercel rewrites directly to index.html
  // (prevents a redirect loop — /blog/:slug would otherwise re-enter this function)
  if (!isBot(ua)) {
    res.setHeader('Location', `${url}?_spa=1`);
    res.status(302).end();
    return;
  }

  // Social/search bot: fetch post metadata and serve OG-enriched HTML
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=title,excerpt,cover_image,author,published_at&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );

    const rows = response.ok ? await response.json() : [];
    const post = rows[0];

    if (!post) {
      res.status(404).end();
      return;
    }

    const title       = `${post.title} | ScanMyFrame`;
    const description = post.excerpt || `Read "${post.title}" on the ScanMyFrame blog.`;
    const image       = post.cover_image || `${SITE_URL}/og-default.png`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">

  <meta property="og:type"         content="article">
  <meta property="og:site_name"    content="ScanMyFrame">
  <meta property="og:url"          content="${esc(url)}">
  <meta property="og:title"        content="${esc(title)}">
  <meta property="og:description"  content="${esc(description)}">
  <meta property="og:image"        content="${esc(image)}">
  <meta property="og:image:width"  content="1200">
  <meta property="og:image:height" content="630">

  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image"       content="${esc(image)}">
  <meta name="twitter:site"        content="@scanmyframe">

  <link rel="canonical" href="${esc(url)}">
</head>
<body>
  <script>window.location.replace("${esc(url)}");</script>
  <a href="${esc(url)}">${esc(post.title)}</a>
</body>
</html>`);
  } catch {
    res.status(500).end();
  }
}
