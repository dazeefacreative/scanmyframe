"""One-off script: render Terms of Use & Privacy Policy content to PDF for record-keeping."""
from fpdf import FPDF

CONTACT_EMAIL = 'legal@scanmyframe.com'
SITE = 'https://scanmyframe.com'
LAST_UPDATED = 'April 25, 2026'

GREEN = (15, 76, 58)
GRAY = (74, 124, 111)
GOLD = (212, 175, 55)


class LegalPDF(FPDF):
    def header(self):
        pass

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', '', 8)
        self.set_text_color(*GRAY)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')

    def title_block(self, title):
        self.add_page()
        self.set_font('Helvetica', 'B', 22)
        self.set_text_color(*GREEN)
        self.cell(0, 12, title, new_x='LMARGIN', new_y='NEXT')
        self.set_font('Helvetica', '', 10)
        self.set_text_color(*GRAY)
        self.cell(0, 8, f'Last updated: {LAST_UPDATED}', new_x='LMARGIN', new_y='NEXT')
        self.cell(0, 8, f'ScanMyFrame  -  {SITE}', new_x='LMARGIN', new_y='NEXT')
        self.ln(6)

    def section_title(self, text):
        self.ln(3)
        self.set_font('Helvetica', 'B', 13)
        self.set_text_color(*GREEN)
        self.multi_cell(0, 7, text)
        self.ln(1)

    def sub_title(self, text):
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(*GREEN)
        self.multi_cell(0, 6, text)

    def paragraph(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 5.6, text)
        self.ln(1.5)

    def bullet(self, text, indent=6):
        self.set_font('Helvetica', '', 10)
        start_x = self.l_margin + indent
        text_x = start_x + 4
        self.set_xy(start_x, self.get_y())
        self.set_text_color(*GOLD)
        self.cell(4, 5.6, '-', new_x='RIGHT', new_y='TOP')
        self.set_text_color(50, 50, 50)
        self.set_xy(text_x, self.get_y())
        avail_w = self.w - self.r_margin - text_x
        self.multi_cell(avail_w, 5.6, text, new_x='LMARGIN', new_y='NEXT')

    def card(self, label, desc):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(*GREEN)
        self.set_x(self.l_margin)
        self.multi_cell(0, 5.6, label, new_x='LMARGIN', new_y='NEXT')
        self.set_font('Helvetica', '', 10)
        self.set_text_color(50, 50, 50)
        self.set_x(self.l_margin)
        self.multi_cell(0, 5.6, desc, new_x='LMARGIN', new_y='NEXT')
        self.ln(1.5)


def render_sections(pdf, sections):
    for sec in sections:
        pdf.section_title(sec['title'])

        for p in sec.get('content', []):
            pdf.paragraph(p)

        for sub in sec.get('subsections', []):
            pdf.sub_title(sub['label'])
            for item in sub['items']:
                pdf.bullet(item)
            pdf.ln(2)

        if 'rows' in sec:
            pdf.set_font('Helvetica', 'B', 9.5)
            pdf.set_text_color(*GREEN)
            col_w = [55, 50, 0]
            col_w[2] = pdf.w - pdf.l_margin - pdf.r_margin - col_w[0] - col_w[1]
            pdf.cell(col_w[0], 6, 'Purpose', border='B')
            pdf.cell(col_w[1], 6, 'Legal basis', border='B')
            pdf.cell(col_w[2], 6, 'Details', border='B', new_x='LMARGIN', new_y='NEXT')
            pdf.set_font('Helvetica', '', 9)
            pdf.set_text_color(50, 50, 50)
            for row in sec['rows']:
                start_y = pdf.get_y()
                x0 = pdf.get_x()
                pdf.multi_cell(col_w[0], 5, row['purpose'])
                y1 = pdf.get_y()
                pdf.set_xy(x0 + col_w[0], start_y)
                pdf.multi_cell(col_w[1], 5, row['basis'])
                y2 = pdf.get_y()
                pdf.set_xy(x0 + col_w[0] + col_w[1], start_y)
                pdf.multi_cell(col_w[2], 5, row['detail'])
                y3 = pdf.get_y()
                pdf.set_y(max(y1, y2, y3))
            pdf.ln(2)

        for b in sec.get('bullets', []):
            pdf.bullet(b)
        if 'bullets' in sec:
            pdf.ln(1.5)

        for p in sec.get('content2', []):
            pdf.paragraph(p)

        if 'rights' in sec:
            for r in sec['rights']:
                pdf.card(r['right'], r['desc'])

        pdf.ln(3)


