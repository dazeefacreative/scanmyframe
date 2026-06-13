/**
 * referralService.js
 * All referral & partnership data access lives here.
 */

import { supabase } from './supabaseClient';

// ─── Referral profile (referral fields + partner application if any) ─────────
export async function getReferralProfile(userId) {
  const { data: profile, error } = await supabase
    .from('users')
    .select('full_name, account_type, referral_type, referral_code, referral_code_type, commission_rate, commission_window_months, partner_status, referred_by, referred_at, first_paid_at')
    .eq('id', userId)
    .single();

  if (error) return { profile: null, application: null, error: error.message };

  let application = null;
  if (profile.account_type === 'partner') {
    const { data: app } = await supabase
      .from('partner_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    application = app || null;
  }

  return { profile, application, error: null };
}

// ─── Turn a username into a referral link slug ────────────────────────────────
export function slugifyUsername(name) {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

// ─── Apply a promo/referral code entered manually (e.g. during onboarding) ───
export async function applyPromoCode(code) {
  const { error } = await supabase.rpc('apply_referral_code', { p_code: code });
  if (error) return { error: error.message };
  return { error: null };
}

// ─── Bonus QR codes (if any) granted by the referrer the current user signed up through ───
export async function getMySignupBonus() {
  const { data, error } = await supabase.rpc('get_my_signup_bonus');
  if (error) return 0;
  return data || 0;
}

// ─── Standard opt-in: set referral link slug ──────────────────────────────────
export async function setStandardReferralCode(code) {
  const { error } = await supabase.rpc('set_standard_referral_code', { p_code: code });
  if (error) return { error: error.message };
  return { error: null };
}

// ─── Referred users list ───────────────────────────────────────────────────────
export async function getMyReferrals() {
  const { data, error } = await supabase.rpc('get_my_referrals');
  if (error) return { referrals: [], error: error.message };
  return { referrals: data || [], error: null };
}

// ─── Commission ledger ──────────────────────────────────────────────────────────
export async function getMyCommissions() {
  const { data, error } = await supabase.rpc('get_my_commissions');
  if (error) return { commissions: [], error: error.message };
  return { commissions: data || [], error: null };
}

// ─── Payout history ─────────────────────────────────────────────────────────────
export async function getMyPayouts() {
  const { data, error } = await supabase
    .from('referral_payouts')
    .select('*')
    .order('period_month', { ascending: false });

  if (error) return { payouts: [], error: error.message };
  return { payouts: data || [], error: null };
}

// ─── Payout bank account (referral-payout-account edge function) ────────────────
async function payoutAccountFetch(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/referral-payout-account`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Curated list of popular Nigerian banks. Codes are taken from Paystack's
// live bank list at request time, so they always match what /bank/resolve
// and /transferrecipient expect.
const PREFERRED_BANKS = [
  { label: '9Mobile Money',          match: /9mobile|9psb|9 payment/i },
  { label: 'Access Bank',            match: /^access bank/i },
  { label: 'Ecobank',                match: /ecobank/i },
  { label: 'FCMB',                   match: /first city monument|fcmb/i },
  { label: 'Fidelity Bank',          match: /fidelity/i },
  { label: 'First Bank',             match: /first bank/i },
  { label: 'Flutterwave',            match: /flutterwave/i },
  { label: 'GTBank',                 match: /guaranty trust|gtbank|gt bank/i },
  { label: 'Heritage Bank',          match: /heritage/i },
  { label: 'Kuda',                   match: /kuda/i },
  { label: 'Moniepoint',             match: /moniepoint/i },
  { label: 'OPay',                   match: /\bopay\b/i },
  { label: 'Palmpay',                match: /palmpay/i },
  { label: 'Paystack',               match: /paystack/i },
  { label: 'Polaris Bank',           match: /polaris/i },
  { label: 'Providus Bank',          match: /providus/i },
  { label: 'Remita',                 match: /remita/i },
  { label: 'Stanbic IBTC Bank',      match: /stanbic/i },
  { label: 'Standard Chartered Bank', match: /standard chartered/i },
  { label: 'Sterling Bank',          match: /sterling/i },
  { label: 'Union Bank',             match: /union bank/i },
  { label: 'United Bank for Africa', match: /united bank for africa|^uba/i },
  { label: 'Wema Bank',              match: /wema/i },
  { label: 'Zenith Bank',            match: /zenith/i },
];

export async function listBanks() {
  try {
    const data = await payoutAccountFetch({ resource: 'list_banks' });
    const live = data.banks || [];
    const banks = PREFERRED_BANKS
      .map(({ label, match }) => {
        const found = live.find(b => match.test(b.name));
        return found ? { code: found.code, name: label } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
    return { banks, error: null };
  } catch (error) {
    return { banks: [], error: error.message };
  }
}

export async function resolveAccount(accountNumber, bankCode) {
  try {
    const data = await payoutAccountFetch({ resource: 'resolve_account', account_number: accountNumber, bank_code: bankCode });
    return { accountName: data.account_name, error: null };
  } catch (error) {
    return { accountName: null, error: error.message };
  }
}

export async function saveBankAccount({ accountNumber, bankCode, bankName, accountName }) {
  try {
    await payoutAccountFetch({
      resource: 'save_account',
      account_number: accountNumber,
      bank_code: bankCode,
      bank_name: bankName,
      account_name: accountName,
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

export async function getPayoutAccount() {
  try {
    const { account } = await payoutAccountFetch({ resource: 'get_account' });
    return { account: account || null, error: null };
  } catch (error) {
    return { account: null, error: error.message };
  }
}
