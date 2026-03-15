import type { LeadPayloadV2 } from "./leadPayload";
import { publicSiteUrl } from "./site.ts";
import type { FormData } from "./types";

export const RESULTS_LINK_KEY_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;
export const DEFAULT_RESULTS_LINK_URL = new URL(
  "/results",
  publicSiteUrl,
).toString();

export type ResultsLinkSnapshot = {
  linkKey: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
};

const parseTimestamp = (value: string | null): number | null => {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const buildResultsLinkUrl = (
  linkKey: string,
  baseUrl = publicSiteUrl,
): string => {
  const normalizedKey = linkKey.trim();
  const url = new URL("/results", baseUrl);
  url.searchParams.set("r", normalizedKey);
  return url.toString();
};

export const isResultsLinkExpired = (
  value: string | null,
  nowMs = Date.now(),
): boolean => {
  if (!value) return false;
  const timestamp = parseTimestamp(value);
  if (timestamp === null) return true;
  return timestamp < nowMs;
};

export const isResultsLinkCurrentForLead = (
  linkCreatedAt: string | null,
  leadCreatedAt: string | null,
): boolean => {
  const linkTimestamp = parseTimestamp(linkCreatedAt);
  if (linkTimestamp === null) return false;

  const leadTimestamp = parseTimestamp(leadCreatedAt);
  if (leadTimestamp === null) return true;

  return linkTimestamp >= leadTimestamp;
};

export const selectReusableResultsLink = (
  links: readonly ResultsLinkSnapshot[],
  leadCreatedAt: string | null,
  nowMs = Date.now(),
): ResultsLinkSnapshot | null => {
  const sortedLinks = [...links].sort((a, b) => {
    const aTimestamp = parseTimestamp(a.createdAt) ?? -1;
    const bTimestamp = parseTimestamp(b.createdAt) ?? -1;
    return bTimestamp - aTimestamp;
  });

  for (const link of sortedLinks) {
    if (link.revokedAt) continue;
    if (isResultsLinkExpired(link.expiresAt, nowMs)) continue;
    if (!isResultsLinkCurrentForLead(link.createdAt, leadCreatedAt)) {
      return null;
    }
    return link;
  }

  return null;
};

export const leadPayloadToResultsFormData = (
  payload: Pick<LeadPayloadV2, "answers" | "contact">,
): FormData => ({
  ...payload.answers,
  name: payload.contact.name,
  email: payload.contact.email,
  mobile: payload.contact.mobile,
});
