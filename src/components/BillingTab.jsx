/**
 * BillingTab.jsx
 * Full Tailwind + framer-motion rewrite.
 * All payment logic via paystackService → initializePayment.
 * After successful payment, subscription row is updated with new qr_allocated.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  getSubscription,
  getPaymentHistory,
  initializePayment,
  cancelSubscription,
  formatPrice,
  PLAN_CONFIG,
} from '../services/paystackService';

const PLAN_ORDER = ['trial', 'free', 'basic', 'pro', 'business'];

// Extra display metadata (kept here so paystackService stays data-only)
const PLAN_META = {
  basic: {
    description: 'Perfect for getting started',
    discount:    'Save 10%',
    features: [
      'Up to 10 QR credits',
      '2MB max image upload',
      '1 extra image per frame',
      '20MB max video upload',
      'PNG QR code download',
      'Basic analytics data',
    ],
  },
  pro: {
    description: 'Best for growing vendors',
    discount:    'Save 15%',
    features: [
      'Up to 30 QR credits',
      '5MB max image upload',
      '4 extra images per frame',
      '30MB max video upload',
      'PNG, SVG & print-ready PDF export',
      'Vendor card on public frame page',
      'Password-protect frames',
      'AI Story Assistant',
      'Real-time analytics data',
    ],
  },
  business: {
    description: 'For large-scale operations',
    discount:    'Save 20%',
    features: [
      'Everything in Pro +',
      'Unlimited QR credits',
      'Your logo and brand featured on every public frame page',
      'Full white label experience, no ScanMyFrame branding',
      '8 extra images per frame',
      '50MB max video upload',
      'Featured on homepage',
      '24/7 priority support',
    ],
  },
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS = {
  free:      { cls: 'bg-neutral-100 text-neutral-500',  label: 'Free'         },
  trial:     { cls: 'bg-blue-100 text-blue-700',        label: 'Trial'        },
  active:    { cls: 'bg-emerald-100 text-emerald-700',  label: 'Active'       },
  past_due:  { cls: 'bg-red-100 text-red-600',          label: 'Past Due'     },
  cancelled: { cls: 'bg-amber-100 text-amber-700',      label: 'Cancels soon' },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.active;
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── QR usage bar ─────────────────────────────────────────────────────────────
function QRBar({ used, allocated, isDark }) {
  const isUnlimited = allocated === -1;
  const pct         = isUnlimited ? 100 : allocated > 0 ? Math.round((used / allocated) * 100) : 0;
  const remaining   = isUnlimited ? '∞' : Math.max(0, allocated - used);
  const danger      = !isUnlimited && pct >= 80;

  return (
    <div className="mt-5">
      <div className="flex justify-between text-xs mb-1.5">
        <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>QR codes used</span>
        <span className={`font-bold ${danger ? 'text-red-500' : isDark ? 'text-white' : 'text-[#0F4C3A]'}`}>
          {isUnlimited ? '∞ unlimited' : `${used} / ${allocated} (${remaining} left)`}
        </span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-neutral-700' : 'bg-neutral-200'}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${danger ? 'bg-red-500' : 'bg-[#D4AF37]'}`}
        />
      </div>
      {danger && !isUnlimited && (
        <p className="text-[11px] text-red-500 mt-1.5">
          Running low. Upgrade to avoid interruptions.
        </p>
      )}
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, currentPlanId, billingCycle, onSelect, payLoading, isDark }) {
  const isCurrent   = plan.id === currentPlanId;
  const isDowngrade = PLAN_ORDER.indexOf(plan.id) < PLAN_ORDER.indexOf(currentPlanId);
  const isLoading   = payLoading === plan.id;
  const price       = billingCycle === 'yearly' ? plan.yearly_kobo : plan.monthly_kobo;
  const isPro       = plan.id === 'pro';
  const meta        = PLAN_META[plan.id] || {};

  const buttonLabel = isCurrent ? 'Repurchase' : isDowngrade ? 'Downgrade' : 'Upgrade';

  const textMain = isPro ? 'text-white'      : isDark ? 'text-white'        : 'text-[#0F4C3A]';
  const textSub  = isPro ? 'text-white/70'   : isDark ? 'text-neutral-400'  : 'text-neutral-500';
  const checkClr = isPro ? 'text-[#D4AF37]'  : 'text-[#D4AF37]';
  const divider  = isPro ? 'border-white/10' : isDark ? 'border-neutral-700' : 'border-neutral-100';

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={[
        'relative rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200',
        isCurrent
          ? 'ring-2 ring-[#D4AF37]'
          : isDark ? 'ring-1 ring-neutral-700' : 'ring-1 ring-neutral-200',
        isPro
          ? 'bg-[#0F4C3A]'
          : isDark ? 'bg-neutral-800' : 'bg-white',
      ].join(' ')}
    >
      {/* Badges */}
      <div className="flex items-center justify-between flex-wrap gap-1">
        {isPro && (
          <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#0F4C3A] tracking-widest uppercase">
            Most Popular
          </span>
        )}
        {isCurrent && (
          <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-400/20 text-[#D4AF37] tracking-widest uppercase ml-auto">
            Current
          </span>
        )}
      </div>

      {/* Name + description */}
      <div>
        <p className={`text-base font-bold font-[Poltawski_Nowy,serif] ${textMain}`}>{plan.name}</p>
        {meta.description && (
          <p className={`text-xs mt-0.5 ${textSub}`}>{meta.description}</p>
        )}
      </div>

      {/* Price */}
      <div>
        <p className={`text-2xl font-extrabold ${isPro ? 'text-[#D4AF37]' : textMain}`}>
          {price === 0 ? 'Free' : formatPrice(price)}
          {price > 0 && <span className="text-xs font-normal opacity-60 ml-0.5">/mo</span>}
        </p>
        {billingCycle === 'yearly' && meta.discount && (
          <span className="inline-block mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500 text-white">
            {meta.discount}
          </span>
        )}
      </div>

      {/* CTA */}
      {plan.id !== 'free' && (
        <button
          onClick={() => onSelect(plan.id)}
          disabled={isLoading}
          className={[
            'py-2 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer',
            isPro
              ? 'bg-[#D4AF37] text-[#0F4C3A] hover:opacity-90'
              : 'bg-[#0F4C3A] text-[#FAF5DD] hover:opacity-90',
            isLoading ? 'opacity-60 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Opening…
            </span>
          ) : buttonLabel}
        </button>
      )}

      {/* Divider */}
      {meta.features?.length > 0 && <hr className={`border-t ${divider}`} />}

      {/* Features */}
      {meta.features?.length > 0 && (
        <ul className="flex flex-col gap-2">
          {meta.features.map(f => (
            <li key={f} className={`flex items-start gap-2 text-xs ${textSub}`}>
              <span className={`mt-px text-sm leading-none ${checkClr}`}>✓</span>
              {f}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ isDark, className }) {
  return (
    <div className={`rounded-2xl animate-pulse ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'} ${className}`} />
  );
}

// ─── Main BillingTab ──────────────────────────────────────────────────────────
export default function BillingTab() {
  const { user }   = useAuth();
  const { isDark } = useTheme();

  const [sub,           setSub]           = useState(null);
  const [history,       setHistory]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [billingCycle,  setBillingCycle]  = useState('monthly');
  const [payError,      setPayError]      = useState('');
  const [payLoading,    setPayLoading]    = useState('');
  const [showCancel,    setShowCancel]    = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showHistory,   setShowHistory]   = useState(false);

  useEffect(() => { if (user?.id) loadData(); }, [user?.id]);

  async function loadData() {
    setLoading(true);
    const [subRes, histRes] = await Promise.all([
      getSubscription(user.id),
      getPaymentHistory(user.id),
    ]);
    if (subRes.subscription) setSub(subRes.subscription);
    if (histRes.payments)    setHistory(histRes.payments);
    setLoading(false);
  }

  async function handleSelectPlan(planId) {
    setPayError('');
    setPayLoading(planId);
    await initializePayment({
      userId:       user.id,
      email:        user.email,
      planId,
      billingCycle,
      onSuccess: () => { window.location.reload(); },
      onCancel:  ()       => { setPayLoading(''); },
      onError:   (msg)    => { setPayError(msg); setPayLoading(''); },
    });
  }

  async function handleCancel() {
    setCancelLoading(true);
    const { error } = await cancelSubscription(user.id);
    setCancelLoading(false);
    setShowCancel(false);
    if (!error) window.location.reload();
  }

  const card  = isDark ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-neutral-200';
  const text  = isDark ? 'text-white' : 'text-[#0F4C3A]';
  const muted = isDark ? 'text-neutral-400' : 'text-neutral-500';
  const labelCls = `text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`;

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton isDark={isDark} className="h-36" />
        <Skeleton isDark={isDark} className="h-20" />
        <Skeleton isDark={isDark} className="h-20" />
      </div>
    );
  }

  const rawPlanId    = sub?.plan_id || 'free';
  // Period has ended if current_period_end is in the past — regardless of status field
  const periodEnded  = rawPlanId !== 'free' && rawPlanId !== 'trial' &&
    sub?.current_period_end &&
    new Date(sub.current_period_end) < new Date();
  // Trial drops to free once its period ends
  const trialExpired = rawPlanId === 'trial' &&
    sub?.current_period_end &&
    new Date(sub.current_period_end) < new Date();
  const currentPlanId = (periodEnded || trialExpired) ? 'free' : rawPlanId;
  const planInfo      = PLAN_CONFIG[currentPlanId] || PLAN_CONFIG.free;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-6"
    >
      <h2 className={`text-xl font-bold font-[Poltawski_Nowy,serif] ${text}`}>Billing</h2>

      {/* ── Current plan card ── */}
      <div className={`${card} rounded-2xl p-5`}>
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <p className={labelCls}>Current plan</p>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-xl font-bold font-[Poltawski_Nowy,serif] ${text}`}>
                {planInfo?.name || 'Trial'}
              </h3>
              {currentPlanId !== 'free' && (
                <StatusBadge status={rawPlanId === 'trial' && !trialExpired ? 'trial' : (sub?.status || 'active')} />
              )}
            </div>
            {rawPlanId === 'trial' && !trialExpired && sub?.current_period_end && (
              <p className={`text-xs mt-1 ${muted}`}>
                Trial ends {new Date(sub.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            {rawPlanId !== 'trial' && currentPlanId !== 'free' && sub?.current_period_end && (
              <p className={`text-xs mt-1 ${muted}`}>
                Renews {new Date(sub.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            </div>
          {sub?.status === 'active' && currentPlanId !== 'free' && rawPlanId !== 'trial' && (
            <button
              onClick={() => setShowCancel(true)}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-red-300 text-red-500 hover:bg-red-50 transition-colors"
            >
              Cancel plan
            </button>
          )}
          {sub?.status === 'cancelled' && !periodEnded && sub?.current_period_end && (
            <p className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">
              Your plan remains active until{' '}
              {new Date(sub.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
              After that your account moves to the Free plan and unused QR credits will be locked until you resubscribe.
            </p>
          )}
        </div>
        {currentPlanId === 'free' && (sub?.qr_allocated ?? 0) > 0 ? (
          <div className="mt-5 opacity-60">
            <QRBar used={sub?.qr_used || 0} allocated={sub?.qr_allocated} isDark={isDark} />
            <p className={`text-[11px] mt-2 flex items-center gap-1 ${muted}`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Credits locked, subscribe to a plan to use them
            </p>
          </div>
        ) : currentPlanId !== 'free' ? (
          <QRBar
            used={sub?.qr_used || 0}
            allocated={sub?.qr_allocated ?? 10}
            isDark={isDark}
          />
        ) : null}
      </div>

      {/* ── Highest plan message ── */}
      {currentPlanId === 'business' && (
        <div className={`${card} rounded-2xl p-5 flex items-center gap-4`}>
          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] text-xl flex-shrink-0">
            ✦
          </div>
          <div>
            <p className={`text-sm font-bold ${text}`}>You're on our highest plan</p>
            <p className={`text-xs mt-0.5 ${muted}`}>
              Enjoy unlimited QR codes, priority support, and all Business features.
            </p>
          </div>
        </div>
      )}

      {/* ── Trial notice ── */}
      {rawPlanId === 'trial' && !trialExpired && (
        <div className={`${card} rounded-2xl p-5 flex items-start gap-3`}>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm flex-shrink-0 mt-0.5">
            ✦
          </div>
          <div>
            <p className={`text-sm font-bold ${text}`}>You're on a free Trial</p>
            <p className={`text-xs mt-1 leading-relaxed ${muted}`}>
              Your trial gives you full Business-level access for 30 days — including AI Story Assistant, analytics, unlimited uploads, and more. Upgrade before your trial ends to keep all features.
            </p>
          </div>
        </div>
      )}

      {/* ── Upgrade grid ── */}
      {currentPlanId !== 'business' && (
        <div>
          <p className={labelCls}>{rawPlanId === 'trial' ? 'Upgrade to keep your features' : 'Upgrade your plan'}</p>

          {/* Billing cycle toggle */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex rounded-lg overflow-hidden border ${isDark ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-neutral-50'}`}>
              {['monthly', 'yearly'].map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={[
                    'px-4 py-1.5 text-sm font-medium transition-all',
                    billingCycle === cycle
                      ? 'bg-[#0F4C3A] text-[#FAF5DD]'
                      : isDark ? 'text-neutral-400' : 'text-neutral-500',
                  ].join(' ')}
                >
                  {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {billingCycle === 'yearly' && (
                <motion.span
                  key="yearly-badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[10px] font-bold px-3 py-1 rounded-full bg-yellow-400/15 text-[#D4AF37]"
                >
                  Save up to 20%
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLAN_ORDER.filter((id) => id !== 'free' && id !== 'trial').map((planId) => (
              <PlanCard
                key={planId}
                plan={PLAN_CONFIG[planId]}
                currentPlanId={currentPlanId}
                billingCycle={billingCycle}
                onSelect={handleSelectPlan}
                payLoading={payLoading}
                isDark={isDark}
              />
            ))}
          </div>

          <AnimatePresence>
            {payError && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-500 mt-3"
              >
                ⚠ {payError}
              </motion.p>
            )}
          </AnimatePresence>

          <p className={`text-center text-xs mt-4 ${muted}`}>
            Powered by Paystack · pay your way
          </p>
        </div>
      )}

      {/* ── Payment history ── */}
      {history.length > 0 && (
        <div className={`${card} rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-1">
            <p className={labelCls}>Payment history</p>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="text-xs font-semibold text-[#D4AF37] hover:opacity-80 transition-opacity"
            >
              {showHistory ? 'Hide' : `Show ${history.length} records`}
            </button>
          </div>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                key="history"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`overflow-hidden divide-y ${isDark ? 'divide-neutral-700' : 'divide-neutral-100'}`}
              >
                {history.map((pay) => (
                  <div key={pay.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className={`text-sm font-semibold capitalize ${text}`}>
                        {pay.plan_id} · {pay.billing_cycle}
                      </p>
                      <p className={`text-xs mt-0.5 ${muted}`}>
                        {new Date(pay.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {pay.paystack_reference && ` · ${pay.paystack_reference}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${text}`}>{formatPrice(pay.amount_kobo)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pay.status === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                        {pay.status}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Cancel confirm modal ── */}
      <AnimatePresence>
        {showCancel && (
          <motion.div
            key="cancel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className={`${isDark ? 'bg-neutral-900 border border-neutral-700' : 'bg-white border border-neutral-200'} rounded-2xl p-7 w-full max-w-sm`}
            >
              <p className={`text-base font-bold font-[Poltawski_Nowy,serif] mb-2 ${text}`}>
                Cancel subscription?
              </p>
              <p className={`text-sm leading-relaxed mb-6 ${muted}`}>
            You’ll retain access until the end of your billing period. After that, your subscription will be cancelled and any unused QR credits will be cleared. <strong>This cannot be undone.</strong>
            </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancel(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${isDark ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
                >
                  Keep plan
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {cancelLoading ? 'Cancelling…' : 'Yes, cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}