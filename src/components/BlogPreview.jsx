import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPinnedPosts } from '../services/supabaseHelpers';
import { useTheme } from '../context/ThemeContext';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function BlogPreview() {
  const { isDark } = useTheme();
  const navigate   = useNavigate();
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPinnedPosts().then(({ posts: data }) => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  // Don't render the section at all if there are no pinned posts
  if (!loading && posts.length === 0) return null;

  const textPrim = isDark ? 'text-white'       : 'text-[#0F4C3A]';
  const textSub  = isDark ? 'text-[#999]'      : 'text-[#4a7c6f]';
  const cardBg   = isDark ? 'bg-[#111]'        : 'bg-white';
  const cardBorder = isDark ? 'border-white/10 hover:border-white/20' : 'border-[#0F4C3A]/10 hover:border-[#0F4C3A]/25';

  return (
    <section className={`py-16 md:py-24 px-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#f5f9f7]'}`}>
      <div className="max-w-6xl mx-auto">

        {/* Header row */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-[0.35em] mb-2 ${isDark ? 'text-[#D4AF37]' : 'text-[#0F4C3A]'}`}>
              From the Blog
            </p>
            <h2 className={`text-3xl md:text-4xl font-bold font-[Poltawski_Nowy,serif] leading-tight mb-3 ${textPrim}`}>
              Tips, guides &amp; updates
            </h2>
            <p className={`text-xs font-semibold tracking-widest uppercase mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Learn more about growing your frame business
            </p>
          </div>
          <Link
            to="/blog"
            className={`hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70 ${textSub}`}
          >
            View all
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-[3px] border-[#0F4C3A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {posts.map(post => (
              <article
                key={post.id}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col ${cardBg} ${cardBorder}`}
              >
                {/* Cover */}
                <div className="aspect-[16/9] overflow-hidden flex-shrink-0">
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#e8f2ee]'}`}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0F4C3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-4">
                  {/* Tags */}
                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {post.tags.slice(0, 2).map(tag => (
                        <Link
                          key={tag}
                          to={`/blog?tag=${encodeURIComponent(tag)}`}
                          onClick={e => e.stopPropagation()}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-opacity hover:opacity-70
                            ${isDark ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-secondary/30 text-[#0F4C3A]'}`}
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <h3 className={`text-lg font-bold leading-snug mb-2 line-clamp-2 transition-colors
                    ${isDark ? 'text-white group-hover:text-[#D4AF37]' : 'text-[#0F4C3A] group-hover:text-[#0a3329]'}`}>
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className={`text-xs leading-relaxed line-clamp-2 flex-1 ${textSub}`}>
                      {post.excerpt}
                    </p>
                  )}

                  {/* Footer */}
                  <div className={`flex items-center justify-between mt-3 pt-3 border-t text-[11px]
                    ${isDark ? 'border-white/8 text-[#555]' : 'border-[#0F4C3A]/8 text-[#4a7c6f]/60'}`}>
                    <span className="font-medium">{post.author}</span>
                    <span>{formatDate(post.published_at || post.created_at)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Mobile "View all" link */}
        <div className="sm:hidden text-center mt-8">
          <Link
            to="/blog"
            className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70 ${textSub}`}
          >
            View all articles
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}
