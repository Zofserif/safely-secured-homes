import { Hammer, Phone, Wrench, X } from "lucide-react";

export default function DIYView({ onBack, onCall }: { onBack: () => void, onCall: () => void }){
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
        <button onClick={onBack} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#BEE9E8] rounded-full flex items-center justify-center mx-auto mb-4">
            <Hammer className="w-8 h-8 text-[#0E79B2]" />
          </div>
          <h2 className="text-2xl font-bold text-[#2D3748]">DIY Security Plan</h2>
          <p className="text-slate-600 text-sm mt-2">Here is a basic outline to get you started on securing your own home.</p>
        </div>

        <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 shrink-0">1</div>
            <div>
              <h4 className="font-bold text-sm text-[#2D3748]">Map Your Weak Points</h4>
              <p className="text-xs text-slate-500">Draw a layout of your home and mark all entry points (doors, windows) and blind spots.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 shrink-0">2</div>
            <div>
              <h4 className="font-bold text-sm text-[#2D3748]">Choose Your Hardware</h4>
              <p className="text-xs text-slate-500">Research cameras that fit your needs (Wired vs Wireless, NVR vs Cloud Storage).</p>
            </div>
          </div>
           <div className="flex gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 shrink-0">3</div>
            <div>
              <h4 className="font-bold text-sm text-[#2D3748]">Run Cables & Mount</h4>
              <p className="text-xs text-slate-500">Drill holes for mounting brackets and run ethernet/power cables through walls or conduits.</p>
            </div>
          </div>
           <div className="flex gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 shrink-0">4</div>
            <div>
              <h4 className="font-bold text-sm text-[#2D3748]">Network Configuration</h4>
              <p className="text-xs text-slate-500">Set up IP addresses, port forwarding, and secure your network against hackers.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#FFF5F5] border border-red-100 rounded-xl p-4 text-center">
          <h4 className="text-red-800 font-bold text-sm mb-1 flex items-center justify-center gap-2">
            <Wrench className="w-4 h-4" /> Sounds complicated?
          </h4>
          <p className="text-red-600 text-xs mb-3">Incorrect installation can leave your home vulnerable. Let the experts handle it perfectly in just one weekend.</p>
          <button onClick={onCall} className="w-full bg-[#0E79B2] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#0b5e8b] transition-colors flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" /> Call Us for Expert Help
          </button>
        </div>
      </div>
    </div>
  );
}