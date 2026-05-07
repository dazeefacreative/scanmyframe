import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const LAST_UPDATED = 'April 25, 2026';
const CONTACT_EMAIL = 'legal@scanmyframe.com';
const SITE = 'https://scanmyframe.com';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut', delay },
  viewport: { once: true, amount: 0.15 },
});

const SECTIONS = [
  {
    id: 'who-we-are',
    title: '1. Who We Are',
    content: [
      `ScanMyFrame ("ScanMyFrame", "we", "us", or "our") is a platform that connects frame vendors with buyers by linking physical artwork frames to digital content through unique QR codes. We are registered in Nigeria and operate the website at ${SITE}.`,
      'This Privacy Policy describes how we collect, use, store, and share your personal data when you use our website, dashboard, or any related services (collectively, the "Service"). It is written in compliance with the Nigeria Data Protection Regulation (NDPR) 2019 and, where applicable, the EU General Data Protection Regulation (GDPR).',
    ],
  },
  {
    id: 'data-we-collect',
    title: '2. Data We Collect',
    subsections: [
      {
        label: 'Account & Profile Data',
        items: [
          'Full name, business name, email address, and phone number.',
          'Profile photo or business logo (if uploaded).',
          'Country and business type (e.g., photographer, gallery, artist).',
          'Account credentials (password stored as a secure hash - we never see it).',
        ],
      },
      {
        label: 'Frame & QR Data',
        items: [
          'Frame titles, descriptions, artwork stories, and attached media.',
          'QR code generation and usage records.',
          'Public frame page views and scan events (anonymised by default).',
        ],
      },
      {
        label: 'Payment Data',
        items: [
          'Subscription plan, billing cycle, and payment status.',
          'We do not store card numbers or bank details - payments are processed by our third-party payment provider. We only store a transaction reference and the outcome.',
        ],
      },
      {
        label: 'Technical & Usage Data',
        items: [
          'IP address, browser type, device type, and operating system.',
          'Pages visited, session duration, and referral source (analytics cookies, with your consent).',
          'Login timestamps and originating IP addresses (for security alerts).',
        ],
      },
      {
        label: 'Communications',
        items: [
          'Emails you send to us (support, feedback).',
          'Newsletter subscription if you opted in explicitly - we will never add you without consent.',
        ],
      },
    ],
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Data',
    rows: [
      { purpose: 'Provide the Service', basis: 'Contract', detail: 'Creating your account, managing frames, generating QR codes.' },
      { purpose: 'Process payments', basis: 'Contract', detail: 'Charging subscription fees and issuing receipts.' },
      { purpose: 'Send transactional emails', basis: 'Contract / Legitimate interest', detail: 'Welcome email, password resets, login alerts.' },
      { purpose: 'Security monitoring', basis: 'Legitimate interest', detail: 'Detecting unusual login activity and preventing fraud.' },
      { purpose: 'Platform analytics', basis: 'Consent', detail: 'Understanding how features are used to improve the product.' },
      { purpose: 'Marketing communications', basis: 'Consent', detail: 'Newsletters and promotional emails (only if opted in).' },
      { purpose: 'Legal compliance', basis: 'Legal obligation', detail: 'Responding to lawful requests from regulators or courts.' },
    ],
  },
  {
    id: 'cookies',
    title: '4. Cookies & Tracking',
    content: [
      'We use cookies and similar technologies to keep you logged in, remember your preferences, and (with your consent) understand how you use the platform.',
      'Essential cookies: Required for the Service to function. You cannot opt out of these.',
      'Analytics cookies: Help us count visits and understand traffic patterns. Only activated with your consent.',
      'Marketing cookies: Used to serve relevant advertisements. Only activated with your consent.',
      'You can change your cookie preferences at any time by clicking "Cookie Preferences" in the footer. Your current choices are stored in your browser and respected on every visit.',
    ],
  },
  {
    id: 'third-parties',
    title: '5. Third-Party Services',
    content: [
      'We share your data with trusted third parties only to the extent necessary to operate the Service:',
    ],
    bullets: [
      'Supabase (Ireland / EU) - Database, authentication, and file storage. Supabase is GDPR-compliant.',
      'Resend - Transactional email delivery (welcome emails, alerts). We share your email address and name only.',
      'Paystack - For subscription billing. We share only what is required to complete a transaction.',
      'Groq (AI provider) - Powers our in-app AI Guide. Messages you send to the AI are processed by Groq. Do not share sensitive personal information in chat.',
    ],
    content2: [
      'We do not sell, rent, or trade your personal data to any third party for their own marketing purposes.',
    ],
  },
  {
    id: 'retention',
    title: '6. Data Retention',
    content: [
      'We keep your personal data for as long as your account is active or as needed to provide the Service.',
      'If you delete your account, we will delete or anonymise your personal data within 30 days, except where we are required by law to retain it longer (e.g., financial records for tax purposes - typically 6 years).',
      'QR scan logs associated with your frames are anonymised after 90 days.',
    ],
  },
  {
    id: 'your-rights',
    title: '7. Your Rights',
    content: [
      'Under the NDPR (and GDPR for EU residents), you have the following rights regarding your personal data:',
    ],
    rights: [
      { right: 'Access', desc: 'Request a copy of all personal data we hold about you.' },
      { right: 'Rectification', desc: 'Ask us to correct inaccurate or incomplete data.' },
      { right: 'Erasure', desc: 'Request deletion of your data ("right to be forgotten"), subject to legal retention requirements.' },
      { right: 'Restriction', desc: 'Ask us to limit processing of your data while a dispute is resolved.' },
      { right: 'Portability', desc: 'Receive your data in a structured, machine-readable format.' },
      { right: 'Objection', desc: 'Object to processing based on legitimate interest, including direct marketing.' },
      { right: 'Withdraw consent', desc: 'Withdraw consent for analytics or marketing at any time without affecting prior processing.' },
    ],
    content2: [
      `To exercise any of these rights, email us at ${CONTACT_EMAIL}. We will respond within 30 days. If you believe we have mishandled your data, you may also file a complaint with the Nigeria Data Protection Commission (NDPC).`,
    ],
  },
  {
    id: 'security',
    title: '8. Data Security',
    content: [
      'We implement industry-standard safeguards including TLS encryption in transit, encrypted storage at rest, role-based access controls, and regular security reviews.',
      'We send security alerts to your registered email address when a login is detected from a new IP address, so you can take immediate action if it was not you.',
      'No system is 100% secure. If you suspect unauthorised access to your account, contact us immediately at ' + CONTACT_EMAIL + '.',
    ],
  },
  {
    id: 'children',
    title: "9. Children's Privacy",
    content: [
      'ScanMyFrame is not directed at children under the age of 13. We do not knowingly collect personal data from children. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.',
    ],
  },
  {
    id: 'changes',
    title: '10. Changes to This Policy',
    content: [
      'We may update this Privacy Policy from time to time. When we make material changes, we will notify you via email or a prominent notice on the dashboard at least 14 days before the changes take effect.',
      'The "Last updated" date at the top of this page always reflects the most recent revision. Continued use of the Service after the effective date constitutes acceptance of the updated policy.',
    ],
  },
  {
    id: 'contact',
    title: '11. Contact Us',
    content: [
      `If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact our Data Protection Officer at: ${CONTACT_EMAIL}`,
      `Or write to: ScanMyFrame, Lagos, Nigeria.`,
    ],
  },
];

