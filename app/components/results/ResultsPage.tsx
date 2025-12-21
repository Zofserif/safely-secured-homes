import { motion } from "framer-motion";
import { AlertTriangle, Calendar, CheckCircle2, FileText, HardDrive, Phone, Server, ShieldCheck, Video } from "lucide-react";
import { useState } from "react";
import { CalculationResult, FormData } from "../../lib/types";
import DIYView from "./DIYView";

export default function ResultsPage({ result, data }: { result: CalculationResult, data: FormData }) {
  const [showDIY, setShowDIY] = useState(false);

  // Function to determine buttons based on Lead Priority (Hot/Warm/Nurture)
  const renderActionButtons = () => {
    const handleCallUs = () => {
      window.location.href = "tel:09959959229";
    };

    const handleBookVisit = () => {
      const url = "https://calendly.com/vallarta-troy/30min";
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (!newWindow) {
        window.location.href = url;
      }
    };

    const CommonDIYButton = () => (
       <button 
          onClick={() => setShowDIY(true)}
          className="flex-1 bg-white text-[#0E79B2] border border-[#0E79B2]/30 py-3 rounded-xl font-bold hover:bg-[#F7FAFC] transition-colors flex items-center justify-center gap-2"
       >
          <FileText className="w-5 h-5" /> DIY Security Plan
       </button>
    );

    const CommonCallButton = () => (
      <button 
        onClick={handleCallUs}
        className="flex-1 bg-white text-[#0E79B2] border border-[#0E79B2]/30 py-3 rounded-xl font-bold hover:bg-[#F7FAFC] transition-colors flex items-center justify-center gap-2"
      >
          <Phone className="w-5 h-5" /> Call Us Now
      </button>
    );

    const PrimaryBookButton = () => (
      <button 
        onClick={handleBookVisit}
        className="flex-1 bg-[#0E79B2] text-white py-3 rounded-xl font-bold hover:bg-[#0b5e8b] transition-colors flex items-center justify-center gap-2"
      >
          <Calendar className="w-5 h-5" /> Book Site Visit (Free)
      </button>
    );

    const PrimaryCallButton = () => (
       <button 
        onClick={handleCallUs}
        className="flex-1 bg-[#0E79B2] text-white py-3 rounded-xl font-bold hover:bg-[#0b5e8b] transition-colors flex items-center justify-center gap-2"
      >
          <Phone className="w-5 h-5" /> Call Us Now
      </button>
    );


    if (result.leadTier === 'Hot') {
      // HOT: Book Visit + Call Us
      return (
        <>
          <PrimaryBookButton />
          <CommonCallButton />
        </>
      );
    } else if (result.leadTier === 'Warm') {
      // WARM: Book Visit + DIY Plan
      return (
        <>
          <PrimaryBookButton />
          <CommonDIYButton />
        </>
      );
    } else {
      // NURTURE (Default): Call Us + DIY Plan
      return (
        <>
          <PrimaryCallButton />
          <CommonDIYButton />
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] py-20 px-4">
      {showDIY && (
        <DIYView
          onBack={() => setShowDIY(false)}
          onCall={() => window.location.href = "tel:09959959229"}
          result={result}
          data={data}
        />
      )}
      
      <div className="container mx-auto max-w-3xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="bg-[#0E79B2] p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">Your Personalized Security Plan</h1>
            <p className="opacity-90">Prepared for {data.first_name} {data.last_name}</p>
          </div>

          <div className="p-8 space-y-8">
            {/* Core Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center">
                <Video className="w-8 h-8 mx-auto text-[#0E79B2] mb-2" />
                <div className="text-2xl font-bold text-[#2D3748]">{result.cameraCount}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Cameras</div>
              </div>
              <div className="bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center">
                <Server className="w-8 h-8 mx-auto text-[#63B3ED] mb-2" />
                <div className="text-2xl font-bold text-[#2D3748]">{result.nvrChannel}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Ch. NVR</div>
              </div>
              <div className="bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center">
                <HardDrive className="w-8 h-8 mx-auto text-[#2E8B57] mb-2" />
                <div className="text-2xl font-bold text-[#2D3748]">1TB+</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Storage</div>
              </div>
              <div className="bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center">
                <ShieldCheck className="w-8 h-8 mx-auto text-[#FFB300] mb-2" />
                <div className="text-2xl font-bold text-[#2D3748]">{result.leadTier}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Priority</div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-[#2E8B57]" /> Recommended Setup
              </h3>
              <ul className="space-y-3">
                {result.recommendations.length > 0 ? result.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3 text-slate-700 bg-[#F7FAFC] p-3 rounded-lg">
                    <span className="text-[#0E79B2] font-bold">•</span> {rec}
                  </li>
                )) : (
                  <li className="text-slate-500 italic">Standard comprehensive coverage recommended based on your selections.</li>
                )}
                {data.priority_areas.length > 0 && (
                  <li className="flex gap-3 text-slate-700 bg-[#F7FAFC] p-3 rounded-lg">
                    <span className="text-[#0E79B2] font-bold">•</span> 
                    Key Zones: {data.priority_areas.join(", ")}
                  </li>
                )}
              </ul>
            </div>

            {/* Next Steps - Dynamic Buttons */}
            <div className="bg-[#FFB300]/10 border border-[#FFB300]/30 rounded-2xl p-6">
              <h4 className="font-bold text-[#2D3748] mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#FFB300]" /> Next Step
              </h4>
              <p className="text-[#2D3748] mb-4 text-sm">
                Since your home requires <strong>{result.cameraCount} cameras</strong> and specific cabling, an on-site assessment is crucial to give you an exact quote (no hidden fees).
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {renderActionButtons()}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
};
