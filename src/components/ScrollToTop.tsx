// src/components/ScrollToTop.tsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUp } from "lucide-react";

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  const [showButton, setShowButton] = useState(false);

  // 1) Scroll to top on route change
  useEffect(() => {
    // Instant scroll to top for new pages
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" as ScrollBehavior, // TS safe cast
    });
  }, [pathname]);

  // 2) Show "back to top" button after some scroll
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setShowButton(y > 400); // show after 400px
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* Floating Back to Top button */}
      <button
        type="button"
        onClick={handleBackToTop}
        aria-label="Back to top"
        className={`fixed z-40 bottom-6 right-4 sm:bottom-8 sm:right-6
          inline-flex items-center justify-center rounded-full
          bg-sky-500/90 hover:bg-sky-400
          text-white shadow-lg shadow-sky-900/70
          border border-sky-300/70
          transition-all duration-200
          ${showButton ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-4"}
        `}
      >
        <ArrowUp className="w-5 h-5 m-3" />
      </button>
    </>
  );
};

export default ScrollToTop;
