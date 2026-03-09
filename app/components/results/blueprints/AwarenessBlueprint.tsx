import {
  BulletList,
  ChecklistCard,
  InfoCallout,
  Section,
} from "./shared";

type AwarenessBlueprintProps = {
  cameraCount: number;
  nvrChannel: number;
  storageEstimatedTB7d: number;
  storageRecommendedTB: number;
};

const formatStorageEstimateTB = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
};

export default function AwarenessBlueprint({
  cameraCount,
  nvrChannel,
  storageEstimatedTB7d,
  storageRecommendedTB,
}: AwarenessBlueprintProps) {
  const storageRecommendation = `${storageRecommendedTB} TB recommended (~${formatStorageEstimateTB(storageEstimatedTB7d)} TB for 7 days)`;

  return (
    <>
      <div className="rounded-2xl border border-[#0E79B2]/20 bg-[#F3F9FD] px-5 py-4 text-sm leading-relaxed text-slate-700">
        <p>Most homes do not need more gadgets.</p>
        <p className="mt-1 font-semibold text-slate-800">
          They need the right daily protection in the right places.
        </p>
        <p className="mt-2">
          If you cannot clearly see what is happening, record what happened,
          and respond quickly when something feels off, your home may still
          have protection gaps even if you already have some devices installed.
        </p>
      </div>

      <InfoCallout title="Why this matters every day" tone="info">
        <p>A home feels more secure when three things work together:</p>
        <BulletList
          items={[
            "you notice activity early",
            "you capture footage clearly",
            "you can respond without panic or guesswork",
          ]}
        />
        <p>
          That is what a properly planned security system is meant to do.
        </p>
      </InfoCallout>

      <Section
        title="Your 3 Layers of Daily Protection"
        titleClassName="text-lg md:text-xl font-bold text-slate-900"
      >
        <div className="grid gap-3">
          <ChecklistCard
            icon="👀"
            accent="blue"
            title="Awareness"
            description="Know what is happening as it starts."
            items={[
              "Cover key entry points and blind spots.",
              "Keep front areas, gates, garage access, and side paths visible.",
              "Set motion alerts where they help, not where they create noise.",
            ]}
          />
          <ChecklistCard
            icon="🧾"
            accent="green"
            title="Evidence"
            description="Capture footage you can actually use."
            items={[
              "Place cameras where movement and approach paths are clearly seen.",
              "Make sure night visibility is usable, not just there.",
              "Use proper recording and storage so footage is there when you need it.",
            ]}
          />
          <ChecklistCard
            icon="⚡"
            accent="amber"
            title="Response"
            description="Act faster with less guesswork."
            items={[
              "Make sure alerts reach the right person.",
              "Check that live view and playback are easy to access.",
              "Agree on what your family should do when an alert comes in.",
            ]}
          />
        </div>
      </Section>

      <Section
        title="Your Recommended Protection Setup"
        titleClassName="text-lg md:text-xl font-bold text-slate-900"
      >
        <div className="rounded-2xl border border-[#0E79B2]/20 bg-[#F7FBFF] p-4">
          <p className="text-sm text-slate-700">
            Based on your answers, your home may need:
          </p>
          <ul className="mt-3 space-y-2">
            <li className="rounded-lg border border-[#D9EAF8] bg-white px-3 py-2 text-sm font-semibold text-slate-800">
              {cameraCount} cameras
            </li>
            <li className="rounded-lg border border-[#D9EAF8] bg-white px-3 py-2 text-sm font-semibold text-slate-800">
              {nvrChannel}-Channel NVR
            </li>
            <li className="rounded-lg border border-[#D9EAF8] bg-white px-3 py-2 text-sm font-semibold text-slate-800">
              {storageRecommendation} storage
            </li>
          </ul>
          <p className="mt-3 text-sm text-slate-700">
            This is your recommended starting point based on your home layout,
            risk areas, and daily routine.
          </p>
          <p className="mt-2 text-sm text-slate-700">
            A better setup is not about adding everything. It is about putting
            the right coverage where it matters most, with enough recording and
            storage to make the system useful.
          </p>
        </div>
      </Section>

      <Section
        title="Why a Consultation Is the Smart Next Step"
        titleClassName="text-lg md:text-xl font-bold text-slate-900"
      >
        <div className="rounded-2xl border border-[#0E79B2]/20 bg-[#EAF4FB] p-4 text-sm leading-relaxed text-slate-700">
          <p>
            A camera system only works well when the placement, recorder,
            storage, and viewing setup match the actual home.
          </p>
          <p className="mt-2">
            If camera angles are wrong, blind spots stay open.
            If recording is weak, footage may not help when you need it.
            If alerts are messy, people start ignoring them.
          </p>
          <p className="mt-2">
            A professional security consultation helps you plan the right
            system before you spend on the wrong one.
          </p>
        </div>
      </Section>

      <div className="rounded-3xl border border-[#0E79B2]/35 bg-linear-to-r from-[#0E79B2] to-[#146E9E] p-5 text-center text-white shadow-xl shadow-[#0E79B2]/30">
        <p className="text-base font-extrabold leading-tight md:text-lg">
          Want a system that actually fits your home?
        </p>
        <p className="mt-2 text-sm text-white/90">
          A proper consultation helps you confirm the right camera count,
          recorder, storage, and placement for your layout.
        </p>
      </div>
    </>
  );
}
