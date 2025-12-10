import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Minus, Plus } from "lucide-react";

export default function ReasonItem({ title, desc, isOpen, onClick }: { title: string, desc: string, isOpen: boolean, onClick: () => void }){
  return (
    <div 
      onClick={onClick}
      className={`cursor-pointer rounded-xl transition-all duration-300 border ${isOpen ? 'bg-[#2D3748] border-[#0E79B2] shadow-lg' : 'hover:bg-[#374151] border-transparent hover:border-[#4A5568]'}`}
    >
      <div className="flex items-start gap-4 p-4">
        <div className={`rounded-full p-1 mt-1 shrink-0 transition-colors ${isOpen ? 'bg-[#0E79B2]' : 'bg-[#2E8B57]'}`}>
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <span className={`font-medium text-lg block transition-colors ${isOpen ? 'text-[#63B3ED]' : 'text-[#F7FAFC]'}`}>{title}</span>
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="pt-3 text-slate-300 text-sm leading-relaxed">
                  {desc}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-1 text-slate-500">
          {isOpen ? <Minus className="w-5 h-5 text-[#0E79B2]" /> : <Plus className="w-5 h-5" />}
        </div>
      </div>
    </div>
  );
};