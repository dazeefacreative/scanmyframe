import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatPrice } from '../services/paystackService';
import {
  getReferralProfile,
  setStandardReferralCode,
  slugifyUsername,
  getMyReferrals,
  getMyCommissions,
  getMyPayouts,
  listBanks,
  resolveAccount,
  saveBankAccount,
  getPayoutAccount,
} from '../services/referralService';

import Header from '../components/Header';

const SUB_STATUS = {
  free:      { cls: 'bg-neutral-100 text-neutral-500',  label: 'Free'    },
  trial:     { cls: 'bg-blue-100 text-blue-700',        label: 'Trial'   },
  active:    { cls: 'bg-emerald-100 text-emerald-700',  label: 'Active'  },
  past_due:  { cls: 'bg-red-100 text-red-600',          label: 'Past Due'},
  cancelled: { cls: 'bg-amber-100 text-amber-700',      label: 'Cancelled'},
};

const COMMISSION_STATUS = {
  pending: { cls: 'bg-amber-100 text-amber-700',     label: 'Pending' },
  paid:    { cls: 'bg-emerald-100 text-emerald-700', label: 'Paid'    },
};

const PAYOUT_STATUS = {
  pending: { cls: 'bg-amber-100 text-amber-700',    label: 'Pending' },
  paid:    { cls: 'bg-emerald-100 text-emerald-700', label: 'Paid'   },
  failed:  { cls: 'bg-red-100 text-red-600',         label: 'Failed' },
};

