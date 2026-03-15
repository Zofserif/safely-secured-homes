import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const limitedOfferLinksModule = (await import(
  new URL("../app/lib/limitedOfferLinks.ts", import.meta.url).href
)) as typeof import("../app/lib/limitedOfferLinks");

const {
  createLimitedOfferLinkUrl,
  isValidLimitedOfferLinkKey,
  normalizeLimitedOfferLinkKey,
  resolveLimitedOfferLinkStatus,
} = limitedOfferLinksModule;

assert.equal(
  normalizeLimitedOfferLinkKey("  offer-token  "),
  "offer-token",
  "limited-offer keys should be trimmed before use",
);
assert.equal(
  isValidLimitedOfferLinkKey("offer_token-123456"),
  true,
  "limited-offer keys should accept URL-safe tokens",
);
assert.equal(
  isValidLimitedOfferLinkKey("short"),
  false,
  "limited-offer keys should reject malformed short tokens",
);
assert.equal(
  createLimitedOfferLinkUrl("offer_token-123456"),
  "https://www.safelysecuredhomes.com/offer/offer_token-123456",
  "limited-offer URLs should target the canonical offer route",
);

assert.deepEqual(
  resolveLimitedOfferLinkStatus(
    {
      link_key: "active-offer-token",
      source_key: "delivery-1",
      recipient_name: "Lemon",
      recipient_email: "lemon@example.com",
      blog_post_id: "blog-post-id",
      created_at: "2026-03-15T00:00:00.000Z",
      expires_at: "2026-03-16T00:00:00.000Z",
      first_opened_at: "2026-03-15T01:00:00.000Z",
      last_opened_at: "2026-03-15T01:05:00.000Z",
      revoked_at: null,
    },
    Date.parse("2026-03-15T12:00:00.000Z"),
  ),
  {
    status: "active",
    expiresAt: "2026-03-16T00:00:00.000Z",
    remainingMs: 12 * 60 * 60 * 1000,
    firstOpenedAt: "2026-03-15T01:00:00.000Z",
    lastOpenedAt: "2026-03-15T01:05:00.000Z",
  },
  "limited-offer status should remain active before expiration",
);

assert.deepEqual(
  resolveLimitedOfferLinkStatus(
    {
      link_key: "expired-offer-token",
      source_key: "delivery-2",
      recipient_name: "Lemon",
      recipient_email: "lemon@example.com",
      blog_post_id: "blog-post-id",
      created_at: "2026-03-15T00:00:00.000Z",
      expires_at: "2026-03-15T03:00:00.000Z",
      first_opened_at: "2026-03-15T01:00:00.000Z",
      last_opened_at: "2026-03-15T02:30:00.000Z",
      revoked_at: null,
    },
    Date.parse("2026-03-15T05:00:00.000Z"),
  ),
  {
    status: "expired",
    expiresAt: "2026-03-15T03:00:00.000Z",
    firstOpenedAt: "2026-03-15T01:00:00.000Z",
    lastOpenedAt: "2026-03-15T02:30:00.000Z",
  },
  "limited-offer status should expire after the configured cutoff",
);

assert.deepEqual(
  resolveLimitedOfferLinkStatus(
    {
      link_key: "revoked-offer-token",
      source_key: "delivery-3",
      recipient_name: "Lemon",
      recipient_email: "lemon@example.com",
      blog_post_id: "blog-post-id",
      created_at: "2026-03-15T00:00:00.000Z",
      expires_at: "2026-03-16T00:00:00.000Z",
      first_opened_at: null,
      last_opened_at: null,
      revoked_at: "2026-03-15T06:00:00.000Z",
    },
    Date.parse("2026-03-15T07:00:00.000Z"),
  ),
  {
    status: "expired",
    expiresAt: "2026-03-16T00:00:00.000Z",
    firstOpenedAt: null,
    lastOpenedAt: null,
  },
  "revoked limited-offer links should resolve as expired",
);

assert.deepEqual(
  resolveLimitedOfferLinkStatus(null),
  { status: "invalid" },
  "missing limited-offer rows should resolve as invalid",
);

const limitedOfferLinksServerSource = readFileSync(
  new URL("../app/lib/limitedOfferLinksServer.ts", import.meta.url),
  "utf8",
);
const offerRouteSource = readFileSync(
  new URL("../app/offer/[token]/route.ts", import.meta.url),
  "utf8",
);
const waitlistPageSource = readFileSync(
  new URL("../app/waitlist/page.tsx", import.meta.url),
  "utf8",
);
const analyticsSource = readFileSync(
  new URL("../app/lib/analytics.ts", import.meta.url),
  "utf8",
);
const newsletterFormSource = readFileSync(
  new URL("../app/components/newsletter/NewsletterForm.tsx", import.meta.url),
  "utf8",
);
const adminActionsSource = readFileSync(
  new URL("../app/admin/actions.ts", import.meta.url),
  "utf8",
);

assert.match(
  limitedOfferLinksServerSource,
  /\.eq\("source_key", sourceKey\)/,
  "limited-offer links should be reusable by source_key",
);
assert.match(
  limitedOfferLinksServerSource,
  /first_opened_at:\s*existingRow\.first_opened_at \|\| openedAt/,
  "opening a limited-offer link should preserve the first-open timestamp",
);
assert.match(
  limitedOfferLinksServerSource,
  /last_opened_at:\s*openedAt/,
  "opening a limited-offer link should always record the most recent open time",
);
assert.match(
  offerRouteSource,
  /openLimitedOfferLink/,
  "offer redirects should resolve through the shared openLimitedOfferLink helper",
);
assert.match(
  offerRouteSource,
  /\/schedule-call/,
  "active limited-offer redirects should send visitors to schedule-call",
);
assert.match(
  offerRouteSource,
  /limited_time_offer/,
  "active limited-offer redirects should keep a source marker for analytics",
);
assert.match(
  offerRouteSource,
  /\/waitlist/,
  "expired limited-offer redirects should send visitors to the waitlist",
);
assert.match(
  offerRouteSource,
  /limited_time_offer_expired/,
  "expired limited-offer redirects should keep a waitlist source marker",
);
assert.match(
  waitlistPageSource,
  /page="waitlist"/,
  "the waitlist page should emit a dedicated funnel page-view event",
);
assert.match(
  waitlistPageSource,
  /defaultSource=\{rawSource\}/,
  "the waitlist form should reuse the expired-offer source when subscribing",
);
assert.match(
  analyticsSource,
  /waitlist: "\/waitlist"/,
  "analytics path maps should include the waitlist page",
);
assert.match(
  newsletterFormSource,
  /trackingPage\?: FunnelPage/,
  "newsletter form should accept an overridable funnel page for waitlist submissions",
);
assert.match(
  adminActionsSource,
  /formData\.get\("offerHours"\)/,
  "admin send actions should thread offerHours into limited-offer sends",
);

console.log("All limited-offer link checks passed.");
