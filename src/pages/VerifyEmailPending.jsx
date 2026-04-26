import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { resendVerificationEmail } from '../services/supabaseHelpers';
import { useTheme } from '../context/ThemeContext';

export default function VerifyEmailPending() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { isDark } = useTheme();
  const [resendMessage, setResendMessage] = useState('');
  const email = location.state?.email || localStorage.getItem('pendingEmail') || '';

  useEffect(() => {
  if (countdown === 0) return;

  const timer = setInterval(() => {
    setCountdown((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [countdown]);

  const handleResend = async () => {
  if (countdown > 0) return;

  setIsResending(true);
  setResendMessage('');

  try {
    const result = await resendVerificationEmail(email);

    if (result.error) {
      setResendMessage({ err: result.error });
    } else {
      setResendMessage({ success: 'Verification email sent! Check your inbox and spam folder.' });
      setCountdown(60); // 🔥 reset countdown
    }
  } catch (error) {
    setResendMessage({ err: 'Failed to resend. Please try again.' });
  } finally {
    setIsResending(false);
  }
};

  const maskEmail = (email) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    const maskedLocal =
      local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  };

  return (
<main className={`min-h-screen flex items-center justify-center px-4 ${isDark ? 'bg-[#000000] text-white' : 'bg-white text-black'}`}>      <section className="w-full max-w-md">
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-4">
            <Icon
              icon="mdi:email-check"
              className="text-green-600 dark:text-green-400"
              width="48"
              height="48"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-4">
          Verify Your Email
        </h1>

        {/* Description */}
        <p className="text-center mb-6">
          We've sent a verification link to{' '}
          <span className="font-semibold">
            {maskEmail(email)}
          </span>
        </p>

        {/* Instructions */}
        <div className="border border-gray-800 rounded-lg p-6 mb-8">
          <p className="text-sm space-y-2">
            <span className="block mb-3">
              <strong>Check your email</strong> and click
              the verification link to activate your account.
            </span>
            <span className="block">
              If you don't see the email, check your <strong>spam</strong> or{' '}
              <strong>promotions</strong> folder.
            </span>
          </p>
        </div>

        {/* Messages */}
        {resendMessage && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              resendMessage.success
                ? 'bg-green-100 border border-green-300 text-green-700'
                : 'bg-red-100 border border-red-300 text-red-700'
            }`}
          >
            {resendMessage.success || resendMessage.err}
          </div>
        )}

        {/* Resend Button */}
        <button
          onClick={handleResend}
          disabled={isResending || countdown > 0}
          aria-busy={isResending}
          className={`
            w-full font-semibold py-3 px-4 rounded-lg mb-4
            text-white transition-colors duration-200
            ${isDark ? 'bg-[#0F4C3A] hover:bg-[#0d3d2f]' : 'bg-[#0F4C3A] hover:bg-[#0d3d2f]'}
            active:bg-[#0a2921]
            disabled:opacity-50 disabled:cursor-not-allowed
          `}        
          >
          {isResending ? (
            <span className="flex items-center justify-center gap-2">
              <Icon icon="mdi:loading" className="animate-spin" width="20" height="20" />
              Sending...
            </span>
          ) : countdown > 0 ? (
            `Resend in ${countdown}s`
          ) : (
            'Resend Verification Email'
          )}
        </button>

        {/* Back to Sign In */}
        <button
          onClick={() => navigate('/signin')}
          className="w-full text-center py-3 px-4 text-gray-400 hover:opacity-80 transition-colors duration-200 font-medium"
        >
          Back to Sign In
        </button>

        {/* Help Text */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-6">
          Verification link expires in 24 hours
        </p>
      </section>
    </main>
  );
}