function Badge({ map, value, fallback }) {
  const s = map[value] || fallback;
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wide ${s.cls}`}>
      {s.label}
    </span>
  );
}

function monthLabel(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function dateLabel(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CONFIDENCE_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };
const REFERRAL_VOLUME_LABELS = { '<20': 'Fewer than 20 / month', '20-50': '20–50 / month', '>50': 'More than 50 / month' };

export default function Referrals() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [application, setApplication] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);

  const [optInError, setOptInError] = useState('');
  const [optInSubmitting, setOptInSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [banks, setBanks] = useState([]);
  const [payoutAccount, setPayoutAccount] = useState(null);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [bankError, setBankError] = useState('');

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    (async () => {
      const { profile: p, application: app } = await getReferralProfile(user.id);
      if (!mounted) return;
      setProfile(p);
      setApplication(app);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, [user?.id]);

  useEffect(() => {
    if (!user || !profile) return;

    const isActiveReferrer = profile.referral_type === 'standard' ||
      (profile.account_type === 'partner' && profile.partner_status === 'approved');

    if (!isActiveReferrer) return;

    let mounted = true;
    setBankError('');

    (async () => {
      try {
        const [{ referrals: refs }, { commissions: comms }, { payouts: pays }, { banks: bankList }, { account }] = await Promise.all([
          getMyReferrals(),
          getMyCommissions(),
          getMyPayouts(),
          listBanks(),
          getPayoutAccount(),
        ]);

        if (!mounted) return;

        setReferrals(refs);
        setCommissions(comms);
        setPayouts(pays);
        setBanks(bankList);
        setPayoutAccount(account);
        if (account) {
          setBankCode(account.bank_code || '');
          setAccountNumber(account.account_number || '');
        }
      } catch (err) {
        if (!mounted) return;
        setBankError(err?.message || 'Unable to load payout bank data.');
      }
    })();

    return () => { mounted = false; };
  }, [user?.id, profile?.referral_type, profile?.account_type, profile?.partner_status]);

  const bg      = isDark ? 'bg-[#0a0a0a]' : 'bg-[#f5f5f0]';
  const card    = isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-[#e8e8e4]';
  const text    = isDark ? 'text-white' : 'text-[#0F4C3A]';
  const sub     = isDark ? 'text-[#b0b0b0]' : 'text-[#6b6b6b]';
  const muted   = isDark ? 'text-[#888888]' : 'text-[#999999]';
  const border  = isDark ? 'border-[#2a2a2a]' : 'border-[#e8e8e4]';
  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
    isDark
      ? 'bg-[#111111] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#D4AF37]'
      : 'bg-white border-[#e8e8e4] text-[#111] placeholder:text-[#aaa] focus:border-[#0F4C3A]'
  }`;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <div className={`w-10 h-10 border-4 rounded-full animate-spin ${isDark ? 'border-white/20 border-t-white' : 'border-[#0F4C3A]/20 border-t-[#0F4C3A]'}`} />
      </div>
    );
  }

  const referralLink = profile?.referral_code && profile?.referral_code_type === 'link'
    ? `${window.location.origin}/?ref=${profile.referral_code}`
    : null;

  const handleCopy = (val) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleOptIn = async (e) => {
    e.preventDefault();
    setOptInError('');
    const code = slugifyUsername(profile?.full_name);
    if (!/^[a-z0-9-]{3,30}$/.test(code)) {
      setOptInError('Please update your username (at least 3 letters or numbers) before getting your referral link.');
      return;
    }
    setOptInSubmitting(true);
    const { error } = await setStandardReferralCode(code);
    setOptInSubmitting(false);
    if (error) {
      setOptInError(error);
      return;
    }
    setProfile(prev => ({
      ...prev,
      referral_type: 'standard',
      referral_code: code,
      referral_code_type: 'link',
      commission_rate: 0.10,
      commission_window_months: 12,
    }));
  };

  const handleResolveAccount = async () => {
    setPayoutError('');
    setResolvedName('');
    if (!bankCode || !/^\d{10}$/.test(accountNumber.trim())) {
      setPayoutError('Select a bank and enter a valid 10-digit account number.');
      return;
    }
    setResolving(true);
    const { accountName, error } = await resolveAccount(accountNumber.trim(), bankCode);
    setResolving(false);
    if (error) {
      setPayoutError(error);
      return;
    }
    setResolvedName(accountName);
  };

  const handleSaveAccount = async () => {
    setPayoutError('');
    if (!resolvedName) {
      setPayoutError('Resolve the account name before saving.');
      return;
    }
    const bank = banks.find(b => b.code === bankCode);
    setSavingAccount(true);
    const { error } = await saveBankAccount({
      accountNumber: accountNumber.trim(),
      bankCode,
      bankName: bank?.name || '',
      accountName: resolvedName,
    });
    setSavingAccount(false);
    if (error) {
      setPayoutError(error);
      return;
    }
    setPayoutAccount({
      bank_code: bankCode,
      bank_name: bank?.name || '',
      account_number: accountNumber.trim(),
      account_name: resolvedName,
      updated_at: new Date().toISOString(),
    });
    setResolvedName('');
  };

  const isActiveReferrer = profile && (
    profile.referral_type === 'standard' ||
    (profile.account_type === 'partner' && profile.partner_status === 'approved')
  );

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const monthlyEarnings = commissions
    .filter(c => (c.period_month || '').slice(0, 7) === currentMonthKey)
    .reduce((sum, c) => sum + (c.commission_kobo || 0), 0);
  const lifetimeEarnings = commissions.reduce((sum, c) => sum + (c.commission_kobo || 0), 0);

  return (
    <main className={`min-h-screen ${bg} transition-colors`}>
      <Helmet><title>Referrals - ScanMyFrame</title></Helmet>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <h1 className={`text-2xl sm:text-3xl font-bold font-[Poltawski_Nowy,serif] mb-2 ${text}`}>Referrals & Partnership</h1>
        <p className={`text-sm mb-8 ${sub}`}>Earn commission for every customer you bring to ScanMyFrame.</p>

        {/* ─── Partner: pending review ─────────────────────────────────── */}
        {profile?.account_type === 'partner' && profile?.partner_status === 'pending' && (
          <div className={`rounded-2xl border p-6 sm:p-8 ${card}`}>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              Application under review
            </div>
            <h2 className={`text-xl font-bold mb-3 ${text}`}>Thanks for applying to partner with ScanMyFrame</h2>
            <p className={`text-sm leading-relaxed mb-6 ${sub}`}>
              Our team is reviewing your application and will get back to you by email once a decision has been made.
              You won't be able to access your referral dashboard until your partnership is approved.
            </p>

            {application && (
              <div className={`rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 ${isDark ? 'bg-white/5' : 'bg-[#f5f9f7]'}`}>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${muted}`}>Applicant type</p>
                  <p className={`text-sm font-semibold ${text}`}>{application.applicant_type === 'team' ? `Team (${application.team_size} people)` : 'Individual'}</p>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${muted}`}>Preferred contract length</p>
                  <p className={`text-sm font-semibold ${text}`}>{application.contract_years} year{application.contract_years > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${muted}`}>Requested commission</p>
                  <p className={`text-sm font-semibold ${text}`}>{Math.round((application.requested_commission_rate || 0) * 100)}%</p>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${muted}`}>Confidence level</p>
                  <p className={`text-sm font-semibold ${text}`}>{CONFIDENCE_LABELS[application.confidence_level] || application.confidence_level}</p>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${muted}`}>Estimated monthly referrals</p>
                  <p className={`text-sm font-semibold ${text}`}>{REFERRAL_VOLUME_LABELS[application.estimated_monthly_referrals] || application.estimated_monthly_referrals}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${muted}`}>Audience fit</p>
                  <p className={`text-sm ${sub}`}>{application.audience_fit}</p>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${muted}`}>Preferred {application.preferred_code_type === 'promo_code' ? 'promo code' : 'referral link'}</p>
                  <p className={`text-sm font-semibold font-mono ${text}`}>{application.preferred_referral_code}</p>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${muted}`}>Submitted</p>
                  <p className={`text-sm font-semibold ${text}`}>{dateLabel(application.created_at)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Partner: rejected ───────────────────────────────────────── */}
        {profile?.account_type === 'partner' && profile?.partner_status === 'rejected' && (
          <div className={`rounded-2xl border p-6 sm:p-8 ${card}`}>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              Application not approved
            </div>
            <h2 className={`text-xl font-bold mb-3 ${text}`}>Your partnership application wasn't approved</h2>
            <p className={`text-sm leading-relaxed mb-4 ${sub}`}>
              After reviewing your application, our team has decided not to move forward with a partnership at this time.
            </p>
            {application?.reviewer_notes && (
              <div className={`rounded-xl p-5 ${isDark ? 'bg-white/5' : 'bg-[#f5f9f7]'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${muted}`}>Notes from our team</p>
                <p className={`text-sm ${sub}`}>{application.reviewer_notes}</p>
              </div>
            )}
            <p className={`text-sm leading-relaxed mt-5 ${sub}`}>
              If you have questions, feel free to <a href="mailto:support@scanmyframe.com" className="underline hover:opacity-70 transition-opacity">contact our support team</a>.
            </p>
          </div>
        )}

        {/* ─── Standard, not yet opted in ──────────────────────────────── */}
        {profile?.account_type === 'standard' && !profile?.referral_type && (
          <div className={`rounded-2xl border p-6 sm:p-8 ${card}`}>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              Earn 10% for 12 months
            </div>
            <h2 className={`text-xl font-bold mb-3 ${text}`}>Share ScanMyFrame, earn recurring commission</h2>
            <p className={`text-sm leading-relaxed mb-6 ${sub}`}>
              Pick a referral link, share it with anyone you know. For every person who signs up through your link
              and subscribes to a paid plan, you'll earn <strong className={text}>10% of their subscription revenue every month for 12 months</strong>.
            </p>

            <form onSubmit={handleOptIn} className="flex flex-col gap-3 max-w-md">
              <label className={`text-xs font-bold uppercase tracking-widest ${muted}`}>Your referral link</label>
              <code className={`text-sm font-mono px-4 py-2.5 rounded-xl border ${border} ${text}`}>
                {window.location.origin}/?ref={slugifyUsername(profile?.full_name) || '...'}
              </code>
              <p className={`text-xs ${muted}`}>Based on your username. Update your username from your dashboard if you'd like to change this.</p>
              {optInError && <p className="text-sm text-red-500">{optInError}</p>}
              <button
                type="submit"
                disabled={optInSubmitting}
                className="self-start bg-[#0F4C3A] text-[#FAF5DD] px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {optInSubmitting ? 'Setting up…' : 'Get my referral link'}
              </button>
            </form>

            <p className={`text-xs mt-6 ${muted}`}>
              Looking for a custom commission rate or a longer-term partnership instead?{' '}
              <Link to="/partnership" className="underline hover:opacity-70 transition-opacity">Apply as a partner</Link>.
            </p>
          </div>
        )}

        {/* ─── Active referrer dashboard (standard or approved partner) ─── */}
        {isActiveReferrer && (
          <div className="flex flex-col gap-6">
            {/* Referral code box */}
            <div className={`rounded-2xl border p-6 ${card}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${muted}`}>
                Your {profile.referral_code_type === 'promo_code' ? 'promo code' : 'referral link'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <code className={`text-sm font-mono px-4 py-2.5 rounded-xl border flex-1 min-w-0 truncate ${border} ${text}`}>
                  {referralLink || profile.referral_code}
                </code>
                <button
                  onClick={() => handleCopy(referralLink || profile.referral_code)}
                  className="bg-[#0F4C3A] text-[#FAF5DD] px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {profile.referral_code_type === 'promo_code' && (
                <p className={`text-xs mt-3 ${muted}`}>Tell people to enter this code when they sign up.</p>
              )}
              <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-current border-opacity-10">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${muted}`}>Commission rate</p>
                  <p className={`text-lg font-bold ${text}`}>{Math.round((profile.commission_rate || 0) * 100)}%</p>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${muted}`}>Commission window</p>
                  <p className={`text-lg font-bold ${text}`}>{profile.commission_window_months} months</p>
                </div>
              </div>
            </div>

            {/* Earnings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`rounded-2xl border p-6 ${card}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${muted}`}>This month's earnings</p>
                <p className={`text-2xl font-bold font-[Poltawski_Nowy,serif] ${text}`}>{formatPrice(monthlyEarnings)}</p>
              </div>
              <div className={`rounded-2xl border p-6 ${card}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${muted}`}>Lifetime earnings</p>
                <p className={`text-2xl font-bold font-[Poltawski_Nowy,serif] ${text}`}>{formatPrice(lifetimeEarnings)}</p>
              </div>
            </div>

            {/* Referred users */}
            <div className={`rounded-2xl border p-6 ${card}`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${muted}`}>Referred users ({referrals.length})</h3>
              {referrals.length === 0 ? (
                <p className={`text-sm ${sub}`}>No one has signed up with your link yet.</p>
              ) : (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`text-left border-b ${border}`}>
                        <th className={`py-2 px-2 font-semibold ${muted}`}>User</th>
                        <th className={`py-2 px-2 font-semibold ${muted}`}>Signed up</th>
                        <th className={`py-2 px-2 font-semibold ${muted}`}>Plan</th>
                        <th className={`py-2 px-2 font-semibold ${muted}`}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map(r => (
                        <tr key={r.id} className={`border-b last:border-0 ${border}`}>
                          <td className={`py-2.5 px-2 font-medium ${text}`}>{r.display_name}</td>
                          <td className={`py-2.5 px-2 ${sub}`}>{dateLabel(r.signed_up_at)}</td>
                          <td className={`py-2.5 px-2 ${sub} capitalize`}>{r.plan_id || '—'}</td>
                          <td className="py-2.5 px-2">
                            {r.subscription_status
                              ? <Badge map={SUB_STATUS} value={r.subscription_status} fallback={SUB_STATUS.active} />
                              : <span className={`text-xs ${muted}`}>No subscription</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Commission ledger */}
            <div className={`rounded-2xl border p-6 ${card}`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${muted}`}>Commission history</h3>
              {commissions.length === 0 ? (
                <p className={`text-sm ${sub}`}>No commissions earned yet.</p>
              ) : (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`text-left border-b ${border}`}>
                        <th className={`py-2 px-2 font-semibold ${muted}`}>Month</th>
                        <th className={`py-2 px-2 font-semibold ${muted}`}>Referred user</th>
                        <th className={`py-2 px-2 font-semibold ${muted}`}>Month #</th>
                        <th className={`py-2 px-2 font-semibold ${muted}`}>Commission</th>
                        <th className={`py-2 px-2 font-semibold ${muted}`}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map(c => (
                        <tr key={c.id} className={`border-b last:border-0 ${border}`}>
                          <td className={`py-2.5 px-2 ${sub}`}>{monthLabel(c.period_month)}</td>
                          <td className={`py-2.5 px-2 font-medium ${text}`}>{c.referred_display_name}</td>
                          <td className={`py-2.5 px-2 ${sub}`}>{c.month_number} / {profile.commission_window_months}</td>
                          <td className={`py-2.5 px-2 font-semibold ${text}`}>{formatPrice(c.commission_kobo)}</td>
                          <td className="py-2.5 px-2"><Badge map={COMMISSION_STATUS} value={c.status} fallback={COMMISSION_STATUS.pending} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payout history */}
            <div className={`rounded-2xl border p-6 ${card}`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${muted}`}>Payout history</h3>
              {payouts.length === 0 ? (
                <p className={`text-sm ${sub}`}>No payouts yet. Payouts are processed monthly.</p>
              ) : (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`text-left border-b ${border}`}>
                        <th className={`py-2 px-2 font-semibold ${muted}`}>Period</th>
                        <th className={`py-2 px-2 font-semibold ${muted}`}>Amount</th>
                        <th className={`py-2 px-2 font-semibold ${muted}`}>Status</th>
                        <th className={`py-2 px-2 font-semibold ${muted}`}>Paid on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map(p => (
                        <tr key={p.id} className={`border-b last:border-0 ${border}`}>
                          <td className={`py-2.5 px-2 ${sub}`}>{monthLabel(p.period_month)}</td>
                          <td className={`py-2.5 px-2 font-semibold ${text}`}>{formatPrice(p.total_amount_kobo)}</td>
                          <td className="py-2.5 px-2"><Badge map={PAYOUT_STATUS} value={p.status} fallback={PAYOUT_STATUS.pending} /></td>
                          <td className={`py-2.5 px-2 ${sub}`}>{p.paid_at ? dateLabel(p.paid_at) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payout bank account */}
            <div className={`rounded-2xl border p-6 ${card}`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${muted}`}>Payout bank account</h3>
              <p className={`text-sm leading-relaxed mb-5 ${sub}`}>
                Add the Nigerian bank account where your monthly commission payouts should be sent.
              </p>

              {payoutAccount && (
                <div className={`rounded-xl p-4 mb-5 ${isDark ? 'bg-white/5' : 'bg-[#f5f9f7]'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${muted}`}>Current account on file</p>
                  <p className={`text-sm font-semibold ${text}`}>{payoutAccount.account_name}</p>
                  <p className={`text-sm ${sub}`}>{payoutAccount.bank_name} ({payoutAccount.account_number})</p>
                </div>
              )}

              <div className="flex flex-col gap-3 max-w-md">
                <div>
                  <label className={`text-xs font-bold uppercase tracking-widest block mb-1.5 ${muted}`}>Bank</label>
                  <select
                    className={inputCls}
                    value={bankCode}
                    onChange={e => { setBankCode(e.target.value); setResolvedName(''); }}
                  >
                    <option value="">Select your bank</option>
                    {banks.map(b => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                  {bankError && <p className="text-sm text-red-500 mt-2">{bankError}</p>}
                </div>

                <div>
                  <label className={`text-xs font-bold uppercase tracking-widest block mb-1.5 ${muted}`}>Account number</label>
                  <input
                    className={inputCls}
                    placeholder="0123456789"
                    maxLength={10}
                    value={accountNumber}
                    onChange={e => { setAccountNumber(e.target.value.replace(/\D/g, '')); setResolvedName(''); }}
                  />
                </div>

                {payoutError && <p className="text-sm text-red-500">{payoutError}</p>}

                {resolvedName && (
                  <p className={`text-sm ${sub}`}>
                    Account name: <strong className={text}>{resolvedName}</strong>
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  {!resolvedName ? (
                    <button
                      type="button"
                      onClick={handleResolveAccount}
                      disabled={resolving || !bankCode || accountNumber.trim().length !== 10}
                      className={`px-6 py-2.5 rounded-xl text-sm font-bold border transition-opacity disabled:opacity-50 ${border} ${text}`}
                    >
                      {resolving ? 'Verifying…' : 'Verify account'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveAccount}
                      disabled={savingAccount}
                      className="bg-[#0F4C3A] text-[#FAF5DD] px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {savingAccount ? 'Saving…' : 'Save account'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
