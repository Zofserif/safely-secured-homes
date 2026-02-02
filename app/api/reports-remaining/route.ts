import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const REPORT_LIMIT = 15;
const WINDOW_DAYS = 3;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping reports count.");
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const now = new Date();
  const windowStartAt = new Date(now);
  windowStartAt.setDate(windowStartAt.getDate() - WINDOW_DAYS);
  const windowEndsAt = new Date(now);
  windowEndsAt.setDate(windowEndsAt.getDate() + WINDOW_DAYS);

  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", windowStartAt.toISOString())
    .lte("created_at", windowEndsAt.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const used = count ?? 0;
  const remaining = Math.max(0, REPORT_LIMIT - used);

  return NextResponse.json(
    {
      remaining,
      used,
      limit: REPORT_LIMIT,
      windowStartAt: windowStartAt.toISOString(),
      windowEndsAt: windowEndsAt.toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
