import AccordionItem from "../../AccordionItem";
import { MiniCheck, Section } from "./shared";

export default function EmergencyBlueprint() {
  return (
    <>
      <p className="text-sm text-slate-600 pb-1">
        Help is always &quot;on the way&quot; but are they there when we need them the most? We need to prepare for moments to actwhen help is needed most.
      </p>
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-slate-800">Our Goal:</span> To make our family stay calm under stress
      </p>
      <Section title="I MEET 911 (ICE + 911 + Meet-Up Plan)">
        <div className="space-y-3">
          <AccordionItem title="ICE Card Setup (🪪)">
            <p className="text-sm text-slate-600">Create it. Print it. Save it.</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-[#0E79B2]">
              <li>Full names + birthdays</li>
              <li>Allergies / medical conditions</li>
              <li>Blood type</li>
              <li>Emergency contacts</li>
              <li>Home address + landmark directions</li>
            </ul>
          </AccordionItem>

          <AccordionItem title="Call the Right Line (📞)">
            <p className="text-sm text-slate-600">
              Save 911 on every phone. In the Philippines, 911 is the nationwide
              emergency hotline, supported by the government&apos;s Unified 911
              rollout.
            </p>
          </AccordionItem>

          <AccordionItem title="Meet-Up Plan (📍)">
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-[#0E79B2]">
              <li>2 exit routes: Main + backup</li>
              <li>
                1 meet-up spot nearby: outside the gate / neighbor&apos;s house /
                sari-sari store corner
              </li>
            </ul>
          </AccordionItem>
        </div>
      </Section>
      <MiniCheck text="If someone yells Fire! at 2 AM, does your family know where to go without thinking? I know your family will and let's make every home a Panatag Safe & Sound Certified" />
    </>
  );
}
