import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const leadDay0CtaModule = (await import(
  new URL("../app/lib/leadJourneyDay0Cta.ts", import.meta.url).href
)) as typeof import("../app/lib/leadJourneyDay0Cta");

const {
  LEAD_DAY_0_BONUS_COPY,
  LEAD_DAY_0_NON_BONUS_COPY,
  buildLeadDay0BonusCtaHtml,
  buildLeadDay0NonBonusCtaHtml,
} = leadDay0CtaModule;

const nonBonusHtml = buildLeadDay0NonBonusCtaHtml(
  "https://www.safelysecuredhomes.com",
);
assert.ok(
  nonBonusHtml.includes("Troy to Call"),
  "non-bonus CTA should mention 'Troy to Call'",
);
assert.ok(
  nonBonusHtml.includes("/schedule-call?source=lead_journey_day_0_no_bonus"),
  "non-bonus CTA should point to the schedule-call page",
);
assert.ok(
  nonBonusHtml.includes(LEAD_DAY_0_NON_BONUS_COPY.replace(/'/g, "&#39;")),
  "non-bonus CTA should include the approved non-bonus copy",
);

const bonusHtml = buildLeadDay0BonusCtaHtml(
  "https://www.safelysecuredhomes.com/bonus/test-token",
);
assert.ok(
  bonusHtml.includes(LEAD_DAY_0_BONUS_COPY),
  "bonus CTA should include the approved bonus copy",
);
assert.ok(
  bonusHtml.includes("/bonus/test-token"),
  "bonus CTA should point to a bonus claim link",
);

const emailCoreSql = readFileSync(
  new URL("../supabase/email_core.sql", import.meta.url),
  "utf8",
);
assert.ok(
  emailCoreSql.includes("lead_journey_day_0_no_bonus"),
  "email_core.sql should seed the new non-bonus day-0 CTA",
);

const legacySeedSql = readFileSync(
  new URL("../supabase/newsletter_campaign_tracking.sql", import.meta.url),
  "utf8",
);
assert.ok(
  legacySeedSql.includes("lead_journey_day_0_no_bonus"),
  "legacy journey seed should mirror the new non-bonus day-0 CTA",
);

console.log("Lead day 0 CTA verification passed.");
