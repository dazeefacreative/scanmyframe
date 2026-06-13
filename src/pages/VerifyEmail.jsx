import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import MessageDisplay from '../components/MessageDisplay';
import { supabase } from '../services/supabaseClient';
import { applyPendingPartnerApplication } from '../components/AuthService';

export default function VerifyEmail() {
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ success: '', err: '' });
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
  const verifyEmail = async () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        localStorage.removeItem('pendingEmail');
        // Apply newsletter preference captured at signup
        const optIn = localStorage.getItem('scanframe_newsletter_opt_in');
        if (optIn !== null) {
          await supabase
            .from('users')
            .update({ newsletter_opt_in: optIn === '1' })
            .eq('id', session.user.id);
          localStorage.removeItem('scanframe_newsletter_opt_in');
        }
        // Submit any queued partnership application now that a session exists
        await applyPendingPartnerApplication();
        setMessage({ success: 'Email verified successfully!' });
        setVerified(true);
        setTimeout(() => navigate('/dashboard'), 2000);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        setLoading(false);
      }
    });

    // If no session after 5 seconds, assume verification failed
    setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setMessage({ err: 'Verification failed or link expired.' });
          setVerified(false);
        }
        return false;
      });
    }, 5000);

    return () => subscription.unsubscribe();
  };

  verifyEmail();
}, [navigate]);

  useEffect(() => {
  if (loading || verified) return; // only run when failed

  const timer = setInterval(() => {
    setRedirectCountdown((prev) => {
      if (prev <= 1) {
        clearInterval(timer);
        navigate('/verify-email-pending', { 
          state: { email: localStorage.getItem('pendingEmail') || '' } });
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [loading, verified]);

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#000000]">
      <section className="h-fit bg-[#000000] bg-[url('./assets/images/Background.png')] bg-contain bg-no-repeat bg-center flex items-center justify-end pt-[50px] sm:pr-[8%] lg:pr-[12%] xl:pr-[15%]">
        <div className="relative mx-auto sm:m-0 max-w-[425px]">
          <MessageDisplay message={message} setMessage={setMessage} />

          <div className="flex flex-col items-center gap-6 w-full min-w-[300px] sm:w-[425px] min-h-[600px] bg-black border border-primary rounded-[18px] py-5 px-10 sm:p-[40px_70px] shadow-[-10px_0_4px_0_rgba(0,0,0,0.48)]">
            {loading ? (
              <>
                <div className="inline-block mr-2 w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
                <p className="text-secondary font-poltawski text-lg">
                  Verifying email...
                </p>
              </>
            ) : verified ? (
              <>
                <Icon
                  icon="ic:round-check-circle"
                  width="64"
                  height="64"
                  className="text-primary mb-4"
                />
                <h3 className="text-2xl font-poltawski font-bold text-secondary text-center">
                  Email Verified!
                </h3>
                <p className="text-secondary text-center text-sm">
                  Your email has been verified successfully. Redirecting to login...
                </p>
              </>
            ) : (
              <>
                <Icon
                  icon="ic:round-error"
                  width="64"
                  height="64"
                  className="text-red-500 mb-4 items-center justify-center self-center"
                />
                <h3 className="text-2xl font-poltawski font-bold text-secondary text-center">
                  Verification Failed
                </h3>
                <p className="text-secondary text-center text-sm">
                  {message.err || 'Unable to verify your email. The link may have expired or is invalid.'}
                </p>

                {/* Redirect notice */}
                <div className="bg-primary/20 border border-primary rounded-lg p-4 text-center">
                  <p className="text-secondary text-sm">
                    Redirecting you to resend a new verification link in{' '}
                    <span className="text-gold font-bold">{redirectCountdown}s</span>...
                  </p>
                  <div className="w-full bg-gray-700 rounded-full h-1 mt-3">
                    <div
                      className="bg-primary h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${(redirectCountdown / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Manual redirect option */}
                <button
                  onClick={() => navigate('/verify-email-pending', { 
                    state: { email: localStorage.getItem('pendingEmail') || '' } 
                  })}
                  className="bg-primary hover:bg-opacity-80 text-secondary px-5 py-2.5 w-full border-0 text-[1rem] rounded-full cursor-pointer transition duration-200"
                >
                  Resend Verification Email Now
                </button>

                <p className="text-[12px] text-secondary text-center">
                  <span
                    className="text-gold cursor-pointer font-bold hover:text-white transition"
                    onClick={() => navigate('/signin')}
                    role="button"
                    tabIndex="0"
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/signin')}
                  >
                    Back to Login
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
