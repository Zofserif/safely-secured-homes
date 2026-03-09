import { Printer } from "lucide-react";
import {
  ChecklistCard,
  MiniCheck,
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
      <div className="rounded-2xl border border-[#0E79B2]/20 bg-[#F3F9FD] px-5 py-4 text-sm leading-relaxed text-slate-700">
        A ready home has 3 basics: emergency contacts, a fast call-for-help
        plan, and a simple exit and meet-up plan.
      </div>

      <div className="mt-6 grid gap-3">
        <ChecklistCard
          icon="🪪"
          accent="blue"
          title="Emergency Contacts"
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
            "Save 911 on each phone",
            "Make a family contact card",
            "Include address and medical needs",
          ]}
        />

        <ChecklistCard
          icon="📞"
          accent="green"
          title="Call for Help Fast"
          items={[
            "Teach name, address, emergency",
            "Keep backup contacts visible",
            "Make sure 2 people know how to call",
          ]}
        />

        <ChecklistCard
          icon="📍"
          accent="amber"
          title="Exit + Meet-Up Plan"
          items={[
            "Pick 1 outside meet-up spot",
            "Pick 1 backup meet-up spot",
            "Know 2 ways out when possible",
            "Test smoke alarms monthly",
          ]}
        />
      </div>

      <MiniCheck text="Would your family know what to do in the first 60 seconds?" />
    </>
  );
}
