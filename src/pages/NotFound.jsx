import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import scanframeLogo from '../assets/images/Scanframe alt.png';
import scanframeLogoAlt from '../assets/images/Scanframe.png';

export default function NotFound() {
  const { isDark } = useTheme();

  const logo     = isDark ? scanframeLogoAlt : scanframeLogo;
  const pageBg   = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
  const textPrim = isDark ? 'text-white'    : 'text-[#0F4C3A]';
  const textSub  = isDark ? 'text-[#888]'   : 'text-[#4a7c6f]';
  const border   = isDark ? 'border-white/8' : 'border-[#0F4C3A]/10';

  return (
    <div className={`min-h-screen ${pageBg} flex flex-col`}>
      {/* Header */}
      <header className={`border-b ${border} px-6 py-4 max-w-3xl mx-auto w-full`}>
        <Link to="/"><img src={logo} alt="ScanMyFrame" className="h-7 w-auto" /></Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[80px] leading-none font-bold text-[#D4AF37] font-[Poltawski_Nowy,serif] mb-2">
          404
        </p>
        <h1 className={`text-2xl font-bold ${textPrim} font-[Poltawski_Nowy,serif] mb-3`}>
          Page not found
        </h1>
        <p className={`text-sm ${textSub} mb-10 max-w-sm`}>
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/"
            className="bg-[#0F4C3A] text-[#FAF5DD] px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
            Back to home
          </Link>
          <Link to="/dashboard"
            className={`px-6 py-2.5 rounded-xl text-sm font-bold border transition-opacity hover:opacity-70 ${isDark ? 'border-white/15 text-white' : 'border-[#0F4C3A]/20 text-[#0F4C3A]'}`}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
