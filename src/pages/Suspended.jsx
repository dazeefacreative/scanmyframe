import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabaseClient';

import logo from '../assets/images/Scanframe.png';

const APPEAL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-appeal`;
const ANON_KEY   = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function Suspended() {
  const { isDark } = useTheme();

  const [form, setForm] = useState({ name: '', email: '', usage: '', reason: '', additional: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isDisabled, setIsDisabled] = useState(null);
  const [isSuspended, setIsSuspended] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const updates = {};
      if (user.email) updates.email = user.email;
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, is_disabled, is_suspended')
        .eq('id', user.id)
        .single();
      if (profile?.full_name) updates.name = profile.full_name;
      setIsDisabled(profile?.is_disabled || false);
      setIsSuspended(profile?.is_suspended || false);
      if (Object.keys(updates).length) setForm(f => ({ ...f, ...updates }));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading && !isDisabled && !isSuspended) {
      window.location.href = '/dashboard';
    }
  }, [loading, isDisabled, isSuspended]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.reason.trim() || !form.usage.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(APPEAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut({ scope: 'local' });
    window.location.href = '/signin';
  }

  const bg      = isDark ? 'bg-[#0a0a0a]'   : 'bg-[#f8f7f4]';
  const card    = isDark ? 'bg-[#111] border-white/8'  : 'bg-white border-[#0F4C3A]/10';
  const text    = isDark ? 'text-white'      : 'text-[#0F4C3A]';
  const sub     = isDark ? 'text-[#999]'    : 'text-[#4a7c6f]';
  const inputCls = `w-full px-4 py-3 rounded-xl border text-base outline-none transition-colors ${
    isDark
      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-white/30'
      : 'bg-white border-[#0F4C3A]/15 text-[#111] placeholder:text-[#999] focus:border-[#0F4C3A]/40'
  }`;
  const labelCls = `block text-xs font-bold uppercase tracking-widest mb-1.5 ${sub}`;

  return (
    <div className={`min-h-screen ${bg} flex flex-col items-center justify-center px-4 py-16`}>

      {/* Logo */}
      <Link to="/" className={`flex items-center jusify-center rounded-lg px-4 py-5 bg-primary mb-10 hover:opacity-100 transition-opacity`}>
        <img src={logo} alt="ScanMyFrame" className="w-10" />
      </Link>

      <div className={`w-full max-w-lg border rounded-2xl p-8 sm:p-10 ${card}`}>

        {loading || (!isDisabled && !isSuspended) ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-white/20 border-t-white' : 'border-[#0F4C3A]/20 border-t-[#0F4C3A]'}`}></div>
          </div>
        ) : submitted ? (
          <div>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${isDark ? 'bg-[#0F4C3A]/20' : 'bg-[#0F4C3A]/10'}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F4C3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 className={`text-2xl font-bold font-[Poltawski_Nowy,serif] mb-3 text-center ${text}`}>Appeal received</h2>
            <p className={`text-sm leading-relaxed text-center mb-6 ${sub}`}>
              We've received your appeal and sent a confirmation to <strong className={text}>{form.email}</strong>. Our team will review your information and respond within <strong className={text}>2–3 business days</strong>.
            </p>

            {/* What to do next */}
            <div className={`rounded-xl p-5 flex flex-col gap-3 ${isDark ? 'bg-white/5 border border-white/8' : 'bg-[#f5f9f7] border border-[#0F4C3A]/10'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${sub}`}>What to do next</p>
              <div className="flex gap-3">
                <span className="text-[#0F4C3A] font-bold text-sm mt-0.5">1.</span>
                <p className={`text-sm leading-relaxed ${sub}`}>
                  <strong className={text}>Wait for our response.</strong> Our team reviews every appeal carefully. You'll hear from us at the email you provided - no action is needed on your end.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-[#0F4C3A] font-bold text-sm mt-0.5">2.</span>
                <p className={`text-sm leading-relaxed ${sub}`}>
                  <strong className={text}>Don't submit another appeal.</strong> Submitting multiple appeals for the same case doesn't speed things up - it can actually push your case further back in the queue as our system flags duplicate submissions. One appeal is enough.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-[#0F4C3A] font-bold text-sm mt-0.5">3.</span>
                <p className={`text-sm leading-relaxed ${sub}`}>
                  <strong className={text}>Have more to add?</strong> Simply reply to the confirmation email we just sent you - we'll see it and attach it to your case.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-[#0F4C3A] font-bold text-sm mt-0.5">4.</span>
                <p className={`text-sm leading-relaxed ${sub}`}>
                  If you haven't heard from us after 3 business days - which is very unlikely - you're welcome to submit one follow-up appeal.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {isDisabled ? (
              // ─── DISABLED ACCOUNT VIEW ───
              <div>
                <div className="mb-8">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Account Closed
                  </div>
                  <h1 className={`text-2xl sm:text-3xl font-bold font-[Poltawski_Nowy,serif] mb-3 ${text}`}>
                    Your account has been permanently closed
                  </h1>
                </div>

                <div className={`rounded-xl p-6 mb-6 ${isDark ? 'bg-white/5 border border-white/8' : 'bg-[#f5f9f7] border border-[#0F4C3A]/10'}`}>
                  <p className={`text-sm leading-relaxed mb-4 ${sub}`}>
                    Due to a violation of our policies and terms of service. This decision was made after a thorough review of account activity and is considered final.
                  </p>
                  <p className={`text-sm leading-relaxed ${sub}`}>
                    As a result, you will no longer be able to access the platform, associated services, or any stored data linked to this account. If you believe this action was taken in error, you may contact our support team for further clarification.
                  </p>
                </div>

                <div className="mb-6">
                  <p className={`text-xs text-center font-bold uppercase tracking-widest mb-3 ${sub}`}>Are we wrong on this decision?</p>
                  <a
                    href={`mailto:support@scanmyframe.com?subject=CLOSURE REVIEW - ScanMyFrame, ${form.email}`}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                      isDark
                        ? 'bg-white/10 text-white hover:bg-white/15'
                        : 'bg-[#0F4C3A]/10 text-[#0F4C3A] hover:bg-[#0F4C3A]/20'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    Contact Support
                  </a>
                </div>

                <div className={`mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-[#0F4C3A]/10'}`}>
                  <p className={`text-xs leading-relaxed ${sub}`}>
                    For more information, please review our <a href="/terms" className="underline hover:opacity-70 transition-opacity">Terms of Service</a> and <a href="/privacy" className="underline hover:opacity-70 transition-opacity">Privacy Policy</a>.
                  </p>
                </div>
              </div>
            ) : (
              // ─── SUSPENDED ACCOUNT VIEW ───
              <>
                <div className="mb-8">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5 ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Account suspended
                  </div>
                  <h1 className={`text-2xl sm:text-3xl font-bold font-[Poltawski_Nowy,serif] mb-3 ${text}`}>
                    Your account has been suspended
                  </h1>
                  <p className={`text-sm leading-relaxed ${sub}`}>
                    We noticed activity on your account that doesn't align with ScanMyFrame's <a href="/terms" className="underline hover:opacity-70 transition-opacity">rules and guidelines</a>. As a result, access to your dashboard has been temporarily suspended.
                  </p>
                  <p className={`text-sm leading-relaxed mt-3 ${sub}`}>
                    Your frames and data are safe. If you believe this was a mistake, please fill in the form below and our team will review your case promptly.
                  </p>
                </div>

                {/* Appeal form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Full name <span className="text-red-400">*</span></label>
                  <input className={inputCls} placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Account email <span className="text-red-400">*</span></label>
                  <input className={inputCls} type="email" placeholder="email@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelCls}>How do you use ScanMyFrame? <span className="text-red-400">*</span></label>
                <textarea
                  rows={2}
                  className={`${inputCls} resize-y`}
                  placeholder="e.g. I'm a photographer selling framed prints to clients"
                  value={form.usage}
                  onChange={e => set('usage', e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Why do you think this is a mistake? <span className="text-red-400">*</span></label>
                <textarea
                  rows={4}
                  className={`${inputCls} resize-y`}
                  placeholder="Explain why you believe the suspension is incorrect…"
                  value={form.reason}
                  onChange={e => set('reason', e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>Any additional context <span className={`normal-case font-normal ${sub}`}>(optional)</span></label>
                <textarea
                  rows={3}
                  className={`${inputCls} resize-y`}
                  placeholder="Anything else that might help us understand your situation…"
                  value={form.additional}
                  onChange={e => set('additional', e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0F4C3A] text-[#FAF5DD] py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#FAF5DD] border-t-transparent rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : 'Submit appeal'}
              </button>
              </form>
              </>
            )}
          </>
        )}

        {/* Sign out */}
        <div className="mt-8 pt-6 border-t border-current border-opacity-10 text-center">
          <button onClick={handleSignOut} className={`text-xs ${sub} hover:opacity-70 transition-opacity`}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
