import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import {
  handleGoogleLogin,
  handleEmailSignup,
  handleEmailLogin,
} from "./AuthService";
import { useTheme } from "../context/ThemeContext";

export default function AuthButtons({ setMessage, initialMode = false }) {
  const [isRegister, setIsRegister] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mailClickLoading, setMailClickLoading] = useState(false);
  const [googleClickLoading, setGoogleClickLoading] = useState(false);
  const [eyes, setEyes] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  function nameChange(e) {
    const toTitleCase = (str) => {
      return str
        .replace(/-/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map(word => {
          if (!word) return "";
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
    };
    setName(toTitleCase(e.target.value));
  }

  const registerWithEmail = async () => {
    if (!name.trim()) {
      setMessage({ err: "Name is required" });
      return;
    }
    if (!email.trim()) {
      setMessage({ err: "Email is required" });
      return;
    }
    if (!password.trim()) {
      setMessage({ err: "Password is required" });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ err: "Passwords do not match" });
      return;
    }
    if (password.length < 6) {
      setMessage({ err: "Password must be at least 6 characters" });
      return;
    }

    setMailClickLoading(true);
    try {
      const user = await handleEmailSignup(name, email, password, newsletterOptIn);
      if (user) {
        localStorage.setItem('scanframe_newsletter_opt_in', newsletterOptIn ? '1' : '0');
        setMessage({ success: "Sign up successful! Check your email to verify your account." });
        setTimeout(() => {
          navigate("/verify-email-pending", { state: { email } });
        }, 1500);
      }
    } catch (error) {
      setMessage({ err: error.message });
    } finally {
      setMailClickLoading(false);
    }
  };

  const handleEmailLoginClick = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage({ err: "Email and password are required" });
      return;
    }

    setMailClickLoading(true);
    try {
      const user = await handleEmailLogin(email, password);
      if (user) {
        setMessage({ success: "Login successful!" });
        setTimeout(() => navigate("/dashboard"), 800);
      }
    } catch (error) {
      if (error.message.includes("Invalid login credentials")) {
        setMessage({ err: "Invalid email or password" });
      } else {
        setMessage({ err: error.message });
      }
    } finally {
      setMailClickLoading(false);
    }
  };

  const useGoogleLogin = async () => {
    setGoogleClickLoading(true);
    try {
      const user = await handleGoogleLogin();
      if (user) {
        setMessage({ success: "Signing in with Google..." });
      }
    } catch (error) {
      setMessage({ err: error.message });
    } finally {
      setGoogleClickLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-6 w-full min-w-[300px] background-blur-lg sm:w-[425px] min-h-[600px] ${isDark ? 'bg-[#000000]/90 text-white' : 'bg-white/90 text-black'} border border-primary rounded-[18px] py-5 px-10 sm:p-[40px_70px] shadow-[-10px_0_4px_0_rgba(0,0,0,0.48)]`}>
      {!isRegister && (
        <>
          <h3 className="text-2xl font-poltawski font-bold">Login</h3>

          <button
            onClick={useGoogleLogin}
            disabled={googleClickLoading}
            className={`w-full flex items-center justify-center gap-5 p-2.5 rounded-full text-[16px] text-white ${
              googleClickLoading 
                ? "bg-zinc-700 cursor-not-allowed"
                : "bg-[#6a3fff] hover:bg-[#454ACD] cursor-pointer"
            }`}
          >
            {googleClickLoading ? (
              <>
                <span className="inline-block align-middle mr-2 w-4 h-4 rounded-full border-2 border-[#ccc] border-t-[#333] animate-spin" /> Signing in...
              </>
            ) : (
              <>
                <span className="bg-white p-[2px] w-5 h-5 flex items-center justify-center rounded-full overflow-hidden">
                  <Icon icon="flat-color-icons:google" width="16" height="16" />
                </span>
                Sign in with Google
              </>
            )}
          </button>

          <div className="flex items-center justify-between gap-2.5">
            <div className={`w-full h-[0.45px] ${ isDark? 'bg-white' : 'bg-primary'}`}></div>
            <span className="text-sm">or</span>
            <div className={`w-full h-[0.45px] ${ isDark? 'bg-white' : 'bg-primary'}`}></div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 ">
                <Icon icon="ic:round-email" />
              </span>
              <input
                className={`w-full py-2 pl-10 pr-6 border rounded-full text-sm placeholder-gray-500 ${isDark ? 'border-white/90 text-white bg-white/10' : 'border-[#000000]/90 text-black bg-white'}  `}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 ">
                <Icon icon="ic:round-lock" />
              </span>
              {!eyes ? (
                <span
                  className="absolute right-4 top-1/2 transform -translate-y-1/2  cursor-pointer"
                  onClick={() => {
                    setEyes(true);
                    setShowPassword(true);
                  }}
                >
                  <Icon icon="lucide:eye-off" />
                </span>
              ) : (
                <span
                  className="absolute right-4 top-1/2 transform -translate-y-1/2  cursor-pointer"
                  onClick={() => {
                    setEyes(false);
                    setShowPassword(false);
                  }}
                >
                  <Icon icon="lucide:eye" />
                </span>
              )}
              <input
                className={`w-full py-2 pl-10 pr-6 border rounded-full text-sm placeholder-gray-500 ${isDark ? 'border-white/90 text-white bg-white/10' : 'border-[#000000]/90 text-black bg-white'}  `}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleEmailLoginClick}
            className="bg-primary hover:bg-opacity-80  px-5 py-2.5 w-full border-0 text-[1rem] rounded-full cursor-pointer disabled:opacity-50 text-white"
            disabled={mailClickLoading}
          >
            {mailClickLoading ? (
              <>
                <span className="inline-block align-middle mr-2 w-4 h-4 rounded-full border-2 border-[#ccc] border-t-[#333] animate-spin" /> 
                Logging in...
              </>
            ) : (
              "Login with Email"
            )}
          </button>

          <p className="text-[12px] text-wrap m-0 text-center ">
            Don't have an account?{" "}
            <span
              className={`cursor-pointer font-bold ${isDark ? 'text-gold hover:text-white' : 'text-primary hover:text-gold'}`}
              onClick={() => {
                setIsRegister(true);
                setEmail("");
                setPassword("");
                setName("");
                setConfirmPassword("");
              }}
            >
              Create an account
            </span>
          </p>

          <p className="text-[12px] text-wrap m-0 text-center ">
            <span
              className={`cursor-pointer font-bold ${isDark ? 'text-gold hover:text-white' : 'text-primary hover:text-gold'}`}
              onClick={() => navigate('/forgot-password')}
            >
              Forgot password?
            </span>
          </p>
        </>
      )}

      {isRegister && (
        <>
          <h3 className="text-2xl font-poltawski font-bold ">Sign up</h3>

          <button
            onClick={useGoogleLogin}
            disabled={googleClickLoading}
            className={`w-full flex items-center justify-center gap-5 p-2.5 rounded-full text-[16px] text-white ${
              googleClickLoading
                ? "bg-zinc-700 cursor-not-allowed"
                : "bg-[#6a3fff] hover:bg-[#454ACD] cursor-pointer"
            }`}
          >
            {googleClickLoading ? (
              <>
                <span className="inline-block align-middle mr-2 w-4 h-4 rounded-full border-2 border-[#ccc] border-t-[#333] animate-spin" /> Signing in...
              </>
            ) : (
              <>
                <span className="bg-white p-[2px] w-5 h-5 flex items-center justify-center rounded-full overflow-hidden">
                  <Icon icon="flat-color-icons:google" width="16" height="16" />
                </span>
                Sign in with Google
              </>
            )}
          </button>

          <div className="flex items-center justify-between gap-2.5">
            <div className={`w-full h-[0.45px] ${ isDark? 'bg-white' : 'bg-primary'}`}></div>
            <span className="text-sm">or</span>
            <div className={`w-full h-[0.45px] ${ isDark? 'bg-white' : 'bg-primary'}`}></div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 ">
                <Icon icon="ic:round-person" />
              </span>
              <input
                className={`w-full py-2 pl-10 pr-6 border rounded-full text-sm placeholder-gray-500 ${isDark ? 'border-white/90 text-white bg-white/10' : 'border-[#000000]/90 text-black bg-white'}  `}
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={nameChange}
              />
            </div>

            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 ">
                <Icon icon="ic:round-email" />
              </span>
              <input
                className={`w-full py-2 pl-10 pr-6 border rounded-full text-sm placeholder-gray-500 ${isDark ? 'border-white/90 text-white bg-white/10' : 'border-[#000000]/90 text-black bg-white'}  `}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 ">
                <Icon icon="ic:round-lock" />
              </span>
              {!eyes ? (
                <span
                  className="absolute right-4 top-1/2 transform -translate-y-1/2  cursor-pointer"
                  onClick={() => {
                    setEyes(true);
                    setShowPassword(true);
                  }}
                >
                  <Icon icon="lucide:eye-off" />
                </span>
              ) : (
                <span
                  className="absolute right-4 top-1/2 transform -translate-y-1/2  cursor-pointer"
                  onClick={() => {
                    setEyes(false);
                    setShowPassword(false);
                  }}
                >
                  <Icon icon="lucide:eye" />
                </span>
              )}
              <input
                className={`w-full py-2 pl-10 pr-6 border rounded-full text-sm placeholder-gray-500 ${isDark ? 'border-white/90 text-white bg-white/10' : 'border-[#000000]/90 text-black bg-white'}  `}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 ">
                <Icon icon="ic:round-lock" />
              </span>
              {!eyes ? (
                <span
                  className="absolute right-4 top-1/2 transform -translate-y-1/2  cursor-pointer"
                  onClick={() => {
                    setEyes(true);
                    setShowPassword(true);
                  }}
                >
                  <Icon icon="lucide:eye-off" />
                </span>
              ) : (
                <span
                  className="absolute right-4 top-1/2 transform -translate-y-1/2  cursor-pointer"
                  onClick={() => {
                    setEyes(false);
                    setShowPassword(false);
                  }}
                >
                  <Icon icon="lucide:eye" />
                </span>
              )}
              <input
                className={`w-full py-2 pl-10 pr-6 border rounded-full text-sm placeholder-gray-500 ${isDark ? 'border-white/90 text-white bg-white/10' : 'border-[#000000]/90 text-black bg-white'}  `}
                type={showPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={newsletterOptIn}
              onChange={e => setNewsletterOptIn(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#0F4C3A] flex-shrink-0 cursor-pointer"
            />
            <span className={`text-[11px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Send me vendor tips, platform updates, and occasional offers. You can unsubscribe anytime.
            </span>
          </label>

          <button
            onClick={registerWithEmail}
            className="bg-primary hover:bg-opacity-80  px-5 py-2.5 w-full border-0 text-[1rem] rounded-full cursor-pointer disabled:opacity-50 text-white"
            disabled={mailClickLoading}
          >
            {mailClickLoading ? (
              <>
                <span className="inline-block align-middle mr-2 w-4 h-4 rounded-full border-2 border-[#ccc] border-t-[#333] animate-spin text-white" /> 
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <p className="text-[12px] text-wrap m-0 text-center ">
            Already have an account?{" "}
            <span
              className={`cursor-pointer font-bold ${isDark ? 'text-gold hover:text-white' : 'text-primary hover:text-gold'}`}              
              onClick={() => {
                setIsRegister(false);
                setEmail("");
                setPassword("");
                setName("");
                setConfirmPassword("");
              }}
            >
              Sign In
            </span>
          </p>
        </>
      )}
    </div>
  );
}
