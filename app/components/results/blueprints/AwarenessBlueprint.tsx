import {
  BlueprintLead,
  BulletList,
  ChecklistCard,
  InfoCallout,
  Section,
} from "./shared";

export default function AwarenessBlueprint() {
  return (
    <>
      <BlueprintLead>
        Even a guard dog sleeps at night. Home safety should stay awake 24/7,
        with visibility, proof, and a clear response plan.
      </BlueprintLead>

      <InfoCallout title="Where most homes are weakest" tone="warning">
        <p>
          When an incident happens, families are often unsure what they saw and
          do not have usable evidence.
        </p>
        <p>
          Huwag hintayin na may mangyari bago kumilos. Build your system before
          you need it.
        </p>
      </InfoCallout>

      <Section
        title="3 Layers of Protection to Stay Ahead in Most Filipino Homes"
        titleClassName="text-lg md:text-xl font-bold text-slate-900"
      >
        <div className="grid gap-3">
          <ChecklistCard
            icon="👀"
            badge="Layer 1"
            accent="blue"
            title="Awareness"
            description="Know what is happening in real time."
            items={[
              "Enable motion alerts for key entry points.",
              "Keep clear camera visibility on gate, front area, garage, and side paths.",
            ]}
          />
          <ChecklistCard
            icon="🧾"
            badge="Layer 2"
            accent="green"
            title="Evidence"
            description="If something happens, you are covered."
            items={[
              "Capture footage that clearly shows faces or plates when possible.",
              "Use reliable storage, not guesswork recording.",
            ]}
          />
          <ChecklistCard
            icon="⚡"
            badge="Layer 3"
            accent="amber"
            title="Response"
            description="Act faster with less panic."
            items={[
              "Set up notifications correctly so alerts stay useful, not spammy.",
              "Make sure the family knows what to do when an alert triggers.",
            ]}
          />
        </div>
      </Section>

      <Section
        title="Why a Smart Safety System is Your Best Next Step"
        titleClassName="text-lg md:text-xl font-bold text-slate-900"
      >
        <div className="rounded-2xl border border-[#0E79B2]/20 bg-[#EAF4FB] p-4">
          <p className="text-base font-semibold text-slate-800">
            A properly planned CCTV system gives you:
          </p>
          <BulletList
            items={[
              "Early warning before a situation happens (Awareness)",
              "Proof for authorities, barangay reports, or disputes (Evidence)",
              "Confidence when you are away from home (Response)",
            ]}
          />
        </div>
        <div className="rounded-3xl border border-[#0E79B2]/40 bg-[#0E79B2] p-5 text-center text-white shadow-lg shadow-[#0E79B2]/30">
          <p className="mt-2 text-sm font-extrabold text-white/90">
            Want to reach a 100 Panatag Rating? A complete home assessment is
            your best next step.
          </p>
        </div>
      </Section>
    </>
  );
}
