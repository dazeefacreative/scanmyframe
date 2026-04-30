import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import logo from '../assets/images/Scanframe.png';
import logoalt from '../assets/images/Scanframe alt.png';

export default function Header() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    ...(user ? [{ label: 'Dashboard', href: '/dashboard' }] : []),
    { label: 'Generate Code', href: '#newframes' },
    { label: 'Blog', href: '/blog' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About Us', href: '/about' },
  ];

  const handleNavClick = (href) => {
    setMobileMenuOpen(false);
    if (href.startsWith('#')) {
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(href.slice(1));
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.getElementById(href.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(href);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-30 border-b transition-colors duration-200 ${
      isDark
        ? 'bg-black/80 border-white/10 backdrop-blur-md'
        : 'bg-white/85 border-black/10 backdrop-blur-md'
    }`}>
      <nav className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[60px]">

        {/* Logo */}
        <div className="cursor-pointer flex items-center flex-shrink-0" onClick={() => navigate('/')}>
          <img src={isDark ? logo : logoalt} alt="ScanMyFrame Logo" className="h-7 w-auto" />
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href)}
              className={`text-[13px] font-medium transition-colors hover:text-gold ${
                isDark ? 'text-white' : 'text-primary'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`p-1 transition-colors hover:text-gold ${isDark ? 'text-white' : 'text-primary'}`}
          >
            <Icon icon={isDark ? 'lucide:sun' : 'lucide:moon'} width="18" height="18" />
          </button>

          {/* Desktop Auth Buttons */}
          {user ? (
            <button
              onClick={handleSignOut}
              className={`hidden md:block text-[13px] font-semibold transition-colors hover:text-gold ${isDark ? 'text-white' : 'text-primary'}`}
            >
              Sign Out
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => navigate('/signin')}
                className={`text-[13px] font-semibold transition-colors hover:text-gold ${isDark ? 'text-white' : 'text-primary'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signin?mode=register')}
                className={`text-[13px] font-semibold px-4 py-1.5 rounded-md transition-opacity hover:opacity-80 ${
                  isDark ? 'bg-gold text-primary' : 'bg-primary text-white'
                }`}
              >
                Get Started Free
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-1.5 rounded transition-colors ${isDark ? 'text-white' : 'text-primary'}`}
          >
            <Icon icon={mobileMenuOpen ? 'lucide:x' : 'lucide:menu'} width="22" height="22" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-t px-6 py-5 flex flex-col gap-3 transition-colors duration-200 ${
          isDark ? 'bg-black border-white/10' : 'bg-white border-black/10'
        }`}>
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href)}
              className={`text-left text-sm font-medium py-1.5 transition-colors hover:text-gold ${
                isDark ? 'text-white' : 'text-primary'
              }`}
            >
              {link.label}
            </button>
          ))}

          <div className={`my-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

          {user ? (
            <button
              onClick={handleSignOut}
              className={`text-left text-sm font-semibold py-1.5 transition-colors hover:text-gold ${isDark ? 'text-white' : 'text-primary'}`}
            >
              Sign Out
            </button>
          ) : (
            <>
              <button
                onClick={() => { navigate('/signin'); setMobileMenuOpen(false); }}
                className={`text-left text-sm font-semibold py-1.5 transition-colors hover:text-gold ${isDark ? 'text-white' : 'text-primary'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { navigate('/signin?mode=register'); setMobileMenuOpen(false); }}
                className={`text-[13px] font-semibold px-4 py-2 rounded-md transition-opacity hover:opacity-80 text-center ${
                  isDark ? 'bg-gold text-primary' : 'bg-primary text-white'
                }`}
              >
                Get Started Free
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
