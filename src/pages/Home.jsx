import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Icon } from '@iconify/react';

import Header from '../components/Header';
import Price from '../components/Price';

import frameScanning from '../assets/images/FrameScanning.png';
import qrCode from '../assets/images/QR code.png';
import ctaSlide1 from '../assets/images/scanframe-image-step-1.jpg';
import ctaSlide2 from '../assets/images/scanframe-image-step-2.jpg';
import ctaSlide3 from '../assets/images/scanframe-image-step-3.jpg';
import marketPlace from '../assets/images/marketplace.png';

import { getFeaturedLogos } from '../services/supabaseHelpers';

import chatBot from '../assets/images/1x/chat bot.png';
import analytics from '../assets/images/1x/analytics.png';
import easy from '../assets/images/1x/easy.png';
import dashboard from '../assets/images/1x/dashboard.png';
import branding from '../assets/images/1x/branding.png';
import secure from '../assets/images/1x/secure.png';
import Footer from '../components/Footer';
import QRCodeGenerator from '../components/QRCodeGenerator';
import WaitlistModal from '../components/WaitlistModal';
import SEO, { OrganizationSchema } from '../components/SEO';
import BlogPreview from '../components/BlogPreview';
import BackToTop from '../components/BackToTop';

// ── Features ──────────────────────────────────────────────────────────────────
const features = [
  { icon: chatBot,
    title: 'Personal AI Assistant',
    desc: 'Your creative writing partner, built in',
    summary: "Every frame deserves a story worth reading. ScanMyFrame's built-in AI assistant helps you write compelling artwork narratives, polish rough drafts, and generate client-ready stories in seconds, all without leaving your dashboard. Also helps in navigating the dashboard.",
    explanation: [
      "Writing the story behind a frame should not be a struggle. ScanMyFrame includes a built-in AI assistant that acts as your creative writing partner, ready whenever you need to bring a piece to life with words.",
      "Whether you are starting from scratch or refining a rough idea, the AI can generate a full artwork story, match your client's tone, or turn brief notes into a polished narrative that buyers and collectors will love.",
      "The assistant is accessible directly from your dashboard. No switching tabs, no separate tools. Just describe the piece and let the AI do the heavy lifting, so you can focus on your craft.",
    ] },
  { icon: branding,
    title: "Branding & Vendor Card",
    desc: "Custom QR code plus your contact card",
    summary: "Customize your QR code with your logo and colors, and attach a vendor card to every frame that shares your name, business details, and contact info. It is effortless branding that turns every scan into a connection, making sure customers always know who to come back to.",
    explanation: [
      "When a customer scans a frame QR code, they don't just see the artwork story - they see you. Your vendor card appears on the frame page, showing your name, business details, and how to get in touch.",
      "This turns every frame you sell into a quiet referral. A customer who loves the piece already has your contact in front of them, with no extra step required on your part.",
      "It is a simple but powerful way to stay connected to your work after it leaves your hands. Every scan is a touchpoint, and your card makes sure customers always know who to come back to."
    ] },
  { icon: secure,
    title: "Secure & Private Sharing",
    desc: "Control who can access your frames",
    summary: "Decide exactly who can access your frame content, whether it is a private client, a selected group, or the general public. Built for personal memories, client deliveries, and sensitive work, ScanMyFrame treats privacy as a core feature so you can deliver with confidence.",
    explanation: [
      "Secure & Private Sharing gives you full control over who can access the content inside your frames. Not every frame is meant for public viewing, and this feature ensures your content stays in the right hands.",
      "You can decide exactly who sees your frames, whether it is a specific customer, a private group, or a selected audience. This makes it ideal for personal memories, client deliveries, or sensitive creative work that requires controlled access.",
      "It also gives your customers peace of mind knowing their content is protected. With ScanMyFrame, privacy is not an afterthought, it is built into the experience, helping you deliver work with confidence and professionalism."
    ] },
  { icon: analytics,
    title: 'Real-Time Analytics',
    desc: 'Track scans and engagement instantly',
    summary: "See when and where every frame is scanned, which content holds attention, and which locations drive the most engagement. Real-time analytics removes guesswork, giving vendors the signals they need to improve their offerings and grow with purpose.",
    explanation: [
      "Understanding how people interact with your frames is just as important as creating them. With real time analytics, you can see when a frame is scanned, how often it is viewed, and how users engage with the content behind it.",
      "For vendors and creators, this insight removes guesswork. You begin to understand what captures attention, which locations perform best, and what type of content keeps people engaged. This allows you to make smarter decisions, improve your offerings, and create more impactful experiences over time.",
      "For businesses, it becomes a powerful feedback loop. Every scan is a signal, helping you measure reach, audience interest, and overall performance without relying on assumptions.",
    ] },
];

