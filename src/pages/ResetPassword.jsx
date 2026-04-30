import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { resetPasswordWithToken } from '../services/supabaseHelpers';
import { supabase } from '../services/supabaseClient';
import MessageDisplay from '../components/MessageDisplay';
import Footer from '../components/SigninFooter';

// Password strength validator
const validatePasswordStrength = (pwd) => {
  const hasLength = pwd.length >= 8;
  const hasNumber = /\d/.test(pwd);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
  const hasUpperCase = /[A-Z]/.test(pwd);
  
  const strength = [hasLength, hasNumber, hasSymbol, hasUpperCase].filter(Boolean).length;
  return { strength, hasLength, hasNumber, hasSymbol, hasUpperCase };
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ success: '', err: '' });
  const [tokenValid, setTokenValid] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    const { strength } = validatePasswordStrength(pwd);
    setPasswordStrength(strength);
  };

  useEffect(() => {
    // Supabase automatically processes the recovery token on redirect
    // We just need to check if access_token is present or if user has session
    const accessToken = searchParams.get('access_token');
    const type = searchParams.get('type');

    // Token is valid if we have access_token with type=recovery
    // Or if Supabase has already authenticated the session
    if (!accessToken && type !== 'recovery') {
      // Give a small delay to allow Supabase to process
      const timer = setTimeout(() => {
        setTokenValid(true); // Still allow form to show - Supabase may have processed it
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setMessage({ err: 'Password is required before you can proceed.' });
      return;
    }

    const { strength, hasLength, hasNumber, hasSymbol } = validatePasswordStrength(password);
    if (strength < 3) {
      setMessage({ err: 'Password must be at least 8 characters with a number and a symbol.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ err: 'The passwords you entered don\'t match. Please re-enter them.' });
      return;
    }

    setLoading(true);
    try {
      const result = await resetPasswordWithToken(password);

      if (result.error) {
        if (result.error.includes('session')) {
          setMessage({ err: 'Your reset link has expired. Links are only valid for 1 hour. Request a new one below.' });
          setTimeout(() => navigate('/forgot-password'), 2000);
        } else {
          setMessage({ err: result.error });
        }
      } else {
        // Push in-app notification for the password reset
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await supabase.from('notification').insert({
              user_id:          session.user.id,
              type:             'success',
              message:          'Your password was successfully reset.',
              full_description: 'Your ScanMyFrame account password was changed just now. If you did not initiate this change, contact support immediately and request another password reset from a secure device.',
              is_read:          false,
            });
          }
        } catch (_) { /* best-effort */ }

        setMessage({ success: 'Password reset successfully! Redirecting to login...' });
        setTimeout(() => { navigate('/signin'); }, 2000);
      }
    } catch (error) {
      setMessage({ err: error.message || 'Failed to reset password. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <main className="min-h-screen flex flex-col justify-between bg-[#000000]">
        <section className="h-fit bg-[#000000] bg-[url('./assets/images/Background.png')] bg-contain bg-no-repeat bg-center flex items-center justify-end pt-[50px] sm:pr-[8%] lg:pr-[12%] xl:pr-[15%]">
          <div className="relative mx-auto sm:m-0 max-w-[425px]">
            <MessageDisplay message={message} setMessage={setMessage} />

            <div className="flex flex-col gap-6 w-full min-w-[300px] sm:w-[425px] min-h-[600px] bg-black border border-primary rounded-[18px] py-5 px-10 sm:p-[40px_70px] shadow-[-10px_0_4px_0_rgba(0,0,0,0.48)]">
              <h3 className="text-2xl font-poltawski font-bold text-secondary">
                Reset Password
              </h3>
              <p className="text-secondary text-sm">
                Your reset link is invalid or has expired. Please request a new one.
              </p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="bg-primary hover:bg-opacity-80 text-secondary px-5 py-2.5 w-full border-0 text-[1rem] rounded-full cursor-pointer"
              >
                Request New Link
              </button>
            </div>
          </div>
        </section>

        <footer className="w-full bg-primary position absolute bottom-0 left-0">
          <div className="m-0 flex flex-row justify-center items-center gap-2 text-secondary text-[12px] py-5">
            <p>2025 © All Right Reserved. ScanMyFrame</p>
            <div className="h-5 w-[1px] bg-secondary"></div>
            <p>Privacy</p>
            <div className="h-5 w-[1px] bg-secondary"></div>
            <p>Terms of use</p>
          </div>
        </footer>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#000000]">
      <section className="h-fit bg-[#000000] bg-[url('./assets/images/Background.png')] bg-contain bg-no-repeat bg-center flex items-center justify-end pt-[50px] sm:pr-[8%] lg:pr-[12%] xl:pr-[15%]">
        <div className="relative mx-auto sm:m-0 max-w-[425px]">
          <MessageDisplay message={message} setMessage={setMessage} />

          <div className="flex flex-col gap-6 w-full min-w-[300px] sm:w-[425px] min-h-[600px] bg-black border border-primary rounded-[18px] py-5 px-10 sm:p-[40px_70px] shadow-[-10px_0_4px_0_rgba(0,0,0,0.48)]">
            <h3 className="text-2xl font-poltawski font-bold text-secondary">
              Set New Password
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="relative w-full">
                <label htmlFor="new-password" className="block text-sm font-medium text-secondary mb-2">
                  New Password
                </label>
                <span className="absolute right-4 top-10 transform text-secondary cursor-pointer hover:text-gold transition"
                  onClick={() => setShowPassword(!showPassword)}
                  role="button"
                  tabIndex="0"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onKeyDown={(e) => e.key === 'Enter' && setShowPassword(!showPassword)}
                >
                  <Icon icon={showPassword ? 'lucide:eye' : 'lucide:eye-off'} width="20" />
                </span>
                <input
                  id="new-password"
                  className="w-full py-2 pl-4 pr-12 border border-primary rounded-full text-sm bg-black text-secondary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                  aria-label="New password"
                  aria-describedby="password-strength-info"
                />
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2" id="password-strength-info">
                    <div className="flex gap-1 mb-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition ${
                            i < passwordStrength
                              ? passwordStrength === 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-yellow-500' : 'bg-green-500'
                              : 'bg-gray-100'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-white">
                      {passwordStrength === 1 && 'Weak password'}
                      {passwordStrength === 2 && 'Fair password'}
                      {passwordStrength === 3 && 'Good password'}
                      {passwordStrength === 4 && 'Strong password'}
                    </p>
                  </div>
                )}
                <p className="text-xs text-white opacity-50 max-w-[250px] sm:w-full mt-2">At least 8 characters and try to combine letters, numbers and symbols</p>
              </div>

              <div className="relative w-full">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-secondary mb-2">
                  Confirm Password
                </label>
                <span className="absolute right-4 top-10 transform text-secondary cursor-pointer hover:text-gold transition"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  role="button"
                  tabIndex="0"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onKeyDown={(e) => e.key === 'Enter' && setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon icon={showConfirmPassword ? 'lucide:eye' : 'lucide:eye-off'} width="20" />
                </span>
                <input
                  id="confirm-password"
                  className="w-full py-2 pl-4 pr-12 border border-primary rounded-full text-sm bg-black text-secondary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  aria-label="Confirm password"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-2">Passwords do not match</p>
                )}
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
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="text-[12px] text-secondary">
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
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
