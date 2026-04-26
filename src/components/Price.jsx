import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializePayment } from '../services/paystackService';

export default function Price() {
  const { isDark }  = useTheme();
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [payLoading,   setPayLoading]   = useState('');
  const [payError,     setPayError]     = useState('');

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: { monthly: '₦3,000', yearly: '₦2,700' },
      discount: 'Save 10%',
      description: 'Perfect for getting started',
      features: [
        'Up to 10 QR credits',
        '2MB max image upload',
        '1 extra image per frame',
        '20MB max video upload',
        'PNG QR code download',
        'Last 30 days analytics data',
      ],
      notes: ['Good for starter', 'Upgrade anytime to unlock more'],
      cta: 'Get Started',
      highlighted: false,
      initial: { opacity: 0, x: 100, zIndex: 0 },
      whileInView: { opacity: 1, x: 0 },
      transition: { delay: 0.4, type: 'spring', stiffness: 100, damping: 10, duration: 0.3 },
    },
    {
      id: 'pro',
      name: 'Pro',
      price: { monthly: '₦15,000', yearly: '₦12,750' },
      discount: 'Save 15%',
      description: 'Best for growing vendors',
      features: [
        'Up to 30 QR credits',
        '5MB max image upload',
        '4 extra images per frame',
        '30MB max video upload',
        'PNG, SVG & print-ready PDF export',
        'Vendor card on public frame page',
        'Password-protect frames',
        'AI Story Assistant',
        'Analytics - last 6 months',
      ],
      notes: ['Everything in Basic', 'Unlock branding & advanced exports'],
      cta: 'Subscribe Now',
      highlighted: true,
      initial: { opacity: 1, scale: 0.8, zIndex: 1 },
      whileInView: { opacity: 1, scale: 1 },
      transition: { delay: 0.2, type: 'spring', stiffness: 100, damping: 10, duration: 0.5 },
    },
    {
      id: 'business',
      name: 'Business',
      price: { monthly: '₦30,000', yearly: '₦24,000' },
      discount: 'Save 20%',
      description: 'For large-scale operations',
      features: [
        'Unlimited QR credits',
        '5MB max image upload',
        '8 extra images per frame',
        '50MB max video upload',
        'PNG, SVG & print-ready PDF export',
        'Vendor card on public frame page',
        'Password-protect frames',
        'AI Story Assistant',
        'All-time analytics data',
        '24/7 priority support',
      ],
      notes: ['Everything in Pro', 'Built for high-volume vendors'],
      cta: 'Subscribe Now',
      highlighted: false,
      initial: { opacity: 0, x: -100, zIndex: 0 },
      whileInView: { opacity: 1, x: 0 },
      transition: { delay: 0.4, type: 'spring', stiffness: 100, damping: 10, duration: 0.3 },
    },
  ];

  async function handleCTA(plan) {
    setPayError('');

    // Not logged in → go sign in first
    if (!user) {
      navigate('/signin');
      return;
    }

    setPayLoading(plan.id);

    await initializePayment({
      userId:       user.id,
      email:        user.email,
      planId:       plan.id,
      billingCycle,
      onSuccess: () => {
        setPayLoading('');
        // Redirect to dashboard/billing tab after success
        navigate('/dashboard', { state: { tab: 'billing' } });
      },
      onCancel: () => { setPayLoading(''); },
      onError:  (msg) => { setPayError(msg); setPayLoading(''); },
    });
  }

  return (
    <div className="flex flex-col px-4 md:px-0 max-w-6xl mx-auto">
      {/* Billing toggle */}
      <div className={`flex items-center justify-center gap-2 mb-12 font-[Poltawski_Nowy,serif]`}>
        <div className={`flex items-center border p-0.5 rounded-lg w-max ${isDark ? 'border-[#FAF5DD]' : 'border-[#0F4C3A]'}`}>
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-3 py-1 rounded-lg transition-all text-sm ${
              billingCycle === 'monthly'
                ? isDark ? 'bg-[#FAF5DD] text-[#0F4C3A]' : 'bg-[#0F4C3A] text-[#FAF5DD]'
                : isDark ? 'text-[#FAF5DD]' : 'text-[#0F4C3A]'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-3 py-1 rounded-lg transition-all text-sm ${
              billingCycle === 'yearly'
                ? isDark ? 'bg-[#FAF5DD] text-[#0F4C3A]' : 'bg-[#0F4C3A] text-[#FAF5DD]'
                : isDark ? 'text-[#FAF5DD]' : 'text-[#0F4C3A]'
            }`}
          >
            Yearly
          </button>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
          billingCycle === 'yearly'
            ? 'bg-[#D4AF37] text-[#0F4C3A]'
            : isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-400'
        }`}>
          Save up to 20%
        </span>
      </div>

      {payError && (
        <p className="text-xs text-red-500 text-center mb-4">⚠ {payError}</p>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <motion.div
            initial={plan.initial}
            whileInView={plan.whileInView}
            transition={plan.transition}
            viewport={{ once: true }}
            key={plan.name}
            className={`rounded-2xl p-8 transition-all ${
              plan.highlighted
                ? 'bg-[#0F4C3A] border-2 border-[#D4AF37] transform scale-105'
                : isDark ? 'bg-black border border-neutral-400' : 'bg-white border border-neutral-400'
            }`}
          >
            {plan.highlighted && (
              <div className="mb-4 inline-block bg-[#D4AF37] text-[#0F4C3A] px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
            )}

            <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : isDark ? 'text-white' : 'text-[#0F4C3A]'}`}>
              {plan.name}
            </h3>

            <p className={`mb-6 text-sm ${plan.highlighted ? 'text-white/80' : isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {plan.description}
            </p>

            <div className="mb-6">
              <span className={`text-2xl md:text-3xl font-bold ${plan.highlighted ? 'text-white' : isDark ? 'text-white' : 'text-[#0F4C3A]'}`}>
                {billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}
              </span>
              <span className={`ml-1 text-sm ${plan.highlighted ? 'text-white/80' : isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {billingCycle === 'monthly' ? '/Month' : '/Month, billed yearly'}
              </span>
              {billingCycle === 'yearly' && (
                <div className="mt-2 inline-flex ml-2 bg-red-600 text-white text-xs px-3 py-0.5 rounded-full font-medium">
                  {plan.discount}
                </div>
              )}
            </div>

            <button
              onClick={() => handleCTA(plan)}
              disabled={payLoading === plan.id}
              className={`w-full py-3 px-6 rounded-full font-bold mb-8 transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${
                plan.highlighted
                  ? 'bg-[#D4AF37] text-[#0F4C3A] hover:opacity-90'
                  : isDark
                    ? 'bg-[#0F4C3A] text-white border border-[#D4AF37] hover:opacity-80'
                    : 'bg-[#0F4C3A] text-white hover:opacity-80'
              }`}
            >
              {payLoading === plan.id ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Opening…
                </>
              ) : plan.cta}
            </button>

            <ul className={`space-y-4 ${plan.highlighted ? 'text-white' : isDark ? 'text-neutral-400' : 'text-neutral-700'}`}>
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm">
                  <span className={plan.highlighted ? 'text-[#D4AF37]' : 'text-[#D4AF37]'}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
}