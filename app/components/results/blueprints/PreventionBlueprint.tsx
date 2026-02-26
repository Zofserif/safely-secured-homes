import {
  BlueprintLead,
  ChecklistCard,
  MiniCheck,
  Section,
} from "./shared";

export default function PreventionBlueprint() {
  return (
    <>
      <BlueprintLead>
        An ounce of prevention is worth a pound of cure -- Benjamin Franklin
        <br />
        <br /> 
        <div className="text-sm text-slate-500 not-italic">
        A famous thousand years saying that we tend to use nowadays as &quot;Prevention is better than cure&quot; but still holds weight until to this day.
        As Filipinos we believe heavily in superstitions, and while some of them are harmless, others can lead to a false sense of security.
        Let&apos;s take our culture as a guiding help to take actionable ways to prevent problems before they happen.
        </div>
      </BlueprintLead>

      <Section title="Make This Your Tonight Checklist">
        <div className="grid gap-4 md:grid-cols-3">
          <ChecklistCard
            icon="💡"
            badge="Fast Win"
            accent="green"
            title="Light + Visibility"
            description="Most blind spots show up at night."
            items={[
              "Add mini motion lights near your entrance.",
              "Turn on indoor lights before going to bed (i.e. Kitchen/Living Room).",
            ]}
          />

          <ChecklistCard
            icon="🔒"
            badge="Preventive"
            accent="blue"
            title="Locks + Openings"
            description="Do one quick lock check before sleep."
            items={[
              "Keep keys in a safe and consistent spot.",
              "Confirm gate and front door are locked.",
              "Check windows and sliding doors.",
            ]}
          />

          <ChecklistCard
            icon="🧰"
            badge="Be Ready"
            accent="amber"
            title="Emergency Ready"
            description="Keep essentials ready to grab."
            items={[
              "Prepare a grab kit: flashlight, power bank, and whistle.",
              "Keep smoke alarms and a fire extinguisher ready.",
              "Place first aid where everyone can access it quickly.",
            ]}
          />
        </div>
      </Section>

      <MiniCheck text="If there is a power outage, strange noise, or fire risk tonight, can your family respond in the first 60 seconds without panic?" />
    </>
  );
}
