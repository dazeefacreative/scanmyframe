/**
 * paystackService.js
 * All Paystack interactions live here — nothing payment-related touches components directly.
 *
 * Paystack public key goes in .env:
 *   VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxx
 *
 * Flow:
 *  1. initializePayment()  — opens Paystack inline popup
 *  2. On success callback  — verifyAndActivate() is called
 *  3. verifyAndActivate()  — creates payment record + upgrades subscription in Supabase
 */

import { supabase } from './supabaseClient';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

// ─── Plan config (mirrors Price.jsx & plans table) ────────────────────────────
export const PLAN_CONFIG = {
  trial: {
    id:            'trial',
    name:          'Trial',
    qr_allocation: 5,   // 5 test credits, full Business-level features for 30 days
    monthly_kobo:  0,
    yearly_kobo:   0,
  },
  free: {
    id:           'free',
    name:         'Free',
    qr_allocation: 0,
    monthly_kobo: 0,
    yearly_kobo:  0,
  },
  basic: {
    id:            'basic',
    name:          'Basic',
    qr_allocation: 10,
    monthly_kobo:  300000,   // ₦3,000 in kobo
    yearly_kobo:   270000,   // ₦2,700/mo billed yearly = ₦32,400/yr → store monthly equivalent
    yearly_total_kobo: 3240000,
  },
  pro: {
    id:            'pro',
    name:          'Pro',
    qr_allocation: 30,
    monthly_kobo:  1500000,  // ₦15,000
    yearly_kobo:   1275000,  // ₦12,750/mo
    yearly_total_kobo: 15300000,
  },
  business: {
    id:            'business',
    name:          'Business',
    qr_allocation: -1,       // unlimited
    monthly_kobo:  3000000,  // ₦30,000
    yearly_kobo:   2400000,  // ₦24,000/mo
    yearly_total_kobo: 28800000,
  },
};

// Amount to actually charge Paystack (total for the period)
export function getChargeAmount(planId, billingCycle) {
  const plan = PLAN_CONFIG[planId];
  if (!plan) return 0;
  if (billingCycle === 'yearly') return plan.yearly_total_kobo || plan.yearly_kobo * 12;
  return plan.monthly_kobo;
}

// Human-readable price string
export function formatPrice(amountKobo) {
  return `₦${(amountKobo / 100).toLocaleString('en-NG')}`;
}

