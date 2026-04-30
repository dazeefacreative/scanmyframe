import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getBlogPostBySlug, getRelatedPosts } from '../services/supabaseHelpers';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO, { ArticleSchema } from '../components/SEO';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─── Rich content block renderer ─────────────────────────────────────────────
function BlockRenderer({ block, isDark }) {
  const prose = isDark ? 'text-[#ccc]' : 'text-[#2d2d2d]';
  const heading = isDark ? 'text-white' : 'text-[#0F4C3A]';

  switch (block.type) {
    case 'paragraph':
      return (
        <p className={`text-base leading-[1.5] ${prose} whitespace-pre-wrap`}>
          {block.content}
        </p>
      );

    case 'h2':
      return (
        <h2 className={`text-2xl md:text-3xl font-bold font-[Poltawski_Nowy,serif] mt-10 mb-3 ${heading}`}>
          {block.content}
        </h2>
      );

    case 'h3':
      return (
        <h3 className={`text-xl font-bold mt-8 mb-2 ${heading}`}>
          {block.content}
        </h3>
      );

    case 'quote':
      return (
        <blockquote className={`border-l-4 border-[#D4AF37] pl-5 my-6 italic text-base leading-relaxed
          ${isDark ? 'text-[#aaa] bg-[#1a1a1a]' : 'text-[#4a7c6f] bg-[#f0f7f4]'} py-4 pr-4 rounded-r-xl`}>
          {block.content}
        </blockquote>
      );

    case 'list':
      return block.ordered ? (
        <ol className={`list-decimal list-outside ml-6 space-y-2 text-base leading-relaxed ${prose}`}>
          {(block.items || []).map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      ) : (
        <ul className={`list-disc list-outside ml-6 space-y-2 text-base leading-relaxed ${prose}`}>
          {(block.items || []).map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );

    case 'image':
      return (
        <figure className="my-8">
          <img
            src={block.url}
            alt={block.caption || ''}
            className="w-full rounded-2xl object-cover shadow-lg"
          />
          {block.caption && (
            <figcaption className={`text-center text-xs mt-2 ${isDark ? 'text-[#666]' : 'text-[#4a7c6f]/70'}`}>
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'divider':
      return (
        <hr className={`my-10 border-none h-px ${isDark ? 'bg-white/10' : 'bg-[#0F4C3A]/10'}`} />
      );

    default:
      return null;
  }
}

export default function BlogPost() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const { isDark }  = useTheme();
  const [post,         setPost]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [notFound,     setNotFound]     = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    getBlogPostBySlug(slug).then(({ post: data, error }) => {
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
      } else {
        setPost(data);
        document.title = `${data.title} | ScanMyFrame`;
        setLoading(false);
        // Fetch related posts non-blocking
        getRelatedPosts(data.id, data.tags || []).then(({ posts }) => setRelatedPosts(posts));
      }
    });
    return () => { document.title = 'ScanMyFrame | Smart QR Frames'; };
  }, [slug]);

  const pageBg   = isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafaf8]';
  const textPrim = isDark ? 'text-white'    : 'text-[#0F4C3A]';
  const textSub  = isDark ? 'text-[#999]'  : 'text-[#4a7c6f]';
  const border   = isDark ? 'border-white/10' : 'border-[#0F4C3A]/10';

  if (loading) return (
    <div className={`min-h-screen ${pageBg} flex items-center justify-center`}>
      <div className="w-9 h-9 border-[3px] border-[#0F4C3A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className={`min-h-screen ${pageBg}`}>
      <Header />
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <p className={`text-5xl mb-5`}>📝</p>
        <h1 className={`text-2xl font-bold ${textPrim} mb-2`}>Post not found</h1>
        <p className={`text-sm ${textSub} mb-8`}>This article doesn't exist or may have been removed.</p>
        <Link to="/blog" className="bg-[#0F4C3A] text-[#FAF5DD] px-7 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
          Back to Blog
        </Link>
      </div>
    </div>
  );

  const postUrl = `/blog/${post.slug}`;

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <SEO
        title={post.title}
        description={post.excerpt || `Read "${post.title}" on the ScanMyFrame blog.`}
        image={post.cover_image || undefined}
        url={postUrl}
        type="article"
        article={{
          publishedTime: post.published_at || post.created_at,
          modifiedTime:  post.updated_at   || post.published_at || post.created_at,
          author:        post.author,
          tags:          post.tags || [],
        }}
      />
      <ArticleSchema post={post} url={postUrl} />
      <Header />

      {/* Cover image */}
      {post.cover_image && (
        <div className="w-full max-h-[480px] overflow-hidden">
          <img src={post.cover_image} alt={post.title} className="w-full max-h-[480px] object-cover" />
        </div>
      )}

      {/* Article */}
      <article className="max-w-2xl mx-auto px-4 py-12 md:py-16">

        {/* Back link */}
        <button
          onClick={() => navigate('/blog')}
          className={`inline-flex items-center gap-1.5 text-sm mb-8 ${textSub} hover:opacity-70 transition-opacity`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          All articles
        </button>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {post.tags.map(tag => (
              <Link
                key={tag}
                to={`/blog?tag=${encodeURIComponent(tag)}`}
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-opacity hover:opacity-70
                  ${isDark ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'bg-secondary/40 text-[#0F4C3A]'}`}>
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className={`text-3xl md:text-4xl font-bold font-[Poltawski_Nowy,serif] leading-tight mb-4 ${textPrim}`}>
          {post.title}
        </h1>

        {/* Meta */}
        <div className={`flex items-center gap-3 text-sm mb-8 pb-8 border-b ${border} ${textSub}`}>
          <span className="font-semibold">{post.author}</span>
          <span className="opacity-40">·</span>
          <span>{formatDate(post.published_at || post.created_at)}</span>
        </div>

        {/* Excerpt / lead */}
        {post.excerpt && (
          <p className={`text-lg leading-relaxed mb-8 font-medium ${isDark ? 'text-[#bbb]' : 'text-[#3a6b5f]'}`}>
            {post.excerpt}
          </p>
        )}

        {/* Body blocks */}
        <div className="flex flex-col gap-2">
          {(post.body || []).map((block, i) => (
            <BlockRenderer key={i} block={block} isDark={isDark} />
          ))}
        </div>

        {/* Bottom nav */}
        <div className={`mt-16 pt-8 border-t ${border} text-center`}>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 bg-[#0F4C3A] text-[#FAF5DD] px-7 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            More articles
          </Link>
        </div>
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className={`py-14 px-4 border-t ${border} ${isDark ? 'bg-[#0d0d0d]' : 'bg-[#f5f9f7]'}`}>
          <div className="max-w-2xl mx-auto">
            <p className={`text-[11px] font-bold uppercase tracking-[0.3em] mb-1 ${isDark ? 'text-[#D4AF37]' : 'text-[#0F4C3A]'}`}>
              You might also like
            </p>
            <h2 className={`text-xl font-bold font-[Poltawski_Nowy,serif] mb-6 ${textPrim}`}>
              Related articles
            </h2>
            <div className="flex flex-col gap-4">
              {relatedPosts.map(p => (
                <Link
                  key={p.id}
                  to={`/blog/${p.slug}`}
                  className={`group flex gap-4 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md
                    ${isDark ? 'bg-[#111] border-white/10 hover:border-white/20' : 'bg-white border-[#0F4C3A]/10 hover:border-[#0F4C3A]/25'}`}
                >
                  {p.cover_image && (
                    <img
                      src={p.cover_image}
                      alt={p.title}
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex flex-col justify-center min-w-0">
                    {p.tags?.length > 0 && (
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-[#D4AF37]' : 'text-[#0F4C3A]/60'}`}>
                        {p.tags[0]}
                      </p>
                    )}
                    <p className={`text-sm font-bold leading-snug line-clamp-2 mb-1 transition-colors
                      ${isDark ? 'text-white group-hover:text-[#D4AF37]' : 'text-[#0F4C3A] group-hover:text-[#0a3329]'}`}>
                      {p.title}
                    </p>
                    {p.excerpt && (
                      <p className={`text-xs line-clamp-1 ${textSub}`}>{p.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
