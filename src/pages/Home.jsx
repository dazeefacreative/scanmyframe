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

import me from '../assets/images/icons/me.png';
import onSocial from '../assets/images/icons/on social.png';
import coment from '../assets/images/icons/coment.png';
import protippa from '../assets/images/icons/protippa.png';
import punch from '../assets/images/icons/punch.png';
import rons from '../assets/images/icons/rons.png';

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
  { icon: easy,
    title: 'Easy to Use',
    desc: 'No technical knowledge required',
    summary: "Getting started takes only minutes, no technical background needed. Enter your details, upload your content, and the platform guides you to a ready QR code. Visitors then scan and access everything instantly, with no apps to install and no extra steps required.",
    explanation: [
      "Getting started is simple and straightforward, even if you have never used a digital tool like this before. You begin by entering your customer's details and the content you want to attach, whether it is photos, videos, or a personal story.",
      "From there, the platform guides you step by step. Once everything is set, you generate a unique QR code linked to that frame. The process is clear, quick, and does not require any technical setup or special skills.",
      "For the end user, it is even easier. They simply scan the QR code with their phone and instantly access the content. No apps to install, no extra steps, just a smooth and effortless experience from start to finish."
    ] },
  { icon: chatBot,
    title: 'Personal AI Assistant',
    desc: 'Your creative writing partner, built in',
    summary: "Every frame deserves a story worth reading. ScanFrameNG's built-in AI assistant helps you write compelling artwork narratives, polish rough drafts, and generate client-ready stories in seconds, all without leaving your dashboard. Also helps in navigating the dashboard.",
    explanation: [
      "Writing the story behind a frame should not be a struggle. ScanFrameNG includes a built-in AI assistant that acts as your creative writing partner, ready whenever you need to bring a piece to life with words.",
      "Whether you are starting from scratch or refining a rough idea, the AI can generate a full artwork story, match your client's tone, or turn brief notes into a polished narrative that buyers and collectors will love.",
      "The assistant is accessible directly from your dashboard. No switching tabs, no separate tools. Just describe the piece and let the AI do the heavy lifting, so you can focus on your craft.",
    ] },
  { icon: dashboard,
    title: "Personalised Dashboard",
    desc: "Everything you need in one simple place",
    summary: "Your dashboard brings frames, customers, and activity together in one organised space. Instead of juggling multiple tools, you stay focused on what matters. Create frames, manage content, and track your workflow with a clear overview that keeps your business running smoothly.",
    explanation: [
      "After signing in, you get access to a personalised dashboard designed to keep everything organised and easy to manage. It brings your frames, customers, and activity together in one place.",
      "Instead of switching between tools or losing track of details, the dashboard helps you focus on what matters most. You can quickly create frames, manage content, and stay in control of your workflow.",
      "It is built to reduce distraction and improve efficiency, giving you a clear overview of your activity so you can focus more on growing your business and less on managing tools."
    ] },
  { icon: branding,
    title: "Custom Branding",
    desc: "Make every frame reflect your brand",
    summary: "Shape how your customers experience your frames from start to finish. Add your logo, align colours to your brand, and ensure every interaction feels like a direct extension of your business. When customers scan a frame, they recognise you, not a third-party platform.",
    explanation: [
      "Custom Branding allows you to fully personalise your ScanFrameNG experience so it reflects your identity as a creator, vendor, or business. You are not limited to a generic interface, you can shape how your customers experience your frames from start to finish.",
      "You can add your logo, adjust colours, and align the visual experience with your brand style. This ensures that every interaction your customer has with a frame feels like a direct extension of your business, not a third party tool.",
      "This level of personalisation helps you build stronger recognition and trust with your customers. When they scan a frame, they immediately associate the experience with your brand, making your work feel more professional, consistent, and memorable."
    ] },
  { icon: secure,
    title: "Secure & Private Sharing",
    desc: "Control who can access your frames",
    summary: "Decide exactly who can access your frame content, whether it is a private client, a selected group, or the general public. Built for personal memories, client deliveries, and sensitive work, ScanFrameNG treats privacy as a core feature so you can deliver with confidence.",
    explanation: [
      "Secure & Private Sharing gives you full control over who can access the content inside your frames. Not every frame is meant for public viewing, and this feature ensures your content stays in the right hands.",
      "You can decide exactly who sees your frames, whether it is a specific customer, a private group, or a selected audience. This makes it ideal for personal memories, client deliveries, or sensitive creative work that requires controlled access.",
      "It also gives your customers peace of mind knowing their content is protected. With ScanFrameNG, privacy is not an afterthought, it is built into the experience, helping you deliver work with confidence and professionalism."
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
    desc: 'Add a frame title, upload a photo, video, or gallery, and write a short story or use our AI Agent to write for you. The platform does the rest.',
    icon: 'lucide:layout-template',
  },
  {
    step: '02',
    title: 'Get your QR Code',
    desc: 'A unique branded QR code is generated instantly and emailed directly to you as a ready-to-print file.',
    icon: 'lucide:qr-code',
  },
  {
    step: '03',
    title: 'Print, Scan and Grow',
    desc: 'Attach the QR to your physical frame. People scan it, see the story, communicate with it, and you track every interaction in real time.',
    icon: 'lucide:trending-up',
  },
];

