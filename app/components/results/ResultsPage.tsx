import { motion } from "framer-motion";
import { AlertTriangle, Calendar, CheckCircle2, FileText, Gauge, HouseHeart, Phone, ShieldCheck, Siren, Video, X } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { getResultsSummary } from "../../lib/calculations";
import { CalculationResult, FormData } from "../../lib/types";
import DIYView from "./DIYView";

type BlueprintCard = {
  id: string;
  title: string;
  summary: string;
  featured?: boolean;
  content: ReactNode;
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="mt-6">
    <h5 className="text-base font-semibold text-slate-800">{title}</h5>
    <div className="mt-3 space-y-3">{children}</div>
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#0E79B2]" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const MiniCheck = ({ text }: { text: string }) => (
  <div className="mt-6 rounded-2xl border border-[#0E79B2]/20 bg-[#0E79B2]/5 p-4 text-sm text-slate-700">
    <span className="font-semibold text-[#0E79B2]">Mini-check:</span> {text}
  </div>
);

export default function ResultsPage({ result, data }: { result: CalculationResult, data: FormData }) {
  const [showDIY, setShowDIY] = useState(false);
  const [activeBlueprintId, setActiveBlueprintId] = useState<string | null>(null);
  const { safetyLevel, priority, emergency, panatagRating } = getResultsSummary(data, result);
  const severityColors = {
    low: "text-[#2E8B57]",
    medium: "text-[#FFB300]",
    high: "text-[#E53E3E]",
  } as const;
  const panatagIconColor =
    panatagRating <= 5
      ? "text-[#E53E3E]"
      : panatagRating <= 8
        ? "text-[#F6C445]"
        : "text-[#2E8B57]";
  const blueprintCards: BlueprintCard[] = [
    {
      id: "prevention",
      title: "Prevention & Preparation",
      summary: "Goal: Stop problems before they start.",
      content: (
        <>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Goal:</span> Stop problems before they start.
          </p>
          <Section title="15-minute Quick Wins (Do today)">
            <p className="text-sm text-slate-700">
              Light up the entry points tonight. Focus on: gate, front door, garage, side door, and any dark corner where someone can hide.
            </p>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Check your door + window basics.</p>
              <BulletList
                items={[
                  "Are hinges exposed?",
                  "Are locks working smoothly?",
                  "Are sliding windows secured (even with a simple stopper)?",
                ]}
              />
            </div>
            <p className="text-sm text-slate-700">
              Create a &ldquo;grab kit&rdquo; location. Pick one spot everyone knows (cabinet near the main exit). Put: flashlight, power bank, whistle, and small cash.
            </p>
          </Section>
          <Section title="Weekend Upgrade (High-impact)">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Outdoor lighting plan (simple rule)</p>
              <p className="text-sm text-slate-700">
                Every entry point should be visible from the street and from inside the home.
              </p>
              <BulletList items={["Add motion lights where possible", "Aim lights downward to avoid glare and shadow zones"]} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Fire safety essentials</p>
              <BulletList
                items={[
                  "Install/replace smoke alarm batteries",
                  "Place a kitchen fire extinguisher where you can reach it without crossing the stove",
                  "Keep a fire blanket if cooking often",
                ]}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">First aid + medicine readiness</p>
              <BulletList
                items={[
                  "Basic first aid kit + bandages, antiseptic, thermometer",
                  "Keep maintenance meds in one labeled container",
                  "Add emergency items: ORS, antihistamine, pain reliever (as appropriate for your family)",
                ]}
              />
            </div>
          </Section>
          <MiniCheck text="If there's a problem tonight - power outage, noise outside, fire risk - can your family respond in the first 60 seconds?" />
        </>
      ),
    },
    {
      id: "awareness",
      title: "For Your Complete Peace of Mind",
      summary: "Goal: Detect threats early and respond faster without feeling watched.",
      featured: true,
      content: (
        <>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Goal:</span> Detect threats early, document what happened, and respond faster - without feeling watched.
          </p>
          <div className="mt-4 rounded-2xl border border-slate-100 bg-[#F7FAFC] p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-800">This is where most homes are weakest:</p>
            <ul className="mt-3 space-y-2">
              <li>Something happens at night...</li>
              <li>Nobody is sure what they saw...</li>
              <li>No evidence, no timeline, no clarity.</li>
            </ul>
          </div>
          <Section title="The 3 Layers of Real Home Protection">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">1) Awareness (Know what is happening)</p>
              <BulletList items={["Motion alerts for entry points", "Clear visibility of gate/front/garage/side paths"]} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">2) Evidence (If something happens, you are covered)</p>
              <BulletList
                items={[
                  "Recorded footage that clearly shows faces/plates (when possible)",
                  "Reliable storage (not just \"I think it recorded\")",
                ]}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">3) Response (Faster action, less panic)</p>
              <BulletList items={["Phone notifications that are set up correctly (not spammy)", "Family knows what to do when an alert triggers"]} />
            </div>
          </Section>
          <Section title="Why a security system is the natural next step">
            <p className="text-sm text-slate-700">A properly planned CCTV system gives you:</p>
            <BulletList
              items={[
                "Early warning before a situation escalates",
                "Proof for authorities, barangay reports, or disputes",
                "Confidence when you are away (work, school runs, travel)",
              ]}
            />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">But here is the key:</p>
              <p className="text-sm text-slate-700">&ldquo;More cameras&ldquo; does not automatically mean &ldquo;more safety. &ldquo;</p>
            </div>
            <p className="text-sm text-slate-700">Bad installs create:</p>
            <BulletList
              items={[
                "Blind spots (the exact angle intruders love)",
                "Glare at night (useless footage)",
                "The \"watched\" feeling inside the home",
                "Notifications that are so noisy you ignore them",
              ]}
            />
          </Section>
        </>
      ),
    },
    {
      id: "emergency",
      title: "Emergency Readiness",
      summary: "Goal: Make sure everyone knows what to do under stress.",
      content: (
        <>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Goal:</span> Make sure everyone knows what to do under stress.
          </p>
          <Section title="Build your family ICE system (In Case of Emergency)">
            <p className="text-sm text-slate-700">Create a simple &ldquo;ICE card&ldquo; and store it:</p>
            <BulletList items={["Printed on the fridge", "Saved on every family member's phone lock screen"]} />
            <p className="text-sm font-semibold text-slate-800">Include:</p>
            <BulletList
              items={[
                "Full names + birthdays (especially kids)",
                "Allergies / medical conditions",
                "Blood type (if known)",
                "Emergency contacts (2-3 people)",
                "Home address + landmark directions",
              ]}
            />
          </Section>
          <Section title="Know the emergency line">
            <p className="text-sm text-slate-700">
              In the Philippines, 911 is the nationwide emergency hotline (and it has been institutionalized as the emergency hotline number).
            </p>
            <p className="text-sm text-slate-700">
              Pro tip: Teach kids to say their name + address + what happened in one sentence.
            </p>
          </Section>
          <Section title="Evacuation route + meetup plan (Most families skip this)">
            <BulletList
              items={[
                "Pick 2 exit routes (main + backup)",
                "Decide 1 meetup spot nearby (outside the gate / neighbor's house / sari-sari store corner)",
                "Practice once: If we can't find each other inside, we go to the meetup spot.",
              ]}
            />
          </Section>
          <MiniCheck text="If someone yells Fire! at 2 AM, does everyone know where to go without thinking?" />
        </>
      ),
    },
  ];
  const activeBlueprint = blueprintCards.find((card) => card.id === activeBlueprintId) ?? null;

  useEffect(() => {
    if (!activeBlueprintId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveBlueprintId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeBlueprintId]);

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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
                <ShieldCheck className={`h-9 w-9 ${severityColors[safetyLevel.severity]}`} />
                <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">{safetyLevel.label}</div>
                <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">Safety Score</div>
              </div>
              <div className="bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
                <Gauge className={`h-9 w-9 ${severityColors[priority.severity]}`} />
                <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">{priority.label}</div>
                <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">Priority</div>
              </div>
              <div className="bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
                <Video className="h-9 w-9 text-[#0E79B2]" />
                <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">{result.cameraCount}</div>
                <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">Security Cameras</div>
              </div>
              <div className="bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
                <Siren className={`h-9 w-9 ${severityColors[emergency.severity]}`} />
                <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">{emergency.label}</div>
                <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">Emergency Readiness</div>
              </div>
              <div className="bg-[#F7FAFC] p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center gap-2">
                <HouseHeart className={`h-9 w-9 ${panatagIconColor}`} />
                <div className="text-xl font-bold leading-tight min-h-2.25rem text-[#2D3748]">{panatagRating}/10</div>
                <div className="text-[0.7rem] leading-snug text-slate-500 uppercase tracking-wider min-h-[1.9rem]">Panatag Rating</div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="font-bold text-2xl mb-4 flex items-center justify-center gap-2">
                Your Home Safety Blueprint
              </h3>
              <p className="text-center text-sm text-slate-600 mb-6">
                Tap a card to reveal the actions that make your home feel safer, faster.
              </p>
              <div className="grid gap-4 md:grid-cols-3 mb-8">
                {blueprintCards.map((card) => {
                  const isFeatured = Boolean(card.featured);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setActiveBlueprintId(card.id)}
                      className={[
                        "relative text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all duration-300",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/60",
                        "hover:-translate-y-1 hover:shadow-lg",
                        isFeatured ? "md:scale-[1.04] md:-translate-y-1 border-[#0E79B2]/40 bg-linear-to-br from-white via-white to-[#EAF4FB]" : "",
                      ].join(" ")}
                    >
                      {isFeatured && (
                        <span className="pointer-events-none absolute -inset-1 rounded-3xl bg-[#0E79B2]/20 blur-2xl opacity-70" />
                      )}
                      <div className="relative z-10">
                        <h4 className="text-lg font-bold text-slate-800">{card.title}</h4>
                        <p className="mt-2 text-sm text-slate-600">{card.summary}</p>
                        <p className="mt-3 text-xs text-slate-500">Click to view details</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {activeBlueprint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                  <button
                    type="button"
                    onClick={() => setActiveBlueprintId(null)}
                    className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
                    aria-label="Close blueprint details"
                  />
                  <div
                    role="dialog"
                    aria-modal="true"
                    className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)] ring-1 ring-slate-200"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveBlueprintId(null)}
                      className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-2 text-white shadow-sm backdrop-blur hover:bg-white/30"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="bg-linear-to-r from-[#0E79B2] via-[#1B8CCB] to-[#0E79B2] px-6 py-5 text-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/70">Your Home Safety Blueprint</p>
                      <h4 className="mt-2 text-2xl font-bold">{activeBlueprint.title}</h4>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto bg-white px-6 py-6">
                      <div className="rounded-2xl border border-slate-100 bg-[#F7FAFC] p-4 text-sm text-slate-600">
                        Here is the exact checklist we recommend for this area.
                      </div>
                      <div className="mt-5">{activeBlueprint.content}</div>
                    </div>
                  </div>
                </div>
              )}
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-[#2E8B57]" />Safely Secured Homes Approach
              </h3>
              <ul className="space-y-3">
                {result.recommendations.length > 0 ? result.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3 text-slate-700 bg-[#F7FAFC] p-3 rounded-lg">
                    <span className="text-[#0E79B2] font-bold">•</span> {rec}
                  </li>
                )) : (
                  <li className="text-slate-500 italic">We focus on security that blends into your home layout—so you feel safe, not monitored. The recommendations are based on your selections.</li>
                )}
                {data.priority_areas.length > 0 && (
                  <li className="flex gap-3 text-slate-700 bg-[#F7FAFC] p-3 rounded-lg">
                    <span className="text-[#0E79B2] font-bold">•</span> 
                    Key Zones: {data.priority_areas.join(", ")}
                  </li>
                )}
                  <li className="flex gap-3 text-slate-700 bg-[#F7FAFC] p-3 rounded-lg">
                     <p><strong>Our baseline promise:</strong> All key zones points covered with cameras + notifications configured for real threats (not constant alarm) and we are there for your safety needs from consult, install, and maintain.</p>
                  </li>
              </ul>
            </div>

            {/* Next Steps - Dynamic Buttons */}
            <div className="bg-[#FFB300]/10 border border-[#FFB300]/30 rounded-2xl p-6">
              <h4 className="font-bold text-[#2D3748] mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#FFB300]" /> Next Step
              </h4>
              <p className="text-[#2D3748] mb-4 text-sm">
                Since your home requires <strong>{result.cameraCount} cameras</strong>, identifying blind spots, professional camera placement, and layout plan. Click the &ldquo;Call Us Now&ldquo; to reserve onsite assessment for FREE and get a done all for you personalized security system.
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
