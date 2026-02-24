import { MiniCheck, Section } from "./shared";

export default function PreventionBlueprint() {
  return (
    <>
      <p className="text-sm text-slate-600 pb-1">
        There&apos;s a famous saying that you&apos;ve heard of &quot;Prevention
        is better than cure.&quot;
      </p>
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-slate-800">Our Goal:</span>To stop
        problems before they happen.
      </p>
      <Section title="Make This Your Today's Task">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl" aria-hidden="true">
                💡
              </span>
              <span className="rounded-full bg-[#2E8B57]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#2E8B57]">
                Fast Win
              </span>
            </div>
            <h6 className="mt-3 text-sm font-semibold text-slate-800">
              Light + Visibility
            </h6>
            <p className="mt-2 text-sm text-slate-600">
              There are more blindspots in your home especially at night
            </p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-[#0E79B2]">
              <li>Add mini motion lights home entrance.</li>
              <li>
                Turn on your lights (kitchen/living room), before going to bed.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl" aria-hidden="true">
                🔒
              </span>
              <span className="rounded-full bg-[#0E79B2]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#0E79B2]">
                Preventive
              </span>
            </div>
            <h6 className="mt-3 text-sm font-semibold text-slate-800">
              Locks + Openings
            </h6>
            <p className="mt-2 text-sm text-slate-600">
              Before you sleep, check for:
            </p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-[#0E79B2]">
              <li>Keys near my bedside?</li>
              <li>Gate/Front Door Lock</li>
              <li>Windows/Sliding Window</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl" aria-hidden="true">
                🧰
              </span>
              <span className="rounded-full bg-[#FFB300]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#B46B00]">
                Family Safety
              </span>
            </div>
            <h6 className="mt-3 text-sm font-semibold text-slate-800">
              Emergency Ready
            </h6>
            <p className="mt-2 text-sm text-slate-600">
              Every home needs this at all times
            </p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-[#0E79B2]">
              <li>Grab Kit: flashlight, power bank, whistle</li>
              <li>Smoke Alarms + Fire Extinguisher</li>
              <li>First aid ready to grab</li>
            </ul>
          </div>
        </div>
      </Section>
      <MiniCheck text="If there's a problem tonight - power outage, noise outside, fire risk - can your family respond in the first 60 seconds? I know your family will and let's make every home a Panatag Safe & Sound Certified" />
    </>
  );
}
