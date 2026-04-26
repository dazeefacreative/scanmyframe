import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { requestPasswordReset } from '../services/supabaseHelpers';
import MessageDisplay from '../components/MessageDisplay';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ success: '', err: '' });
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage({ err: 'Please enter a valid email address (e.g. you@example.com).' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ err: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(email);

      if (result.error) {
        if (result.error.includes('not found')) {
          setMessage({ err: 'We couldn\'t find an account with that email address. Double-check the email or create a new account.' });
        } else {
          setMessage({ err: result.error });
        }
      } else {
        setMessage({ success: result.message });
        setSubmitted(true);
        setTimeout(() => {
          navigate('/signin');
        }, 3000);
      }
    } catch (error) {
      setMessage({ err: 'We\'re experiencing a technical issue. Our team has been notified. Please try again shortly.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#000000]">
        <section className="h-fit bg-[#000000] bg-[url('./assets/images/Background.png')] bg-contain bg-no-repeat bg-center flex items-center justify-end pt-[50px] sm:pr-[8%] lg:pr-[12%] xl:pr-[15%]">
        <div className="relative mx-auto sm:m-0 max-w-[425px]">
          <MessageDisplay message={message} setMessage={setMessage} />

          <div className="flex flex-col gap-6 w-full min-w-[300px] sm:w-[425px] min-h-[600px] bg-black border border-primary rounded-[18px] py-5 px-10 sm:p-[40px_70px] shadow-[-10px_0_4px_0_rgba(0,0,0,0.48)]">
            <h3 className="text-2xl font-poltawski font-bold text-secondary">
              Reset Password
            </h3>

            {!submitted ? (
              <>
                <p className="text-secondary text-sm">
                  Enter your email and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="relative w-full">
                    <label htmlFor="forgot-password-email" className="block text-sm font-medium text-secondary mb-2">
                      Business Email
                    </label>
                    <span className="absolute left-4 top-10 text-secondary">
                      <Icon icon="ic:round-email" />
                    </span>
                    <input
                      id="forgot-password-email"
                      className="w-full py-2 pl-10 pr-6 border border-primary rounded-full text-sm bg-black text-secondary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition"
                      type="email"
                      placeholder="you@yourbusiness.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      aria-label="Business email address"
                      aria-describedby="email-hint"
                    />
                    <p id="email-hint" className="text-xs text-gray-500 mt-1">We'll send a secure reset link to this email</p>
                  </div>

                  <button
                    type="submit"
                    className="bg-primary hover:bg-opacity-80 text-secondary px-5 py-2.5 w-full border-0 text-[1rem] rounded-full cursor-pointer disabled:opacity-50 transition duration-200"
                    disabled={loading}
                    aria-busy={loading}
                  >
                    {loading ? (
                      <>
                        <span className="inline-block align-middle mr-2 w-4 h-4 rounded-full border-2 border-[#ccc] border-t-[#333] animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <p className="text-[12px] text-secondary">
                    Remember your password?{' '}
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
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4 items-center">
                <Icon
                  icon="ic:round-check-circle"
                  width="48"
                  height="48"
                  className="text-primary"
                />
                <p className="text-secondary text-center">
                  Check your email for a password reset link.
                </p>
                <p className="text-[12px] text-gray-400 text-center">
                  Didn't receive it? Check your spam folder or <span className="text-gold cursor-pointer" onClick={() => setSubmitted(false)}>request a new link</span>.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

    </main>
  );
}