# ---------------------------------------------------------------------------
# Terms of Use
# ---------------------------------------------------------------------------
TERMS_SECTIONS = [
    {
        'title': '1. Acceptance of Terms',
        'content': [
            f'These Terms of Use ("Terms") are a legal agreement between you and ScanMyFrame ("ScanMyFrame", "we", "us") governing your access to and use of the website at {SITE}, the ScanMyFrame dashboard, QR frame management tools, and all related services (collectively, the "Service").',
            'By creating an account or using the Service in any way, you confirm that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, you must not use the Service.',
            'We may update these Terms from time to time. Continued use after the effective date of any changes constitutes acceptance of the revised Terms.',
        ],
    },
    {
        'title': '2. Eligibility',
        'content': [
            'You must be at least 18 years old to create an account and use the Service.',
            'If you are registering on behalf of a business, you represent that you have the authority to bind that business to these Terms.',
            'By using the Service, you represent that you are not located in a country subject to sanctions under Nigerian or international law, and that you are not listed on any prohibited-persons list.',
        ],
    },
    {
        'title': '3. Your Account',
        'content': [
            'You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.',
            'You agree to provide accurate, current, and complete information when registering and to keep your profile up to date.',
            f'You must notify us immediately at {CONTACT_EMAIL} if you suspect unauthorised access to your account.',
            'We reserve the right to suspend or terminate accounts that contain false information, are used abusively, or violate these Terms.',
            'One person may not maintain more than one free account. Duplicate accounts may be removed without notice.',
        ],
    },
    {
        'title': '4. Acceptable Use',
        'bullets': [
            'Use the Service for lawful purposes only.',
            'Not upload, post, or share content that is defamatory, obscene, fraudulent, infringing, or otherwise unlawful.',
            'Not attempt to reverse-engineer, scrape, copy, or reproduce any part of the Service without express written permission.',
            'Not use the Service to distribute spam, malware, or unsolicited communications.',
            'Not impersonate another person, business, or entity.',
            'Not attempt to gain unauthorised access to any part of the Service or its infrastructure.',
            'Not use automated tools (bots, scrapers) to access or interact with the Service beyond normal usage patterns.',
        ],
        'content2': [
            'Violation of any of these rules may result in immediate account suspension or termination, at our sole discretion, without prior notice or refund.',
        ],
    },
    {
        'title': '5. QR Codes and Frames',
        'content': [
            'ScanMyFrame generates unique QR codes that link to digital content pages ("frame pages") you create on the platform.',
            'You are solely responsible for the accuracy, legality, and appropriateness of any content you attach to a frame, including artwork stories, descriptions, images, and videos.',
            'Your frame pages and QR codes remain accessible even if your subscription lapses, your account is terminated, or you close your account. We do not automatically deactivate them. See below for how to request a takedown.',
            'We reserve the right to remove any frame page that violates these Terms or is reported as infringing.',
            f'If you wish to take down all frame pages and QR codes associated with your account, please contact us at {CONTACT_EMAIL} with your account details and request. We will process takedown requests within a reasonable timeframe.',
        ],
    },
    {
        'title': '6. Intellectual Property',
        'content': [
            'Your content remains yours. By uploading content to ScanMyFrame, you grant us a non-exclusive, royalty-free, worldwide licence to host, display, and deliver that content solely for the purpose of operating the Service.',
            'ScanMyFrame and its logo, design, code, and branding are the intellectual property of ScanMyFrame. You may not use them without our prior written consent.',
            f'If you believe any content on the platform infringes your copyright, please send a takedown notice to {CONTACT_EMAIL} with full details of the infringement.',
        ],
    },
    {
        'title': '7. Payments & Subscriptions',
        'content': [
            'Certain features of the Service require a paid subscription. All prices are displayed in Nigerian Naira (NGN) unless otherwise stated, and are inclusive of applicable taxes.',
            'Subscriptions renew automatically at the end of each billing period (monthly or annually) unless you cancel before the renewal date.',
            'You may cancel your subscription at any time from your dashboard. Cancellation takes effect at the end of the current billing period - you retain access until then.',
            f'We do not offer refunds for partial billing periods. If you believe a charge was made in error, contact us within 14 days at {CONTACT_EMAIL}.',
            'We reserve the right to change our pricing at any time. We will give you at least 30 days notice before any price increase takes effect on your account.',
            'Free-plan allocations (e.g., free QR codes) are provided at our discretion and may be modified or discontinued with reasonable notice.',
        ],
    },
    {
        'title': '8. Disclaimer of Warranties',
        'content': [
            'The Service is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement.',
            'We do not guarantee that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.',
            'We do not warrant the accuracy, completeness, or suitability of any content generated or displayed through the Service, including AI-generated content from our AI Guide feature.',
        ],
    },
    {
        'title': '9. Limitation of Liability',
        'content': [
            'To the fullest extent permitted by applicable law, ScanMyFrame and its directors, employees, and partners shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of or inability to use the Service.',
            'Our total aggregate liability to you for any claims arising from these Terms or the Service shall not exceed the amount you paid to us in the 3 months preceding the claim.',
            'Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so the above limitations may not apply to you.',
        ],
    },
    {
        'title': '10. Termination',
        'content': [
            'You may close your account at any time from your dashboard settings.',
            'We may suspend or terminate your account and access to the Service at any time, with or without cause, and with or without notice, if we believe you have violated these Terms or applicable law.',
            'Upon termination, your right to use the Service ceases immediately. Provisions of these Terms that by their nature should survive termination will continue in effect, including ownership, warranty disclaimers, and limitations of liability.',
        ],
    },
    {
        'title': '11. Governing Law & Disputes',
        'content': [
            'These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.',
            'Any dispute arising out of or in connection with these Terms or the Service shall first be referred to mediation. If mediation fails within 30 days, disputes shall be resolved by binding arbitration in Lagos, Nigeria, under the rules of the Lagos Court of Arbitration.',
            'Nothing in this clause prevents either party from seeking urgent injunctive or other interim relief from a court of competent jurisdiction.',
        ],
    },
    {
        'title': '12. General',
        'content': [
            'If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect.',
            'Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.',
            'These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and ScanMyFrame regarding the Service.',
        ],
    },
    {
        'title': '13. Contact',
        'content': [
            f'For questions about these Terms, please email us at: {CONTACT_EMAIL}',
            'ScanMyFrame, Lagos, Nigeria.',
        ],
    },
]

