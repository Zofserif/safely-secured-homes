import { deriveNameFromEmail, normalizeEmail } from "./contactName";

export type NewsletterLead = {
  name: string;
  email: string;
};

type LegacyNewsletterLead = {
  name?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  email?: unknown;
  mobile?: unknown;
};

const STORAGE_KEY = "ssh_newsletter_lead";

const toSafeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const readNameFromLead = (lead: LegacyNewsletterLead, email: string) => {
  const explicitName = toSafeString(lead.name);
  if (explicitName) return explicitName;

  const firstName = toSafeString(lead.first_name);
  if (firstName) return firstName;

  const combinedLegacyName = [toSafeString(lead.first_name), toSafeString(lead.last_name)]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (combinedLegacyName) return combinedLegacyName;

  return deriveNameFromEmail(email);
};

export const readNewsletterLead = (): NewsletterLead | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LegacyNewsletterLead;
    if (!parsed || typeof parsed !== "object") return null;

    const email = normalizeEmail(toSafeString(parsed.email));
    if (!email) return null;

    return {
      name: readNameFromLead(parsed, email),
      email,
    };
  } catch {
    return null;
  }
};

export const writeNewsletterLead = (lead: NewsletterLead) => {
  if (typeof window === "undefined") return;
  try {
    const email = normalizeEmail(toSafeString(lead.email));
    if (!email) return;

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: toSafeString(lead.name) || deriveNameFromEmail(email),
        email,
      }),
    );
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
};

export const clearNewsletterLead = () => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
};
