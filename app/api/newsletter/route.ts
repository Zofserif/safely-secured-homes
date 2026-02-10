import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

export async function POST(req: Request) {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping newsletter insert.");
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const email =
    typeof body?.email === "string" ? body.email.trim() : "";

  if (email) {
    const { data: existing, error: lookupError } = await supabase
      .from("newsletter_subscribers")
      .select("id")
      .eq("email", email)
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
  }
  const { error } = await supabase.from("newsletter_subscribers").insert(body);

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
