import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const LEAD_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "";
const CHECKLIST_TEMPLATE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_CHECKLIST_TEMPLATE_ID || "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";

export async function sendLeadEmail(templateParams: Record<string, unknown>) {
  if (!SERVICE_ID || !LEAD_TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("EmailJS lead template not configured; skipping send.", {
      SERVICE_ID,
      LEAD_TEMPLATE_ID,
      PUBLIC_KEY,
    });
    return;
  }
  return emailjs.send(SERVICE_ID, LEAD_TEMPLATE_ID, templateParams, PUBLIC_KEY);
}

export async function sendChecklistEmail(templateParams: Record<string, unknown>) {
  if (!SERVICE_ID || !CHECKLIST_TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("EmailJS checklist template not configured; skipping send.", {
      SERVICE_ID,
      CHECKLIST_TEMPLATE_ID,
      PUBLIC_KEY,
    });
    return;
  }
  return emailjs.send(
    SERVICE_ID,
    CHECKLIST_TEMPLATE_ID,
    templateParams,
    PUBLIC_KEY,
  );
}
