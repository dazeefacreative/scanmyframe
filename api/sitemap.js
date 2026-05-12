const SITE_URL      = 'https://scanmyframe.com';
const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY  = process.env.VITE_SUPABASE_ANON_KEY;

const STATIC_PAGES = [
  { loc: '/',        changefreq: 'weekly',  priority: '1.0' },
  { loc: '/pricing', changefreq: 'monthly', priority: '0.9' },
  { loc: '/blog',    changefreq: 'weekly',  priority: '0.8' },
  { loc: '/about',   changefreq: 'monthly', priority: '0.7' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.7' },
  { loc: '/privacy', changefreq: 'yearly',  priority: '0.5' },
  { loc: '/terms',   changefreq: 'yearly',  priority: '0.5' },
];

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${SITE_URL}${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

export default async function handler(req, res) {
  try {
    // Fetch all published blog posts
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&select=slug,published_at,updated_at&order=published_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const posts = response.ok ? await response.json() : [];

    const staticEntries = STATIC_PAGES.map(p =>
      urlEntry({ ...p, lastmod: new Date().toISOString().split('T')[0] })
    );

    const postEntries = posts.map(post =>
      urlEntry({
        loc: `/blog/${post.slug}`,
        lastmod: (post.updated_at || post.published_at || '').split('T')[0],
        changefreq: 'monthly',
        priority: '0.7',
      })
    );

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '',
      ...staticEntries,
      '',
      ...postEntries,
      '',
      '</urlset>',
    ].join('\n');

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
}
