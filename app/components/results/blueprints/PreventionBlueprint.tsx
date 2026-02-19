import { MiniCheck, Section } from "./shared";

export default function PreventionBlueprint() {
  return (
    <>
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-slate-800">Goal:</span> Stop
        problems before they start.
      </p>
      <Section title="15-minute Quick Wins (Do today)">
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
            <ul className="mt-2 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-[#0E79B2]">
              <li>Focus: gate, front door, garage, side door, dark corners.</li>
              <li>Add mini motion lights near these areas.</li>
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
            <ul className="mt-2 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-[#0E79B2]">
              <li>Hinges exposed?</li>
              <li>Locks smooth?</li>
              <li>Sliding windows locked?</li>
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
            <ul className="mt-2 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-[#0E79B2]">
              <li>Grab Kit: flashlight, power bank, whistle, small cash</li>
              <li>Fire: smoke alarms + extinguisher</li>
              <li>First aid ready to grab</li>
            </ul>
          </div>
        </div>
      </Section>
      <MiniCheck text="If there's a problem tonight - power outage, noise outside, fire risk - can your family respond in the first 60 seconds?" />
    </>
  );
}
