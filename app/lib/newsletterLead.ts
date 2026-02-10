export type NewsletterLead = {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
};

const STORAGE_KEY = "ssh_newsletter_lead";

export const readNewsletterLead = (): NewsletterLead | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NewsletterLead;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

export const writeNewsletterLead = (lead: NewsletterLead) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lead));
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
