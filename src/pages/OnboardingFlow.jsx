import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabaseClient';
import { initializePayment } from '../services/paystackService';
import { sendWelcomeNotification } from '../services/supabaseHelpers';

import scanframeLogo from '../assets/images/Scanframe.png';
import scanframeLogoAlt from '../assets/images/Scanframe alt.png';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: { monthly: '₦3,000', yearly: '₦2,700' },
    discount: 'Save 10%',
    description: 'Perfect for getting started',
    features: [
      '2MB max image upload',
      '1 extra image per frame',
      '20MB max video upload',
      'PNG QR code download',
      'Basic analytics data',
    ],
    notes: [
      'Get 10 free QR codes on signup',
      'Free credits never expire',
    ],
    highlighted: false,
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: 0.1, type: 'spring', stiffness: 100, damping: 14 },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: '₦15,000', yearly: '₦12,750' },
    discount: 'Save 15%',
    description: 'Best for growing users',
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
    notes: [
      'Works alongside your free QR credits',
      'Scale your QR usage without limits',
    ],
    highlighted: true,
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: 0.2, type: 'spring', stiffness: 100, damping: 14 },
  },
  {
    id: 'business',
    name: 'Business',
    price: { monthly: '₦50,000', yearly: '₦40,000' },
    discount: 'Save 20%',
    description: 'For large scale operations',
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
    notes: [
      'Built for high volume QR usage',
      'No limits on growth',
    ],
    highlighted: false,
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: 0.3, type: 'spring', stiffness: 100, damping: 14 },
  },
];

const BUSINESS_TYPES = [
  'Art Gallery', 'Wedding Photography', 'Event Planning',
  'Interior Design', 'Memorial Services', 'Family Photography',
  'Corporate Gifting', 'Other',
];

const COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United Kingdom',
  'United States', 'Canada', 'Other',
];

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ current, isDark }) {
  const steps = ['Your profile', 'Choose plan', 'All done'];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={`
              w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
              ${done
                ? isDark ? 'bg-gold text-primary' : 'bg-primary text-white'
                : active
                  ? isDark ? 'border-2 border-gold text-gold' : 'border-2 border-primary text-primary'
                  : isDark ? 'border-2 border-white/20 text-gray-600' : 'border-2 border-gray-300 text-gray-400'}
            `}>
              {done ? '✓' : i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap font-poltawski ${
              active
                ? isDark ? 'text-gold font-semibold' : 'text-primary font-semibold'
                : done
                  ? isDark ? 'text-gray-300' : 'text-primary'
                  : isDark ? 'text-gray-600' : 'text-gray-400'
            }`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-10 h-0.5 mx-2 ${done ? isDark ? 'bg-gold' : 'bg-primary' : isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Business Profile ─────────────────────────────────────────────────
function StepProfile({ data, onChange, onNext, onSkip, loading, error, isDark }) {
  const [logoPreview, setLogoPreview] = useState(null);

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'].includes(file.type)) return;
    if (file.size > 2 * 1024 * 1024) return;
    onChange('business_logo_file', file);
    setLogoPreview(URL.createObjectURL(file));
  }

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors
    ${isDark ? 'bg-[#111] border-white/10 text-white placeholder-gray-600 focus:border-gold'
             : 'bg-white border-gray-200 text-primary placeholder-gray-400 focus:border-primary'}`;

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">
        Step 1 of 3: Your profile
      </p>
      <h2 className={`text-2xl font-bold mb-1 font-poltawski ${isDark ? 'text-white' : 'text-primary'}`}>
        Tell us about your business
      </h2>
      <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        This helps us personalise your experience. You can update this anytime.
      </p>

      {/* Business Logo */}
      <div className="mb-4">
        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Business logo <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-4">
          {logoPreview
            ? <img src={logoPreview} alt="Logo preview" className="w-14 h-14 rounded-xl object-contain border border-gray-200" />
            : <div className={`w-14 h-14 rounded-xl flex items-center justify-center border ${isDark ? 'border-white/10 bg-[#111]' : 'border-gray-200 bg-gray-50'}`}>
                <span className="text-xl">🖼</span>
              </div>
          }
          <label className={`cursor-pointer px-4 py-2 rounded-xl border text-sm font-medium transition-colors
            ${isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {logoPreview ? 'Change logo' : 'Upload logo'}
            <input type="file" accept="image/jpeg" onChange={handleLogoChange} className="hidden" />
          </label>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Only JPG file is accepted, max 2MB</span>
        </div>
      </div>

      <div className="mb-4">
        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Business name
        </label>
        <input className={inputCls} placeholder="e.g. Lagos Art Gallery"
          value={data.business_name} onChange={e => onChange('business_name', e.target.value)} />
      </div>

      <div className="mb-4">
        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Business email <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input className={inputCls} placeholder="e.g. hello@myart.com" type="email"
          value={data.business_email} onChange={e => onChange('business_email', e.target.value)} />
      </div>

      <div className="mb-4">
        <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Business type
        </label>
        <select
          className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none
            ${isDark ? 'bg-black border-gray-700 text-white focus:border-gold'
                     : 'bg-white border-gray-200 text-primary focus:border-primary'}`}
          value={data.business_type}
          onChange={e => onChange('business_type', e.target.value)}
        >
          <option value="">Select a type...</option>
          {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Country
          </label>
          <select
            className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors
              ${isDark ? 'bg-[#111] border-white/10 text-white focus:border-gold'
                       : 'bg-white border-gray-200 text-primary focus:border-primary'}`}
            value={data.country}
            onChange={e => onChange('country', e.target.value)}
          >
            <option value="">Select country</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Phone (optional)
          </label>
          <input
            className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors
              ${isDark ? 'bg-[#111] border-white/10 text-white placeholder-gray-600 focus:border-gold'
                       : 'bg-white border-gray-200 text-primary placeholder-gray-400 focus:border-primary'}`}
            placeholder="+234 800 000 0000"
            value={data.phone}
            onChange={e => onChange('phone', e.target.value)}
          />
        </div>
      </div>

      {/* Newsletter opt-in */}
      <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border mt-2 mb-1 transition-colors
        ${isDark ? 'border-white/10 hover:border-white/20' : 'border-gray-200 hover:border-gray-300'}`}>
        <input
          type="checkbox"
          checked={data.newsletter_opt_in}
          onChange={e => onChange('newsletter_opt_in', e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#0F4C3A] flex-shrink-0 cursor-pointer"
        />
        <span className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Send me vendor tips, platform updates, and occasional offers.{' '}
          <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>You can unsubscribe anytime.</span>
        </span>
      </label>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={onSkip}
          className={`text-sm transition-colors ${isDark ? 'text-gray-500 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Skip for now
        </button>
        <button
          onClick={() => onNext(false)}
          disabled={loading}
          className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all
            ${isDark ? 'bg-secondary text-primary hover:opacity-90' : 'bg-primary text-white hover:opacity-80'}`}
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Choose Plan ──────────────────────────────────────────────────────
function StepPlan({ data, onChange, onNext, onBack, onSkip, loading, error, isDark }) {
  const billing = data.billing_cycle;

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-2">
        Step 2 of 3: Select plan
      </p>
      <h2 className={`text-2xl font-bold mb-1 font-poltawski ${isDark ? 'text-white' : 'text-primary'}`}>
        Choose your plan
      </h2>
      <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Start free. Scale when you're ready. Cancel anytime. You get 10 Free QR codes to try out all features. No credit card required.
      </p>

      {/* Billing toggle — discount badge sits right beside the Yearly button */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className={`flex items-center font-poltawski gap-1 border ${isDark ? 'border-secondary' : 'border-primary'} p-0.5 rounded-lg transition-colors duration-200`}>
          <button
            onClick={() => onChange('billing_cycle', 'monthly')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              billing === 'monthly'
                ? `${isDark ? 'bg-secondary text-primary' : 'bg-primary text-secondary'}`
                : `${isDark ? 'text-secondary' : 'text-primary'}`
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => onChange('billing_cycle', 'yearly')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              billing === 'yearly'
                ? `${isDark ? 'bg-secondary text-primary' : 'bg-primary text-secondary'}`
                : `${isDark ? 'text-secondary' : 'text-primary'}`
            }`}
          >
            Yearly
          </button>
        </div>
        {/* Discount badge — always visible, draws attention to yearly saving */}
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
          billing === 'yearly'
            ? 'bg-gold text-primary'
            : `${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-400'}`
        }`}>
          Save up to 20%
        </span>
      </div>

      {/* Plan cards — full width stacked, no shrinking */}
      <div className="flex flex-col gap-4 mb-8">
        {plans.map(plan => {
          const selected = data.plan === plan.id;
          return (
            <motion.div
              key={plan.name}
              initial={plan.initial}
              whileInView={plan.whileInView}
              transition={plan.transition}
              viewport={{ once: true }}
              onClick={() => onChange('plan', plan.id)}
              className={`
                rounded-2xl p-6 cursor-pointer transition-all relative
                ${plan.highlighted
                  ? 'bg-primary border-2 border-gold'
                  : isDark ? 'bg-[#1a1a1a] border border-white/10 hover:border-white/20' : 'bg-white border border-gray-200 hover:border-gray-300'
                }
                ${selected && !plan.highlighted ? isDark ? 'ring-2 ring-gold ring-offset-2 ring-offset-[#181818]' : 'ring-2 ring-primary ring-offset-2' : ''}
                ${selected && plan.highlighted ? 'ring-2 ring-gold ring-offset-2 ring-offset-black' : ''}
              `}
            >
              {/* Card layout: two columns — info left, price + CTA right */}
              <div className="flex items-start justify-between gap-4">

                {/* Left: badge + name + features */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-lg font-bold font-poltawski ${plan.highlighted ? 'text-white' : isDark ? 'text-white' : 'text-primary'}`}>
                      {plan.name}
                    </h3>
                    {plan.highlighted && (
                      <span className="bg-gold text-primary px-3 py-0.5 rounded-full text-xs font-bold">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mb-3 ${plan.highlighted ? 'text-white opacity-70' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {plan.features.map(feature => (
                      <li key={feature} className={`flex items-center gap-1.5 text-xs ${plan.highlighted ? 'text-white opacity-80' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className={`font-bold ${plan.highlighted ? 'text-gold' : 'text-gold'}`}>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right: price + yearly discount + select button */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="text-right">
                    {billing === 'yearly' && (
                      <div className="text-xs font-bold text-red-400 mb-0.5">
                        {plan.discount}
                      </div>
                    )}
                    <span className={`text-2xl font-bold ${plan.highlighted ? 'text-white' : isDark ? 'text-white' : 'text-primary'}`}>
                      {billing === 'monthly' ? plan.price.monthly : plan.price.yearly}
                    </span>
                    <span className={`ml-1 text-xs ${plan.highlighted ? 'text-white opacity-70' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      /mo
                    </span>
                    {billing === 'yearly' && (
                      <p className={`text-xs mt-0.5 ${plan.highlighted ? 'text-white opacity-60' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        billed yearly
                      </p>
                    )}
                  </div>

                  <div className={`px-5 py-2 rounded-full text-xs font-bold text-center whitespace-nowrap transition-all
                    ${selected
                      ? plan.highlighted ? 'bg-gold text-primary' : isDark ? 'bg-gold text-primary' : 'bg-primary text-white'
                      : plan.highlighted
                        ? 'bg-white/10 text-white border border-white/30'
                        : isDark ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}
                  >
                    {selected ? '✓ Selected' : 'Select plan'}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className={`text-sm transition-colors ${isDark ? 'text-gray-500 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
        >
          ← Back
        </button>
        <button
          onClick={onSkip}
          className={`text-sm transition-colors ${isDark ? 'text-gray-500 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Skip plan selection →
        </button>
        <button
          onClick={onNext}
          disabled={loading}
          className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all
            ${isDark ? 'bg-secondary text-primary hover:opacity-90' : 'bg-primary text-white hover:opacity-80'}`}
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Complete ─────────────────────────────────────────────────────────
function StepComplete({ planName, onDashboard, onCreateFrame, onSkip, isDark }) {
  return (
    <div className="text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className={`text-2xl font-bold mb-2 font-poltawski ${isDark ? 'text-white' : 'text-primary'}`}>
        You're all set!
      </h2>
      
      {planName?
      <p className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Your <strong>{planName}</strong> subscription is active. Time to create your first frame.
      </p>
      : <p className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        You’ve got <strong>10 free QR codes</strong> added to your account. Start creating and exploring right away.
      </p>
      }
      <div className={`rounded-2xl p-6 mb-8 text-left ${isDark ? 'bg-[#1a1a1a] border border-white/10' : 'bg-gray-50 border border-gray-100'}`}>
        {[
          'Create a frame and add your content',
          'Generate and download your QR code',
          'Attach the QR code to your physical frame',
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-4 mb-4 last:mb-0">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </div>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{s}</span>
          </div>
        ))}
      </div>

      <p className={`text-xs mb-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        We sent a welcome email to your inbox. If you don't see it, check your spam folder and mark it as safe.
      </p>

      <div className="flex gap-3 justify-center">
        <button
          onClick={onDashboard}
          className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all
            ${isDark ? 'bg-secondary text-primary hover:opacity-90' : 'bg-primary text-white hover:opacity-80'}`}
        >
          Go to dashboard
        </button>
        <button
          onClick={onCreateFrame}
          className={`px-8 py-2.5 rounded-full font-bold text-sm border transition-all
            ${isDark ? 'border-gold text-secondary hover:bg-gold hover:bg-opacity-10' : 'border-primary text-primary hover:bg-primary hover:bg-opacity-5'}`}
        >
          Create my first frame
        </button>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function OnboardingFlow() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill newsletter preference from DB (set during email signup)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('users').select('newsletter_opt_in').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.newsletter_opt_in) {
            setProfile(prev => ({ ...prev, newsletter_opt_in: true }));
          }
        });
    });
  }, []);

  const [profile, setProfile] = useState({
    business_name: '',
    business_email: '',
    business_type: '',
    country: '',
    phone: '',
    business_logo_file: null,
    newsletter_opt_in: false,
  });

  const [planData, setPlanData] = useState({
    plan: 'pro',
    billing_cycle: 'monthly',
  });

  function updateProfile(key, val) {
    setProfile(prev => ({ ...prev, [key]: val }));
    setError('');
  }

  function updatePlan(key, val) {
    setPlanData(prev => ({ ...prev, [key]: val }));
  }

  async function saveProfileAndContinue(skip) {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates = { onboarding_step: 1, newsletter_opt_in: profile.newsletter_opt_in, updated_at: new Date().toISOString() };

      if (!skip) {
        if (!profile.business_name.trim()) {
          setError('Please enter your business name.');
          setLoading(false);
          return;
        }
        updates.business_name  = profile.business_name;
        updates.business_type  = profile.business_type  || null;
        updates.business_email = profile.business_email || null;
        updates.country        = profile.country        || null;
        updates.phone          = profile.phone          || null;

        // Upload business logo if provided
        if (profile.business_logo_file) {
          const file = profile.business_logo_file;
          const ext  = file.name.split('.').pop();
          const path = `logos/${user.id}-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage.from('media').upload(path, file, { upsert: true });
          if (!upErr) {
            const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
            updates.business_logo = urlData.publicUrl;
          }
        }
      }

      const { error: dbErr } = await supabase.from('users').update(updates).eq('id', user.id);
      if (dbErr) throw dbErr;
      setStep(1);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function savePlanAndContinue() {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Helper: mark onboarding done on users table (no plan columns — moved to subscriptions)
      const markDone = async () => {
        const { error } = await supabase
          .from('users')
          .update({ onboarding_step: 2, onboarding_completed: true, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (error) throw error;
      };

      // Paid plan → open Paystack first, complete onboarding in the success callback
      
        await initializePayment({
          userId:     user.id,
          email:        user.email,
          planId:       planData.plan,
          billingCycle: planData.billing_cycle || 'monthly',
          onSuccess: async () => {
            await markDone();
            // Fire-and-forget welcome notification + email
            sendWelcomeNotification({
              userId:      user.id,
              toEmail:     user.email,
              userName:    profile.business_name || profile.business_email || user.email.split('@')[0],
            });
            setStep(2);
            setLoading(false);
          },
          onCancel: () => setLoading(false),
          onError: (msg) => { setError(msg); setLoading(false); },
        });
        return; // loading cleared inside callbacks above
      

    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSkipPlan() {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error: dbErr } = await supabase
        .from('users')
        .update({ onboarding_step: 2, onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (dbErr) throw dbErr;
      // Fire-and-forget welcome notification + email
      sendWelcomeNotification({
        userId:   user.id,
        toEmail:  user.email,
        userName: profile.business_name || user.email.split('@')[0],
      });
      setPlanData({ plan: 'trial' });
      setStep(2);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const selectedPlan = plans.find(p => p.id === planData.plan);

  return (
    <div className={`min-h-screen flex items-start justify-center px-4 py-10 transition-colors duration-200 ${isDark ? 'bg-[#0c0c0c] text-white' : 'bg-gray-50 text-black'}`}>
      <div className={`w-full max-w-2xl rounded-2xl p-8 md:p-12 transition-colors duration-200 ${isDark ? 'bg-[#181818] border border-white/8' : 'bg-white border border-gray-100 shadow-sm'}`}>
        {/* Logo */}
        <div
        className={`flex items-center font-poltawski justify-center gap-1 mb-12 w-max mx-auto transition-colors duration-200`}>

        <img
        src={isDark ? scanframeLogo : scanframeLogoAlt}
        className="w-10"
        alt="ScanMyFrame"
      />
        </div>

        <StepBar current={step} isDark={isDark} />

        {step === 0 && (
          <StepProfile
            data={profile}
            onChange={updateProfile}
            onNext={saveProfileAndContinue}
            onSkip={() => saveProfileAndContinue(true)}
            loading={loading}
            error={error}
            isDark={isDark}
          />
        )}
        {step === 1 && (
          <StepPlan
            data={planData}
            onChange={updatePlan}
            onNext={savePlanAndContinue}
            onSkip={handleSkipPlan}
            onBack={() => setStep(0)}
            loading={loading}
            error={error}
            isDark={isDark}
          />
        )}
        {step === 2 && (
          <StepComplete
            planName={selectedPlan?.name || null}
            onDashboard={() => navigate('/dashboard')}
            onCreateFrame={() => navigate('/dashboard')}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
}