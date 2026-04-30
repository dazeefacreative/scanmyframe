import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getBlogPosts } from '../services/supabaseHelpers';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO, { BlogListSchema } from '../components/SEO';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function TagPill({ tag, isDark }) {
  return (
    <Link
      to={`/blog?tag=${encodeURIComponent(tag)}`}
      onClick={e => e.stopPropagation()}
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-opacity hover:opacity-70
        ${isDark ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-[#0F4C3A]/8 text-[#0F4C3A]'}`}
    >
      {tag}
    </Link>
  );
}

function PostCard({ post, isDark }) {
  const navigate = useNavigate();

  return (
    <article
      onClick={() => navigate(`/blog/${post.slug}`)}
      className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col
        ${isDark
          ? 'bg-[#111] border-white/10 hover:border-white/20'
          : 'bg-white border-[#0F4C3A]/10 hover:border-[#0F4C3A]/25 hover:shadow-[#0F4C3A]/10'
        }`}
    >
      {/* Cover image */}
      <div className="aspect-[16/9] overflow-hidden bg-[#0F4C3A]/10 flex-shrink-0">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#f0f7f4]'}`}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0F4C3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        {/* Tags
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 3).map(tag => (
              <TagPill key={tag} tag={tag} isDark={isDark} />
            ))}
          </div>
        )} */}

        {/* Title */}
        <h2 className={`text-base font-bold leading-snug mb-2 line-clamp-2 transition-colors
          ${isDark ? 'text-white group-hover:text-[#D4AF37]' : 'text-[#0F4C3A] group-hover:text-[#0a3329]'}`}>
          {post.title}
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p className={`text-sm leading-relaxed line-clamp-3 flex-1
            ${isDark ? 'text-[#999]' : 'text-[#4a7c6f]'}`}>
            {post.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className={`flex items-center justify-between mt-4 pt-4 border-t text-xs
          ${isDark ? 'border-white/8 text-[#666]' : 'border-[#0F4C3A]/8 text-[#4a7c6f]/70'}`}>
          <span className="font-medium">{post.author}</span>
          <span>{formatDate(post.published_at || post.created_at)}</span>
        </div>
      </div>
    </article>
  );
}

export default function Blog() {
  const { isDark }              = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');

  // Tag filter comes from URL: /blog?tag=acrylic
  const activeTag = searchParams.get('tag') || '';

  useEffect(() => {
    document.title = 'Blog: Insights, Tips & Stories | ScanMyFrame';
    getBlogPosts().then(({ posts: data }) => {
      setPosts(data);
      setLoading(false);
    });
    return () => { document.title = 'ScanMyFrame | Smart QR Frames'; };
  }, []);

  function clearTag() { setSearchParams({}); }

  const q = query.trim().toLowerCase();

  const filtered = posts.filter(p => {
    const matchesTag   = activeTag ? p.tags?.some(t => t.toLowerCase() === activeTag.toLowerCase()) : true;
    const matchesQuery = q
      ? (p.title?.toLowerCase().includes(q) ||
         p.excerpt?.toLowerCase().includes(q) ||
         p.tags?.some(t => t.toLowerCase().includes(q)) ||
         p.author?.toLowerCase().includes(q))
      : true;
    return matchesTag && matchesQuery;
  });

  const pageBg   = isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafaf8]';
  const textPrim = isDark ? 'text-white'    : 'text-[#0F4C3A]';
  const textSub  = isDark ? 'text-[#999]'  : 'text-[#4a7c6f]';
  const border   = isDark ? 'border-white/10' : 'border-[#0F4C3A]/10';

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <SEO
        title="Blog: Insights, Tips & Stories"
        description="Guides for frame vendors, updates on new features, and ideas to help you get the most from ScanMyFrame."
        url="/blog"
        type="website"
      />
      <BlogListSchema />
      <Header />

      {/* Hero */}
      <section className={`py-16 md:py-20 px-4`}>
        <div className="max-w-6xl mx-auto text-center">
          <p className={`text-[11px] font-bold uppercase tracking-[0.35em] mb-4 ${isDark ? 'text-[#D4AF37]' : 'text-[#0F4C3A]'}`}>
            The ScanMyFrame Blog
          </p>
          <h1 className={`text-4xl md:text-5xl font-bold font-[Poltawski_Nowy,serif] leading-tight mb-4 ${textPrim}`}>
            Insights, tips &amp; stories
          </h1>
          <p className={`text-base md:text-lg max-w-xl mx-auto ${textSub}`}>
            Guides for frame vendors, updates on new features, and ideas to help you get the most from ScanMyFrame.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-md mx-auto relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#fff' : '#0F4C3A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search posts by title, tag or author…"
              className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#0F4C3A]/30 transition-colors
                ${isDark
                  ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30'
                  : 'bg-white border-[#0F4C3A]/15 text-[#0F4C3A] placeholder:text-[#0F4C3A]/30'
                }`}
            />
            {query && (
              <button onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity"
                aria-label="Clear search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#fff' : '#0F4C3A'} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Posts grid */}
      <main className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-9 h-9 border-[3px] border-[#0F4C3A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            {q ? (
              <>
                <p className={`text-lg font-semibold mb-2 ${textPrim}`}>No results for "{query}"</p>
                <p className={`text-sm ${textSub}`}>Try a different keyword or tag.</p>
                <button onClick={() => setQuery('')} className="mt-4 text-sm text-[#0F4C3A] underline underline-offset-2 hover:opacity-70">Clear search</button>
              </>
            ) : (
              <>
                <p className={`text-lg font-semibold mb-2 ${textPrim}`}>No posts yet</p>
                <p className={`text-sm ${textSub}`}>Check back soon, content is coming.</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Active tag / search context row */}
            {(activeTag || q) && (
              <div className="flex flex-wrap items-center gap-2 mb-5 text-xs">
                {activeTag && (
                  <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider px-3 py-1 rounded-full
                    ${isDark ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-[#0F4C3A]/8 text-[#0F4C3A]'}`}>
                    # {activeTag}
                    <button onClick={clearTag} aria-label="Remove tag filter" className="hover:opacity-60 transition-opacity">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </span>
                )}
                <span className={textSub}>
                  {filtered.length} post{filtered.length !== 1 ? 's' : ''}
                  {q ? ` matching "${query}"` : ''}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filtered.map(post => (
                <PostCard key={post.id} post={post} isDark={isDark} />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
