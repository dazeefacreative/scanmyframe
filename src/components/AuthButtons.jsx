import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate, Link } from "react-router-dom";
import { handleGoogleLogin, handleEmailSignup, handleEmailLogin } from "./AuthService";
import { useTheme } from "../context/ThemeContext";

const validatePasswordStrength = (pwd) => {
  const hasLength    = pwd.length >= 8;
  const hasNumber    = /\d/.test(pwd);
  const hasSymbol    = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);
  const hasUpperCase = /[A-Z]/.test(pwd);
  const strength = [hasLength, hasNumber, hasSymbol, hasUpperCase].filter(Boolean).length;
  return { strength };
};

export default function AuthButtons({ setMessage, initialMode = false }) {
  const [isRegister, setIsRegister] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [mailClickLoading, setMailClickLoading] = useState(false);
  const [googleClickLoading, setGoogleClickLoading] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const switchMode = (toRegister) => {
    setIsRegister(toRegister);
    setEmail("");
    setPassword("");
    setPasswordStrength(0);
    setShowPassword(false);
    setAgreedToTerms(false);
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (isRegister) setPasswordStrength(validatePasswordStrength(val).strength);
  };

  const registerWithEmail = async () => {
    if (!email.trim()) { setMessage({ err: "Email is required" }); return; }
    if (!password.trim()) { setMessage({ err: "Password is required" }); return; }
    if (password.length < 6) { setMessage({ err: "Password must be at least 6 characters" }); return; }
    if (!agreedToTerms) { setMessage({ err: "You must agree to the Terms and Privacy Policy" }); return; }
    setMailClickLoading(true);
    try {
      const user = await handleEmailSignup(email, password);
      if (user) {
        setMessage({ success: "Check your email to verify your account." });
        setTimeout(() => navigate("/verify-email-pending", { state: { email } }), 1500);
      }
    } catch (error) {
      setMessage({ err: error.message });
    } finally {
      setMailClickLoading(false);
    }
  };

  const handleEmailLoginClick = async () => {
    if (!email.trim() || !password.trim()) { setMessage({ err: "Email and password are required" }); return; }
    setMailClickLoading(true);
    try {
      const user = await handleEmailLogin(email, password);
      if (user) {
        setMessage({ success: "Signing in..." });
        setTimeout(() => navigate("/dashboard"), 800);
      }
    } catch (error) {
      setMessage({ err: error.message.includes("Invalid login credentials") ? "Invalid email or password" : error.message });
    } finally {
      setMailClickLoading(false);
    }
  };

  const useGoogleLogin = async () => {
    setGoogleClickLoading(true);
    try {
      await handleGoogleLogin();
    } catch (error) {
      setMessage({ err: error.message });
      setGoogleClickLoading(false);
    }
  };

  return (
    <div className={`flex flex-col w-full min-w-[300px] sm:w-[420px] gap-6 px-8 sm:px-10 py-10 rounded-2xl transition-colors duration-200
      ${isDark
        ? 'bg-[#141414] border border-[#272727]'
        : 'bg-white border border-[#d0d0d0] shadow-sm'}`}>

      {/* ── Title + switcher ── */}
      <div className="space-y-1">
        <h3 className={`text-[26px] font-poltawski font-bold tracking-tight ${isDark ? 'text-white' : 'text-primary'}`}>
          {isRegister ? "Create account" : "Welcome back"}
        </h3>
        <p className={`text-sm ${isDark ? 'text-[#999]' : 'text-[#444]'}`}>
          {isRegister ? (
            <>Already have an account?{" "}
              <button onClick={() => switchMode(false)} className={` transition-colors ${isDark ? 'text-[#D4AF37] hover:text-white' : 'text-primary hover:opacity-70'}`}>
                Sign in
              </button>
            </>
          ) : (
            <>Don't have an account?{" "}
              <button onClick={() => switchMode(true)} className={` transition-colors ${isDark ? 'text-[#D4AF37] hover:text-white' : 'text-primary hover:opacity-70'}`}>
                Sign up free
              </button>
            </>
          )}
        </p>
      </div>

      {/* ── Google button ── */}
      <button
        onClick={useGoogleLogin}
        disabled={googleClickLoading}
        className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all
          ${googleClickLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${isDark
            ? 'bg-white text-[#1f2937] border border-transparent hover:bg-[#f3f4f6]'
            : 'bg-white text-[#374151] border border-[#c8c8c8] hover:bg-[#f9fafb] hover:shadow-sm'}`}
      >
        {googleClickLoading ? (
          <span className="w-4 h-4 rounded-full border-2 border-[#ccc] border-t-[#999] animate-spin" />
        ) : (
          <>
            <Icon icon="flat-color-icons:google" width="18" height="18" />
            Continue with Google
          </>
        )}
      </button>

      {/* ── Implicit consent ── */}
      <p className={`-mt-3 text-center text-[11px] leading-relaxed ${isDark ? 'text-[#999]' : 'text-[#444]'}`}>
        By continuing, you agree to our{" "}
        <Link to="/terms" target="_blank" className={`underline underline-offset-2 transition-colors ${isDark ? 'text-[#999] hover:text-[#ccc]' : 'text-[#777] hover:text-primary'}`}>
          Terms
        </Link>
        {" "}and{" "}
        <Link to="/privacy" target="_blank" className={`underline underline-offset-2 transition-colors ${isDark ? 'text-[#999] hover:text-[#ccc]' : 'text-[#777] hover:text-primary'}`}>
          Privacy Policy
        </Link>
      </p>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 -mt-2">
        <div className={`flex-1 h-px ${isDark ? 'bg-[#2a2a2a]' : 'bg-[#ddd]'}`} />
        <span className={`text-xs px-1 ${isDark ? 'text-[#999]' : 'text-[#444]'}`}>or continue with email</span>
        <div className={`flex-1 h-px ${isDark ? 'bg-[#2a2a2a]' : 'bg-[#ddd]'}`} />
      </div>

      {/* ── Fields ── */}
      <div className="flex flex-col gap-3 -mt-2">
        {/* Email */}
        <div className="relative">
          <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-[#999]' : 'text-[#111]'}`}>
            <Icon icon="ic:round-email" width="16" />
          </span>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (isRegister ? registerWithEmail() : handleEmailLoginClick())}
            className={`w-full py-3 pl-10 pr-4 rounded-xl text-sm outline-none transition-all
              ${isDark
                ? 'bg-[#1e1e1e] border border-[#303030] text-white placeholder-[#555] focus:border-[#4a4a4a]'
                : 'bg-[#f7f7f7] border border-[#d0d0d0] text-[#111] placeholder-[#aaa] focus:border-primary focus:bg-white'}`}
          />
        </div>

        {/* Password */}
        <div>
          <div className="relative">
            <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-[#999]' : 'text-[#111]'}`}>
              <Icon icon="ic:round-lock" width="16" />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder={isRegister ? 'Create password' : 'Password'}
              value={password}
              onChange={handlePasswordChange}
              onKeyDown={e => e.key === 'Enter' && (isRegister ? registerWithEmail() : handleEmailLoginClick())}
              className={`w-full py-3 pl-10 pr-10 rounded-xl text-sm outline-none transition-all
                ${isDark
                  ? 'bg-[#1e1e1e] border border-[#303030] text-white placeholder-[#555] focus:border-[#4a4a4a]'
                  : 'bg-[#f7f7f7] border border-[#d0d0d0] text-[#111] placeholder-[#aaa] focus:border-primary focus:bg-white'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-[#999] hover:text-[#bbb]' : 'text-[#444] hover:text-[#555]'}`}
            >
              <Icon icon={showPassword ? "lucide:eye" : "lucide:eye-off"} width="15" />
            </button>
          </div>

          {/* Strength indicator — register only */}
          {isRegister && password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i < passwordStrength
                        ? passwordStrength === 1 ? 'bg-red-500'
                          : passwordStrength === 2 ? 'bg-yellow-500'
                          : 'bg-green-500'
                        : isDark ? 'bg-[#333]' : 'bg-[#e0e0e0]'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs ${
                passwordStrength === 1 ? 'text-red-500'
                  : passwordStrength === 2 ? 'text-yellow-500'
                  : 'text-green-500'
              }`}>
                {passwordStrength === 1 && 'Weak password'}
                {passwordStrength === 2 && 'Fair password'}
                {passwordStrength === 3 && 'Good password'}
                {passwordStrength === 4 && 'Strong password'}
              </p>
            </div>
          )}

          {isRegister && !password && (
            <p className={`text-xs mt-1.5 ${isDark ? 'text-[#555]' : 'text-[#aaa]'}`}>
              Use 8+ characters with a number, symbol and uppercase letter
            </p>
          )}
        </div>

        {/* Forgot password — login only */}
        {!isRegister && (
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className={`text-xs font-medium transition-colors ${isDark ? 'text-[#999] hover:text-[#D4AF37]' : 'text-[#999] hover:text-primary'}`}
            >
              Forgot password?
            </button>
          </div>
        )}
      </div>

      {/* ── Terms — register only ── */}
      {isRegister && (
        <label className="flex items-start gap-2.5 cursor-pointer select-none -mt-1">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={e => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#0F4C3A] flex-shrink-0"
          />
          <span className={`text-xs leading-relaxed ${isDark ? 'text-[#999]' : 'text-[#444]'}`}>
            I agree to the{" "}
            <Link to="/terms" target="_blank" className={` underline underline-offset-2 transition-colors ${isDark ? 'text-white hover:text-[#D4AF37]' : 'text-primary hover:opacity-70'}`}>
              Terms of Use
            </Link>
            {" "}and{" "}
            <Link to="/privacy" target="_blank" className={` underline underline-offset-2 whitespace-nowrap transition-colors ${isDark ? 'text-white hover:text-[#D4AF37]' : 'text-primary hover:opacity-70'}`}>
              Privacy Policy <span className="text-red-400">*</span>
            </Link>
          </span>
        </label>
      )}

      {/* ── Submit ── */}
      <button
        onClick={isRegister ? registerWithEmail : handleEmailLoginClick}
        disabled={mailClickLoading}
        className="w-full py-3 rounded-xl font-bold text-sm bg-primary hover:bg-opacity-85 text-white transition-all disabled:opacity-50 cursor-pointer -mt-1"
      >
        {mailClickLoading ? (
          <>
            <span className="inline-block mr-2 w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin align-middle" />
            {isRegister ? "Creating account..." : "Signing in..."}
          </>
        ) : (
          isRegister ? "Create Account" : "Sign in"
        )}
      </button>

    </div>
  );
}
