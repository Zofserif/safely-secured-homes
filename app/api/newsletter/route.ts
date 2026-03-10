import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  deriveNameFromEmail,
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
  name: string;
  email: string;
  source: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeInsertBody = (value: unknown): InsertNewsletterSubscriber | null => {
  if (!isRecord(value)) return null;

  const email = normalizeEmail(toSafeString(value.email));
  if (!email) return null;

  return {
    name: deriveNameFromEmail(email),
    email,
    source: toSafeString(value.source) || "newsletter",
  };
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

  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert(insertBody);

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
