import {
  BlueprintLead,
  ChecklistCard,
  GoalBanner,
  MiniCheck,
  Section,
} from "./shared";

export default function PreventionBlueprint() {
  return (
    <>
      <BlueprintLead>
        There&apos;s a famous saying  &quot;Prevention is better than cure.&quot;
      </BlueprintLead>
      <GoalBanner goal="Stop problems before they happen." />

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
              "Turn on key indoor lights before going to bed.",
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
            badge="Family Safety"
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
