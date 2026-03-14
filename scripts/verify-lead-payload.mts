import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const leadPayloadModule = (await import(
  new URL("../app/lib/leadPayload.ts", import.meta.url).href
)) as typeof import("../app/lib/leadPayload");
const formOptionsModule = (await import(
  new URL("../app/lib/formOptions.ts", import.meta.url).href
)) as typeof import("../app/lib/formOptions");

const {
  buildLeadPayload,
  getLeadPayloadHasBonus,
  getLeadPayloadName,
  getLeadPayloadScorePersonalization,
  normalizeStoredLeadPayload,
} = leadPayloadModule;
const {
  DESIRED_OUTCOME_OPTIONS,
  GOAL_OBSTACLE_OPTIONS,
  HOUSEHOLD_STAGE_OPTIONS,
  PROPERTY_TYPES,
  SOLUTION_OPTIONS,
} = formOptionsModule;

const leadBody = {
  contact: {
    name: "",
    email: "lemon.squeezy@example.com",
    mobile: "09171234567",
  },
  answers: {
    property_type: PROPERTY_TYPES[0].value,
    has_spare_key: true,
    changed_wifi_default_password: false,
    sleeps_with_earphones: false,
    locks_windows_gate_at_night: true,
    has_security_cameras: false,
    has_smoke_alarm_or_fire_extinguisher: true,
    has_first_aid_or_medicine_ready: true,
    knows_local_emergency_contacts: true,
    home_entrance: 35,
    windows_terrace: 60,
    neighborhood_safety_check: 50,
    emergency_readiness_home: 85,
    household_stage: HOUSEHOLD_STAGE_OPTIONS[3],
    desired_outcome: DESIRED_OUTCOME_OPTIONS[3],
    goal_obstacle: GOAL_OBSTACLE_OPTIONS[0],
    has_additional_notes: true,
    additional_notes: "Family arrives home after dark.",
    solution: SOLUTION_OPTIONS.ONE_ON_ONE_HOME_SECURITY_CONSULTATION,
  },
  meta: {
    source: "facebook_ads",
    utm_source: "facebook",
    utm_medium: "paid_social",
    utm_campaign: "march_launch",
    allow_external_emails: true,
    has_bonus: true,
  },
} as const;

const location = {
  source: "ip_header",
  country_code: "PH",
  region: "NCR",
  city: "Quezon City",
} as const;

const payload = buildLeadPayload(leadBody, location);

assert.equal(payload.schema_version, 2, "new leads should store payload schema version 2");
assert.equal(payload.source, leadBody.meta.source, "top-level source alias should be preserved");
assert.equal(payload.has_bonus, true, "top-level has_bonus alias should be preserved");
assert.equal(payload.contact.name, "Lemon", "missing names should derive from the email");
assert.equal(payload.contact.email, "lemon.squeezy@example.com");
assert.equal(payload.meta.utm_campaign, "march_launch");
assert.equal(
  payload.outcomes.lead.model_version,
  payload.outcomes.lead.model_version?.trim() || "unknown",
  "lead model version should be populated",
);
assert.ok(
  payload.outcomes.lead.breakdown.length > 0,
  "new payloads should persist the full lead score breakdown",
);
assert.ok(
  payload.outcomes.safety.level.label !== null &&
    payload.outcomes.priority.label !== null &&
    payload.outcomes.emergency.label !== null,
  "new payloads should persist derived safety, priority, and emergency summaries",
);
assert.ok(
  Array.isArray(payload.outcomes.recommendations),
  "new payloads should always persist a recommendations array",
);
assert.equal(
  getLeadPayloadHasBonus(payload),
  true,
  "bonus eligibility should read from the canonical payload",
);

const scorePersonalization = getLeadPayloadScorePersonalization(payload);
assert.ok(
  scorePersonalization?.scoreValue !== undefined,
  "score personalization should derive from the canonical payload",
);
assert.match(
  scorePersonalization?.score ?? "",
  /^\d+%$/,
  "score personalization should format the score for email tokens",
);

const legacyPayload = {
  source: "referral",
  has_bonus: true,
  contact: {
    first_name: "Legacy",
    mobile: "09998887777",
  },
  outcomes: {
    lead: {
      score: 72,
    },
    safety: {
      total: 33,
      emergency_readiness_score: 100,
    },
    panatag_home_rating: 44,
  },
};

const normalizedLegacy = normalizeStoredLeadPayload(legacyPayload, {
  email: "legacy@example.com",
});

assert.ok(normalizedLegacy, "legacy payloads should normalize into the canonical shape");
assert.equal(normalizedLegacy?.schema_version, 2);
assert.equal(normalizedLegacy?.contact.name, "Legacy");
assert.equal(normalizedLegacy?.contact.email, "legacy@example.com");
assert.equal(normalizedLegacy?.meta.source, "referral");
assert.equal(normalizedLegacy?.meta.allow_external_emails, null);
assert.deepEqual(
  normalizedLegacy?.outcomes.priority,
  { label: "Urgent", severity: "high" },
  "priority should derive from the normalized lead tier when absent",
);
assert.deepEqual(
  normalizedLegacy?.outcomes.emergency,
  { label: "Almost", severity: "low" },
  "emergency summary should derive from the normalized emergency readiness score",
);
assert.deepEqual(
  normalizedLegacy?.outcomes.safety.level,
  { label: "Urgent", range: "0-44", severity: "high" },
  "safety level should derive from the normalized safety total when absent",
);
assert.equal(
  getLeadPayloadName(legacyPayload, { email: "legacy@example.com" }),
  "Legacy",
  "name selectors should handle legacy payload contact fields",
);

const sqlSource = readFileSync(
  new URL("../supabase/leads.sql", import.meta.url),
  "utf8",
);

assert.match(
  sqlSource,
  /'schema_version', 2[\s\S]*'meta'[\s\S]*'outcomes'/,
  "lead SQL migration should normalize payload rows into the v2 canonical envelope",
);
assert.match(
  sqlSource,
  /'breakdown'[\s\S]*'recommendations'/,
  "lead SQL migration should preserve canonical lead breakdown and recommendations fields",
);
assert.doesNotMatch(
  sqlSource,
  /\bl\.(score|tier|camera_count|safety_score_total)\b/,
  "lead SQL migration should not reference legacy lead table columns",
);
assert.doesNotMatch(
  sqlSource,
  /drop column if exists (tier|score|camera_count|safety_score_total)/,
  "lead SQL migration should not drop legacy summary columns in the payload-only flow",
);

console.log("All lead payload checks passed.");
