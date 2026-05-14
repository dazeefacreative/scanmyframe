import { Helmet } from 'react-helmet-async';

const SITE_NAME  = 'ScanMyFrame';
const SITE_URL   = 'https://scanmyframe.com'; // update to your real domain
const DEFAULT_DESC = 'ScanMyFrame connects physical picture frames to rich digital content via QR codes. Empower your frames with stories, photos, videos, and more.';
const DEFAULT_IMG  = `${SITE_URL}/og-default.png`; // place a 1200×630 image in /public

export default function SEO({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMG,
  url,
  type = 'website',
  article = null, // { publishedTime, modifiedTime, author, tags, keywords }
  noIndex = false,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Smart QR Frames`;
  const canonical = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      {/* ── Primary ── */}
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* ── Open Graph ── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonical} />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* ── Article-specific (blog posts) ── */}
      {article && <meta property="article:published_time" content={article.publishedTime} />}
      {article && <meta property="article:modified_time" content={article.modifiedTime} />}
      {article && <meta property="article:author" content={article.author} />}
      {article?.tags?.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}
      {/* ── Meta keywords (used by Bing; Google ignores but harmless) ── */}
      {article && [...(article.tags || []), ...(article.keywords || [])].length > 0 && (
        <meta name="keywords" content={[...(article.tags || []), ...(article.keywords || [])].join(', ')} />
      )}
    </Helmet>
  );
}

/** JSON-LD structured data for a blog post (Article schema) */
export function ArticleSchema({ post, url }) {
  const canonical = `${SITE_URL}${url}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || '',
    image: post.cover_image || DEFAULT_IMG,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: {
      '@type': 'Organization',
      name: post.author || SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    url: canonical,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical,
    },
    keywords: [...(post.tags || []), ...(post.keywords || [])].join(', '),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

/** JSON-LD for the Blog listing page (Blog schema) */
export function BlogListSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} Blog`,
    description: 'Guides, tips, and updates for frame vendors using ScanMyFrame.',
    url: `${SITE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

/** JSON-LD for the homepage */
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: DEFAULT_DESC,
    sameAs: [],
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