// ── How It Works ──────────────────────────────────────────────────────────────
const howItWorks = [
  {
    step: '01',
    title: 'Create a Frame',
    desc: 'Upload your artwork, write the story behind the piece, and generate your QR code.',
    icon: 'lucide:layout-template',
  },
  {
    step: '02',
    title: 'Get your QR Code',
    desc: 'Your unique QR code is generated instantly and emailed to your mailbox - always safe, never lost.',
    icon: 'lucide:qr-code',
  },
  {
    step: '03',
    title: 'Print, Scan and Grow',
    desc: 'Attach the QR to your physical frame. People scan it and feel it.',
    icon: 'lucide:trending-up',
  },
];

// ── Testimonials ──────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: 'OGL',
    role: 'Fashion Designer',
    quote: 'Awwwn, this is really amazing I love my art and the scanning efizy. Thank you thank you.',
    initials: 'OG',
    instagram: 'ogl_couture',
  },
  {
    name: 'Adebimpe Lawal',
    role: 'Fashion Designer',
    quote: 'The fact that I can scan my frame and read the love story my man sent to me, it\'s a 10/10.',
    initials: 'AL',
    instagram: 'queen_of_stitches_',
  },
  {
    name: 'Oladipupo Soidiq',
    role: 'Disc Jockey',
    quote: 'Our wedding photo is indeed lively, even people that visit us any time they scan, they feel the wedding day vibe watching our beautiful video.',
    initials: 'OS',
    instagram: 'djopdot_iloveyou',
  },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────
