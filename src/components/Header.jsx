import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import logo from '../assets/images/Scanframe.png';

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
    if (href.startsWith('#')) {
      // If not on home page, navigate there first then scroll
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

  const handleAuthAction = async () => {
    if (user) {
      await signOut();
      navigate('/');
    } else {
      navigate('/signin');
    }
  };

  return (
    <header className={`${isDark ? 'bg-transparent' : 'bg-primary'} transition-colors duration-200`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between py-4 items-center h-16">
          
          {/* Logo */}
          <div className="cursor-pointer flex items-center" onClick={() => navigate('/')}>
              <img src={logo} alt="ScanFrameNG Logo" className="h-8 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="text-sm text-white hover:text-gold transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right Side: Theme Toggle + Sign In */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="text-white hover:text-opacity-80"                
              aria-label="Toggle theme"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <Icon 
                icon={isDark ? 'lucide:sun' : 'lucide:moon'} 
                width="20" 
                height="20" 
              />
            </button>

            {/* Sign In / Sign Out Button */}
            <button
              onClick={handleAuthAction}
              className="hidden md:block bg-white rounded-md px-4 font-medium py-1 text-black hover:bg-opacity-80"
            >
              {user ? 'Sign Out' : 'Sign In'}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded transition-colors text-white`}
            >
              <Icon 
                icon={mobileMenuOpen ? 'lucide:x' : 'lucide:menu'} 
                width="24" 
                height="24" 
              />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden absolute ${isDark ? 'bg-[#000000]' : 'bg-primary'} top-15 left-0 right-0 px-10 border-t py-10 text-white`}>
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  handleNavClick(link.href);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                  isDark 
                    ? 'text-secondary hover:text-gold' 
                    : 'text-gray-700 hover:text-primary'
                }`}
              >
                {link.label}
              </button>
            ))}
            {/* Sign In / Sign Out Button (mobile) */}
            <button
              onClick={() => {
                handleAuthAction();
                setMobileMenuOpen(false);
              }}
              className="md:hidden block bg-white mt-4 rounded-md px-4 font-medium py-1 text-black hover:bg-opacity-80"
            >
              {user ? 'Sign Out' : 'Sign In'}
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
