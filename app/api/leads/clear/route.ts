import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const debugEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.DEBUG_CLEAR_LEADS === "true";

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

export async function POST(req: Request) {
  if (!debugEnabled) {
    return NextResponse.json(
      { error: "Debug clear disabled" },
      { status: 403 }
    );
  }

  if (!supabase) {
    console.warn("Supabase env vars missing; skipping lead delete.");
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const { error } = await supabase.from("leads").delete().eq("email", email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
