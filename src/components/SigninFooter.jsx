import { Link } from 'react-router-dom';

function openCookiePrefs(e) {
  e.preventDefault();
  window.dispatchEvent(new CustomEvent('sf:openCookiePrefs'));
}

export default function SigninFooter() {
  return (
    <footer className="w-full bg-primary sticky bottom-0 left-0">
      <div className="m-0 flex flex-row flex-wrap justify-center items-center gap-x-3 gap-y-1 text-secondary text-[12px] py-5 px-4">
        <p className="whitespace-nowrap">{new Date().getFullYear()} &copy; ScanFrameNG. All Rights Reserved.</p>

        <div className="h-4 w-px bg-[#FAF5DD]/30 hidden sm:block" />

        <Link
          to="/privacy"
          className="hover:text-[#D4AF37] transition-colors duration-150 whitespace-nowrap"
        >
          Privacy Policy
        </Link>

        <div className="h-4 w-px bg-[#FAF5DD]/30 hidden sm:block" />

        <Link
          to="/terms"
          className="hover:text-[#D4AF37] transition-colors duration-150 whitespace-nowrap"
        >
          Terms of Use
        </Link>

        <div className="h-4 w-px bg-[#FAF5DD]/30 hidden sm:block" />

        <button
          onClick={openCookiePrefs}
          className="hover:text-[#D4AF37] transition-colors duration-150 whitespace-nowrap bg-transparent border-none cursor-pointer text-secondary text-[12px] p-0 font-inherit"
        >
          Cookie Preferences
        </button>
      </div>
    </footer>
  );
}
