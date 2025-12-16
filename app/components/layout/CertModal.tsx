import { AnimatePresence, motion } from "framer-motion";
import { Award, ChevronDown, ChevronUp, FileCheck, X } from "lucide-react";
import { useState } from "react";

export default function CertModal ({ onClose }: { onClose: () => void }){
  const [activeCert, setActiveCert] = useState<string | null>(null);

  const toggleCert = (id: string) => {
    setActiveCert(activeCert === id ? null : id);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-60" onClick={onClose}>
      <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 bg-white/50 hover:bg-white rounded-full p-2 transition-colors z-10">
          <X className="w-6 h-6 text-slate-900" />
        </button>
        <div className="p-8">
            <div className="text-center mb-6">
                <Award className="w-16 h-16 text-[#0E79B2] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#2D3748] mb-2">Certified Expert</h3>
                <p className="text-slate-600">Our team is fully certified by leading security providers.</p>
            </div>
            
            <div className="space-y-4">
                {/* Certification 1 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button 
                        onClick={() => toggleCert('hikvision')}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <FileCheck className="w-6 h-6 text-[#2E8B57]" />
                            <div>
                                <div className="font-bold text-[#2D3748]">Hikvision Security Associate</div>
                                <div className="text-xs text-slate-500">System Design & Deployment</div>
                            </div>
                        </div>
                        {activeCert === 'hikvision' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                        {activeCert === 'hikvision' && (
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-white border-t border-slate-100"
                            >
                                <div className="p-4 flex justify-center">
                                    <div className="bg-slate-100 w-full h-48 rounded-lg flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300">
                                        {/* Replace with actual image */}
                                        <span className="text-sm">Certificate Image Placeholder</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Certification 2 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button 
                        onClick={() => toggleCert('surveyor')}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <FileCheck className="w-6 h-6 text-[#2E8B57]" />
                            <div>
                                <div className="font-bold text-[#2D3748]">System Surveyor</div>
                                <div className="text-xs text-slate-500">Vulnerability Assessment</div>
                            </div>
                        </div>
                         {activeCert === 'surveyor' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                        {activeCert === 'surveyor' && (
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-white border-t border-slate-100"
                            >
                                <div className="p-4 flex justify-center">
                                    <div className="bg-slate-100 w-full h-48 rounded-lg flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300">
                                        {/* Replace with actual image */}
                                        <span className="text-sm">Certificate Image Placeholder</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};