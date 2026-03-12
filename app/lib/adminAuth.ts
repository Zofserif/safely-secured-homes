import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_SESSION_COOKIE_NAME = "ssh_admin_session";
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const getAdminPassword = () => process.env.ADMIN_PASSWORD?.trim() || "";
const getAdminSessionSecret = () => process.env.ADMIN_SESSION_SECRET?.trim() || "";

const createCookieExpiry = () => new Date(Date.now() + ADMIN_SESSION_TTL_MS);

const encodeBase64Url = (value: string) =>
  Buffer.from(value, "utf8").toString("base64url");

const decodeBase64Url = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

const signSessionPayload = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
};

const buildSessionToken = (secret: string) => {
  const payload = encodeBase64Url(
    JSON.stringify({
      exp: Date.now() + ADMIN_SESSION_TTL_MS,
    }),
  );

  return `${payload}.${signSessionPayload(payload, secret)}`;
};

const verifySessionToken = (token: string, secret: string) => {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expectedSignature = signSessionPayload(payload, secret);
  if (!safeEqual(signature, expectedSignature)) return false;

  try {
    const decodedPayload = JSON.parse(decodeBase64Url(payload)) as {
      exp?: unknown;
    };
    return (
      typeof decodedPayload.exp === "number" &&
      Number.isFinite(decodedPayload.exp) &&
      decodedPayload.exp > Date.now()
    );
  } catch {
    return false;
  }
};

export const getAdminAuthConfigurationError = () => {
  if (!getAdminPassword()) {
    return "ADMIN_PASSWORD is not configured.";
  }

  if (!getAdminSessionSecret()) {
    return "ADMIN_SESSION_SECRET is not configured.";
  }

  return null;
};

export const isAdminAuthConfigured = () =>
  getAdminAuthConfigurationError() === null;

export async function isAdminAuthenticated() {
  const secret = getAdminSessionSecret();
  if (!secret) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value || "";
  if (!token) return false;

  return verifySessionToken(token, secret);
}

export async function requireAdminSession() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }
}

export async function createAdminSession() {
  const configurationError = getAdminAuthConfigurationError();
  if (configurationError) {
    throw new Error(configurationError);
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: buildSessionToken(getAdminSessionSecret()),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: createCookieExpiry(),
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export const isValidAdminPassword = (candidate: string) => {
  const expectedPassword = getAdminPassword();
  const normalizedCandidate = candidate.trim();
  if (!expectedPassword || !normalizedCandidate) return false;
  return safeEqual(normalizedCandidate, expectedPassword);
};
