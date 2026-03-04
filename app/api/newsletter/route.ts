import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  deriveFirstNameFromEmail,
  normalizeEmail,
} from "../../lib/contactName";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

type InsertNewsletterSubscriber = {
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  source: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeInsertBody = (value: unknown): InsertNewsletterSubscriber | null => {
  if (!isRecord(value)) return null;

  const email = normalizeEmail(toSafeString(value.email));
  if (!email) return null;

  const firstName = toSafeString(value.first_name) || deriveFirstNameFromEmail(email);

  return {
    first_name: firstName,
    last_name: toSafeString(value.last_name),
    email,
    contact_number: toSafeString(value.contact_number),
    source: toSafeString(value.source) || "newsletter",
  };
};

const isNameConstraintError = (error: {
  code?: string;
  message?: string;
  details?: string;
}): boolean => {
  if (error.code === "23502") return true;
  if (error.code !== "23514") return false;

  const errorText = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return (
    errorText.includes("first_name") ||
    errorText.includes("last_name") ||
    errorText.includes("name")
  );
};

export async function POST(req: Request) {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping newsletter insert.");
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const rawBody = await req.json().catch(() => null);
  const insertBody = sanitizeInsertBody(rawBody);

  if (!insertBody) {
    return NextResponse.json(
      { error: "Invalid newsletter payload" },
      { status: 400 }
    );
  }

  const { data: existing, error: lookupError } = await supabase
    .from("newsletter_subscribers")
    .select("id")
    .eq("email", insertBody.email)
    .limit(1);

  if (lookupError) {
    console.error("Newsletter lookup failed:", lookupError);
    return NextResponse.json(
      {
        error: lookupError.message,
        code: lookupError.code,
        details: lookupError.details,
      },
      { status: 400 }
    );
  }

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "Email already exists", code: "email_exists" },
      { status: 409 }
    );
  }

  let { error } = await supabase
    .from("newsletter_subscribers")
    .insert(insertBody);

  if (
    error &&
    !insertBody.last_name &&
    isNameConstraintError({
      code: error.code ?? undefined,
      message: error.message,
      details: error.details ?? undefined,
    })
  ) {
    const retryBody: InsertNewsletterSubscriber = {
      ...insertBody,
      last_name: "Subscriber",
    };
    const retryResult = await supabase
      .from("newsletter_subscribers")
      .insert(retryBody);
    error = retryResult.error;
  }

  if (error) {
    console.error("Newsletter insert failed:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Email already exists", code: "email_exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
