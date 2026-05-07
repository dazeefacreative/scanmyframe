import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: 'easeOut', delay },
  viewport: { once: true, amount: 0.15 },
});

const CHANNELS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    label: 'General Enquiries',
    email: 'hello@scanmyframe.com',
    desc: 'Questions about the platform, partnerships, or anything else.',
    response: 'Usually within 24 hours',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    label: 'Technical Support',
    email: 'support@scanmyframe.com',
    desc: 'Problems with QR codes, frames, uploads, dashboard features, or your account.',
    response: 'Usually within 12 hours',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    label: 'Billing & Payments',
    email: 'billing@scanmyframe.com',
    desc: 'Subscription charges, plan upgrades, payment failures, or refund requests.',
    response: 'Usually within 24 hours',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    label: 'Legal & Privacy',
    email: 'legal@scanmyframe.com',
    desc: 'Data access requests, takedown notices, NDPR/GDPR queries, or compliance matters.',
    response: 'Usually within 2 business days',
  },
];

const FAQS = [
  {
    q: 'How do I generate a QR code for my frame?',
    a: 'Go to your dashboard, click "New Frame", fill in the frame details and upload your artwork. Once saved, the QR code is generated automatically. You can download it as a PNG, SVG, or print-ready PDF depending on your plan.',
  },
  {
    q: 'Can I change what the QR code links to after printing it?',
    a: 'Yes. The QR code always points to the same permanent URL - but you can update the content on that page (artwork story, images, video, description) at any time from your dashboard without reprinting the code.',
  },
  {
    q: 'My QR code is not scanning. What should I do?',
    a: 'First, check that your frame page is published (not in draft). Make sure the QR code is printed at a minimum of 2cm × 2cm and is not distorted. Try scanning with a different phone or app. If the issue persists, contact support@scanmyframe.com.',
  },
  {
    q: 'What happens to my frames if I cancel my subscription?',
    a: 'You retain access until the end of your current billing period. After that, your subscription is cancelled and unused QR credits are cleared. Your frame pages may become inaccessible - we recommend downloading all QR codes before cancelling.',
  },
  {
    q: 'How do I upgrade or change my plan?',
    a: 'Go to Dashboard → Billing. Choose the plan you want and complete the payment. Your new plan activates immediately and your QR credit balance is updated.',
  },
  {
    q: 'Can I password-protect a frame?',
    a: 'Yes - password protection is available on Pro and Business plans. When creating or editing a frame, enable the password option and set a password. Clients will need to enter it before viewing the frame page.',
  },
  {
    q: 'How does the vendor contact card work?',
    a: 'On Pro and Business plans, your business name, logo, email, and phone appear on every public frame page so buyers can contact you directly. Update your details in Dashboard → Settings.',
  },
  {
    q: 'Is my data safe on ScanMyFrame?',
    a: 'Yes. All data is encrypted in transit (TLS) and at rest. We use Supabase with EU-based servers, role-based access controls, and automatic login alerts. Read our Privacy Policy for full details.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'We do not offer refunds for partial billing periods. If you believe a charge was made in error, contact billing@scanmyframe.com within 14 days of the charge and we will investigate.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Dashboard → Settings → scroll to the bottom → Delete Account. This permanently removes your account and all associated data within 30 days. This action cannot be undone.',
  },
];

