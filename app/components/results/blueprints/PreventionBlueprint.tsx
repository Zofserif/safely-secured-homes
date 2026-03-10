import {
  ChecklistCard,
  MiniCheck,
} from "./shared";

export default function PreventionBlueprint() {
  return (
    <>
      <div className="rounded-2xl border border-[#0E79B2]/20 bg-[#F3F9FD] px-5 py-4 text-sm leading-relaxed text-slate-700">
        Start with the basics: better lighting, better lock habits, and better
        front-door awareness. These are some of the simplest ways to reduce
        entry risk.
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <ChecklistCard
          icon="💡"
          accent="green"
          title="Light + Visibility"
          items={[
            "Turn on your porch light",
            "Add a motion light",
            "Clear blocked sightlines",
          ]}
        />

        <ChecklistCard
          icon="🔒"
          accent="blue"
          title="Locks + Openings"
          items={[
            "Lock doors and windows",
            "Check sliding doors",
            "Don’t hide spare keys outside",
          ]}
        />

        <ChecklistCard
          icon="🧰"
          accent="amber"
          title="Smart Entry Upgrade"
          items={[
            "Add a video doorbell",
            "Add a door sensor",
            "Upgrade to a smart lock",
          ]}
        />
      </div>

      <MiniCheck text="Would you know right away if someone approached your door tonight?" />
    </>
  );
}
