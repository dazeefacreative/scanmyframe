import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTheme } from '../context/ThemeContext';
import { handlePartnerSignup, checkEmailProvider } from '../components/AuthService';
import { notifyPartnerApplication } from '../services/supabaseHelpers';

import logo from '../assets/images/Scanframe.png';
import logoAlt from '../assets/images/Scanframe alt.png';

const CONFIDENCE_OPTIONS = [
  { value: 'low',    label: 'Low - I can bring a few referrals' },
  { value: 'medium', label: 'Medium - I have a relevant audience' },
  { value: 'high',   label: 'High - I can drive consistent signups' },
];

const VOLUME_OPTIONS = [
  { value: '<20',  label: 'Fewer than 20 / month' },
  { value: '20-50', label: '20 – 50 / month' },
  { value: '>50',  label: 'More than 50 / month' },
];

export default function Partnership() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [applicantType,     setApplicantType]     = useState('individual');
  const [teamSize,          setTeamSize]          = useState(2);

  const [contractYears,     setContractYears]     = useState(1);
  const [commissionRate,    setCommissionRate]    = useState(10);
  const [confidenceLevel,   setConfidenceLevel]   = useState('medium');
  const [monthlyReferrals,  setMonthlyReferrals]  = useState('<20');
  const [audienceFit,       setAudienceFit]       = useState('');
  const [codeType,          setCodeType]          = useState('link');
  const [codeValue,         setCodeValue]         = useState('');

  const [agreed,     setAgreed]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const inputCls = `w-full py-3 px-4 rounded-xl text-sm outline-none transition-all
    ${isDark
      ? 'bg-[#1e1e1e] border border-[#303030] text-white placeholder-[#555] focus:border-[#4a4a4a]'
      : 'bg-[#f7f7f7] border border-[#d0d0d0] text-[#111] placeholder-[#aaa] focus:border-primary focus:bg-white'}`;
  const labelCls = `block text-xs font-bold uppercase tracking-widest mb-1.5 ${isDark ? 'text-[#999]' : 'text-[#6b6b6b]'}`;
  const selectCls = inputCls;

  const validate = () => {
    if (!fullName.trim()) return 'Tell us what we should address you as';

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Enter a valid email address';
    }
    if (password.length < 6) return 'Password must be at least 6 characters';

    if (applicantType === 'team') {
      if (!Number.isInteger(teamSize) || teamSize < 2 || teamSize > 1000) {
        return 'Team size must be a whole number between 2 and 1000';
      }
    }

    if (!audienceFit.trim()) return 'Tell us a bit about your audience';

    const code = codeValue.trim();
    if (codeType === 'link') {
      if (!/^[a-z0-9-]{3,30}$/.test(code.toLowerCase())) {
        return 'Referral link must be 3-30 characters: lowercase letters, numbers, and hyphens only';
      }
    } else {
      if (!/^[A-Z0-9]{4,20}$/.test(code.toUpperCase())) {
        return 'Promo code must be 4-20 characters: letters and numbers only';
      }
    }

    if (!agreed) return 'Please confirm you understand how partnerships are evaluated';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);

    try {
      const provider = await checkEmailProvider(email.trim());
      if (provider) {
        setError('This email is already registered on ScanMyFrame. Please use a different email address to apply as a partner.');
        setSubmitting(false);
        return;
      }

      const preferredCode = codeType === 'link' ? codeValue.trim().toLowerCase() : codeValue.trim().toUpperCase();

      await handlePartnerSignup(email.trim(), password, {
        contract_years: contractYears,
        requested_commission_rate: commissionRate / 100,
        confidence_level: confidenceLevel,
        estimated_monthly_referrals: monthlyReferrals,
        audience_fit: audienceFit.trim(),
        preferred_code_type: codeType,
        preferred_referral_code: preferredCode,
        applicant_type: applicantType,
        team_size: applicantType === 'team' ? teamSize : null,
      }, fullName.trim());

      notifyPartnerApplication({
        applicant_name: fullName.trim(),
        applicant_email: email.trim(),
        contract_years: contractYears,
        requested_commission_rate: commissionRate / 100,
        confidence_level: confidenceLevel,
        estimated_monthly_referrals: monthlyReferrals,
        audience_fit: audienceFit.trim(),
        preferred_code_type: codeType,
        preferred_referral_code: preferredCode,
        applicant_type: applicantType,
        team_size: applicantType === 'team' ? teamSize : null,
      });

      navigate('/verify-email-pending', { state: { email: email.trim() } });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={`min-h-screen flex flex-col items-center px-4 py-10 sm:py-16 transition-colors duration-200 ${isDark ? 'bg-[#080808]' : 'bg-[#fffdf3]'}`}>
      <Helmet><title>Partner with ScanMyFrame</title></Helmet>

      <Link to="/" className="mb-8">
        <img src={isDark ? logo : logoAlt} alt="ScanMyFrame" className="h-10 w-auto" />
      </Link>

      <form
        onSubmit={handleSubmit}
        className={`flex flex-col w-full max-w-xl gap-5 px-6 sm:px-10 py-8 sm:py-10 rounded-2xl transition-colors duration-200
          ${isDark ? 'bg-[#141414] border border-[#272727]' : 'bg-white border border-[#d0d0d0] shadow-sm'}`}
      >
        <div>
          <h1 className={`text-2xl sm:text-[26px] font-poltawski font-bold tracking-tight ${isDark ? 'text-white' : 'text-primary'}`}>
            Become a ScanMyFrame partner
          </h1>
          <p className={`text-sm mt-2 leading-relaxed ${isDark ? 'text-[#999]' : 'text-[#666]'}`}>
            Tell us about your audience and what you're looking for. ScanMyFrame will review your
            application and determine the terms that work best for both of us - you'll hear back from
            us by email before your partnership goes live.
          </p>
        </div>

        {/* Account */}
        <div>
          <label className={labelCls}>What should we address you as?</label>
          <input type="text" className={inputCls} placeholder="Your name or business name" value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Email address</label>
            <input type="email" className={inputCls} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`${inputCls} pr-10`}
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-[#666] hover:text-[#bbb]' : 'text-[#aaa] hover:text-[#555]'}`}
              >
                <Icon icon={showPassword ? 'lucide:eye' : 'lucide:eye-off'} width="15" />
              </button>
            </div>
          </div>
        </div>

        {/* Agreement form */}
        <div className={`pt-1 pb-2 text-xs font-bold uppercase tracking-widest 
          ${isDark ? 'text-[#D4AF37]' : 'text-primary'}`}>
          Partnership agreement
        </div>

        <div className={applicantType === 'team' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
          <div>
            <label className={labelCls}>Are you applying as an individual or a team?</label>
            <div className="flex gap-3">
              {[
                { value: 'individual', label: 'Just me' },
                { value: 'team',       label: 'A team' },
              ].map(o => (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => setApplicantType(o.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all
                    ${applicantType === o.value
                      ? 'bg-primary text-white border-primary'
                      : isDark ? 'bg-[#1e1e1e] border-[#303030] text-[#999]' : 'bg-[#f7f7f7] border-[#d0d0d0] text-[#666]'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {applicantType === 'team' && (
            <div>
              <label className={labelCls}>How many people are on your team?</label>
              <input
                type="number"
                min={2}
                max={1000}
                className={inputCls}
                value={teamSize}
                onChange={e => setTeamSize(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Preferred contract length</label>
            <select className={selectCls} value={contractYears} onChange={e => setContractYears(Number(e.target.value))}>
              {Array.from({ length: 3 }, (_, i) => i + 1).map(y => (
                <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Requested commission</label>
            <select className={selectCls} value={commissionRate} onChange={e => setCommissionRate(Number(e.target.value))}>
              {[10, 15, 20].map(r => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>How confident are you that you can bring us users?</label>
          <select className={selectCls} value={confidenceLevel} onChange={e => setConfidenceLevel(e.target.value)}>
            {CONFIDENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Estimated referrals you can bring per month</label>
          <select className={selectCls} value={monthlyReferrals} onChange={e => setMonthlyReferrals(e.target.value)}>
            {VOLUME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Tell us about your audience and how likely they are to use ScanMyFrame</label>
          <textarea
            rows={3}
            className={`${inputCls} resize-y`}
            placeholder="e.g. I run a print shop with 5,000 monthly visitors who frequently order custom frames…"
            value={audienceFit}
            onChange={e => setAudienceFit(e.target.value)}
          />
        </div>

        {/* Code type */}
        <div>
          <label className={labelCls}>How would you like to share ScanMyFrame?</label>
          <div className="flex gap-3 mb-3">
            {[
              { value: 'link',       label: 'A referral link' },
              { value: 'promo_code', label: 'A promo code' },
            ].map(o => (
              <button
                type="button"
                key={o.value}
                onClick={() => { setCodeType(o.value); setCodeValue(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all
                  ${codeType === o.value
                    ? 'bg-primary text-white border-primary'
                    : isDark ? 'bg-[#1e1e1e] border-[#303030] text-[#999]' : 'bg-[#f7f7f7] border-[#d0d0d0] text-[#666]'}`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {codeType === 'link' ? (
            <div className="flex items-center gap-2">
              <span className={`text-sm whitespace-nowrap 
                ${isDark ? 'text-[#999]' : 'text-[#666]'}`}>?ref=</span>
              <input
                className={inputCls}
                placeholder="our-frames"
                value={codeValue}
                onChange={e => setCodeValue(e.target.value)}
              />
            </div>
          ) : (
            <input
              className={inputCls}
              placeholder="OURFRAMES"
              value={codeValue}
              onChange={e => setCodeValue(e.target.value.toUpperCase())}
            />
          )}
          <p className={`text-xs mt-1.5 ${isDark ? 'text-[#555]' : 'text-[#aaa]'}`}>
            {codeType === 'link'
              ? 'Lowercase letters, numbers, and hyphens (3-30 characters).'
              : 'Letters and numbers, no spaces (4-20 characters). Customers will enter this at signup.'}
          </p>
        </div>

        {/* Disclaimer */}
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#0F4C3A] flex-shrink-0"
          />
          <span className={`text-xs leading-relaxed ${isDark ? 'text-[#999]' : 'text-[#555]'}`}>
            I understand that ScanMyFrame will evaluate this application and determine the final
            commission rate and terms that work best for both parties. My partnership account will
            stay pending until I'm notified by email. I agree to the{' '}
            <Link to="/terms" target="_blank" className={`font-semibold underline underline-offset-2 ${isDark ? 'text-[#D4AF37]' : 'text-primary'}`}>Terms of Use</Link>
            {' '}and{' '}
            <Link to="/privacy" target="_blank" className={`font-semibold underline underline-offset-2 ${isDark ? 'text-[#D4AF37]' : 'text-primary'}`}>Privacy Policy</Link>.
          </span>
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl font-bold text-sm bg-primary hover:bg-opacity-85 text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          {submitting
            ? <><span className="inline-block mr-2 w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin align-middle" />Submitting application...</>
            : 'Submit partnership application'
          }
        </button>

        <p className={`text-center text-sm ${isDark ? 'text-[#999]' : 'text-[#666]'}`}>
          Just want to share ScanMyFrame casually?{' '}
          <Link to="/signin?mode=register" className={`font-semibold underline underline-offset-2 ${isDark ? 'text-[#D4AF37]' : 'text-primary'}`}>
            Sign up as a vendor
          </Link>{' '}
          and set up a referral link from your dashboard.
        </p>
      </form>
    </main>
  );
}
