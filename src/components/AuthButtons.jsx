import React, { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, Link } from "react-router-dom";
import { handleGoogleLogin, handleEmailSignup, handleEmailLogin, checkEmailProvider } from "./AuthService";
import { useTheme } from "../context/ThemeContext";

const validatePasswordStrength = (pwd) => {
  const hasLength    = pwd.length >= 8;
  const hasNumber    = /\d/.test(pwd);
  const hasSymbol    = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);
  const hasUpperCase = /[A-Z]/.test(pwd);
  const strength = [hasLength, hasNumber, hasSymbol, hasUpperCase].filter(Boolean).length;
  return { strength };
};

export default function AuthButtons({ setMessage }) {
  // Step: 'email' -> 'password'
  const [step,           setStep]           = useState('email');
  const [detectedMode,   setDetectedMode]   = useState(null); // 'login' | 'register'
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword,   setShowPassword]   = useState(false);
  const [agreedToTerms,  setAgreedToTerms]  = useState(false);
  const [checkingEmail,  setCheckingEmail]  = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [googleLoading,  setGoogleLoading]  = useState(false);
  const passwordRef = useRef(null);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const inputCls = `w-full py-3 pl-10 pr-4 rounded-xl text-sm outline-none transition-all
    ${isDark
      ? 'bg-[#1e1e1e] border border-[#303030] text-white placeholder-[#555] focus:border-[#4a4a4a]'
      : 'bg-[#f7f7f7] border border-[#d0d0d0] text-[#111] placeholder-[#aaa] focus:border-primary focus:bg-white'}`;

  // ── Step 1: check email ──────────────────────────────────────────────────
  const handleEmailContinue = async () => {
    const trimmed = email.trim();
    if (!trimmed) { setMessage({ err: 'Email is required' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setMessage({ err: 'Enter a valid email address' }); return;
    }

    setCheckingEmail(true);
    const provider = await checkEmailProvider(trimmed);
    setCheckingEmail(false);

    if (provider === 'google') {
      setMessage({ err: 'This email is linked to a Google account. Use "Continue with Google" above to sign in.' });
      return;
    }

    if (provider === 'email') {
      setDetectedMode('login');
    } else {
      setDetectedMode('register');
    }

    setStep('password');
    setTimeout(() => passwordRef.current?.focus(), 80);
  };

  const goBack = () => {
    setStep('email');
    setDetectedMode(null);
    setPassword('');
    setPasswordStrength(0);
    setShowPassword(false);
    setAgreedToTerms(false);
    setMessage({ err: '', success: '' });
  };

  // ── Step 2: submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!password.trim()) { setMessage({ err: 'Password is required' }); return; }

    if (detectedMode === 'register') {
      if (password.length < 6) { setMessage({ err: 'Password must be at least 6 characters' }); return; }
      if (!agreedToTerms) { setMessage({ err: 'You must agree to the Terms and Privacy Policy' }); return; }

      setSubmitting(true);
      try {
        const user = await handleEmailSignup(email.trim(), password);
        if (user) {
          setMessage({ success: 'Check your email to verify your account.' });
          setTimeout(() => navigate('/verify-email-pending', { state: { email } }), 1500);
        }
      } catch (err) {
        setMessage({ err: err.message });
      } finally {
        setSubmitting(false);
      }
    } else {
      setSubmitting(true);
      try {
        const user = await handleEmailLogin(email.trim(), password);
        if (user) {
          setMessage({ success: 'Signing in...' });
          setTimeout(() => navigate('/dashboard'), 800);
        }
      } catch (err) {
        setMessage({ err: err.message.includes('Invalid login credentials') ? 'Wrong password. Try again.' : err.message });
      } finally {
        setSubmitting(false);
      }
    }
  };

  // ── Google ─────────────────────────────────────────────────────────────────
  const useGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await handleGoogleLogin();
    } catch (err) {
      setMessage({ err: err.message });
      setGoogleLoading(false);
    }
  };

  return (
    <div className={`flex flex-col w-full min-w-[300px] sm:w-[420px] gap-5 px-8 sm:px-10 py-10 rounded-2xl transition-colors duration-200
      ${isDark ? 'bg-[#141414] border border-[#272727]' : 'bg-white border border-[#d0d0d0] shadow-sm'}`}>

      {/* ── Title ── */}
      <div>
        <h3 className={`text-[26px] font-poltawski font-bold tracking-tight ${isDark ? 'text-white' : 'text-primary'}`}>
          {step === 'email'
            ? 'Sign in or sign up'
            : detectedMode === 'login' ? 'Welcome back' : 'Create your account'}
        </h3>
        {step === 'email' && (
          <p className={`text-sm mt-1 ${isDark ? 'text-[#999]' : 'text-[#666]'}`}>
            Enter your email to continue
          </p>
        )}
        {step === 'password' && detectedMode === 'login' && (
          <p className={`text-sm mt-1 ${isDark ? 'text-[#999]' : 'text-[#666]'}`}>
            We found your account. Enter your password.
          </p>
        )}
        {step === 'password' && detectedMode === 'register' && (
          <p className={`text-sm mt-1 ${isDark ? 'text-[#999]' : 'text-[#666]'}`}>
            No account found. Set a password to get started.
          </p>
        )}
      </div>

      {/* ── Google button — always visible ── */}
      <button
        onClick={useGoogleLogin}
        disabled={googleLoading || checkingEmail || submitting}
        className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all
          ${googleLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isDark
            ? 'bg-white text-[#1f2937] border border-transparent hover:bg-[#f3f4f6]'
            : 'bg-white text-[#374151] border border-[#c8c8c8] hover:bg-[#f9fafb] hover:shadow-sm'}`}
      >
        {googleLoading
          ? <span className="w-4 h-4 rounded-full border-2 border-[#ccc] border-t-[#999] animate-spin" />
          : <><Icon icon="flat-color-icons:google" width="18" height="18" />Continue with Google</>
        }
      </button>

      {/* ── Consent notice ── */}
      <p className={`-mt-2 text-center text-[11px] leading-relaxed ${isDark ? 'text-[#666]' : 'text-[#999]'}`}>
        By continuing, you agree to our{' '}
        <Link to="/terms" target="_blank" className={`underline underline-offset-2 ${isDark ? 'hover:text-[#ccc]' : 'hover:text-primary'}`}>Terms</Link>
        {' '}and{' '}
        <Link to="/privacy" target="_blank" className={`underline underline-offset-2 ${isDark ? 'hover:text-[#ccc]' : 'hover:text-primary'}`}>Privacy Policy</Link>
      </p>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 -mt-1">
        <div className={`flex-1 h-px ${isDark ? 'bg-[#2a2a2a]' : 'bg-[#e0e0e0]'}`} />
        <span className={`text-xs ${isDark ? 'text-[#666]' : 'text-[#999]'}`}>or</span>
        <div className={`flex-1 h-px ${isDark ? 'bg-[#2a2a2a]' : 'bg-[#e0e0e0]'}`} />
      </div>

      {/* ── Step 1: Email field ── */}
      {step === 'email' && (
        <>
          <div className="relative -mt-1">
            <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-[#666]' : 'text-[#999]'}`}>
              <Icon icon="ic:round-email" width="16" />
            </span>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmailContinue()}
              autoFocus
              className={inputCls}
            />
          </div>

          <button
            onClick={handleEmailContinue}
            disabled={checkingEmail || googleLoading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-primary hover:bg-opacity-85 text-white transition-all disabled:opacity-60 cursor-pointer -mt-1"
          >
            {checkingEmail
              ? <><span className="inline-block mr-2 w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin align-middle" />Checking...</>
              : 'Continue'
            }
          </button>
        </>
      )}

      {/* ── Step 2: Password field ── */}
      {step === 'password' && (
        <>
          {/* Email chip with back button */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm -mt-1 ${isDark ? 'bg-[#1e1e1e] border border-[#303030]' : 'bg-[#f7f7f7] border border-[#d0d0d0]'}`}>
            <Icon icon="ic:round-email" width="14" className={isDark ? 'text-[#666]' : 'text-[#999]'} />
            <span className={`flex-1 truncate ${isDark ? 'text-white' : 'text-[#111]'}`}>{email}</span>
            <button
              type="button"
              onClick={goBack}
              className={`text-xs font-medium shrink-0 ${isDark ? 'text-[#D4AF37] hover:text-white' : 'text-primary hover:opacity-70'} transition-colors`}
            >
              Change
            </button>
          </div>

          {/* Password input */}
          <div className="-mt-1">
            <div className="relative">
              <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-[#666]' : 'text-[#999]'}`}>
                <Icon icon="ic:round-lock" width="16" />
              </span>
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                placeholder={detectedMode === 'register' ? 'Create a password' : 'Password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (detectedMode === 'register') setPasswordStrength(validatePasswordStrength(e.target.value).strength);
                }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className={`w-full py-3 pl-10 pr-10 rounded-xl text-sm outline-none transition-all
                  ${isDark
                    ? 'bg-[#1e1e1e] border border-[#303030] text-white placeholder-[#555] focus:border-[#4a4a4a]'
                    : 'bg-[#f7f7f7] border border-[#d0d0d0] text-[#111] placeholder-[#aaa] focus:border-primary focus:bg-white'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-[#666] hover:text-[#bbb]' : 'text-[#aaa] hover:text-[#555]'}`}
              >
                <Icon icon={showPassword ? 'lucide:eye' : 'lucide:eye-off'} width="15" />
              </button>
            </div>

            {/* Password strength — register only */}
            {detectedMode === 'register' && password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i < passwordStrength
                        ? passwordStrength === 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-yellow-500' : 'bg-green-500'
                        : isDark ? 'bg-[#333]' : 'bg-[#e0e0e0]'
                    }`} />
                  ))}
                </div>
                <p className={`text-xs ${passwordStrength === 1 ? 'text-red-500' : passwordStrength === 2 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {passwordStrength === 1 && 'Weak'}
                  {passwordStrength === 2 && 'Fair'}
                  {passwordStrength === 3 && 'Good'}
                  {passwordStrength === 4 && 'Strong'}
                </p>
              </div>
            )}

            {detectedMode === 'register' && !password && (
              <p className={`text-xs mt-1.5 ${isDark ? 'text-[#555]' : 'text-[#aaa]'}`}>
                Use 8+ characters with a number, symbol and uppercase letter
              </p>
            )}

            {/* Forgot password — login only */}
            {detectedMode === 'login' && (
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className={`text-xs font-medium transition-colors ${isDark ? 'text-[#666] hover:text-[#D4AF37]' : 'text-[#999] hover:text-primary'}`}
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {/* Terms — register only */}
          {detectedMode === 'register' && (
            <label className="flex items-start gap-2.5 cursor-pointer select-none -mt-1">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#0F4C3A] flex-shrink-0"
              />
              <span className={`text-xs leading-relaxed ${isDark ? 'text-[#999]' : 'text-[#555]'}`}>
                I agree to the{' '}
                <Link to="/terms" target="_blank" className={`font-semibold underline underline-offset-2 ${isDark ? 'text-[#D4AF37]' : 'text-primary'}`}>Terms of Use</Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" className={`font-semibold underline underline-offset-2 whitespace-nowrap ${isDark ? 'text-[#D4AF37]' : 'text-primary'}`}>
                  Privacy Policy <span className="text-red-400">*</span>
                </Link>
              </span>
            </label>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || googleLoading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-primary hover:bg-opacity-85 text-white transition-all disabled:opacity-50 cursor-pointer -mt-1"
          >
            {submitting
              ? <><span className="inline-block mr-2 w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin align-middle" />{detectedMode === 'register' ? 'Creating account...' : 'Signing in...'}</>
              : detectedMode === 'register' ? 'Create Account' : 'Sign in'
            }
          </button>
        </>
      )}

    </div>
  );
}
