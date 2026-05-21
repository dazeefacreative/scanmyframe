import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthButtons from '../components/AuthButtons';
import MessageDisplay from '../components/MessageDisplay';

import logo from '../assets/images/Scanframe.png';
import logoAlt from '../assets/images/Scanframe alt.png';
import step1 from '../assets/images/scanframe-image-step-1.jpg';
import step2 from '../assets/images/scanframe-image-step-2.jpg';
import step3 from '../assets/images/scanframe-image-step-3.jpg';

const slides = [
  { src: step1, caption: 'Your client scan their frame' },
  { src: step2, caption: 'They explore everything inside the frame' },
  { src: step3, caption: 'They enjoy the experience and share it with others' },
];

export default function Signin() {
  const [message, setMessage] = useState({ success: '', err: '' });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register';
  const [slideIndex, setSlideIndex] = useState(0);
  const { isDark } = useTheme();

  useEffect(() => {
    if (!user) return;
    const hasDraft = localStorage.getItem('scanframe_qr_pending');
    navigate(hasDraft ? '/#newframes' : '/dashboard', { replace: true });
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setSlideIndex(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className={`h-screen flex flex-col overflow-hidden transition-colors duration-200 ${isDark ? 'bg-[#080808]' : 'bg-[#fffdf3]'}`}>

      {/* ── Content row ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel: full-height image carousel */}
        <div className="hidden lg:block relative flex-1 h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={slideIndex}
              src={slides[slideIndex].src}
              alt={slides[slideIndex].caption}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            />
          </AnimatePresence>

          {/* Gradient overlay — darker in dark mode, lighter in light mode */}
          <div className={`absolute inset-0 z-10 bg-gradient-to-t transition-all duration-500 ${
            isDark
              ? 'from-black/80 via-black/20 to-black/55'
              : 'from-black/50 via-[#fffdf3]/5 to-[#fffdf3]/20'
          }`} />

          {/* Logo top-left */}

          <Link to="/" className="hidden md:block absolute top-8 left-8 z-20">
            <img src={isDark? logo : logoAlt} alt="ScanMyFrame" className="h-8 w-auto" />
          </Link>

          {/* Caption + dots */}
          <div className="absolute bottom-12 left-8 right-8 z-20">
            <AnimatePresence mode="wait">
              <motion.p
                key={slideIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
                className="text-white text-base font-medium mb-4 leading-snug drop-shadow-sm"
              >
                {slides[slideIndex].caption}
              </motion.p>
            </AnimatePresence>
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === slideIndex
                      ? 'w-6 ' + (isDark ? 'bg-white' : 'bg-white')
                      : 'w-1.5 ' + (isDark ? 'bg-white/40' : 'bg-white/60')
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right panel: form */}
        <div className={`flex flex-col flex-1 overflow-y-auto transition-colors duration-200 ${isDark ? 'bg-[#080808]' : 'bg-[#fffdf3]'}`}>

          <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 gap-5">
            {/* Mobile logo — centered, tight above the form */}
            <div className="lg:hidden">
              <Link to="/">
                <img src={isDark ? logo : logoAlt} alt="ScanMyFrame" className="h-10 w-auto" />
              </Link>
            </div>

            <MessageDisplay message={message} setMessage={setMessage} />
            <AuthButtons setMessage={setMessage} initialMode={initialMode} />
          </div>
        </div>

      </div>

    </main>
  );
}
