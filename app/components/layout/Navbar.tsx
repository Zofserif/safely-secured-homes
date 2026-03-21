/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { HomeCtaLocation, HomeCtaTarget } from "../home/types";

type NavbarVisibilityMode = "default" | "home_hero_reveal";

export default function Navbar({
  onNavigate,
  onPrimaryCtaClick,
  hideCta = false,
  hasExistingPlan = false,
  primaryCtaTarget,
  primaryCtaLabel,
  centerLogo = false,
  visibilityMode = "default",
  heroSectionId = "home-hero",
}: {
  onNavigate: (page: string) => void;
  onPrimaryCtaClick?: (
    target: HomeCtaTarget,
    location: HomeCtaLocation
  ) => void;
  hideCta?: boolean;
  hasExistingPlan?: boolean;
  primaryCtaTarget?: HomeCtaTarget;
  primaryCtaLabel?: string;
  centerLogo?: boolean;
  visibilityMode?: NavbarVisibilityMode;
  heroSectionId?: string;
}){
  const ctaTarget: HomeCtaTarget =
    primaryCtaTarget ?? (hasExistingPlan ? "results" : "form");
  const ctaLabel =
    primaryCtaLabel ?? (hasExistingPlan ? "SEE MY PLAN" : "GET MY PANATAG RATING NOW");
  const ctaMobileLabel = ctaLabel;
  const [isOpen, setIsOpen] = useState(false);
  const hasMobileMenuContent = !hideCta;
  const isMobileMenuOpen = isOpen && hasMobileMenuContent;
  const [isVisible, setIsVisible] = useState(
    () => visibilityMode !== "home_hero_reveal"
  );
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (hasMobileMenuContent || !isOpen) return;

    const closeFrame = window.requestAnimationFrame(() => {
      setIsOpen(false);
    });

    return () => {
      window.cancelAnimationFrame(closeFrame);
    };
  }, [hasMobileMenuContent, isOpen]);

  useEffect(() => {
    if (visibilityMode === "home_hero_reveal") {
      const updateVisibilityFromHero = () => {
        const heroElement = document.getElementById(heroSectionId);
        if (!heroElement) {
          // Fail open so navigation remains available if hero lookup fails.
          setIsVisible(true);
          return;
        }

        const heroBottom = heroElement.getBoundingClientRect().bottom;
        setIsVisible(heroBottom <= 0);
      };

      updateVisibilityFromHero();
      window.addEventListener("scroll", updateVisibilityFromHero, {
        passive: true,
      });
      window.addEventListener("resize", updateVisibilityFromHero);
      return () => {
        window.removeEventListener("scroll", updateVisibilityFromHero);
        window.removeEventListener("resize", updateVisibilityFromHero);
      };
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (
        currentScrollY > lastScrollY.current &&
        currentScrollY > 100 &&
        !isMobileMenuOpen
      ) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [heroSectionId, isMobileMenuOpen, visibilityMode]);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 block ${isVisible ? 'translate-y-0' : '-translate-y-full'} ${isMobileMenuOpen ? 'bg-white' : 'bg-white/90 backdrop-blur-xl border-b border-[#BEE9E8]/30 shadow-sm'}`}>
      <div
        className={`container mx-auto flex items-center px-4 py-2.5 sm:px-6 md:py-4 ${
          centerLogo ? "justify-center" : "justify-between"
        }`}
      >
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('home')}>
          {/* Logo */}
          <img 
            src="/assets/img/Logo/navbar banner.png"
            alt="Safely Secured Homes Logo" 
            className="h-7 md:h-10 w-auto"
            onError={(e) => {
              // Fallback to text if image fails to load (e.g., in preview or without public folder setup)
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextElementSibling) {
                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
          {/* Text Fallback (hidden by default if image is present) */}
          {/* <div className="hidden flex-col leading-none" style={{display: 'flex', flexDirection: 'column'}}>
            <span className="font-bold text-[#2D3748] text-lg tracking-wide">SAFELY</span>
            <span className="font-medium text-[#0E79B2] text-xs tracking-[0.2em] uppercase">Secured</span>
          </div> */}
        </div>
        
        <div className="hidden md:flex gap-3 items-center">
          {!hideCta && (
            <button 
              onClick={() => {
                if (onPrimaryCtaClick) {
                  onPrimaryCtaClick(ctaTarget, "navbar_primary");
                  return;
                }
                onNavigate(ctaTarget);
              }}
              className="bg-[#0E79B2] hover:bg-[#0b5e8b] text-white px-8 py-3 rounded-full font-semibold shadow-xl shadow-[#0E79B2]/20 transition-all hover:scale-105 hover:shadow-2xl border border-transparent"
            >
              {ctaLabel}
            </button>
          )}
        </div>

        {hasMobileMenuContent && (
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-[#2D3748] p-2">
              {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        )}
      </div>

      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden bg-white border-b shadow-2xl"
        >
          <div className="p-6 flex flex-col gap-6">
            <button 
              onClick={() => {
                if (onPrimaryCtaClick) {
                  onPrimaryCtaClick(ctaTarget, "navbar_primary");
                  setIsOpen(false);
                  return;
                }
                onNavigate(ctaTarget);
                setIsOpen(false);
              }}
              className="w-full bg-[#0E79B2] text-white py-4 rounded-xl font-bold shadow-lg text-lg"
            >
              {ctaMobileLabel}
            </button>
          </div>
        </motion.div>
      )}
    </nav>
  );
};