// ── Testimonials ──────────────────────────────────────────────────────────────
// PLACEHOLDER: replace with real vendor quotes when available
const testimonials = [
  {
    name: 'Adaeze Nwosu',
    role: 'Frame vendor, Lagos',
    quote: 'I linked QR codes to eight frames I sold last month and two customers came back within a week to order more. Seeing where my frames are being scanned changed how I approach marketing completely.',
    initials: 'AN',
  },
  {
    name: 'Emeka Okafor',
    role: 'Photography studio, Abuja',
    quote: 'My clients used to take their framed portraits home and that was the end of the relationship. Now they scan the QR and see the full story behind the shoot. Three of them have already referred friends.',
    initials: 'EO',
  },
  {
    name: 'Chisom Eze',
    role: 'Art gallery owner, Port Harcourt',
    quote: 'I had my first frame live with a QR code in under ten minutes. The dashboard gives me a clear view of which pieces are getting attention and from where. It has become a core part of how I run the gallery.',
    initials: 'CE',
  },
];

// ── Logos ─────────────────────────────────────────────────────────────────────
const logos = [
  { src: me, alt: 'Me' },
  { src: onSocial, alt: 'On Social' },
  { src: coment, alt: 'Coment' },
  { src: protippa, alt: 'Protippa' },
  { src: punch, alt: 'Punch' },
  { src: rons, alt: 'Rons' },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────
const faq = [
  {
    question: "What is ScanFrameNG?",
    answer: "ScanFrameNG is a platform that turns physical frames into interactive digital experiences using QR codes, allowing you to link photos, videos, and stories to any frame."
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
    question: "As a non-frame vendor, can I still use ScanFrameNG?",
    answer: "Yes, ScanFrameNG is not limited to frame vendors. Anyone can use it to create interactive digital experiences, whether you are a creator, photographer, artist, or simply want to share memories in a unique way."
  },
  {
    question: "Can I track how my frames are performing?",
    answer: "Yes, ScanFrameNG provides real-time analytics so you can track scans, engagement, and performance insights for each frame."
  },
  {
    question: "Is ScanFrameNG mobile friendly?",
    answer: "Yes, the platform is fully mobile optimised because most users interact with frames through their phones."
  },
  {
    question: "Can I use ScanFrameNG for my business?",
    answer: "Absolutely. It is designed for creators, photographers, artists, and vendors who want to enhance customer engagement and grow their brand."
  },
  {
    question: "Do customers need an app to view frames?",
    answer: "No app is required. Customers can access everything directly through their phone camera by scanning the QR code."
  },
  {
    question: "Is my customer's data safe with ScanFrameNG?",
    answer: "Yes. ScanFrameNG is built on Supabase with Row-Level Security on every database table, meaning your data and your customers' data are only accessible to the right people. We do not sell or share any personal data, and all content is protected at the infrastructure level."
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [ctaIndex, setCtaIndex] = useState(0);
  const scrollRef = useRef(null);
  const logoRef   = useRef(null);

  const isInView = useInView(scrollRef, { amount: 0.5 }); // 30% visible

  const ctaSlides = [
    { src: ctaSlide1, caption: 'She scans the frame' },
    { src: ctaSlide2, caption: 'She explores everything inside the frame' },
    { src: ctaSlide3, caption: 'She enjoys the experience and shares it with others' },
  ];

  const currentFeature = features[index];

  const handleToggle = (i) => setActiveIndex(activeIndex === i ? null : i);

  useEffect(() => { document.title = 'ScanFrameNG | Smart QR Frames'; }, []);

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
    <main className={`${isDark ? 'bg-[#000000] text-white' : 'bg-white text-gray-900'} min-h-screen transition-colors duration-200`}>
      <SEO
        title={null}
        description="ScanFrameNG connects physical picture frames to rich digital content via QR codes. Empower your frames with stories, photos, videos, and more."
        url="/"
      />
      <OrganizationSchema />
      <BackToTop isDark={isDark} />

      {/* ── 1. HERO ───────────────────────────────────────────────────────── */}
      
      <section className={`${isDark ? 'bg-gradient-to-b from-[#1C1C1C] to-black' : 'bg-white'} transition-colors duration-200`}>
        <Header />
        <div className="min-w-[300px] max-w-6xl mx-auto pt-12 overflow-hidden">
          <div className="flex flex-col items-center max-w-4xl px-4 mx-auto text-center">
            <span className={`inline-block text-xs font-light tracking-wide px-6 py-2 mb-4 rounded-full transition-all duration-500 ${isDark ? 'bg-gray-900 text-white border border-gray-700 shadow-[0_0_12px_rgba(255,255,255,0.25),0_0_30px_rgba(255,255,255,0.15)]' : 'bg-white text-gray-900 border border-gray-300 shadow-[0_0_10px_rgba(0,0,0,0.15),0_0_25px_rgba(0,0,0,0.1)]'}`}>
              {currentFeature.desc}
            </span>
            <h1 className={`text-4xl md:text-5xl font-poltawski text-center font-bold mb-6 ${isDark ? 'text-secondary' : 'text-gray-900'}`}>
              Turn Every Frame You Sell Into a Digital Experience
            </h1>
            <p className={`text-md mb-6 text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              ScanFrameNG gives frame vendors a branded QR system to link photos, videos and stories to any physical frame, with real-time analytics and zero technical setup.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/signin')}
                className="bg-primary text-secondary px-5 py-2 rounded-md font-bold hover:bg-opacity-80 transition"
              >
                Get Started Free
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className={`px-5 py-2 rounded-md font-bold border-2 border-primary transition ${isDark ? 'text-secondary hover:bg-primary hover:bg-opacity-10' : 'text-primary hover:bg-gray-100'}`}
              >
                View Pricing
              </button>
            </div>
          </div>
          <div className="w-[1000px] h-auto ml-5 md:ml-0 md:h-full md:w-full">
            <img src={frameScanning} alt="ScanFrameNG Feature" className="w-full md:mt-0" />
          </div>
        </div>
      </section>

      {/* ── 2. BRANDS / AS FEATURED IN ───────────────────────────────────── */}
      <section className="bg-primary overflow-hidden transition-colors duration-200 py-6">
        <style>{`
          @keyframes marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .logo-track {
            display: flex;
            gap: 48px;
            align-items: center;
            width: max-content;
            animation: marquee 18s linear infinite;
          }
          @media (min-width: 1280px) {
            .logo-track { animation: none; justify-content: center; }
          }
        `}</style>
        <p className="text-center text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 mb-4">
          As featured in
        </p>
        <div ref={logoRef} className="w-full overflow-hidden px-4">
          <div className="logo-track">
            {/* Duplicated for seamless infinite loop */}
            {[...logos, ...logos].map((logo, idx) => (
              <img key={idx} src={logo.src} alt={logo.alt} className="h-10 w-auto flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. HOW IT WORKS ──────────────────────────────────────────────── */}
      <section 
      id='guidelines'
      className={`py-16 md:py-24 px-4 transition-colors duration-200 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
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
            <h2 className={`text-3xl md:text-4xl font-poltawski font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Up and running in three steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line, desktop only */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-[2px] bg-gradient-to-r from-primary via-gold to-primary opacity-20" />

            {howItWorks.map(({ step, title, desc, icon }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                viewport={{ once: true }}
                className={`relative flex flex-col items-center text-center p-8 rounded-2xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200'}`}
              >
                {/* Step badge */}
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-5 flex-shrink-0">
                  <Icon icon={icon} width={22} className="text-gold" />
                </div>
                <span className={`text-[10px] font-bold tracking-widest uppercase mb-2 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                  Step {step}
                </span>
                <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. FEATURES ──────────────────────────────────────────────────── */}
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
        <section className="bg-primary py-16 px-4 transition-colors duration-200">
          <div className="min-w-[300px] max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-poltawski text-white font-bold mb-3"
              >
                Everything a frame vendor needs in one place
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-white/50 text-sm max-w-md mx-auto mb-5"
              >
                Built specifically for vendors who want to grow their business without the technical complexity.
              </motion.p>
              <button
                onClick={() => setFeaturePaused(p => !p)}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 text-xs font-medium transition-all duration-200"
              >
                {featurePaused ? (
                  <><Icon icon="lucide:play" width={12} />Resume slideshow</>
                ) : (
                  <><Icon icon="lucide:pause" width={12} />Pause slideshow</>
                )}
              </button>
            </div>

            {/* Desktop */}
            <div className="hidden md:grid grid-cols-[280px_1fr] gap-6 items-start">
              <div className="flex flex-col gap-1">
                {features.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`group flex items-start gap-3 px-4 py-4 rounded-xl text-left transition-all duration-300 border ${i === index ? 'bg-white/10 border-white/15' : 'border-transparent hover:bg-white/5'}`}
                  >
                    <span className={`text-xs font-bold font-mono pt-0.5 flex-shrink-0 transition-colors ${i === index ? 'text-gold' : 'text-white/25'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm transition-colors ${i === index ? 'text-white' : 'text-white/50'}`}>{f.title}</p>
                      <p className={`text-xs mt-0.5 truncate transition-colors ${i === index ? 'text-white/40' : 'text-white/25'}`}>{f.desc}</p>
                      {i === index && (
                        <div className="mt-2.5 h-[2px] bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            key={`bar-${index}-${featurePaused}`}
                            className="h-full bg-gold rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: featurePaused ? undefined : '100%' }}
                            transition={{ duration: 7, ease: 'linear' }}
                          />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.38, ease: 'easeOut' }}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col"
                >
                  <div className="flex items-center justify-center bg-white/5 px-8">
                    <img src={features[index].icon} alt={features[index].title} className="w-[400px] object-contain" />
                  </div>
                  <div className="px-8 py-7 border-t border-white/10">
                    <h3 className="text-2xl font-bold text-white mb-3">{features[index].title}</h3>
                    <p className="text-sm text-white/65 leading-relaxed">{features[index].summary}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Mobile */}
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
                  <div className="flex items-center justify-center bg-white/5 py-10 px-6">
                    <img src={features[index].icon} alt={features[index].title} className="w-48 h-48 object-contain" />
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

            {/* Inline CTA after features */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <button
                onClick={() => navigate('/signin')}
                className="bg-gold text-primary font-bold px-8 py-3 rounded-full hover:bg-opacity-90 transition text-sm"
              >
                Start for free, no credit card required
              </button>
            </motion.div>
          </div>
        </section>
      </motion.div>

      {/* ── 5. VISITOR EXPERIENCE (CTA / image slider) ───────────────────── */}
      <section id="about" className={`py-16 md:py-28 px-4 transition-colors duration-200`}>
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
                className="text-3xl md:text-4xl font-poltawski font-bold mb-5"
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
                onClick={() => navigate('/signin')}
                className="bg-primary text-secondary px-6 py-2.5 rounded-full font-bold hover:bg-opacity-80 transition text-sm"
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

      {/* ── 6. QR CODE GENERATOR ─────────────────────────────────────────── */}
      <section id="newframes" className="py-12 md:py-24 px-4">
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
            <QRCodeGenerator />
            <motion.img
              initial={{ y: 100, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              src={qrCode}
              alt="QR Code"
              className="hidden md:block absolute w-[250px] -left-16 top-1/2 -translate-y-1/2 rounded-lg shadow-lg -rotate-12"
            />
          </div>
        </div>
      </section>

      {/* ── 7. TESTIMONIALS ──────────────────────────────────────────────── */}
      {/* PLACEHOLDER: swap testimonial data above with real vendor quotes */}
      <section className={`py-16 md:py-24 px-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
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
            {testimonials.map(({ name, role, quote, initials }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`flex flex-col gap-5 p-7 rounded-2xl border ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-gray-200'}`}
              >
                {/* Quote mark */}
                <span className="text-gold text-4xl leading-none font-serif select-none">"</span>

                <p className={`text-sm leading-relaxed flex-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {quote}
                </p>

                <div className="flex items-center gap-3 pt-2 border-t border-dashed ${isDark ? 'border-white/10' : 'border-gray-200'}">
                  {/* Avatar initials */}
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gold">{initials}</span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{name}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. MARKETPLACE / FOMO ────────────────────────────────────────── */}
      <section className="overflow-hidden">
        <div className="min-w-[300px] max-w-6xl mx-auto px-4 py-10 md:py-16">
          <div className="flex flex-col items-center max-w-3xl mx-auto text-center">
            <span className={`inline-block text-xs font-light tracking-wide px-6 py-2 mb-4 rounded-full transition-all duration-500 ${isDark ? 'bg-gray-900 text-white border border-gray-700 shadow-[0_0_12px_rgba(255,255,255,0.25),0_0_30px_rgba(255,255,255,0.15)]' : 'bg-white text-gray-900 border border-gray-300 shadow-[0_0_10px_rgba(0,0,0,0.15),0_0_25px_rgba(0,0,0,0.1)]'}`}>
              Coming Soon
            </span>
            <h2 className="text-3xl md:text-4xl font-poltawski font-bold mb-6 text-center">
              Over 2,000 vendors are already on the waitlist for the ScanFrameNG marketplace
            </h2>
            <p className={`text-sm mb-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              A fully integrated marketplace where vendors list their physical frames for quick sale and buyers discover and order directly. Get on the list before we launch.
            </p>
            <button
              onClick={() => setWaitlistOpen(true)}
              className="bg-primary text-secondary px-5 py-2 rounded-md font-bold hover:bg-opacity-80 transition"
            >
              Join the Waitlist
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="w-[250vw] md:w-full md:max-w-6xl md:mx-auto px-4 md:px-0 pb-4 md:pb-16">
            <img src={marketPlace} alt="ScanFrameNG Marketplace" className="w-full rounded-lg shadow-lg" />
          </div>
        </div>
      </section>

      {/* ── 9. PRICING ───────────────────────────────────────────────────── */}
      <section id="pricing" className={`${isDark ? 'bg-black' : 'bg-gray-50'} py-12 md:py-20 px-4 transition-colors duration-200 overflow-hidden`}>
        <div className="min-w-[300px] max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-poltawski font-bold mb-4 ${isDark ? 'text-secondary' : 'text-gray-900'}`}>
              Start free. Upgrade when you grow.
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No contracts, no lock-in. Cancel or change your plan at any time.
            </p>
          </div>
          <Price />
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/signin')}
              className="bg-primary text-secondary font-bold px-8 py-3 rounded-full hover:bg-opacity-80 transition text-sm"
            >
              Get started free, no credit card required
            </button>
          </div>
        </div>
      </section>

      {/* ── 10. FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq">
        <div className="flex flex-col md:py-24 py-12 px-[30px] lg:px-[250px] md:px-[120px] mx-auto items-center">
          <p className={`text-center mb-6 uppercase tracking-[0.6rem] text-[14px] ${isDark ? 'text-secondary' : 'text-gray-600'}`}>FAQ</p>
          <h2 className="md:text-4xl text-2xl mb-10 text-center">Frequently Asked Questions</h2>
          <div className="w-full max-w-[650px] flex flex-col gap-4 justify-center">
            {faq.map((item, i) => (
              <div
                key={i}
                className={`flex flex-col gap-4 rounded-xl p-4 w-full border ${isDark ? activeIndex === i ? "bg-[#102004]" : "bg-[#343831]" : activeIndex === i ? "bg-white" : "bg-stone-100"}`}
              >
                <div onClick={() => handleToggle(i)} className="flex justify-between items-center cursor-pointer">
                  <h3 className={`font-heading text-lg ${isDark ? 'text-white' : 'text-black'}`}>{item.question}</h3>
                  <Icon
                    className={`w-8 h-8 transition-transform duration-300 ${isDark ? 'text-white' : 'text-black'}`}
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

      {/* ── 11. FINAL CTA BLOCK ──────────────────────────────────────────── */}
      <section className="py-12 md:py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-primary rounded-3xl px-8 py-16 md:py-20"
        >
          <h2 className="text-3xl md:text-5xl font-poltawski font-bold text-secondary mb-5 leading-tight">
            Your frames deserve more than a wall.
          </h2>
          <p className="text-secondary/70 text-base mb-10 max-w-xl mx-auto leading-relaxed">
            Join vendors across Nigeria using ScanFrameNG to turn every frame they sell into a digital experience their customers never forget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signin')}
              className="bg-gold text-primary font-bold px-8 py-3.5 rounded-full hover:bg-opacity-90 transition text-sm"
            >
              Get Started Free
            </button>
            <button
              onClick={() => navigate('/pricing')}
              className="border border-secondary/30 text-secondary font-bold px-8 py-3.5 rounded-full hover:bg-secondary/10 transition text-sm"
            >
              View Pricing
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── 12. BLOG PREVIEW ─────────────────────────────────────────────── */}
      <BlogPreview />

      <Footer />

      <WaitlistModal
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        userEmail={user?.email ?? ''}
      />
    </main>
  );
}