// ─── Load Paystack script ─────────────────────────────────────────────────────
function loadPaystackScript() {
  return new Promise((resolve) => {
    if (window.PaystackPop) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

// ─── Generate unique Paystack reference ───────────────────────────────────────
function generateReference(userId, planId) {
  const ts   = Date.now();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SFN-${planId.toUpperCase()}-${ts}-${rand}`;
}

// ─── Create a pending payment record BEFORE opening popup ─────────────────────
async function createPendingPayment(userId, planId, billingCycle, amountKobo, reference) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single();

  const plan = PLAN_CONFIG[planId];

  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id:         userId,
      subscription_id:   sub?.id || null,
      plan_id:           planId,
      billing_cycle:     billingCycle,
      amount_kobo:       amountKobo,
      paystack_reference: reference,
      status:            'pending',
      qr_codes_granted:  0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── Activate subscription after Paystack confirms payment ───────────────────
// paystackRef = response.reference (Paystack v1 inline does NOT return response.transaction)
async function activateSubscription(userId, planId, billingCycle, paystackRef, paymentId) {
  const plan            = PLAN_CONFIG[planId];
  const newQrAllocation = plan.qr_allocation; // -1 = unlimited

  const now       = new Date();
  const periodEnd = new Date(now);
  if (billingCycle === 'yearly') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // Check whether a subscription row already exists for this user
  // Also fetch qr_allocated + qr_used so we can carry over unused credits
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id, qr_allocated, qr_used')
    .eq('user_id', userId)
    .maybeSingle();

  // Calculate final allocation:
  // If new plan is unlimited (-1) keep it unlimited.
  // Otherwise add any unused credits from the previous plan.
  let finalQrAllocation = newQrAllocation;
  if (newQrAllocation !== -1 && existingSub) {
    const prevAllocated  = existingSub.qr_allocated ?? 0;
    const prevUsed       = existingSub.qr_used       ?? 0;
    // Don't carry over from an unlimited plan (prevAllocated === -1)
    const carryOver      = prevAllocated === -1 ? 0 : Math.max(0, prevAllocated - prevUsed);
    finalQrAllocation    = newQrAllocation + carryOver;
  }

  let subErr;

  if (existingSub) {
    // Row exists — update it, reset qr_used (carry-over is baked into allocation)
    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan_id:              planId,
        billing_cycle:        billingCycle,
        status:               'active',
        qr_allocated:         finalQrAllocation,
        qr_used:              0,
        current_period_start: now.toISOString(),
        current_period_end:   periodEnd.toISOString(),
        trial_ends_at:        null,
        cancelled_at:         null,
        updated_at:           now.toISOString(),
      })
      .eq('user_id', userId);
    subErr = error;
  } else {
    // No row yet — insert one
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id:              userId,
        plan_id:              planId,
        billing_cycle:        billingCycle,
        status:               'active',
        qr_allocated:         finalQrAllocation,
        qr_used:              0,
        current_period_start: now.toISOString(),
        current_period_end:   periodEnd.toISOString(),
      });
    subErr = error;
  }

  if (subErr) {
    console.error('[Paystack] subscription update failed:', subErr);
    throw new Error(subErr.message);
  }

  // Mark payment record as success (non-fatal if it fails)
  if (paymentId) {
    const { error: payErr } = await supabase
      .from('payments')
      .update({
        status:           'success',
        paystack_tx_id:   paystackRef || null,
        qr_codes_granted: finalQrAllocation === -1 ? 999999 : finalQrAllocation,
        paid_at:          now.toISOString(),
      })
      .eq('id', paymentId);

    if (payErr) {
      console.warn('[Paystack] payment record update failed (non-fatal):', payErr.message);
    }
  }
}

// ─── Main: open Paystack popup ────────────────────────────────────────────────
/**
 * @param {object} opts
 * @param {string} opts.userId   - Supabase user ID
 * @param {string} opts.email      - User email for Paystack
 * @param {string} opts.planId     - 'basic' | 'pro' | 'business'
 * @param {string} opts.billingCycle - 'monthly' | 'yearly'
 * @param {function} opts.onSuccess  - called with { planId, billingCycle }
 * @param {function} opts.onCancel   - called when user closes popup
 * @param {function} opts.onError    - called with error message string
 */
export async function initializePayment({ userId, email, planId, billingCycle, onSuccess, onCancel, onError }) {
  try {
    await loadPaystackScript();

    const amountKobo = getChargeAmount(planId, billingCycle);
    if (!amountKobo) throw new Error('Invalid plan or amount');

    const reference  = generateReference(userId, planId);
    const payment    = await createPendingPayment(userId, planId, billingCycle, amountKobo, reference);

    const handler = window.PaystackPop.setup({
      key:       PAYSTACK_PUBLIC_KEY,
      email,
      amount:    amountKobo,
      currency:  'NGN',
      ref:       reference,
      metadata: {
        user_id:    userId,
        plan_id:      planId,
        billing_cycle: billingCycle,
        payment_id:   payment.id,
      },
      // Paystack requires callback to be a plain (non-async) function.
      // We fire-and-forget the async work inside it.
      // Paystack v1 inline fires callback with { reference, trxref }.
      // response.transaction is undefined — use response.reference instead.
      callback: function (response) {
        var ref = response.reference || response.trxref || null;
        activateSubscription(userId, planId, billingCycle, ref, payment ? payment.id : null)
          .then(function () {
            onSuccess?.({ planId: planId, billingCycle: billingCycle, reference: ref });
          })
          .catch(function (err) {
            onError?.(err.message);
          });
      },
      onClose: function () {
        onCancel?.();
      },
    });

    handler.openIframe();
  } catch (err) {
    onError?.(err.message || 'Payment initialisation failed');
  }
}

// ─── Fetch current subscription ───────────────────────────────────────────────
export async function getSubscription(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('user_id', userId)
    .single();

  if (error) return { subscription: null, error: error.message };
  return { subscription: data, error: null };
}

// ─── Fetch payment history ────────────────────────────────────────────────────
export async function getPaymentHistory(userId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { payments: [], error: error.message };
  return { payments: data, error: null };
}

// ─── Cancel subscription ──────────────────────────────────────────────────────
export async function cancelSubscription(userId) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: now, updated_at: now })
    .eq('user_id', userId);

  if (error) return { error: error.message };
  return { error: null };
}