# ---------------------------------------------------------------------------
# Privacy Policy
# ---------------------------------------------------------------------------
PRIVACY_SECTIONS = [
    {
        'title': '1. Who We Are',
        'content': [
            f'ScanMyFrame ("ScanMyFrame", "we", "us", or "our") is a platform that connects frame vendors with buyers by linking physical artwork frames to digital content through unique QR codes. We are registered in Nigeria and operate the website at {SITE}.',
            'This Privacy Policy describes how we collect, use, store, and share your personal data when you use our website, dashboard, or any related services (collectively, the "Service"). It is written in compliance with the Nigeria Data Protection Regulation (NDPR) 2019 and, where applicable, the EU General Data Protection Regulation (GDPR).',
        ],
    },
    {
        'title': '2. Data We Collect',
        'subsections': [
            {
                'label': 'Account & Profile Data',
                'items': [
                    'Full name, business name, email address, and phone number.',
                    'Profile photo or business logo (if uploaded).',
                    'Country and business type (e.g., photographer, gallery, artist).',
                    'Account credentials (password stored as a secure hash - we never see it).',
                ],
            },
            {
                'label': 'Frame & QR Data',
                'items': [
                    'Frame titles, descriptions, artwork stories, and attached media.',
                    'QR code generation and usage records.',
                    'Public frame page views and scan events (anonymised by default).',
                ],
            },
            {
                'label': 'Payment Data',
                'items': [
                    'Subscription plan, billing cycle, and payment status.',
                    'We do not store card numbers or bank details - payments are processed by our third-party payment provider. We only store a transaction reference and the outcome.',
                ],
            },
            {
                'label': 'Technical & Usage Data',
                'items': [
                    'IP address, browser type, device type, and operating system.',
                    'Pages visited, session duration, and referral source (analytics cookies, with your consent).',
                    'Login timestamps and originating IP addresses (for security alerts).',
                ],
            },
            {
                'label': 'Communications',
                'items': [
                    'Emails you send to us (support, feedback).',
                    'Newsletter subscription if you opted in explicitly - we will never add you without consent.',
                ],
            },
        ],
    },
    {
        'title': '3. How We Use Your Data',
        'rows': [
            {'purpose': 'Provide the Service', 'basis': 'Contract', 'detail': 'Creating your account, managing frames, generating QR codes.'},
            {'purpose': 'Process payments', 'basis': 'Contract', 'detail': 'Charging subscription fees and issuing receipts.'},
            {'purpose': 'Send transactional emails', 'basis': 'Contract / Legitimate interest', 'detail': 'Welcome email, password resets, login alerts.'},
            {'purpose': 'Security monitoring', 'basis': 'Legitimate interest', 'detail': 'Detecting unusual login activity and preventing fraud.'},
            {'purpose': 'Platform analytics', 'basis': 'Consent', 'detail': 'Understanding how features are used to improve the product.'},
            {'purpose': 'Marketing communications', 'basis': 'Consent', 'detail': 'Newsletters and promotional emails (only if opted in).'},
            {'purpose': 'Legal compliance', 'basis': 'Legal obligation', 'detail': 'Responding to lawful requests from regulators or courts.'},
        ],
    },
    {
        'title': '4. Cookies & Tracking',
        'content': [
            'We use cookies and similar technologies to keep you logged in, remember your preferences, and (with your consent) understand how you use the platform.',
            'Essential cookies: Required for the Service to function. You cannot opt out of these.',
            'Analytics cookies: Help us count visits and understand traffic patterns. Only activated with your consent.',
            'Marketing cookies: Used to serve relevant advertisements. Only activated with your consent.',
            'You can change your cookie preferences at any time by clicking "Cookie Preferences" in the footer. Your current choices are stored in your browser and respected on every visit.',
        ],
    },
    {
        'title': '5. Third-Party Services',
        'content': [
            'We share your data with trusted third parties only to the extent necessary to operate the Service:',
        ],
        'bullets': [
            'Supabase (Ireland / EU) - Database, authentication, and file storage. Supabase is GDPR-compliant.',
            'Resend - Transactional email delivery (welcome emails, alerts). We share your email address and name only.',
            'Paystack - For subscription billing. We share only what is required to complete a transaction.',
            'Groq (AI provider) - Powers our in-app AI Guide. Messages you send to the AI are processed by Groq. Do not share sensitive personal information in chat.',
        ],
        'content2': [
            'We do not sell, rent, or trade your personal data to any third party for their own marketing purposes.',
        ],
    },
    {
        'title': '6. Data Retention',
        'content': [
            'We keep your personal data for as long as your account is active or as needed to provide the Service.',
            'If you delete your account, we will delete or anonymise your personal data within 30 days, except where we are required by law to retain it longer (e.g., financial records for tax purposes - typically 6 years).',
            'QR scan logs associated with your frames are anonymised after 90 days.',
        ],
    },
    {
        'title': '7. Your Rights',
        'content': [
            'Under the NDPR (and GDPR for EU residents), you have the following rights regarding your personal data:',
        ],
        'rights': [
            {'right': 'Access', 'desc': 'Request a copy of all personal data we hold about you.'},
            {'right': 'Rectification', 'desc': 'Ask us to correct inaccurate or incomplete data.'},
            {'right': 'Erasure', 'desc': 'Request deletion of your data ("right to be forgotten"), subject to legal retention requirements.'},
            {'right': 'Restriction', 'desc': 'Ask us to limit processing of your data while a dispute is resolved.'},
            {'right': 'Portability', 'desc': 'Receive your data in a structured, machine-readable format.'},
            {'right': 'Objection', 'desc': 'Object to processing based on legitimate interest, including direct marketing.'},
            {'right': 'Withdraw consent', 'desc': 'Withdraw consent for analytics or marketing at any time without affecting prior processing.'},
        ],
        'content2': [
            f'To exercise any of these rights, email us at {CONTACT_EMAIL}. We will respond within 30 days. If you believe we have mishandled your data, you may also file a complaint with the Nigeria Data Protection Commission (NDPC).',
        ],
    },
    {
        'title': '8. Data Security',
        'content': [
            'We implement industry-standard safeguards including TLS encryption in transit, encrypted storage at rest, role-based access controls, and regular security reviews.',
            'We send security alerts to your registered email address when a login is detected from a new IP address, so you can take immediate action if it was not you.',
            f'No system is 100% secure. If you suspect unauthorised access to your account, contact us immediately at {CONTACT_EMAIL}.',
        ],
    },
    {
        'title': "9. Children's Privacy",
        'content': [
            'ScanMyFrame is not directed at children under the age of 13. We do not knowingly collect personal data from children. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.',
        ],
    },
    {
        'title': '10. Changes to This Policy',
        'content': [
            'We may update this Privacy Policy from time to time. When we make material changes, we will notify you via email or a prominent notice on the dashboard at least 14 days before the changes take effect.',
            'The "Last updated" date at the top of this page always reflects the most recent revision. Continued use of the Service after the effective date constitutes acceptance of the updated policy.',
        ],
    },
    {
        'title': '11. Contact Us',
        'content': [
            f'If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact our Data Protection Officer at: {CONTACT_EMAIL}',
            'Or write to: ScanMyFrame, Lagos, Nigeria.',
        ],
    },
]


def build(title, sections, out_path):
    pdf = LegalPDF(format='A4')
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.title_block(title)
    render_sections(pdf, sections)
    pdf.output(out_path)
    print(f'Wrote {out_path}')


if __name__ == '__main__':
    import os
    out_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'Legal PDFs')
    out_dir = os.path.abspath(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    build('Terms of Use', TERMS_SECTIONS, os.path.join(out_dir, 'ScanMyFrame - Terms of Use.pdf'))
    build('Privacy Policy', PRIVACY_SECTIONS, os.path.join(out_dir, 'ScanMyFrame - Privacy Policy.pdf'))
