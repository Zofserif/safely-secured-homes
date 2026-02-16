import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createShareableResultsPayload,
  parseShareableResultsPayload,
} from "../../lib/resultsShare";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const LINK_KEY_BYTES = 18;
const LINK_KEY_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;
const LINK_EXPIRY_DAYS = 90;
const INSERT_RETRY_COUNT = 3;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

export const dynamic = "force-dynamic";

const generateLinkKey = () => randomBytes(LINK_KEY_BYTES).toString("base64url");

const isExpired = (value: string | null): boolean => {
  if (!value) return false;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return true;
  return timestamp < Date.now();
};

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function POST(req: Request) {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping results-link insert.");
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const formData = parseShareableResultsPayload(body?.payload);
  if (!formData) {
    return NextResponse.json({ error: "Invalid share payload" }, { status: 400 });
  }

  const payload = createShareableResultsPayload(formData);
  if (!payload) {
    return NextResponse.json({ error: "Invalid share payload" }, { status: 400 });
  }

  const contactRaw =
    typeof body?.contact === "object" && body.contact !== null ? body.contact : {};
  const firstName = normalizeText((contactRaw as { first_name?: unknown }).first_name);
  const lastName = normalizeText((contactRaw as { last_name?: unknown }).last_name);
  const emailRaw = normalizeText((contactRaw as { email?: unknown }).email);
  const mobile =
    normalizeText((contactRaw as { mobile?: unknown }).mobile) ??
    normalizeText((contactRaw as { phone_number?: unknown }).phone_number) ??
    normalizeText((contactRaw as { phone?: unknown }).phone);
  const email = emailRaw ? emailRaw.toLowerCase() : null;

  const expiresAt = new Date(
    Date.now() + LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  for (let attempt = 0; attempt < INSERT_RETRY_COUNT; attempt += 1) {
    const linkKey = generateLinkKey();

    const { error } = await supabase.from("results_links").insert({
      link_key: linkKey,
      first_name: firstName,
      last_name: lastName,
      email,
      mobile,
      payload,
      expires_at: expiresAt,
    });

    if (!error) {
      return NextResponse.json(
        { key: linkKey, expiresAt },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    if (error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Failed to generate unique share link key" },
    { status: 500 }
  );
}

export async function GET(req: Request) {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping results-link fetch.");
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const key = new URL(req.url).searchParams.get("key")?.trim() ?? "";
  if (!LINK_KEY_PATTERN.test(key)) {
    return NextResponse.json({ error: "Invalid share link key" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("results_links")
    .select("payload, expires_at, revoked_at")
    .eq("link_key", key)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Share link not found" }, { status: 404 });
  }

  if (data.revoked_at || isExpired(data.expires_at)) {
    return NextResponse.json({ error: "Share link expired" }, { status: 410 });
  }

  const formData = parseShareableResultsPayload(data.payload);
  if (!formData) {
    return NextResponse.json({ error: "Invalid share payload" }, { status: 500 });
  }

  return NextResponse.json(
    { formData },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
