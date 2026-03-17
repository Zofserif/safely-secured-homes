import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const resultsLinksModule = (await import(
  new URL("../app/lib/resultsLinks.ts", import.meta.url).href
)) as typeof import("../app/lib/resultsLinks");
const bonusClaimLinksModule = (await import(
  new URL("../app/lib/bonusClaimLinks.ts", import.meta.url).href
)) as typeof import("../app/lib/bonusClaimLinks");
const limitedOfferLinksModule = (await import(
  new URL("../app/lib/limitedOfferLinks.ts", import.meta.url).href
)) as typeof import("../app/lib/limitedOfferLinks");

const { buildResultsLinkUrl, selectReusableResultsLink } = resultsLinksModule;
const { resolveBonusLinkStatus } = bonusClaimLinksModule;
const {
  createLimitedOfferLinkUrl,
  resolveLimitedOfferLinkStatus,
} = limitedOfferLinksModule;

assert.equal(
  buildResultsLinkUrl("results_token-123456"),
  "https://www.safelysecuredhomes.com/results?r=results_token-123456",
  "results links should keep the /results?r=... contract",
);

assert.deepEqual(
  selectReusableResultsLink(
    [
      {
        linkKey: "older-link",
        createdAt: "2026-03-14T00:00:00.000Z",
        expiresAt: "2026-03-20T00:00:00.000Z",
        revokedAt: null,
      },
      {
        linkKey: "newer-link",
        createdAt: "2026-03-15T00:00:00.000Z",
        expiresAt: "2026-03-21T00:00:00.000Z",
        revokedAt: null,
      },
    ],
    "2026-03-14T12:00:00.000Z",
    Date.parse("2026-03-16T00:00:00.000Z"),
  ),
  {
    linkKey: "newer-link",
    createdAt: "2026-03-15T00:00:00.000Z",
    expiresAt: "2026-03-21T00:00:00.000Z",
    revokedAt: null,
  },
  "results link reuse should still prefer the newest active link",
);

assert.deepEqual(
  resolveBonusLinkStatus(
    {
      link_key: "bonus-token",
      source_key: "lead-1",
      recipient_name: "Lemon",
      recipient_email: "lemon@example.com",
      note: "Keep safe",
      created_at: "2026-03-15T00:00:00.000Z",
      opened_at: "2026-03-15T01:00:00.000Z",
      claim_expires_at: "2026-03-15T02:00:00.000Z",
      claimed_at: null,
      revoked_at: null,
      shipping_name: null,
      shipping_mobile: null,
      shipping_address: null,
    },
    Date.parse("2026-03-15T01:30:00.000Z"),
  ),
  {
    status: "claimable",
    openedAt: "2026-03-15T01:00:00.000Z",
    claimExpiresAt: "2026-03-15T02:00:00.000Z",
    remainingMs: 30 * 60 * 1000,
    recipientName: "Lemon",
    recipientEmail: "lemon@example.com",
    note: "Keep safe",
  },
  "bonus links should keep the same claimable status contract",
);

assert.deepEqual(
  resolveLimitedOfferLinkStatus(
    {
      link_key: "offer-token",
      source_key: "delivery-1",
      recipient_name: "Lemon",
      recipient_email: "lemon@example.com",
      blog_post_id: "blog-id",
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
  "limited-offer links should keep the same active status contract",
);

assert.equal(
  createLimitedOfferLinkUrl("offer-token"),
  "https://www.safelysecuredhomes.com/offer/offer-token",
  "limited-offer URLs should keep the /offer/<token> contract",
);

const engagementSchemaSource = readFileSync(
  new URL("../app/lib/engagementLinksSchema.ts", import.meta.url),
  "utf8",
);
const resultsLinksServerSource = readFileSync(
  new URL("../app/lib/resultsLinksServer.ts", import.meta.url),
  "utf8",
);
const bonusLinksServerSource = readFileSync(
  new URL("../app/lib/bonusClaimLinksServer.ts", import.meta.url),
  "utf8",
);
const limitedOfferLinksServerSource = readFileSync(
  new URL("../app/lib/limitedOfferLinksServer.ts", import.meta.url),
  "utf8",
);

assert.match(
  engagementSchemaSource,
  /ENGAGEMENT_LINKS_TABLE = "engagement_links"/,
  "the consolidated engagement link table constant should exist",
);
assert.match(
  resultsLinksServerSource,
  /\.eq\("kind", ENGAGEMENT_LINK_KIND_RESULTS\)/,
  "results links should scope queries to kind='results'",
);
assert.match(
  bonusLinksServerSource,
  /\.eq\("kind", ENGAGEMENT_LINK_KIND_BONUS_CLAIM\)/,
  "bonus links should scope queries to kind='bonus_claim'",
);
assert.match(
  bonusLinksServerSource,
  /opened_at:first_opened_at/,
  "bonus links should alias first_opened_at back to opened_at for compatibility",
);
assert.match(
  limitedOfferLinksServerSource,
  /\.eq\("kind", ENGAGEMENT_LINK_KIND_LIMITED_OFFER\)/,
  "limited-offer links should scope queries to kind='limited_offer'",
);

console.log("All engagement link checks passed.");
