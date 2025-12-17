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
    console.warn("Supabase env vars missing; skipping lead insert.");
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { error } = await supabase.from("leads").insert(body);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
