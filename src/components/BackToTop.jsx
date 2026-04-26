import { SlArrowUp } from "react-icons/sl";
import { useEffect, useState } from "react";

export default function BackToTop({isDark}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      title="Back to Top"
      onClick={scrollToTop}
      className={`inline-flex items-center justify-center fixed bottom-[30px] right-[30px] w-[40px] h-[40px] rounded-full border-2 border-white shadow-md cursor-pointer opacity-1 visible transition-all duration-300 ease-in-out z-[1000] ${isVisible && "opacity-1 visible"} ${isDark? 'bg-secondary text-primary' : 'text-secondary bg-primary'} hover:scale-110 active:scale-95`}
    >
      <SlArrowUp className="w-[40px]" />
    </div>
  );
}