export default function PrivacyPolicy() {
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState(null);

  const bg      = isDark ? 'bg-[#0a0a0a]'   : 'bg-white';
  const heading = isDark ? 'text-white'     : 'text-[#0F4C3A]';
  const text    = isDark ? 'text-[#aaa]'    : 'text-[#4a7c6f]';
  const card    = isDark ? 'bg-[#111] border-white/8' : 'bg-white border-[#0F4C3A]/10';
  const divider = isDark ? 'border-white/8' : 'border-[#0F4C3A]/10';
  const tag     = isDark ? 'bg-white/5 text-[#D4AF37] border border-white/10' : 'bg-[#0F4C3A]/5 text-[#0F4C3A] border border-[#0F4C3A]/20';

  function renderSection(sec) {
    return (
      <motion.div key={sec.id} {...fadeUp(0.05)}
        id={sec.id}
        className={`border rounded-2xl overflow-hidden ${card}`}
      >
        <button
          onClick={() => setActiveSection(activeSection === sec.id ? null : sec.id)}
          className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
        >
          <span className={`text-base font-bold ${heading}`}>{sec.title}</span>
          <span className="text-[#D4AF37] text-xl leading-none flex-shrink-0">
            {activeSection === sec.id ? '−' : '+'}
          </span>
        </button>

        {activeSection === sec.id && (
          <div className={`px-6 pb-6 border-t ${divider}`}>
            <div className="pt-5 space-y-4">

              {sec.content?.map((p, i) => (
                <p key={i} className={`text-sm leading-relaxed ${text}`}>{p}</p>
              ))}

              {sec.subsections?.map((sub, i) => (
                <div key={i}>
                  <p className={`text-sm font-semibold mb-2 ${heading}`}>{sub.label}</p>
                  <ul className="space-y-1">
                    {sub.items.map((item, j) => (
                      <li key={j} className={`text-sm leading-relaxed ${text} flex gap-2`}>
                        <span className="text-[#D4AF37] mt-1 flex-shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {sec.rows && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className={`border-b ${divider}`}>
                        <th className={`text-left py-2 pr-4 font-semibold ${heading}`}>Purpose</th>
                        <th className={`text-left py-2 pr-4 font-semibold ${heading}`}>Legal basis</th>
                        <th className={`text-left py-2 font-semibold ${heading}`}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sec.rows.map((row, i) => (
                        <tr key={i} className={`border-b ${divider}`}>
                          <td className={`py-2 pr-4 align-top font-medium ${heading}`}>{row.purpose}</td>
                          <td className={`py-2 pr-4 align-top ${text}`}>{row.basis}</td>
                          <td className={`py-2 align-top ${text}`}>{row.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sec.bullets?.map((b, i) => (
                <div key={i} className={`text-sm leading-relaxed ${text} flex gap-2`}>
                  <span className="text-[#D4AF37] mt-1 flex-shrink-0">•</span>
                  <span>{b}</span>
                </div>
              ))}

              {sec.content2?.map((p, i) => (
                <p key={i} className={`text-sm leading-relaxed ${text}`}>{p}</p>
              ))}

              {sec.rights && (
                <div className="space-y-3">
                  {sec.rights.map((r, i) => (
                    <div key={i} className={`rounded-xl p-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-bold mb-1 ${heading}`}>{r.right}</p>
                      <p className={`text-sm ${text}`}>{r.desc}</p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <main className={`${bg} min-h-screen transition-colors duration-200`}>
      <SEO
        title="Privacy Policy | ScanMyFrame"
        description="Learn how ScanMyFrame collects, uses, and protects your personal data in compliance with the Nigeria Data Protection Regulation (NDPR)."
        url="/privacy"
      />
      <Header />

      {/* Hero */}
      <section className={`pt-28 pb-14 px-4 ${isDark ? 'bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.span {...fadeUp(0)} className={`inline-block text-xs font-semibold tracking-widest uppercase px-5 py-2 rounded-full mb-6 ${tag}`}>
            Legal
          </motion.span>
          <motion.h1 {...fadeUp(0.1)} className={`text-4xl md:text-5xl font-poltawski font-bold mb-4 ${heading}`}>
            Privacy Policy
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className={`text-base ${text}`}>
            Last updated: {LAST_UPDATED}
          </motion.p>
          <motion.p {...fadeUp(0.25)} className={`mt-4 text-sm leading-relaxed max-w-xl mx-auto ${text}`}>
            We take your privacy seriously. This policy explains exactly what data we collect,
            why we collect it, and how you can control it.
          </motion.p>
        </div>
      </section>

      {/* Quick-expand tip */}
      <section className={`py-10 px-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#f5f5f0]'}`}>
        <div className="max-w-3xl mx-auto">
          <p className={`text-xs mb-6 ${text}`}>Click any section to expand it.</p>
          <div className="space-y-3">
            {SECTIONS.map(renderSection)}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
