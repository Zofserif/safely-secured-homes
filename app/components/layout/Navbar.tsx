/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Navbar({ onNavigate }: { onNavigate: (page: string) => void }){
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100 && !isOpen) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 hidden md:block ${isVisible ? 'translate-y-0' : '-translate-y-full'} ${isOpen ? 'bg-white' : 'bg-white/90 backdrop-blur-xl border-b border-[#BEE9E8]/30 shadow-sm'}`}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('home')}>
          {/* Logo */}
          <img 
            src="/assets/img/Logo/navbar banner.png"
            alt="Safely Secured Homes Logo" 
            className="h-8 md:h-10 w-auto"
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
        
        <div className="hidden md:flex gap-8 items-center">
          <button 
            onClick={() => onNavigate('form')}
            className="bg-[#0E79B2] hover:bg-[#0b5e8b] text-white px-8 py-3 rounded-full font-semibold shadow-xl shadow-[#0E79B2]/20 transition-all hover:scale-105 hover:shadow-2xl border border-transparent"
          >
            GET MY FREE PLAN
          </button>
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-[#2D3748] p-2">
            {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden bg-white border-b shadow-2xl"
        >
          <div className="p-6 flex flex-col gap-6">
            <button 
              onClick={() => { onNavigate('form'); setIsOpen(false); }}
              className="w-full bg-[#0E79B2] text-white py-4 rounded-xl font-bold shadow-lg text-lg"
            >
              Get Free Plan Now
            </button>
          </div>
        </motion.div>
      )}
    </nav>
  );
};