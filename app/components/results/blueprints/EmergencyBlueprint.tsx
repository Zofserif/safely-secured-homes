import {
  BlueprintLead,
  ChecklistCard,
  GoalBanner,
  InfoCallout,
  MiniCheck,
  Section,
} from "./shared";

export default function EmergencyBlueprint() {
  return (
    <>
      <BlueprintLead>
        Help is often &quot;on the way,&quot; but your first response starts at
        home. Preparation helps your family stay calm when every second counts.
      </BlueprintLead>
      <GoalBanner goal="Make the family calm and ready under stress." />

      <InfoCallout title="Quick reminder" tone="info">
        <p>
          Save emergency numbers on every phone now, not during an emergency.
        </p>
      </InfoCallout>

      <Section title="I MEET 911 (ICE + 911 + Meet-Up Plan)">
        <div className="grid gap-3">
          <ChecklistCard
            icon="🪪"
            badge="ICE"
            accent="blue"
            title="ICE Card Setup"
            description="Create it, print it, and save it on every phone."
            items={[
              "Include full names and birthdays.",
              "Add allergies, medical conditions, and blood type.",
              "List emergency contacts and your full home address with landmarks.",
            ]}
          />

          <ChecklistCard
            icon="📞"
            badge="911"
            accent="green"
            title="Call the Right Line"
            description="In the Philippines, 911 is the national emergency hotline."
            items={[
              "Save 911 on each family phone now.",
              "Teach kids and elders what to say first: name, address, and emergency.",
              "Keep backup emergency contacts written near the main door.",
            ]}
          />

          <ChecklistCard
            icon="📍"
            badge="Meet-Up"
            accent="amber"
            title="Meet-Up Plan"
            description="Set routes and a meet-up point everyone can remember."
            items={[
              "Prepare 2 exit routes: main and backup.",
              "Set 1 nearby meet-up location outside the house.",
              "Practice once so everyone can respond without confusion.",
            ]}
          />
        </div>
      </Section>

      <MiniCheck text="If someone yells 'Fire!' at 2 AM, does your family know exactly where to go without stopping to think?" />
    </>
  );
}
