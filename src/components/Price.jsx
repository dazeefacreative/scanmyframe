import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANS, getQrLabel } from '../data/plans';

export default function Price() {
  const { isDark }  = useTheme();
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');

  function handleCTA() {
    if (!user) {
      navigate('/signin');
    } else {
      navigate('/dashboard', { state: { tab: 'billing' } });
    }
  }

  return (
    <div className="flex flex-col px-4 md:px-0 max-w-4xl mx-auto">
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

      {user && (
        <p className={`text-center text-xs mb-6 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
          Plans are activated from your{' '}
          <button onClick={() => navigate('/dashboard', { state: { tab: 'billing' } })} className="underline underline-offset-2 font-semibold hover:opacity-70 transition-opacity">
            dashboard billing tab
          </button>
        </p>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
          <motion.div
            initial={plan.motion.initial}
            whileInView={plan.motion.whileInView}
            transition={plan.motion.transition}
            key={plan.name}
            className={`rounded-2xl p-5 transition-all ${
              plan.highlighted
                ? 'bg-[#0F4C3A] border-2 border-[#D4AF37] transform scale-105'
                : isDark ? 'bg-black border border-neutral-400' : 'bg-white border border-neutral-400'
            }`}
          >
            {plan.highlighted && (
              <div className="mb-3 inline-block bg-[#D4AF37] text-[#0F4C3A] px-3 py-0.5 rounded-full text-xs font-bold">
                Most Popular
              </div>
            )}

            <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? 'text-white' : isDark ? 'text-white' : 'text-[#0F4C3A]'}`}>
              {plan.name}
            </h3>

            <p className={`mb-4 text-xs ${plan.highlighted ? 'text-white/80' : isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {plan.description}
            </p>

            <div className="mb-4">
              <span className={`text-xl md:text-2xl font-bold ${plan.highlighted ? 'text-white' : isDark ? 'text-white' : 'text-[#0F4C3A]'}`}>
                {billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}
              </span>
              <span className={`ml-1 text-xs ${plan.highlighted ? 'text-white/80' : isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                /Month
              </span>
              {billingCycle === 'yearly' && (
                <div className="mt-1.5 inline-flex ml-2 bg-red-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-medium">
                  {plan.discount}
                </div>
              )}
            </div>

            <button
              onClick={handleCTA}
              className={`w-full py-2 px-4 rounded-full text-sm font-bold mb-5 transition-all flex items-center justify-center gap-2 ${
                plan.highlighted
                  ? 'bg-[#D4AF37] text-[#0F4C3A] hover:opacity-90'
                  : isDark
                    ? 'bg-[#0F4C3A] text-white border border-[#D4AF37] hover:opacity-80'
                    : 'bg-[#0F4C3A] text-white hover:opacity-80'
              }`}
            >
              {user ? 'Activate in Dashboard' : plan.cta}
            </button>

            <ul className={`space-y-2.5 ${plan.highlighted ? 'text-white' : isDark ? 'text-neutral-400' : 'text-neutral-700'}`}>
              {/* Dynamic QR credit line */}
              {getQrLabel(plan, billingCycle) && (
                <li className="flex items-center gap-2.5 text-xs">
                  <span className="text-[#D4AF37]">✓</span>
                  <span className={`font-bold ${plan.highlighted ? 'text-white' : isDark ? 'text-white' : 'text-[#0F4C3A]'}`}>
                    {getQrLabel(plan, billingCycle)}
                  </span>
                  {billingCycle === 'yearly' && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${plan.highlighted ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-emerald-100 text-emerald-600'}`}>
                      upfront
                    </span>
                  )}
                </li>
              )}
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-xs">
                  <span className="text-[#D4AF37]">✓</span>
                  <span className={plan.boldFeatures?.includes(feature) ? 'font-bold' : ''}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <p className={`text-center text-xs mt-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
        Powered by Paystack · pay your way
      </p>
    </div>
  );
}