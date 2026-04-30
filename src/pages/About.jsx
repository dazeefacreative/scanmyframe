import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: 'easeOut', delay },
  viewport: { once: true, amount: 0.2 },
});

export default function About() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const text    = isDark ? 'text-gray-300'  : 'text-gray-600';
  const heading = isDark ? 'text-white'     : 'text-gray-900';
  const card    = isDark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200';
  const tag     = isDark ? 'bg-white/5 text-gold border border-white/10' : 'bg-[#0F4C3A]/5 text-[#0F4C3A] border border-[#0F4C3A]/20';

  return (
    <main className={`${isDark ? 'bg-black text-white' : 'bg-white text-gray-900'} min-h-screen transition-colors duration-200`}>
      <SEO
        title="About Us | ScanFrame"
        description="Learn who we are, our mission to bring frames to life, and our vision to build a global marketplace for frame vendors."
        url="/about"
      />
      <Header />

      {/* Hero */}
      <section className={`pt-28 pb-20 px-4 ${isDark ? 'bg-gradient-to-b from-[#1C1C1C] to-black' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.span
            {...fadeUp(0)}
            className={`inline-block text-xs font-semibold tracking-widest uppercase px-5 py-2 rounded-full mb-6 ${tag}`}
          >
            Our Story
          </motion.span>

          <motion.h1
            {...fadeUp(0.1)}
            className={`text-4xl md:text-6xl font-poltawski font-bold leading-tight mb-6 ${heading}`}
          >
            We Believe Every Frame{' '}
            <span className="text-gold">Deserves to Live</span>
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className={`text-lg md:text-xl leading-relaxed max-w-2xl mx-auto ${text}`}>
            ScanMyFrame was built on one simple idea: a frame hanging on a wall should not be the end of a story. It should be the beginning of a conversation, a discovery, and a connection.
          </motion.p>
        </div>
      </section>

      {/* Who We Are */}
      <section className={`py-16 px-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp(0)}>
              <span className={`inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 ${tag}`}>
                Who We Are
              </span>
              <h2 className={`text-3xl md:text-4xl font-poltawski font-bold mb-5 ${heading}`}>
                A Platform That Gives Frames a Digital Voice
              </h2>
              <p className={`text-base leading-relaxed mb-4 ${text}`}>
                ScanMyFrame is a B2B SaaS platform built for frame vendors, artists, photographers, galleries, and creators across Nigeria and West Africa. We turn physical frames into interactive digital experiences using branded QR codes, with no technical knowledge required.
              </p>
              <p className={`text-base leading-relaxed ${text}`}>
                When someone hangs a frame on a wall today, it sits there silently. We believe that is a missed opportunity. With ScanMyFrame, that same frame becomes a living connection to the story behind it. Scannable, shareable, and always up to date.
              </p>
            </motion.div>

            {/* Stat cards */}
            <motion.div {...fadeUp(0.15)} className="grid grid-cols-2 gap-4">
              {[
                { value: '2,000+', label: 'Vendors on waitlist' },
                { value: '4 Plans', label: 'From free to business' },
                { value: 'Real-Time', label: 'Scan analytics' },
                { value: 'No App', label: 'Needed to scan' },
              ].map(({ value, label }) => (
                <div key={label} className={`rounded-xl border p-6 text-center ${card}`}>
                  <p className="text-2xl font-bold text-gold mb-1">{value}</p>
                  <p className={`text-sm ${text}`}>{label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center mb-14">
            <span className={`inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 ${tag}`}>
              Our Mission
            </span>
            <h2 className={`text-3xl md:text-4xl font-poltawski font-bold ${heading}`}>
              Frames That Live Beyond the Wall
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🖼️',
                title: 'Bring Frames to Life',
                body: 'A frame mounted on a wall is just the beginning. ScanMyFrame attaches a living digital layer to every physical frame: photos, videos, stories, and context. Each frame becomes an experience rather than just a decoration. Your frames breathe, update, and speak long after they leave your hands.',
              },
              {
                icon: '📣',
                title: 'Visibility for Vendors',
                body: 'Frame vendors deserve an audience beyond their local street or shop. ScanMyFrame exposes vendors to a growing digital community. Every QR code scan is a new visitor discovering your work. Every frame page is a storefront accessible to anyone, anywhere, at any time, helping you attract more clients and close sales faster.',
              },
              {
                icon: '🤝',
                title: 'Connecting Buyers and Creators',
                body: 'We are building the infrastructure that lets frame vendors grow their business through technology and not just talent. By turning frames into digital products with measurable reach, we give vendors the tools to compete, scale, and thrive in a digital-first world without abandoning the craft they love.',
              },
            ].map(({ icon, title, body }, i) => (
              <motion.div
                key={title}
                {...fadeUp(i * 0.1)}
                className={`rounded-2xl border p-7 ${card}`}
              >
                <span className="text-3xl mb-4 block">{icon}</span>
                <h3 className={`text-lg font-bold mb-3 ${heading}`}>{title}</h3>
                <p className={`text-sm leading-relaxed ${text}`}>{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className={`py-20 px-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center mb-14">
            <span className={`inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 ${tag}`}>
              Our Vision
            </span>
            <h2 className={`text-3xl md:text-4xl font-poltawski font-bold mb-5 ${heading}`}>
              Africa Is Where We Start.{' '}
              <span className="text-gold">The World Is Where We Are Going.</span>
            </h2>
            <p className={`text-base leading-relaxed max-w-2xl mx-auto ${text}`}>
              We are building ScanMyFrame to be the global platform for frame vendors, starting in Nigeria, expanding across West Africa, and reaching audiences on every continent.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Global reach */}
            <motion.div {...fadeUp(0.05)} className={`rounded-2xl border p-8 ${card}`}>
              <span className="text-3xl mb-4 block">🌍</span>
              <h3 className={`text-xl font-bold mb-3 ${heading}`}>A Platform With Global Reach</h3>
              <p className={`text-sm leading-relaxed mb-3 ${text}`}>
                Our vision is for a frame made by an artisan in Lagos to be discovered and ordered by a buyer in London, New York, or Dubai, all through a single QR scan.
              </p>
              <p className={`text-sm leading-relaxed ${text}`}>
                We are building the infrastructure to make West African frame vendors visible on a global stage. Every QR code is a digital passport that carries your work beyond borders, time zones, and physical limitations.
              </p>
            </motion.div>

            {/* Marketplace */}
            <motion.div {...fadeUp(0.1)} className={`rounded-2xl border p-8 relative overflow-hidden ${card}`}>
              <span className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/30">
                Coming Soon
              </span>
              <span className="text-3xl mb-4 block">🛒</span>
              <h3 className={`text-xl font-bold mb-3 ${heading}`}>The ScanMyFrame Marketplace</h3>
              <p className={`text-sm leading-relaxed mb-3 ${text}`}>
                Our next milestone is a fully integrated marketplace where signed-in vendors can list their physical frames for quick sale and order. Buyers browse a curated catalogue, discover vendors by style or location, and place orders directly through the platform.
              </p>
              <p className={`text-sm leading-relaxed ${text}`}>
                For vendors, it means a ready-made storefront with no extra setup. For buyers, it means a single trusted destination to find, scan, and order unique frames from creators they can learn about before they buy.
              </p>
            </motion.div>
          </div>

          {/* Vision pillars */}
          <motion.div {...fadeUp(0.15)} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: '🇳🇬', label: 'Born in Nigeria' },
              { icon: '🌐', label: 'Built for the world' },
              { icon: '🛍️', label: 'Marketplace ready' },
              { icon: '📦', label: 'Quick vendor orders' },
            ].map(({ icon, label }) => (
              <div key={label} className={`rounded-xl border p-5 text-center ${card}`}>
                <span className="text-2xl block mb-2">{icon}</span>
                <p className={`text-xs font-semibold ${heading}`}>{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center mb-12">
            <span className={`inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 ${tag}`}>
              What We Stand For
            </span>
            <h2 className={`text-3xl md:text-4xl font-poltawski font-bold ${heading}`}>
              Our Values
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: '✦',
                title: 'Simplicity First',
                body: 'Technology should never be a barrier. We build tools that anyone can use, whether you are a gallery owner in Abuja or an artisan in Ibadan, without needing a single line of code.',
              },
              {
                icon: '✦',
                title: 'Vendors at the Centre',
                body: 'Every decision we make starts with the vendors. Their growth, visibility, and success is the metric we optimise for. When vendors win, the platform wins.',
              },
              {
                icon: '✦',
                title: 'Stories Matter',
                body: 'Behind every frame is a human story: a wedding, a family legacy, a creative vision. We are in the business of making those stories accessible, shareable, and lasting.',
              },
              {
                icon: '✦',
                title: 'Built to Scale',
                body: 'We are not building a local tool. We are laying the foundation for a platform that serves vendors and buyers globally, with the infrastructure, security, and reliability to match.',
              },
            ].map(({ icon, title, body }, i) => (
              <motion.div
                key={title}
                {...fadeUp(i * 0.08)}
                className={`flex gap-5 rounded-2xl border p-6 ${card}`}
              >
                <span className="text-gold text-xl font-bold mt-0.5 flex-shrink-0">{icon}</span>
                <div>
                  <h3 className={`font-bold mb-2 ${heading}`}>{title}</h3>
                  <p className={`text-sm leading-relaxed ${text}`}>{body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <motion.div
          {...fadeUp(0)}
          className="max-w-3xl mx-auto text-center bg-primary rounded-2xl px-8 py-16"
        >
          <h2 className="text-3xl md:text-4xl font-poltawski font-bold text-secondary mb-5">
            Ready to Bring Your Frames to Life?
          </h2>
          <p className="text-secondary/70 text-base mb-8 max-w-xl mx-auto">
            Join thousands of vendors using ScanMyFrame to reach more customers, tell better stories, and build a digital presence that lasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signin')}
              className="bg-gold text-[#0F4C3A] font-bold px-7 py-3 rounded-full hover:bg-opacity-90 transition"
            >
              Get Started Free
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="border border-secondary/30 text-secondary font-bold px-7 py-3 rounded-full hover:bg-secondary/10 transition"
            >
              View Pricing
            </button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
