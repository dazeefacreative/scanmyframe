import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import Home from "./pages/Home";
import Signin from "./pages/Signin";
import Dashboard from "./pages/Dashboard";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyEmailPending from "./pages/VerifyEmailPending";
import OnboardingFlow from "./pages/OnboardingFlow";
import OnboardingGuard from "./components/Onboardingguard";
import OnboardingRoute from "./components/OnboardingRoute";
import FramePage from "./pages/FramePage";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Admin from "./pages/Admin";
import About from "./pages/About";

import SigninFooter from "./components/SigninFooter";
import Pricing from "./pages/Pricing";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import CookieConsent from "./components/CookieConsent";

function App() {
  const location = useLocation();
  const authPages = ["/signin", "/verify-email-pending", "/verify-email", "/reset-password", "/forgot-password", "/auth/callback", "/onboarding"];
  const shortFooter = authPages.includes(location.pathname);

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/frame/:slug" element={<FramePage />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* Blog */}
          <Route path="/about" element={<About />} />

          {/* Blog */}
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          {/* Legal */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms"   element={<TermsOfUse />} />

          {/* Admin (self-protected with username/password) */}
          <Route path="/admin" element={<Admin />} />

          {/* Auth Callback */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Password & Email Routes */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email-pending" element={<VerifyEmailPending />} />

          <Route element={<OnboardingGuard />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Onboarding — blocked if user has already completed it */}
          <Route path="/onboarding" element={<OnboardingRoute><OnboardingFlow /></OnboardingRoute>} />
        </Routes>
        {shortFooter && <SigninFooter />}
        <CookieConsent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
