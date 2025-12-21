import { AnimatePresence, motion } from "framer-motion";
import { Award, ChevronDown, ChevronUp, FileCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function CertModal ({ onClose }: { onClose: () => void }){
  const [activeCert, setActiveCert] = useState<string | null>(null);

  const toggleCert = (id: string) => {
    setActiveCert(activeCert === id ? null : id);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
                <p className="text-slate-600">See all certifications by leading security providers.</p>
            </div>
            
            <div className="space-y-4">
                {/* Certification 1 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button 
                        onClick={() => toggleCert('hcsa-cctv')}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <FileCheck className="w-6 h-6 text-[#2E8B57]" />
                            <div>
                                <div className="font-bold text-[#2D3748]">Certified CCTV Security System Design & Deployment</div>
                                <div className="text-xs text-slate-500">Hikvision HCSA-CCTV</div>
                            </div>
                        </div>
                        {activeCert === 'hcsa-cctv' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                        {activeCert === 'hcsa-cctv' && (
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-white border-t border-slate-100"
                            >
                                <div className="p-4 flex justify-center">
                                    <a
                                        href="/assets/img/Certifications/Certified%20HCSA%20-%20Security%20CCTV%20Solution%20%26%20Integrator.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative block w-full h-70 rounded-lg overflow-hidden border border-slate-200 bg-white"
                                        aria-label="Open certificate PDF in a new tab"
                                    >
                                        <Image
                                            src="/assets/img/Certifications/optimized/Certified%20HCSA%20-%20Security%20CCTV%20Solution%20%26%20Integrator.jpg"
                                            alt="Certified HCSA - Security CCTV Solution & Integrator"
                                            fill
                                            sizes="(min-width: 768px) 480px, 90vw"
                                            className="object-contain"
                                        />
                                    </a>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Certification 2 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button 
                        onClick={() => toggleCert('hcsa-access-control')}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <FileCheck className="w-6 h-6 text-[#2E8B57]" />
                            <div>
                                <div className="font-bold text-[#2D3748]">Certified Security & Smart Home Access Control Integrator</div>
                                <div className="text-xs text-slate-500">Hikvision HCSA-Access Control</div>
                            </div>
                        </div>
                        {activeCert === 'hcsa-access-control' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                        {activeCert === 'hcsa-access-control' && (
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-white border-t border-slate-100"
                            >
                                <div className="p-4 flex justify-center">
                                    <a
                                        href="/assets/img/Certifications/Certified%20HCSA%20-%20Security%20Access%20Control.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative block w-full h-70 rounded-lg overflow-hidden border border-slate-200 bg-white"
                                        aria-label="Open certificate PDF in a new tab"
                                    >
                                        <Image
                                            src="/assets/img/Certifications/optimized/Certified%20HCSA%20-%20Security%20Access%20Control.jpg"
                                            alt="Certified HCSA - Security CCTV Solution & Integrator"
                                            fill
                                            sizes="(min-width: 768px) 480px, 90vw"
                                            className="object-contain"
                                        />
                                    </a>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Certification 3 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button 
                        onClick={() => toggleCert('hcsa-maintenance')}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <FileCheck className="w-6 h-6 text-[#2E8B57]" />
                            <div>
                                <div className="font-bold text-[#2D3748]">Certified Security & Smart Home Maintenace Support</div>
                                <div className="text-xs text-slate-500">Hikvision HCSA-Maintenance</div>
                            </div>
                        </div>
                        {activeCert === 'hcsa-maintenance' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                        {activeCert === 'hcsa-maintenance' && (
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-white border-t border-slate-100"
                            >
                                <div className="p-4 flex justify-center">
                                    <a
                                        href="/assets/img/Certifications/Certified%20HCSA%20-%20Security%20Maintenance.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative block w-full h-70 rounded-lg overflow-hidden border border-slate-200 bg-white"
                                        aria-label="Open certificate PDF in a new tab"
                                    >
                                        <Image
                                            src="/assets/img/Certifications/optimized/Certified%20HCSA%20-%20Security%20Maintenance.jpg"
                                            alt="Certified HCSA - Security CCTV Solution & Integrator"
                                            fill
                                            sizes="(min-width: 768px) 480px, 90vw"
                                            className="object-contain"
                                        />
                                    </a>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Certification 4 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button 
                        onClick={() => toggleCert('system-surveyor')}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            <FileCheck className="w-6 h-6 text-[#2E8B57]" />
                            <div>
                                <div className="font-bold text-[#2D3748]">Certified Residential System Vulnerability Surveyor</div>
                                <div className="text-xs text-slate-500">System Surveyor Certification Program</div>
                            </div>
                        </div>
                        {activeCert === 'system-surveyor' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                        {activeCert === 'system-surveyor' && (
                            <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-white border-t border-slate-100"
                            >
                                <div className="p-4 flex justify-center">
                                    <a
                                        href="/assets/img/Certifications/Certified%20Residential%20System%20Surveyor.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative block w-full h-70 rounded-lg overflow-hidden border border-slate-200 bg-white"
                                        aria-label="Open certificate PDF in a new tab"
                                    >
                                        <Image
                                            src="/assets/img/Certifications/optimized/Certified%20Residential%20System%20Surveyor.jpg"
                                            alt="Certified HCSA - Security CCTV Solution & Integrator"
                                            fill
                                            sizes="(min-width: 768px) 480px, 90vw"
                                            className="object-contain"
                                        />
                                    </a>
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
