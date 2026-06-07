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
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: [
      `These Terms of Use ("Terms") are a legal agreement between you and ScanMyFrame ("ScanMyFrame", "we", "us") governing your access to and use of the website at ${SITE}, the ScanMyFrame dashboard, QR frame management tools, and all related services (collectively, the "Service").`,
      'By creating an account or using the Service in any way, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, you must not use the Service.',
      'We may update these Terms from time to time. Continued use after the effective date of any changes constitutes acceptance of the revised Terms.',
    ],
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    content: [
      'You must be at least 18 years old to create an account and use the Service.',
      'If you are registering on behalf of a business, you represent that you have the authority to bind that business to these Terms.',
      'By using the Service, you represent that you are not located in a country subject to sanctions under Nigerian or international law, and that you are not listed on any prohibited-persons list.',
    ],
  },
  {
    id: 'account',
    title: '3. Your Account',
    content: [
      'You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.',
      'You agree to provide accurate, current, and complete information when registering and to keep your profile up to date.',
      'You must notify us immediately at ' + CONTACT_EMAIL + ' if you suspect unauthorised access to your account.',
      'We reserve the right to suspend or terminate accounts that contain false information, are used abusively, or violate these Terms.',
      'One person may not maintain more than one free account. Duplicate accounts may be removed without notice.',
    ],
  },
  {
    id: 'acceptable-use',
    title: '4. Acceptable Use',
    bullets: [
      'Use the Service for lawful purposes only.',
      'Not upload, post, or share content that is defamatory, obscene, fraudulent, infringing, or otherwise unlawful.',
      'Not attempt to reverse-engineer, scrape, copy, or reproduce any part of the Service without express written permission.',
      'Not use the Service to distribute spam, malware, or unsolicited communications.',
      'Not impersonate another person, business, or entity.',
      'Not attempt to gain unauthorised access to any part of the Service or its infrastructure.',
      'Not use automated tools (bots, scrapers) to access or interact with the Service beyond normal usage patterns.',
    ],
    content: [
      'Violation of any of these rules may result in immediate account suspension or termination, at our sole discretion, without prior notice or refund.',
    ],
  },
  {
    id: 'qr-frames',
    title: '5. QR Codes and Frames',
    content: [
      'ScanMyFrame generates unique QR codes that link to digital content pages ("frame pages") you create on the platform.',
      'You are solely responsible for the accuracy, legality, and appropriateness of any content you attach to a frame, including artwork stories, descriptions, images, and videos.',
      'Your frame pages and QR codes remain accessible even if your subscription lapses, your account is terminated, or you close your account. We do not automatically deactivate them. See below for how to request a takedown.',
      'We reserve the right to remove any frame page that violates these Terms or is reported as infringing.',
      'If you wish to take down all frame pages and QR codes associated with your account, please contact us at ' + CONTACT_EMAIL + ' with your account details and request. We will process takedown requests within a reasonable timeframe.',
    ],
  },
  {
    id: 'ip',
    title: '6. Intellectual Property',
    content: [
      'Your content remains yours. By uploading content to ScanMyFrame, you grant us a non-exclusive, royalty-free, worldwide licence to host, display, and deliver that content solely for the purpose of operating the Service.',
      'ScanMyFrame and its logo, design, code, and branding are the intellectual property of ScanMyFrame. You may not use them without our prior written consent.',
      'If you believe any content on the platform infringes your copyright, please send a takedown notice to ' + CONTACT_EMAIL + ' with full details of the infringement.',
    ],
  },
  {
    id: 'payments',
    title: '7. Payments & Subscriptions',
    content: [
      'Certain features of the Service require a paid subscription. All prices are displayed in Nigerian Naira (NGN) unless otherwise stated, and are inclusive of applicable taxes.',
      'Subscriptions renew automatically at the end of each billing period (monthly or annually) unless you cancel before the renewal date.',
      'You may cancel your subscription at any time from your dashboard. Cancellation takes effect at the end of the current billing period - you retain access until then.',
      'We do not offer refunds for partial billing periods. If you believe a charge was made in error, contact us within 14 days at ' + CONTACT_EMAIL + '.',
      'We reserve the right to change our pricing at any time. We will give you at least 30 days notice before any price increase takes effect on your account.',
      'Free-plan allocations (e.g., free QR codes) are provided at our discretion and may be modified or discontinued with reasonable notice.',
    ],
  },
  {
    id: 'disclaimer',
    title: '8. Disclaimer of Warranties',
    content: [
      'The Service is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement.',
      'We do not guarantee that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.',
      'We do not warrant the accuracy, completeness, or suitability of any content generated or displayed through the Service, including AI-generated content from our AI Guide feature.',
    ],
  },
  {
    id: 'liability',
    title: '9. Limitation of Liability',
    content: [
      'To the fullest extent permitted by applicable law, ScanMyFrame and its directors, employees, and partners shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of or inability to use the Service.',
      'Our total aggregate liability to you for any claims arising from these Terms or the Service shall not exceed the amount you paid to us in the 3 months preceding the claim.',
      'Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so the above limitations may not apply to you.',
    ],
  },
  {
    id: 'termination',
    title: '10. Termination',
    content: [
      'You may close your account at any time from your dashboard settings.',
      'We may suspend or terminate your account and access to the Service at any time, with or without cause, and with or without notice, if we believe you have violated these Terms or applicable law.',
      'Upon termination, your right to use the Service ceases immediately. Provisions of these Terms that by their nature should survive termination will continue in effect, including ownership, warranty disclaimers, and limitations of liability.',
    ],
  },
  {
    id: 'governing-law',
    title: '11. Governing Law & Disputes',
    content: [
      'These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.',
      'Any dispute arising out of or in connection with these Terms or the Service shall first be referred to mediation. If mediation fails within 30 days, disputes shall be resolved by binding arbitration in Lagos, Nigeria, under the rules of the Lagos Court of Arbitration.',
      'Nothing in this clause prevents either party from seeking urgent injunctive or other interim relief from a court of competent jurisdiction.',
    ],
  },
  {
    id: 'general',
    title: '12. General',
    content: [
      'If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect.',
      'Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.',
      'These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and ScanMyFrame regarding the Service.',
    ],
  },
  {
    id: 'contact-legal',
    title: '13. Contact',
    content: [
      `For questions about these Terms, please email us at: ${CONTACT_EMAIL}`,
      'ScanMyFrame, Lagos, Nigeria.',
    ],
  },
];

