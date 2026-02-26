import { Printer } from "lucide-react";
import {
  BlueprintLead,
  ChecklistCard,
  MiniCheck,
  Section,
} from "./shared";

const ICE_TEMPLATE_PATH = "/assets/templates/ice/ice-card-template.pdf";
const PRINT_IFRAME_CLEANUP_DELAY_MS = 1000 * 60;

export default function EmergencyBlueprint() {
  const handlePrintIceCard = () => {
    if (typeof window === "undefined") return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");

    let isCleaned = false;
    const cleanup = () => {
      if (isCleaned) return;
      isCleaned = true;
      iframe.removeEventListener("load", handleLoad);
      if (cleanupTimerId !== null) {
        window.clearTimeout(cleanupTimerId);
      }
      iframe.remove();
    };

    const handleLoad = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        window.setTimeout(cleanup, 1500);
      }
    };

    const cleanupTimerId = window.setTimeout(
      cleanup,
      PRINT_IFRAME_CLEANUP_DELAY_MS,
    );

    iframe.addEventListener("load", handleLoad, { once: true });
    iframe.src = ICE_TEMPLATE_PATH;
    document.body.appendChild(iframe);
  };

  return (
    <>
      <BlueprintLead>
        Help is often &quot;on the way,&quot; but your first response starts at
        home. Preparation helps your family stay calm when every second counts.
      </BlueprintLead>

      <Section title="REMEMBER: I MEET 911 (ICE + 911 + Meet-Up Plan)">
        <div className="grid gap-3">
          <ChecklistCard
            icon="🪪"
            badge="ICE"
            accent="blue"
            title="In Case of Emergency (ICE) Card Setup"
            description="Create it, print it, and save it on every phone."
            titleAction={
              <button
                type="button"
                onClick={handlePrintIceCard}
                aria-label="Print ICE card template"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#0E79B2]/20 bg-[#F3F9FD] text-[#0E79B2] transition-colors hover:bg-[#E6F2FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/40"
              >
                <Printer className="h-4 w-4" />
              </button>
            }
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
