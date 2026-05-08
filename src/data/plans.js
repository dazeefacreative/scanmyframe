/**
 * Single source of truth for plan display data.
 * Edit here and it updates Price.jsx, /pricing, BillingTab, and OnboardingFlow.
 *
 * Payment amounts in kobo live in paystackService.js (PLAN_CONFIG).
 * qr_allocation here must stay in sync with PLAN_CONFIG.qr_allocation.
 */

export const PLANS = [
  {
    id:            'basic',
    name:          'Basic',
    qr_allocation: 10,
    price:         { monthly: '₦3,000', yearly: '₦2,700' },
    discount:      'Save 10%',
    description:   'Perfect for getting started',
    cta:           'Get Started',
    highlighted:   false,
    features: [
      '2MB max image upload',
      '1 extra image per frame',
      '20MB max video upload',
      'PNG QR code download',
      'Basic analytics data',
    ],
    notes: ['Good for starter', 'Upgrade anytime to unlock more'],
    motion: {
      initial:     { opacity: 0, y: 30 },
      whileInView: { opacity: 1, y: 0 },
      transition:  { delay: 0.1, type: 'spring', stiffness: 100, damping: 14 },
    },
  },
  {
    id:            'pro',
    name:          'Pro',
    qr_allocation: 30,
    price:         { monthly: '₦15,000', yearly: '₦12,750' },
    discount:      'Save 15%',
    description:   'Best for growing vendors',
    cta:           'Subscribe Now',
    highlighted:   true,
    features: [
      '5MB max image upload',
      '4 extra images per frame',
      '30MB max video upload',
      'PNG, SVG & print-ready PDF export',
      'Your card on public frame page',
      'Brand logo on public frame page',
      'Password-protect frames',
      'AI Story Assistant',
      'Real-time analytics data',
    ],
    notes: ['Everything in Basic', 'Unlock branding & advanced exports'],
    motion: {
      initial:     { opacity: 0, y: 30 },
      whileInView: { opacity: 1, y: 0 },
      transition:  { delay: 0.2, type: 'spring', stiffness: 100, damping: 14 },
    },
  },
  {
    id:            'business',
    name:          'Business',
    qr_allocation: -1,
    price:         { monthly: '₦30,000', yearly: '₦24,000' },
    discount:      'Save 20%',
    description:   'For large-scale operations',
    cta:           'Subscribe Now',
    highlighted:   false,
    boldFeatures: ['Everything in Pro +', 'Unlimited QR credits'],
    features: [
      'Everything in Pro +',
      'Unlimited QR credits',
      'Customize QR Code to your brand',
      'Full white label experience',
      '8 extra images per frame',
      '50MB max video upload',
      'Featured on homepage',
      '24/7 priority support',
    ],
    notes: ['Everything in Pro', 'Built for high-volume vendors'],
    motion: {
      initial:     { opacity: 0, y: 30 },
      whileInView: { opacity: 1, y: 0 },
      transition:  { delay: 0.3, type: 'spring', stiffness: 100, damping: 14 },
    },
  },
];

/**
 * Returns the dynamic QR credit label for a plan based on billing cycle.
 * Returns null for unlimited plans (Business already lists it in features).
 */
export function getQrLabel(plan, billingCycle) {
  if (plan.qr_allocation === -1) return null;
  return billingCycle === 'yearly'
    ? `${plan.qr_allocation * 12} QR credits upfront`
    : `${plan.qr_allocation} QR credits / month`;
}
