/* eslint-disable react/no-unescaped-entities */
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Loader2 } from "lucide-react";
import posthog from "posthog-js";
import { useState } from "react";
import { FormData } from "../../lib/types";

export default function WizardForm({ onComplete }: { onComplete: (data: FormData) => void }) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    property_type: '', 
    home_size: '', 
    floors: '', 
    neighborhood_context: [],
    home_stage: '', 
    goals: [], 
    main_goal: '', 
    risk_window: '', 
    priority_areas: [],
    night_lighting: '', 
    current_setup: '',
    // wireless_devices removed
    safety_level: 5,
    features_must: [], 
    notifications: '', 
    smart_home_interest: '',
    budget_band: '', 
    timeline: '', 
    decision_makers: '', 
    incident_notes: '',
    first_name: '', 
    last_name: '', 
    full_name: '', 
    email: '', 
    mobile: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const updateField = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleArrayField = (field: keyof FormData, value: string) => {
    const current = formData[field] as string[];
    const updated = current.includes(value)
      ? current.filter(i => i !== value)
      : [...current, value];
    setFormData(prev => ({ ...prev, [field]: updated }));
  };

  const nextStep = () => {
    posthog.capture('form_step_completed', { step_index: step, step_name: ['intro', 'property', 'setup', 'goal', 'areas', 'tech', 'timeline', 'contact'][step] });
    setStep(s => s + 1);
  };
  
  const prevStep = () => setStep(s => s - 1);

  const validateContactInfo = () => {
    const newErrors: {[key: string]: string} = {};
    const mobileRegex = /^09\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!mobileRegex.test(formData.mobile)) {
      newErrors.mobile = "Please enter a valid PH mobile number (09xxxxxxxxx)";
    }
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFinalSubmit = () => {
    if (validateContactInfo()) {
      setIsSubmitting(true);
      posthog.capture('form_submission_started');
      onComplete(formData);
    }
  };

  const steps = [
    // 0. Intro
    <div key="start" className="text-center py-10">
      <h2 className="text-2xl font-bold mb-4 text-[#2D3748]">Let's shape your plan.</h2>
      <p className="text-slate-600 mb-8">A few quick questions to design the perfect security system for your home.</p>
      <button onClick={nextStep} className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold">Start</button>
    </div>,

    // 1. Property Type
    <div key="prop" className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">Our place is a...</h3>
      {['Single-family house', 'Townhouse / Duplex', 'Condo / Apartment', 'Other'].map(opt => (
        <button key={opt} onClick={() => { updateField('property_type', opt); nextStep(); }}
          className={`w-full p-4 rounded-xl border text-left hover:border-[#0E79B2] transition-all ${formData.property_type === opt ? 'border-[#0E79B2] bg-[#0E79B2]/5 ring-1 ring-[#0E79B2]' : 'border-slate-200'}`}>
          {opt}
        </button>
      ))}
    </div>,

    // 2. Current Setup (Modified - Removed Wireless Devices Question)
    <div key="setup" className="space-y-6">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">Current Setup</h3>
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700 mt-4">Do you currently have a security system?</label>
        <select className="w-full p-3 rounded-xl border border-slate-300" 
          value={formData.current_setup} onChange={e => updateField('current_setup', e.target.value)}>
          <option value="">Select status</option>
          <option>No, this is a new installation</option>
          <option>Yes, but it's broken/old (Needs replacement)</option>
          <option>Yes, looking to expand/upgrade</option>
        </select>
      </div>
      <button onClick={nextStep} disabled={!formData.current_setup}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-4">Next</button>
    </div>,

    // 3. Goals
    <div key="goals" className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">What is your main goal?</h3>
      <p className="text-center text-sm text-slate-500 mb-4">Select the most important one</p>
      <div className="space-y-3">
        {[
          { label: '✈️ Monitoring while traveling', value: 'Traveling' },
          { label: '👶 Keeping an eye on kids/elderly/pets', value: 'Family' },
          { label: '🛡️ Deterring theft/burglary', value: 'Security' },
          { label: '🌙 Sleeping soundly at night', value: 'Peace of Mind' }
        ].map((opt) => (
          <button key={opt.value} onClick={() => { updateField('main_goal', opt.value); nextStep(); }}
            className={`w-full p-4 rounded-xl border text-left hover:border-[#0E79B2] transition-all ${formData.main_goal === opt.value ? 'border-[#0E79B2] bg-[#0E79B2]/5 ring-1 ring-[#0E79B2]' : 'border-slate-200'}`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>,

    // 4. Size & Floors
    <div key="size" className="space-y-6">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">Home Details</h3>
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700">Lot Size</label>
        <select className="w-full p-3 rounded-xl border border-slate-300" 
          value={formData.home_size} onChange={e => updateField('home_size', e.target.value)}>
          <option value="">Select size</option>
          <option>Small (≤120 sqm)</option>
          <option>Medium (121-250 sqm)</option>
          <option>Large (251-450 sqm)</option>
          <option>Extra Large (451+ sqm)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700">Floors</label>
        <div className="flex gap-2">
          {['1', '2', '3+'].map(f => (
            <button key={f} type="button" 
              onClick={() => updateField('floors', f)}
              className={`flex-1 py-3 rounded-xl border ${formData.floors === f ? 'bg-[#0E79B2] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <button onClick={nextStep} disabled={!formData.home_size || !formData.floors}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-4">Next</button>
    </div>,

    // 5. Priority Areas
    <div key="areas" className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">Where do you need eyes?</h3>
      <p className="text-center text-sm text-slate-500 mb-4">Select all that apply</p>
      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
        {['Front door/porch', 'Gate/Driveway', 'Garage interior', 'Backyard/Patio', 'Side gates/Fence line', 'Street view/Plates', 'Living room', 'Whole perimeter (360°)'].map(area => (
          <label key={area} className={`flex items-center p-4 border rounded-xl cursor-pointer ${formData.priority_areas.includes(area) ? 'border-[#0E79B2] bg-[#0E79B2]/5' : 'border-slate-200'}`}>
            <input type="checkbox" className="w-5 h-5 text-[#0E79B2] rounded mr-3"
              checked={formData.priority_areas.includes(area)}
              onChange={() => toggleArrayField('priority_areas', area)}
            />
            {area}
          </label>
        ))}
      </div>
      <button onClick={nextStep} disabled={formData.priority_areas.length === 0}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-4">Next</button>
    </div>,

    // 6. Tech Prefs
    <div key="tech" className="space-y-6">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">System Preferences</h3>
      <div>
        <label className="block text-sm font-medium mb-2">Must-have Features (Pick up to 3)</label>
        <div className="space-y-2">
          {['Color at night (ColorVu)', 'Human/Vehicle Alerts', 'Two-way Audio', 'Mobile App Access', '24/7 Recording'].map(feat => (
            <label key={feat} className="flex items-center space-x-2">
              <input type="checkbox" 
                checked={formData.features_must.includes(feat)}
                onChange={() => toggleArrayField('features_must', feat)}
                className="rounded text-[#0E79B2]"
              />
              <span className="text-sm">{feat}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 rounded text-[#0E79B2]"
            checked={Boolean(formData.smart_home_interest)}
            onChange={(e) =>
              updateField("smart_home_interest", e.target.checked ? "Yes" : "")
            }
          />
          <div>
            <span className="text-sm font-medium">Interested in smart home integration</span>
            <p className="text-xs text-slate-500">
              Lighting, locks, sensors, and automation.
            </p>
          </div>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Budget Zone</label>
        <select className="w-full p-3 rounded-xl border border-slate-300"
          value={formData.budget_band} onChange={e => updateField('budget_band', e.target.value)}>
          <option value="">Select range</option>
          <option>Basic Starter</option>
          <option>All I can need (Best Value)</option>
          <option>Feature Rich</option>
          <option>Premium / Enterprise</option>
        </select>
      </div>
      <button onClick={nextStep} disabled={!formData.budget_band}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 mt-4">Next</button>
    </div>,

    // 7. Timeline
    <div key="timeline" className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">When do you need this?</h3>
      <div className="space-y-3">
        {[
          { label: '🔥 ASAP / This Week', value: 'ASAP' },
          { label: '📅 Within this month', value: 'This Month' },
          { label: '🏠 Before I move in / renovations finish', value: 'Before Move-in' },
          { label: '👀 Just researching for now', value: 'Researching' }
        ].map((opt) => (
          <button key={opt.value} onClick={() => { updateField('timeline', opt.value); nextStep(); }}
            className={`w-full p-4 rounded-xl border text-left hover:border-[#0E79B2] transition-all ${formData.timeline === opt.value ? 'border-[#0E79B2] bg-[#0E79B2]/5 ring-1 ring-[#0E79B2]' : 'border-slate-200'}`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>,

    // 8. Final Details
    <div key="final" className="space-y-4">
      <h3 className="text-xl font-bold text-center text-[#2D3748]">Almost done!</h3>
      <p className="text-center text-sm text-slate-500">Where should we send your custom plan?</p>
      
      <div className="flex gap-4">
        <input type="text" placeholder="First Name" className="w-1/2 p-3 rounded-xl border border-slate-300"
          value={formData.first_name} onChange={e => updateField('first_name', e.target.value)} />
        <input type="text" placeholder="Last Name" className="w-1/2 p-3 rounded-xl border border-slate-300"
          value={formData.last_name} onChange={e => updateField('last_name', e.target.value)} />
      </div>
      
      <div>
        <input type="email" placeholder="Email Address" 
          className={`w-full p-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-slate-300'}`}
          value={formData.email} onChange={e => updateField('email', e.target.value)} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>
        
      <div>
        <input type="tel" placeholder="Mobile Number (09xxxxxxxxx)" 
          className={`w-full p-3 rounded-xl border ${errors.mobile ? 'border-red-500' : 'border-slate-300'}`}
          value={formData.mobile} onChange={e => updateField('mobile', e.target.value)} />
        {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
      </div>

      <div className="pt-4">
        <label className="block text-sm font-medium mb-2">Current Safety Level (1-10)</label>
        <input type="range" min="1" max="10" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          value={formData.safety_level} onChange={e => updateField('safety_level', parseInt(e.target.value))} />
        <div className="text-center text-[#0E79B2] font-bold mt-1">{formData.safety_level}/10</div>
      </div>

      <button 
        onClick={handleFinalSubmit} 
        disabled={!formData.email || !formData.first_name || !formData.last_name || isSubmitting}
        className="w-full bg-[#0E79B2] text-white py-3 rounded-xl font-bold disabled:opacity-50 shadow-lg shadow-[#0E79B2]/30 flex justify-center items-center gap-2"
      >
        {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Plan...</> : 'Generate My Plan'}
      </button>
    </div>
  ];

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl relative"
      >
        {step > 0 && (
          <button onClick={prevStep} className="absolute top-8 left-8 text-slate-400 hover:text-slate-600">
            <ChevronLeft />
          </button>
        )}
        
        <div className="mb-8 flex justify-center">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#0E79B2] transition-all duration-500 ease-out"
              style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode='wait'>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