const faq = [
  {
    question: "What is ScanMyFrame?",
    answer: "ScanMyFrame is a platform that turns physical frames into interactive digital experiences using QR codes, allowing you to link photos, videos, and stories to any frame."
  },
  {
    question: "Do I need technical skills to use it?",
    answer: "No technical skills are required. The platform is designed to be simple, from adding customer details to generating QR codes and sharing frames instantly."
  },
  {
    question: "How do users access the content?",
    answer: "Users simply scan the QR code on the frame with their mobile device and instantly view the attached photos, videos, or stories."
  },
  {
    question: "As a non-frame vendor, can I still use ScanMyFrame?",
    answer: "Yes, ScanMyFrame is not limited to frame vendors. Anyone can use it to create interactive digital experiences, whether you are a creator, photographer, artist, or simply want to share memories in a unique way."
  },
  {
    question: "Can I track how my frames are performing?",
    answer: "Yes, ScanMyFrame provides real-time analytics so you can track scans, engagement, and performance insights for each frame."
  },
  {
    question: "Is ScanMyFrame mobile friendly?",
    answer: "Yes, the platform is fully mobile optimised because most users interact with frames through their phones."
  },
  {
    question: "Can I use ScanMyFrame for my business?",
    answer: "Absolutely. It is designed for creators, photographers, artists, and vendors who want to enhance customer engagement and grow their brand."
  },
  {
    question: "Do customers need an app to view frames?",
    answer: "No app is required. Customers can access everything directly through their phone camera by scanning the QR code."
  },
  {
    question: "Is my customer's data safe with ScanMyFrame?",
    answer: "Yes. ScanMyFrame is built on Supabase with Row-Level Security on every database table, meaning your data and your customers' data are only accessible to the right people. We do not sell or share any personal data, and all content is protected at the infrastructure level."
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [featurePaused, setFeaturePaused] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [videoOpen,   setVideoOpen]   = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ctaIndex, setCtaIndex] = useState(0);
  const [logos, setLogos] = useState([]);
  const [logoCopies, setLogoCopies] = useState(2);
  const scrollRef = useRef(null);
  const logoRef   = useRef(null);
  const trackRef  = useRef(null);

  const isInView = useInView(scrollRef, { amount: 0.5 }); // 30% visible

  const ctaSlides = [
    { src: ctaSlide1, caption: 'She scans the frame' },
    { src: ctaSlide2, caption: 'She explores everything inside the frame' },
    { src: ctaSlide3, caption: 'She enjoys the experience and shares it with others' },
  ];

  const currentFeature = features[index];

  const handleToggle = (i) => setActiveIndex(activeIndex === i ? null : i);

  useEffect(() => { document.title = 'ScanMyFrame | Smart QR Frames'; }, []);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  useEffect(() => {
    getFeaturedLogos().then(({ logos: data, error }) => {
      if (error) throw error;
      setLogos(data);
    });
  }, []);

  // JS-driven marquee - CSS animations inside overflow:hidden are unreliable on iOS Safari
  useEffect(() => {
    const el = trackRef.current;
    const wrapper = logoRef.current;
    if (!el || !wrapper || logos.length === 0) return;

    const DURATION = 24000; // ms for one full loop
    let start = null;
    let animId = null;
    let setW = 0; // width of ONE copy of the logo set (the distance we translate per loop)
    let cancelled = false;

    function tick(ts) {
      if (!start) start = ts;
      if (setW === 0) { animId = requestAnimationFrame(tick); return; }
      const progress = ((ts - start) % DURATION) / DURATION;
      el.style.transform = `translateX(${-progress * setW}px)`;
      animId = requestAnimationFrame(tick);
    }

    const imgs = Array.from(el.querySelectorAll('img'));
    const settled = imgs.map((img) => img.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        })
    );

    Promise.all(settled).then(() => {
      if (cancelled) return;

      const measuredSetW = el.scrollWidth / logoCopies;

      // The track must always have at least one full extra set's worth of content
      // past the point it scrolls back to, otherwise the right edge of the track
      // runs out before the loop wraps - opening a blank gap that then "snaps"
      // shut the instant the loop resets. Make sure (copies - 1) sets cover the
      // visible width, so there's always content filling the viewport.
      const needed = Math.max(2, Math.ceil(wrapper.clientWidth / measuredSetW) + 1);
      if (needed > logoCopies) {
        setLogoCopies(needed);
        return; // re-render with more copies; this effect re-runs and re-measures
      }

      setW = measuredSetW;
      animId = requestAnimationFrame(tick);
    });

    const handleResize = () => {
      start = null;
      setW = el.scrollWidth / logoCopies;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [logos, logoCopies]);

  useEffect(() => {
    const t = setInterval(() => setCtaIndex(prev => (prev + 1) % 3), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (featurePaused) return;
    const t = setInterval(() => setIndex(prev => (prev + 1) % features.length), 7000);
    return () => clearInterval(t);
  }, [featurePaused]);


  return (
    <main className={`${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#fffdf3] text-gray-900'} transition-colors duration-200`}>
      <SEO
        title={null}
        description="ScanMyFrame connects physical picture frames to rich digital content via QR codes. Empower your frames with stories, photos, videos, and more."
        url="/"
      />
      <OrganizationSchema />
      <BackToTop isDark={isDark} />

      {/* ── 1. HERO ───────────────────────────────────────────────────────── */}
      <section id='hero' className={`${isDark ? 'bg-gradient-to-b from-[#1C1C1C] to-black' : 'bg-white'} transition-colors duration-200`}>
        <Header />
        <div className="min-w-[300px] max-w-6xl mx-auto pt-20 overflow-hidden">
          <div className="flex flex-col items-center max-w-4xl px-4 mx-auto text-center">
            <h1 className={`text-4xl md:text-5xl font-poltawski text-center font-bold mb-6 ${isDark ? 'text-secondary' : 'text-primary'}`}>
              Give every frame a soul.
            </h1>
            <p className={`text-md mb-6 text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Scan the frame. Feel the moment. Every physical frame can now carry a living story - a video, a love letter, a memory - discovered instantly by anyone who points their phone at it.
            </p>
            <div className="flex gap-4">
              <a
                href="/signin?mode=register"
                className="bg-primary text-secondary px-5 py-2 rounded-lg font-bold hover:bg-opacity-80 transition"
              >
                Get Started Free
              </a>
              <button
                onClick={() => setVideoOpen(true)}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-bold border-2 border-primary transition ${isDark ? 'text-secondary hover:bg-primary hover:bg-opacity-10' : 'text-primary hover:bg-gray-100'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                See It Live
              </button>
            </div>
          </div>
          <div className="w-[1000px] h-auto ml-5 md:ml-0 md:h-full md:w-full">
            <img src={frameScanning} alt="ScanMyFrame Feature" className="w-full md:mt-0" />
          </div>
        </div>
      </section>

      {/* ── 2. BRANDS ────────────────────────────────────────────────────── */}
      <section id="brands" className="bg-primary overflow-hidden transition-colors duration-200 py-6">
        <style>{`
          .logo-track {
            display: -webkit-flex;
            display: flex;
            gap: 48px;
            align-items: center;
            width: max-content;
            will-change: transform;
          }
          @media (min-width: 640px) {
            .logo-wrapper {
              -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
              mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
            }
          }
        `}</style>
        <p className="text-center text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-4">
          Trusted by vendors across Nigeria
        </p>
        <div ref={logoRef} className="logo-wrapper w-full overflow-hidden">
          <div ref={trackRef} className="logo-track">
            {logos.length > 0 && Array.from({ length: logoCopies }, () => logos).flat().map((logo, idx) => (
              <img
                key={idx}
                src={logo.logo_url}
                title={logo.name}
                className="h-10 w-auto flex-shrink-0"
                style={{ filter: 'brightness(0) invert(1) sepia(1) saturate(0.15) hue-rotate(10deg) opacity(0.85)' }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. CUSTOMER EXPERIENCE ───────────────────────────────────────── */}
      <section id="customer_experience" className={`py-16 md:py-28 px-4 transition-colors duration-200`}>
        <div className="min-w-[300px] max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
              className="flex-shrink-0 md:max-w-sm"
            >
              <span className={`inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5 ${isDark ? 'bg-white/5 text-gold border border-white/10' : 'bg-[#0F4C3A]/5 text-[#0F4C3A] border border-[#0F4C3A]/20'}`}>
                The customer experience
              </span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                className={`text-3xl md:text-4xl font-poltawski font-bold mb-5 ${isDark ? 'text-white' : 'text-primary'}`}
              >
                Here is what your customers experience when they scan
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true, amount: 0.3 }}
                className={`text-base mb-7 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              >
                Every QR code you print becomes a living story your customers can explore. They scan, they read, they engage, and they remember you.
              </motion.p>
              <motion.button
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true, amount: 0.3 }}
                onClick={() => navigate('/signin?mode=register')}
                className="bg-primary text-secondary px-6 py-2.5 rounded-lg font-bold hover:bg-opacity-80 transition text-sm"
              >
                Start for free
              </motion.button>
            </motion.div>

            <div className="relative w-full">
              <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: '4/3' }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={ctaIndex}
                    src={ctaSlides[ctaIndex].src}
                    alt={ctaSlides[ctaIndex].caption}
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
                </AnimatePresence>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`caption-${ctaIndex}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="absolute bottom-10 left-4 right-16 z-10 max-w-[180px] md:max-w-[200px]"
                  >
                    <p className="text-white text-sm font-medium leading-snug drop-shadow-md">
                      {ctaSlides[ctaIndex].caption}
                    </p>
                  </motion.div>
                </AnimatePresence>
                <div className="absolute bottom-3 left-4 flex gap-2 z-10">
                  {ctaSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCtaIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === ctaIndex ? 'bg-white w-5' : 'bg-white/50 w-1.5'}`}
                    />
                  ))}
                </div>
              </div>
              <motion.img
                initial={{ y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                src={qrCode}
                alt="QR Code"
                className="absolute w-[100px] md:w-[130px] -bottom-8 right-6 shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. PROBLEM ───────────────────────────────────────────────────── */}
      <section id="problem" className={`py-16 md:py-20 px-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fffdf3]'}`}>
        <div className="min-w-[300px] max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className={`inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 ${isDark ? 'bg-white/5 text-gold border border-white/10' : 'bg-[#0F4C3A]/5 text-[#0F4C3A] border border-[#0F4C3A]/20'}`}>
              The problem
            </span>
            <h2 className={`text-3xl md:text-4xl font-poltawski font-bold mb-4 ${isDark ? 'text-white' : 'text-primary'}`}>
              A frame has always just sat on a wall.
            </h2>
            <p className={`text-base max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              For centuries, frames have held the most meaningful moments of our lives - weddings, firstborns, lost loved ones, great art. But the frame itself has never been able to say anything. It just hangs there, beautiful and silent, while the story behind it slowly disappears.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: 'lucide:image',
                title: 'Frames are one-dimensional',
                desc: 'A frame shows you a moment frozen in time. But it cannot tell you who took the photo, what was said that day, or why that moment mattered. It is a window with the curtain drawn.',
              },
              {
                icon: 'lucide:volume-x',
                title: 'Every story gets buried',
                desc: "The emotion behind a frame - the shoot, the gift, the memory, the artist's intent - lives only in the head of the person who made it. Once it leaves their hands, that story is gone.",
              },
              {
                icon: 'lucide:clock-fading',
                title: "Memories fade. Walls don't explain.",
                desc: 'People look at frames for years - visitors, children, grandchildren - without ever knowing what they are really looking at. The frame holds a world inside it. But no one can get in.',
              },
            ].map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                viewport={{ once: true }}
                className={`p-7 rounded-2xl border ${isDark ? 'bg-[#111] border-white/8' : 'bg-white border-gray-200'}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/5' : 'bg-secondary'}`}>
                  <Icon icon={icon} width={20} className={isDark ? 'text-gold' : 'text-primary'} />
                </div>
                <h3 className={`text-base font-bold mb-3 ${isDark ? 'text-white' : 'text-primary'}`}>{title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="guidelines" className={`py-16 md:py-16 px-4 transition-colors duration-200 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fffdf3]'}`}>
        <div className="min-w-[300px] max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className={`inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 ${isDark ? 'bg-white/5 text-gold border border-white/10' : 'bg-[#0F4C3A]/5 text-[#0F4C3A] border border-[#0F4C3A]/20'}`}>
              How it works
            </span>
            <h2 className={`text-3xl md:text-4xl font-poltawski font-bold ${isDark ? 'text-white' : 'text-primary'}`}>
              Up and running in three steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-[2px] bg-gradient-to-r from-primary via-gold to-primary opacity-20" />
            {howItWorks.map(({ step, title, desc, icon }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                viewport={{ once: true }}
                className={`relative flex flex-col items-center text-center p-8 rounded-2xl`}
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-5 flex-shrink-0">
                  <Icon icon={icon} width={22} className="text-gold" />
                </div>
                <span className={`text-[10px] font-bold tracking-widest uppercase mb-2 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                  Step {step}
                </span>
                <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-primary'}`}>{title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. FEATURES ──────────────────────────────────────────────────── */}
      <section id="features" className={`${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fffdf3]'}`}>
        <motion.div
          ref={scrollRef}
          initial={{ scale: 0.8, y: 20, borderRadius: "40px" }}
          animate={
            isInView
              ? { scale: 1, y: 0, borderRadius: "0px" }
              : { scale: 0.8, y: 20, borderRadius: "40px" }
          }
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ overflow: "hidden" }}
        >
          <div className="bg-primary py-16 md:py-16 px-4 transition-colors duration-200">
            <div className="min-w-[300px] max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <span className="inline-block text-[10px] font-semibold tracking-[0.18em] uppercase px-4 py-1.5 rounded-full text-gold bg-white/6 border border-white/12 mb-4">
                  What you get
                </span>
                <h2 className="text-3xl md:text-4xl font-poltawski text-white font-bold">
                  Built for the way you sell.
                </h2>
              </div>

              <div className="hidden md:grid grid-cols-[1fr_1.2fr] gap-12 items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.38, ease: 'easeOut' }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-10 flex items-center justify-center min-h-[360px]"
                  >
                    <img
                      src={features[index].icon}
                      alt={features[index].title}
                      className="w-[85%] max-w-[320px] object-contain"
                    />
                  </motion.div>
                </AnimatePresence>
                <div className="flex flex-col gap-0.5">
                  {features.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => { if (i === index) { setFeaturePaused(p => !p); } else { setIndex(i); setFeaturePaused(true); } }}
                      className={`text-left px-5 py-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                        i === index ? 'bg-white/10 border-white/15' : 'border-transparent hover:bg-white/5'
                      }`}
                    >
                      <h4 className={`font-poltawski text-lg font-bold mb-1 transition-colors ${i === index ? 'text-gold' : 'text-white/70'}`}>
                        {f.title}
                      </h4>
                      {i === index && (
                        <p className="text-sm text-white/65 leading-relaxed mb-3">{f.summary}</p>
                      )}
                      {i === index && (
                        <div className="h-[2px] bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            key={`bar-${index}-${featurePaused}`}
                            className="h-full bg-gold rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: featurePaused ? undefined : '100%' }}
                            transition={{ duration: 7, ease: 'linear' }}
                          />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:hidden">
                <div className="flex gap-2 overflow-x-auto pb-3 mb-5" style={{ scrollbarWidth: 'none' }}>
                  {features.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${i === index ? 'bg-white text-primary' : 'bg-white/10 text-white/60'}`}
                    >
                      {f.title}
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
                  >
                    <div className="flex items-center justify-center bg-white/5 py-1 px-6">
                      <img src={features[index].icon} alt={features[index].title} className="w-64 h-64 object-contain" />
                    </div>
                    <div className="px-6 py-5 border-t border-white/10">
                      <h3 className="text-lg font-bold text-white mb-2">{features[index].title}</h3>
                      <p className="text-sm text-white/65 leading-relaxed">{features[index].summary}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="flex justify-center gap-2 mt-5">
                  {features.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-white w-5' : 'bg-white/30 w-1.5'}`}
                    />
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="mt-14 text-center"
              >
                <a
                  href="/signin?mode=register"
                  className="bg-gold text-primary font-bold px-8 py-3 rounded-lg hover:bg-opacity-90 transition text-sm"
                >
                  Start for free, no credit card required
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 7. WHO IT'S FOR ──────────────────────────────────────────────── */}
      <section id="who_its_for" className={`py-16 md:py-20 px-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#fffdf3]'}`}>
        <div className="min-w-[300px] max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className={`inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 ${isDark ? 'bg-white/5 text-gold border border-white/10' : 'bg-[#0F4C3A]/5 text-[#0F4C3A] border border-[#0F4C3A]/20'}`}>
              Who it's for
            </span>
            <h2 className={`text-3xl md:text-4xl font-poltawski font-bold ${isDark ? 'text-white' : 'text-primary'}`}>
              Built for creators like you
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              {
                icon: 'lucide:frame',
                title: 'Frame Vendors',
                desc: 'Sell the frame. Keep the relationship. Every scan brings a buyer back to you.',
              },
              {
                icon: 'lucide:camera',
                title: 'Photographers',
                desc: 'Your portraits should keep working long after delivery. Attach the story, the shoot, the feeling.',
              },
              {
                icon: 'lucide:palette',
                title: 'Artists & Galleries',
                desc: 'Provenance and storytelling for every piece. Let the art speak - even after it leaves the wall.',
              },
              {
                icon: 'lucide:gift',
                title: 'Gift & Event Creators',
                desc: 'Turn a wedding gift or memorial frame into a memory they relive every time they scan.',
              },
            ].map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`flex flex-col gap-4 p-6 rounded-2xl border ${isDark ? 'bg-[#111] border-white/8' : 'bg-white border-gray-200'}`}
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon icon={icon} width={20} className="text-primary" />
                </div>
                <div>
                  <h3 className={`text-base font-bold mb-2 ${isDark ? 'text-white' : 'text-primary'}`}>{title}</h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. TESTIMONIALS ──────────────────────────────────────────────── */}
      <section id="testimonials" className={`py-12 md:py-16 px-4 ${isDark ? 'bg-[#000000]' : 'bg-white'} transition-colors duration-200`}>
        <div className="min-w-[300px] max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className={`inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 ${isDark ? 'bg-white/5 text-gold border border-white/10' : 'bg-[#0F4C3A]/5 text-[#0F4C3A] border border-[#0F4C3A]/20'}`}>
              Vendor stories
            </span>
            <h2 className={`text-3xl md:text-4xl font-poltawski font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              What vendors are saying
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, quote, initials, instagram }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`flex flex-col gap-5 p-7 rounded-2xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200'}`}
              >
                <span className="text-gold text-4xl leading-none font-serif select-none">"</span>
                <p className={`text-sm leading-relaxed flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{quote}</p>
                <div className={`flex items-center gap-3 pt-2 border-t border-dashed ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gold">{initials}</span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{name}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{role}</p>
                    {instagram && (
                      <a
                        href={`https://instagram.com/${instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-[11px] font-medium ${isDark ? 'text-secondary/40' : 'text-primary'} hover:underline`}
                      >
                        @{instagram}
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. QR CODE GENERATOR ─────────────────────────────────────────── */}
      <section id="create_frames" className={`py-12 md:py-16 px-4 ${isDark ? 'bg-[#000000]' : 'bg-white'}`}>
        <div className="min-w-[300px] max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className={`inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 ${isDark ? 'bg-white/5 text-gold border border-white/10' : 'bg-[#0F4C3A]/5 text-[#0F4C3A] border border-[#0F4C3A]/20'}`}>
              Try it yourself
            </span>
            <h2 className={`text-2xl md:text-3xl font-poltawski font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Create your first QR-linked frame
            </h2>
          </div>
          <div className="relative flex flex-col px-4 py-16 items-center border rounded-xl transition-colors duration-200 bg-[#162722] border-gray-700 overflow-hidden">
            <div className='z-10'>
              <QRCodeGenerator />
            </div>
            <motion.img
              initial={{ y: 100, opacity: 0 }}
              whileInView={{ y: 0, opacity: 0.5 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              src={qrCode}
              alt="QR Code"
              className="hidden md:block absolute w-[250px] -left-16 top-1/2 -translate-y-1/2 rounded-lg shadow-lg -rotate-12"
            />
          </div>
        </div>
      </section>

      {/* ── 10. FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className={`py-12 md:py-16 px-4 ${isDark ? 'bg-[#000000]' : 'bg-white'}`}>
        <div className="flex flex-col md:py-16 py-12 px-[30px] lg:px-[250px] md:px-[120px] mx-auto items-center">
          <p className={`text-center mb-6 uppercase tracking-[0.6rem] text-[14px] ${isDark ? 'text-secondary' : 'text-gray-600'}`}>FAQ</p>
          <h2 className={`md:text-4xl text-2xl mb-10 text-center font-poltawski font-bold ${isDark ? 'text-white' : 'text-primary'}`}>
            Frequently Asked Questions
          </h2>
          <div className="w-full max-w-[650px] flex flex-col gap-4 justify-center">
            {faq.map((item, i) => (
              <div
                key={i}
                className={`flex flex-col gap-4 rounded-xl p-4 w-full border ${isDark ? activeIndex === i ? "bg-[#102004]" : "bg-[#343831]" : activeIndex === i ? "bg-white" : "bg-stone-100"}`}
              >
                <div onClick={() => handleToggle(i)} className="flex justify-between items-center cursor-pointer">
                  <h3 className={`font-heading text-lg ${isDark ? 'text-white' : 'text-primary'}`}>{item.question}</h3>
                  <Icon
                    className={`w-8 h-8 transition-transform duration-300 ${isDark ? 'text-white' : 'text-primary'}`}
                    icon={activeIndex === i ? "material-symbols-light:keyboard-arrow-down" : "material-symbols-light:keyboard-arrow-up"}
                  />
                </div>
                {activeIndex === i && (
                  <p className={`text-sm opacity-80 ${isDark ? 'text-stone-100' : 'text-gray-700'}`}>{item.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. PRICING ──────────────────────────────────────────────────── */}
      <section id="pricing" className={`${isDark ? 'bg-[#000000]' : 'bg-white'} py-12 md:py-20 px-4 transition-colors duration-200 overflow-hidden`}>
        <div className="min-w-[300px] max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-poltawski font-bold mb-4 ${isDark ? 'text-secondary' : 'text-gray-900'}`}>
              Start free. Upgrade when you grow.
            </h2>
            <p className={`max-w-4xl mt-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            You get free access to all features for 30 days on your first signup. No credit card required.
            </p>
          </div>
          <Price />
          <div className="text-center mt-10">
            <a
              href="/signin?mode=register"
              className="bg-primary text-secondary font-bold px-8 py-3 rounded-lg hover:bg-opacity-80 transition text-sm"
            >
              Get started free, no credit card required
            </a>
          </div>
        </div>
      </section>

      {/* ── 12. MARKETPLACE ──────────────────────────────────────────────── */}
      <section id="marketplace" className="overflow-hidden py-12 sm:px-4 md:py-16">
        <div className="min-w-[300px] max-w-6xl mx-auto px-4 py-10 md:py-16">
          <div className="flex flex-col items-center max-w-3xl mx-auto text-center">
            <span className={`inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 ${isDark ? 'bg-white/5 text-gold border border-white/10' : 'bg-[#0F4C3A]/5 text-[#0F4C3A] border border-[#0F4C3A]/20'}`}>
              What's next
            </span>
            <h2 className={`text-3xl md:text-4xl font-poltawski font-bold mb-6 text-center ${isDark ? 'text-white' : 'text-primary'}`}>
              Over 2,000 vendors are already on the waitlist for the ScanMyFrame marketplace
            </h2>
            <p className={`text-sm mb-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              A fully integrated marketplace where vendors list their physical frames for quick sale and buyers discover and order directly. Get on the list before we launch.
            </p>
            <button
              onClick={() => setWaitlistOpen(true)}
              className="bg-primary text-secondary px-5 py-2 rounded-lg font-bold hover:bg-opacity-80 transition"
            >
              Join the Waitlist
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="w-[250vw] md:w-full md:max-w-6xl md:mx-auto md:px-0 pb-4 md:pb-16">
            <img src={marketPlace} alt="ScanMyFrame Marketplace" className="w-full rounded-3xl shadow-lg" />
          </div>
        </div>
      </section>

      {/* ── 13. FINAL CTA ────────────────────────────────────────────────── */}
      <section id="final_cta" className='py-12 md:py-20 px-4 bg-green-800'>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <span className="inline-block text-[10px] font-semibold tracking-[0.18em] uppercase px-4 py-1.5 rounded-full text-gold bg-white/6 border border-white/12 mb-4">
            Ready when you are
          </span>
          <h2 className="text-3xl md:text-5xl font-poltawski font-bold text-secondary mb-5 leading-tight">
            Your frames deserve more than a wall.
          </h2>
          <p className="text-secondary/70 text-base mb-10 max-w-xl mx-auto leading-relaxed">
            Join vendors across Nigeria using ScanMyFrame to turn every frame they sell into a digital experience their customers never forget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signin?mode=register"
              className="bg-gold text-primary font-bold px-8 py-3.5 rounded-lg hover:bg-opacity-90 transition text-sm"
            >
              Get Started Free
            </a>
            <a
              href="/pricing"
              className="border border-secondary/30 text-secondary font-bold px-8 py-3.5 rounded-lg hover:bg-[#fffdf3]/10 transition text-sm"
            >
              View Pricing
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── 14. BLOG PREVIEW ─────────────────────────────────────────────── */}
      <BlogPreview />

      <Footer />

      <WaitlistModal
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        userEmail={user?.email ?? ''}
      />

      {/* ── Video modal ───────────────────────────────────────────────────── */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={() => setVideoOpen(false)}
        >
          <div
            className="relative w-full max-w-sm"
            style={{ aspectRatio: '9/16' }}
            onClick={e => e.stopPropagation()}
          >
            <iframe
              src="https://www.youtube.com/embed/KwbOUFPI-j0?autoplay=1&rel=0&modestbranding=1&vq=hd1080"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full rounded-2xl"
              style={{ border: 'none' }}
              title="See ScanMyFrame in real life"
            />
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 transition-colors flex items-center justify-center text-white"
              aria-label="Close video"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}