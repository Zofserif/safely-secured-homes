import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

export default function AccordionItem({ title, children }: { title: string, children: React.ReactNode }){
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[#F7FAFC] rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:border-[#BEE9E8]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-5 text-left font-semibold text-[#2D3748] hover:bg-[#F7FAFC] transition-colors"
      >
        <span className="text-lg">{title}</span>
        <span className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-[#0E79B2] text-white' : 'bg-[#F7FAFC] text-[#2D3748]'}`}>
          {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 text-slate-600 border-t border-[#F7FAFC] leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};