import { NextResponse } from "next/server";
import {
  sendLeadNtfyNotification,
  type LeadNtfyNotificationPayload,
} from "../../../lib/ntfy";
import type { LeadTier } from "../../../lib/types";

const debugEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.DEBUG_NTFY_TEST === "true";

type NtfyDebugMode = "stored_lead" | "synthetic";

type NtfyDebugSuccessResponse = {
  ok: true;
  mode: NtfyDebugMode;
  ntfy_status: "sent" | "skipped";
  reason?: "missing_config";
};

type NtfyDebugErrorResponse = {
  ok: false;
  mode: NtfyDebugMode;
  error: string;
};

const SYNTHETIC_DEBUG_PAYLOAD: LeadNtfyNotificationPayload = {
  name: "SSH Debug Lead",
  email: "ssh-debug-lead@example.com",
  mobile: "+639171234567",
  tier: "Warm",
  score: 62,
  source: "ssh_debug_synthetic",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toFiniteNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const toScore100 = (value: unknown): number =>
  Math.max(0, Math.min(100, Math.round(toFiniteNumber(value))));

const toLeadTier = (value: unknown): LeadTier =>
  value === "Hot" || value === "Warm" || value === "Nurture"
    ? value
    : "Nurture";

const normalizeError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
};

const toDebugMode = (value: unknown): NtfyDebugMode | null => {
  const mode = toSafeString(value);
  if (mode === "stored_lead" || mode === "synthetic") return mode;
  return null;
};

const sanitizeDebugPayload = (
  value: unknown
): LeadNtfyNotificationPayload | null => {
  if (!isRecord(value)) return null;

  const email = toSafeString(value.email).toLowerCase();
  if (!email) return null;

  return {
    name: toSafeString(value.name) || "SSH Debug Lead",
    email,
    mobile: toSafeString(value.mobile),
    tier: toLeadTier(value.tier),
    score: toScore100(value.score),
    source: toSafeString(value.source) || "ssh_debug_stored",
  };
};

export async function POST(req: Request) {
  if (!debugEnabled) {
    return NextResponse.json(
      { error: "Debug ntfy test disabled" },
      { status: 403 }
    );
  }

  const rawBody = await req.json().catch(() => null);
  const body = isRecord(rawBody) ? rawBody : {};

  const modeHint = toDebugMode(body.mode);
  const payloadInput = isRecord(body.payload) ? body.payload : body;
  const sanitizedPayload = sanitizeDebugPayload(payloadInput);

  const mode: NtfyDebugMode = sanitizedPayload
    ? modeHint ?? "stored_lead"
    : "synthetic";
  const payload = sanitizedPayload ?? SYNTHETIC_DEBUG_PAYLOAD;

  try {
    const ntfyResult = await sendLeadNtfyNotification(payload);
    const responseBody: NtfyDebugSuccessResponse = {
      ok: true,
      mode,
      ntfy_status: ntfyResult.status,
    };

    if (ntfyResult.status === "skipped") {
      responseBody.reason = ntfyResult.reason;
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    const responseBody: NtfyDebugErrorResponse = {
      ok: false,
      mode,
      error: normalizeError(error),
    };

    return NextResponse.json(responseBody, { status: 502 });
  }
}
