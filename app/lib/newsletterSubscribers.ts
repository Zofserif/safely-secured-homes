import { createClient } from "@supabase/supabase-js";
import { unsubscribeNewsletterSubscriberByEmail } from "./newsletterCampaigns";

type NewsletterUnsubscribeStatus =
  | "success"
  | "invalid_email"
  | "not_configured"
  | "error";

type NewsletterUnsubscribeResult = {
  status: NewsletterUnsubscribeStatus;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseServiceRole =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const supabaseAnon =
  supabaseUrl && anonKey ? createClient(supabaseUrl, anonKey) : null;

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const isValidEmailAddress = (value: string) => EMAIL_REGEX.test(value);

export async function unsubscribeNewsletterSubscriber(
  rawEmail: string,
): Promise<NewsletterUnsubscribeResult> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmailAddress(email)) {
    return { status: "invalid_email" };
  }

  if (supabaseServiceRole) {
    try {
      await unsubscribeNewsletterSubscriberByEmail(email);
    } catch (error) {
      console.error("Newsletter unsubscribe failed:", error);
      return { status: "error" };
    }

    return { status: "success" };
  }

  if (supabaseAnon) {
    const { error } = await supabaseAnon.rpc("unsubscribe_newsletter_subscriber", {
      input_email: email,
    });

    if (error) {
      console.error("Newsletter unsubscribe RPC failed:", error);
      return { status: "error" };
    }

    return { status: "success" };
  }

  console.warn("Supabase env vars missing; skipping newsletter unsubscribe.");
  return { status: "not_configured" };
}