export default function TermsOfUse() {
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

              {sec.bullets && (
                <ul className="space-y-2">
                  {sec.bullets.map((b, i) => (
                    <li key={i} className={`text-sm leading-relaxed ${text} flex gap-2`}>
                      <span className="text-[#D4AF37] mt-1 flex-shrink-0">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
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
        title="Terms of Use | ScanMyFrame"
        description="Read ScanMyFrame's Terms of Use - the rules and guidelines governing your use of the platform, QR frame tools, and subscription services."
        url="/terms"
      />
      <Header />

      {/* Hero */}
      <section className={`pt-28 pb-14 px-4 ${isDark ? 'bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.span {...fadeUp(0)} className={`inline-block text-xs font-semibold tracking-widest uppercase px-5 py-2 rounded-full mb-6 ${tag}`}>
            Legal
          </motion.span>
          <motion.h1 {...fadeUp(0.1)} className={`text-4xl md:text-5xl font-poltawski font-bold mb-4 ${heading}`}>
            Terms of Use
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className={`text-base ${text}`}>
            Last updated: {LAST_UPDATED}
          </motion.p>
          <motion.p {...fadeUp(0.25)} className={`mt-4 text-sm leading-relaxed max-w-xl mx-auto ${text}`}>
            Please read these terms carefully before using ScanMyFrame. They explain your rights,
            your responsibilities, and how we work together.
          </motion.p>
        </div>
      </section>

      {/* Sections */}
      <section className={`py-10 px-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#f5f5f0]'}`}>
        <div className="max-w-3xl mx-auto">
          <p className={`text-xs mb-6 ${text}`}>Click any section to expand it.</p>
          <div className="space-y-3">
            {SECTIONS.map(renderSection)}
          </div>

          {/* Bottom notice */}
          <motion.div
            {...fadeUp(0.1)}
            className={`mt-8 rounded-2xl p-6 border ${isDark ? 'bg-[#111] border-white/10' : 'bg-[#0F4C3A]/5 border-[#0F4C3A]/20'}`}
          >
            <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-[#D4AF37]' : 'text-[#0F4C3A]'}`}>
              Have questions about these Terms?
            </p>
            <p className={`text-sm ${text}`}>
              We are happy to clarify anything. Reach us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#D4AF37] underline">{CONTACT_EMAIL}</a>.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