function FAQItem({ item, isDark }) {
  const [open, setOpen] = useState(false);
  const border  = isDark ? 'border-white/8'   : 'border-[#0F4C3A]/10';
  const cardBg  = isDark ? 'bg-[#111]'        : 'bg-white';
  const textH   = isDark ? 'text-white'       : 'text-[#0F4C3A]';
  const textS   = isDark ? 'text-[#aaa]'      : 'text-[#4a7c6f]';

  return (
    <div className={`border rounded-2xl overflow-hidden ${border} ${cardBg}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
      >
        <span className={`text-sm font-semibold ${textH}`}>{item.q}</span>
        <span className="text-[#D4AF37] text-xl leading-none flex-shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className={`px-6 pb-5 border-t ${border}`}>
          <p className={`pt-4 text-sm leading-relaxed ${textS}`}>{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function Contact() {
  const { isDark } = useTheme();

  const bg     = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
  const textH  = isDark ? 'text-white'   : 'text-[#0F4C3A]';
  const textS  = isDark ? 'text-[#aaa]'  : 'text-[#4a7c6f]';
  const border = isDark ? 'border-white/8' : 'border-[#0F4C3A]/10';
  const cardBg = isDark ? 'bg-[#111]'    : 'bg-white';
  const tag    = isDark ? 'bg-white/5 text-[#D4AF37] border border-white/10' : 'bg-[#0F4C3A]/5 text-[#0F4C3A] border border-[#0F4C3A]/20';

  return (
    <main className={`${bg} min-h-screen transition-colors duration-200`}>
      <SEO
        title="Support & Contact | ScanMyFrame"
        description="Get help with your ScanMyFrame account, QR codes, billing, and more. Our support team is based in Lagos, Nigeria."
        url="/contact"
      />
      <Header />

      {/* Hero */}
      <section className={`pt-28 pb-14 px-4 ${isDark ? 'bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.span {...fadeUp(0)} className={`inline-block text-xs font-semibold tracking-widest uppercase px-5 py-2 rounded-full mb-6 ${tag}`}>
            Support
          </motion.span>
          <motion.h1 {...fadeUp(0.1)} className={`text-4xl md:text-5xl font-poltawski font-bold mb-4 ${textH}`}>
            How can we help?
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className={`text-base max-w-xl mx-auto ${textS}`}>
            We're a small team based in Lagos, Nigeria. Reach the right person directly - no ticket system, no bots.
          </motion.p>
        </div>
      </section>

      {/* Contact channels */}
      <section className={`py-14 px-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#f5f5f0]'}`}>
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...fadeUp(0)} className={`text-xl font-bold font-poltawski mb-8 text-center ${textH}`}>
            Contact the right team
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CHANNELS.map((c, i) => (
              <motion.a
                key={c.email}
                {...fadeUp(i * 0.07)}
                href={`mailto:${c.email}`}
                className={`group flex flex-col gap-3 rounded-2xl border p-6 transition-all duration-200 hover:border-[#D4AF37]/50 hover:shadow-lg ${cardBg} ${border}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0F4C3A]/10 flex items-center justify-center text-[#0F4C3A] flex-shrink-0 group-hover:bg-[#0F4C3A] group-hover:text-[#FAF5DD] transition-colors">
                    {c.icon}
                  </div>
                  <svg width="14" height="14" className={`mt-1 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity ${textH}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
                <div>
                  <p className={`text-sm font-bold mb-0.5 ${textH}`}>{c.label}</p>
                  <p className={`text-xs font-medium text-[#D4AF37] mb-2`}>{c.email}</p>
                  <p className={`text-xs leading-relaxed ${textS}`}>{c.desc}</p>
                </div>
                <p className={`text-[11px] font-medium mt-auto pt-2 border-t ${border} ${textS}`}>
                  ⏱ {c.response}
                </p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={`py-14 px-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp(0)} className="text-center mb-10">
            <h2 className={`text-2xl font-bold font-poltawski mb-3 ${textH}`}>Frequently asked questions</h2>
            <p className={`text-sm ${textS}`}>Can't find what you need? Email <a href="mailto:support@scanmyframe.com" className="text-[#D4AF37] hover:underline">support@scanmyframe.com</a></p>
          </motion.div>
          <div className="flex flex-col gap-3">
            {FAQS.map((item, i) => (
              <motion.div key={i} {...fadeUp(i * 0.04)}>
                <FAQItem item={item} isDark={isDark} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={`py-14 px-4 border-t ${border}`}>
        <div className="max-w-xl mx-auto text-center">
          <motion.div {...fadeUp(0)}>
            <p className={`text-lg font-bold font-poltawski mb-2 ${textH}`}>Still need help?</p>
            <p className={`text-sm mb-6 ${textS}`}>
              Our support team responds to every message personally. No automated replies.
            </p>
            <a href="mailto:support@scanmyframe.com"
              className="inline-flex items-center gap-2 bg-[#0F4C3A] text-[#FAF5DD] px-7 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Email support
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
