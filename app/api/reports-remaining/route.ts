import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const REPORT_LIMIT = 15;
const CYCLE_MS = 3 * 24 * 60 * 60 * 1000;
const DEFAULT_REPORT_CYCLE_ANCHOR_ISO = "2026-02-26T09:42:57Z";
const DEFAULT_REPORT_CYCLE_ANCHOR_MS = Date.parse(
  DEFAULT_REPORT_CYCLE_ANCHOR_ISO
);

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

  const anchorIso =
    process.env.REPORT_CYCLE_ANCHOR_ISO?.trim() || DEFAULT_REPORT_CYCLE_ANCHOR_ISO;
  const parsedAnchorMs = Date.parse(anchorIso);
  const anchorMs = Number.isNaN(parsedAnchorMs)
    ? DEFAULT_REPORT_CYCLE_ANCHOR_MS
    : parsedAnchorMs;
  if (Number.isNaN(parsedAnchorMs)) {
    console.warn(
      `Invalid REPORT_CYCLE_ANCHOR_ISO "${anchorIso}", falling back to default ${DEFAULT_REPORT_CYCLE_ANCHOR_ISO}.`
    );
  }

  const effectiveNowMs = Date.now();
  const elapsedMs = Math.max(0, effectiveNowMs - anchorMs);
  const cycleIndex = Math.floor(elapsedMs / CYCLE_MS);
  const windowStartMs = anchorMs + cycleIndex * CYCLE_MS;
  const windowEndMs = windowStartMs + CYCLE_MS;
  const windowStartAtIso = new Date(windowStartMs).toISOString();
  const windowEndsAtIso = new Date(windowEndMs).toISOString();

  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", windowStartAtIso)
    .lt("created_at", windowEndsAtIso);

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
      windowStartAt: windowStartAtIso,
      windowEndsAt: windowEndsAtIso,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
