import { estimateCameraPlan, getResultsSummary } from "./calculations.ts";
import { deriveNameFromEmail, normalizeEmail } from "./contactName.ts";
import { buildLeadScorePersonalizationContext } from "./emailPersonalization.ts";
import { getPriorityActionFromLeadTier } from "./resultsScoring.js";
import { normalizeSafetyHabitAnswers } from "./safetyHabits.ts";
import { getSafetyCategoryScores, getSafetySummary } from "./safetyScores.js";
import type {
  FormData,
  LeadScoreBreakdownItem,
  LeadTier,
  ResultsSummary,
  SeverityLevel,
} from "./types";

export type LeadLocation = {
  source: "ip_header" | "unavailable";
  country_code: string | null;
  region: string | null;
  city: string | null;
};

export type LeadContact = {
  name: string;
  email: string;
  mobile: string;
};

export type LeadAnswers = Omit<FormData, "name" | "email" | "mobile">;

export type LeadMeta = {
  source: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  allow_external_emails: boolean | null;
  has_bonus: boolean;
};

export type LeadCreateBody = {
  contact: LeadContact;
  answers: LeadAnswers;
  meta: LeadMeta;
};

type LeadSummarySnapshot = {
  label: string | null;
  severity: SeverityLevel | null;
};

type LeadSafetyLevelSnapshot = {
  label: string | null;
  range: string | null;
  severity: SeverityLevel | null;
};

export type LeadPayloadV2 = {
  schema_version: 2;
  source: string;
  has_bonus: boolean;
  contact: LeadContact;
  answers: LeadAnswers;
  meta: LeadMeta;
  location: LeadLocation;
  outcomes: {
    lead: {
      score: number | null;
      tier: LeadTier | null;
      model_version: string | null;
      breakdown: LeadScoreBreakdownItem[];
    };
    safety: {
      total: number | null;
      max: number | null;
      level: LeadSafetyLevelSnapshot;
      emergency_readiness_score: number | null;
      categories: {
        home_entrance: number | null;
        neighborhood_safety_check: number | null;
        windows_terrace: number | null;
        emergency_readiness_home: number | null;
      };
    };
    priority: LeadSummarySnapshot;
    emergency: LeadSummarySnapshot;
    panatag_home_rating: number | null;
    camera_plan: {
      camera_count: number | null;
      nvr_channel: number | null;
      storage_recommended_tb: number | null;
      storage_estimated_tb_7d: number | null;
    };
    recommendations: string[];
  };
};

export type LeadPayloadRowMetadata = {
  email?: string | null;
  name?: string | null;
};

export type LeadPayloadScorePersonalization = ReturnType<
  typeof buildLeadScorePersonalizationContext
> & {
  scoreValue: number;
};

const EMPTY_LEAD_ANSWERS: LeadAnswers = {
  property_type: "",
  has_spare_key: null,
  changed_wifi_default_password: null,
  sleeps_with_earphones: null,
  locks_windows_gate_at_night: null,
  has_security_cameras: null,
  has_smoke_alarm_or_fire_extinguisher: null,
  has_first_aid_or_medicine_ready: null,
  knows_local_emergency_contacts: null,
  home_entrance: null,
  windows_terrace: null,
  neighborhood_safety_check: null,
  emergency_readiness_home: null,
  household_stage: "",
  desired_outcome: "",
  goal_obstacle: "",
  has_additional_notes: null,
  additional_notes: "",
  solution: "",
};

const EMPTY_LOCATION: LeadLocation = {
  source: "unavailable",
  country_code: null,
  region: null,
  city: null,
};

const EMPTY_LEVEL_SNAPSHOT: LeadSafetyLevelSnapshot = {
  label: null,
  range: null,
  severity: null,
};

const EMPTY_SUMMARY_SNAPSHOT: LeadSummarySnapshot = {
  label: null,
  severity: null,
};

const isDefined = <T>(value: T | null | undefined): value is T => value != null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toOptionalString = (value: unknown): string | null => {
  const safeValue = toSafeString(value);
  return safeValue || null;
};

const toNullableBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const toBoolean = (value: unknown): boolean =>
  typeof value === "boolean" ? value : false;

const toFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const toRoundedNumber = (value: unknown): number | null => {
  const safeValue = toFiniteNumber(value);
  return safeValue === null ? null : Math.round(safeValue);
};

const toRoundedScore = (value: unknown): number | null => {
  const safeValue = toFiniteNumber(value);
  if (safeValue === null) return null;
  return Math.max(0, Math.min(100, Math.round(safeValue)));
};

const toRoundedDecimal = (value: unknown, places: number): number | null => {
  const safeValue = toFiniteNumber(value);
  if (safeValue === null) return null;
  const factor = 10 ** places;
  return Math.round(safeValue * factor) / factor;
};

const toSeverityLevel = (value: unknown): SeverityLevel | null =>
  value === "low" || value === "medium" || value === "high" ? value : null;

const toLeadTier = (value: unknown): LeadTier | null =>
  value === "Hot" || value === "Warm" || value === "Nurture" ? value : null;

const toSummarySnapshot = (value: unknown): LeadSummarySnapshot => {
  if (!isRecord(value)) return EMPTY_SUMMARY_SNAPSHOT;

  return {
    label: toOptionalString(value.label),
    severity: toSeverityLevel(value.severity),
  };
};

const toSafetyLevelSnapshot = (value: unknown): LeadSafetyLevelSnapshot => {
  if (!isRecord(value)) return EMPTY_LEVEL_SNAPSHOT;

  return {
    label: toOptionalString(value.label),
    range: toOptionalString(value.range),
    severity: toSeverityLevel(value.severity),
  };
};

const mergeSummarySnapshot = (
  fallback: LeadSummarySnapshot,
  override: LeadSummarySnapshot,
): LeadSummarySnapshot => ({
  label: override.label ?? fallback.label,
  severity: override.severity ?? fallback.severity,
});

const mergeSafetyLevelSnapshot = (
  fallback: LeadSafetyLevelSnapshot,
  override: LeadSafetyLevelSnapshot,
): LeadSafetyLevelSnapshot => ({
  label: override.label ?? fallback.label,
  range: override.range ?? fallback.range,
  severity: override.severity ?? fallback.severity,
});

const toSelectedAnswers = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((item) => toSafeString(item)).filter(Boolean)
    : [];

const toBreakdownAnswer = (value: unknown) => {
  if (!isRecord(value)) return null;

  return {
    answer: toSafeString(value.answer),
    points: toRoundedNumber(value.points) ?? 0,
  };
};

const toLeadScoreBreakdownItem = (
  value: unknown,
): LeadScoreBreakdownItem | null => {
  if (!isRecord(value)) return null;

  const matchedAnswers = Array.isArray(value.matchedAnswers)
    ? value.matchedAnswers.map((item) => toBreakdownAnswer(item)).filter(isDefined)
    : [];

  return {
    id: toSafeString(value.id),
    label: toSafeString(value.label),
    questionKey: toSafeString(value.questionKey),
    selectedAnswers: toSelectedAnswers(value.selectedAnswers),
    matchedAnswers,
    matchedPoints: toRoundedNumber(value.matchedPoints) ?? 0,
    bonusPoints: toRoundedNumber(value.bonusPoints) ?? 0,
    maxPoints: toRoundedNumber(value.maxPoints) ?? 0,
    points: toRoundedNumber(value.points) ?? 0,
  };
};

const toLeadScoreBreakdown = (value: unknown): LeadScoreBreakdownItem[] =>
  Array.isArray(value)
    ? value.map((item) => toLeadScoreBreakdownItem(item)).filter(isDefined)
    : [];

const toNormalizedLeadAnswers = (value: unknown): LeadAnswers => {
  const raw = isRecord(value) ? value : {};

  return {
    property_type: toSafeString(raw.property_type),
    has_spare_key: toNullableBoolean(raw.has_spare_key),
    changed_wifi_default_password: toNullableBoolean(
      raw.changed_wifi_default_password,
    ),
    sleeps_with_earphones: toNullableBoolean(raw.sleeps_with_earphones),
    locks_windows_gate_at_night: toNullableBoolean(raw.locks_windows_gate_at_night),
    has_security_cameras: toNullableBoolean(raw.has_security_cameras),
    has_smoke_alarm_or_fire_extinguisher: toNullableBoolean(
      raw.has_smoke_alarm_or_fire_extinguisher,
    ),
    has_first_aid_or_medicine_ready: toNullableBoolean(
      raw.has_first_aid_or_medicine_ready,
    ),
    knows_local_emergency_contacts: toNullableBoolean(
      raw.knows_local_emergency_contacts,
    ),
    home_entrance: toRoundedScore(raw.home_entrance),
    windows_terrace: toRoundedScore(raw.windows_terrace),
    neighborhood_safety_check: toRoundedScore(raw.neighborhood_safety_check),
    emergency_readiness_home: toRoundedScore(raw.emergency_readiness_home),
    household_stage: toSafeString(raw.household_stage),
    desired_outcome: toSafeString(raw.desired_outcome),
    goal_obstacle: toSafeString(raw.goal_obstacle),
    has_additional_notes: toNullableBoolean(raw.has_additional_notes),
    additional_notes: toSafeString(raw.additional_notes),
    solution: toSafeString(raw.solution),
  };
};

const toFormData = (contact: LeadContact, answers: LeadAnswers): FormData =>
  normalizeSafetyHabitAnswers({
    ...answers,
    name: contact.name,
    email: contact.email,
    mobile: contact.mobile,
  });

const toNormalizedLocation = (value: unknown): LeadLocation => {
  if (!isRecord(value)) return EMPTY_LOCATION;

  return {
    source: value.source === "ip_header" ? "ip_header" : "unavailable",
    country_code: toOptionalString(value.country_code),
    region: toOptionalString(value.region),
    city: toOptionalString(value.city),
  };
};

const toResultsSummaryLevel = (
  summary: ResultsSummary["safetyLevel"],
): LeadSafetyLevelSnapshot => ({
  label: summary.label,
  range: summary.range,
  severity: summary.severity,
});

const toResultsSummaryCard = (
  summary: ResultsSummary["priority"] | ResultsSummary["emergency"],
): LeadSummarySnapshot => ({
  label: summary.label,
  severity: summary.severity,
});

const derivePrioritySnapshot = (
  leadTier: LeadTier | null,
): LeadSummarySnapshot => {
  if (!leadTier) return EMPTY_SUMMARY_SNAPSHOT;
  return getPriorityActionFromLeadTier(leadTier);
};

const deriveSafetyLevelSnapshot = (
  total: number | null,
): LeadSafetyLevelSnapshot => {
  if (total === null) return EMPTY_LEVEL_SNAPSHOT;
  if (total >= 70) {
    return { label: "Almost", range: "70-100", severity: "low" };
  }
  if (total >= 45) {
    return { label: "Improve", range: "45-69", severity: "medium" };
  }

  return { label: "Urgent", range: "0-44", severity: "high" };
};

const deriveEmergencySnapshot = (
  score: number | null,
): LeadSummarySnapshot => {
  if (score === null) return EMPTY_SUMMARY_SNAPSHOT;
  if (score >= 100) {
    return { label: "Almost", severity: "low" };
  }
  if (score >= 40) {
    return { label: "Improve", severity: "medium" };
  }

  return { label: "Urgent", severity: "high" };
};

const resolveStoredLeadName = (contact: LeadContact): string =>
  toSafeString(contact.name) || deriveNameFromEmail(contact.email);

export const buildLeadPayload = (
  input: LeadCreateBody,
  location: LeadLocation,
): LeadPayloadV2 => {
  const contact: LeadContact = {
    name: resolveStoredLeadName(input.contact),
    email: normalizeEmail(toSafeString(input.contact.email)),
    mobile: toSafeString(input.contact.mobile),
  };
  const answers = toNormalizedLeadAnswers(input.answers);
  const meta: LeadMeta = {
    source: toSafeString(input.meta.source) || "website",
    utm_source: toSafeString(input.meta.utm_source),
    utm_medium: toSafeString(input.meta.utm_medium),
    utm_campaign: toSafeString(input.meta.utm_campaign),
    allow_external_emails: toNullableBoolean(input.meta.allow_external_emails),
    has_bonus: toBoolean(input.meta.has_bonus),
  };
  const formData = toFormData(contact, answers);
  const result = estimateCameraPlan(formData);
  const safetySummary = getSafetySummary(formData);
  const safetyCategories = getSafetyCategoryScores(formData);
  const resultsSummary = getResultsSummary(formData, result);

  return {
    schema_version: 2,
    source: meta.source,
    has_bonus: meta.has_bonus,
    contact,
    answers,
    meta,
    location: toNormalizedLocation(location),
    outcomes: {
      lead: {
        score: toRoundedScore(result.leadScore),
        tier: result.leadTier,
        model_version: toSafeString(result.leadScoringModelVersion) || "unknown",
        breakdown: toLeadScoreBreakdown(result.leadScoreBreakdown),
      },
      safety: {
        total: toRoundedScore(safetySummary.total),
        max: toRoundedScore(safetySummary.max),
        level: toResultsSummaryLevel(resultsSummary.safetyLevel),
        emergency_readiness_score: toRoundedScore(
          safetySummary.emergencyReadinessScore,
        ),
        categories: {
          home_entrance: toRoundedScore(safetyCategories.home_entrance),
          neighborhood_safety_check: toRoundedScore(
            safetyCategories.neighborhood_safety_check,
          ),
          windows_terrace: toRoundedScore(safetyCategories.windows_terrace),
          emergency_readiness_home: toRoundedScore(
            safetyCategories.emergency_readiness_home,
          ),
        },
      },
      priority: toResultsSummaryCard(resultsSummary.priority),
      emergency: toResultsSummaryCard(resultsSummary.emergency),
      panatag_home_rating: toRoundedScore(resultsSummary.panatagRating),
      camera_plan: {
        camera_count: Math.max(0, toRoundedNumber(result.cameraCount) ?? 0),
        nvr_channel: Math.max(0, toRoundedNumber(result.nvrChannel) ?? 0),
        storage_recommended_tb: Math.max(
          1,
          toRoundedNumber(result.storageRecommendedTB) ?? 1,
        ),
        storage_estimated_tb_7d:
          toRoundedDecimal(result.storageEstimatedTB7d, 3) ?? 0,
      },
      recommendations: Array.isArray(result.recommendations)
        ? result.recommendations.map((item) => toSafeString(item)).filter(Boolean)
        : [],
    },
  };
};

const buildFallbackLeadPayload = (
  metadata: LeadPayloadRowMetadata = {},
): LeadPayloadV2 | null => {
  const email = normalizeEmail(toSafeString(metadata.email));
  const name = toSafeString(metadata.name) || deriveNameFromEmail(email);
  if (!email && !name) return null;

  return {
    schema_version: 2,
    source: "website",
    has_bonus: false,
    contact: {
      name,
      email,
      mobile: "",
    },
    answers: { ...EMPTY_LEAD_ANSWERS },
    meta: {
      source: "website",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      allow_external_emails: null,
      has_bonus: false,
    },
    location: EMPTY_LOCATION,
    outcomes: {
      lead: {
        score: null,
        tier: null,
        model_version: null,
        breakdown: [],
      },
      safety: {
        total: null,
        max: null,
        level: EMPTY_LEVEL_SNAPSHOT,
        emergency_readiness_score: null,
        categories: {
          home_entrance: null,
          neighborhood_safety_check: null,
          windows_terrace: null,
          emergency_readiness_home: null,
        },
      },
      priority: EMPTY_SUMMARY_SNAPSHOT,
      emergency: EMPTY_SUMMARY_SNAPSHOT,
      panatag_home_rating: null,
      camera_plan: {
        camera_count: null,
        nvr_channel: null,
        storage_recommended_tb: null,
        storage_estimated_tb_7d: null,
      },
      recommendations: [],
    },
  };
};

export const normalizeStoredLeadPayload = (
  value: unknown,
  metadata: LeadPayloadRowMetadata = {},
): LeadPayloadV2 | null => {
  const fallbackPayload = buildFallbackLeadPayload(metadata);
  if (!fallbackPayload) return null;

  const raw = isRecord(value) ? value : {};
  const rawContact = isRecord(raw.contact) ? raw.contact : {};
  const rawMeta = isRecord(raw.meta) ? raw.meta : {};
  const rawOutcomes = isRecord(raw.outcomes) ? raw.outcomes : {};
  const rawLead = isRecord(rawOutcomes.lead) ? rawOutcomes.lead : {};
  const rawSafety = isRecord(rawOutcomes.safety) ? rawOutcomes.safety : {};
  const rawSafetyCategories = isRecord(rawSafety.categories)
    ? rawSafety.categories
    : {};
  const rawCameraPlan = isRecord(rawOutcomes.camera_plan)
    ? rawOutcomes.camera_plan
    : {};

  const source =
    toSafeString(rawMeta.source) || toSafeString(raw.source) || fallbackPayload.source;
  const hasBonus =
    toNullableBoolean(rawMeta.has_bonus) ??
    toNullableBoolean(raw.has_bonus) ??
    fallbackPayload.has_bonus;
  const email =
    normalizeEmail(toSafeString(rawContact.email) || fallbackPayload.contact.email);
  const name =
    toSafeString(rawContact.name) ||
    toSafeString(rawContact.first_name) ||
    toSafeString(metadata.name) ||
    deriveNameFromEmail(email);
  const leadScore = toRoundedScore(rawLead.score);
  const leadTier = toLeadTier(rawLead.tier);
  const resolvedLeadTier =
    leadTier ??
    (leadScore === null
      ? null
      : leadScore >= 70
        ? "Hot"
        : leadScore >= 50
          ? "Warm"
          : "Nurture");
  const safetyTotal = toRoundedScore(rawSafety.total);
  const emergencyReadinessScore = toRoundedScore(
    rawSafety.emergency_readiness_score,
  );
  const priority = mergeSummarySnapshot(
    derivePrioritySnapshot(resolvedLeadTier),
    toSummarySnapshot(rawOutcomes.priority),
  );
  const emergency = mergeSummarySnapshot(
    deriveEmergencySnapshot(emergencyReadinessScore),
    toSummarySnapshot(rawOutcomes.emergency),
  );
  const safetyLevel = mergeSafetyLevelSnapshot(
    deriveSafetyLevelSnapshot(safetyTotal),
    toSafetyLevelSnapshot(rawSafety.level),
  );

  return {
    schema_version: 2,
    source,
    has_bonus: hasBonus,
    contact: {
      name: name || fallbackPayload.contact.name,
      email,
      mobile: toSafeString(rawContact.mobile),
    },
    answers: {
      ...EMPTY_LEAD_ANSWERS,
      ...toNormalizedLeadAnswers(raw.answers),
    },
    meta: {
      source,
      utm_source: toSafeString(rawMeta.utm_source),
      utm_medium: toSafeString(rawMeta.utm_medium),
      utm_campaign: toSafeString(rawMeta.utm_campaign),
      allow_external_emails: toNullableBoolean(rawMeta.allow_external_emails),
      has_bonus: hasBonus,
    },
    location: toNormalizedLocation(raw.location),
    outcomes: {
      lead: {
        score: leadScore,
        tier: resolvedLeadTier,
        model_version: toOptionalString(rawLead.model_version),
        breakdown: toLeadScoreBreakdown(rawLead.breakdown),
      },
      safety: {
        total: safetyTotal,
        max: toRoundedScore(rawSafety.max),
        level: safetyLevel,
        emergency_readiness_score: emergencyReadinessScore,
        categories: {
          home_entrance: toRoundedScore(rawSafetyCategories.home_entrance),
          neighborhood_safety_check: toRoundedScore(
            rawSafetyCategories.neighborhood_safety_check,
          ),
          windows_terrace: toRoundedScore(rawSafetyCategories.windows_terrace),
          emergency_readiness_home: toRoundedScore(
            rawSafetyCategories.emergency_readiness_home,
          ),
        },
      },
      priority,
      emergency,
      panatag_home_rating: toRoundedScore(rawOutcomes.panatag_home_rating),
      camera_plan: {
        camera_count: toRoundedNumber(rawCameraPlan.camera_count),
        nvr_channel: toRoundedNumber(rawCameraPlan.nvr_channel),
        storage_recommended_tb: toRoundedNumber(
          rawCameraPlan.storage_recommended_tb,
        ),
        storage_estimated_tb_7d: toRoundedDecimal(
          rawCameraPlan.storage_estimated_tb_7d,
          3,
        ),
      },
      recommendations: Array.isArray(rawOutcomes.recommendations)
        ? rawOutcomes.recommendations
            .map((item) => toSafeString(item))
            .filter(Boolean)
        : [],
    },
  };
};

export const getLeadPayloadName = (
  value: unknown,
  metadata: LeadPayloadRowMetadata = {},
): string =>
  normalizeStoredLeadPayload(value, metadata)?.contact.name ||
  deriveNameFromEmail(normalizeEmail(toSafeString(metadata.email)));

export const getLeadPayloadHasBonus = (value: unknown): boolean =>
  normalizeStoredLeadPayload(value)?.has_bonus === true;

export const getLeadPayloadScorePersonalization = (
  value: unknown,
  metadata: LeadPayloadRowMetadata = {},
): LeadPayloadScorePersonalization | null => {
  const payload = normalizeStoredLeadPayload(value, metadata);
  const scoreValue = payload?.outcomes.panatag_home_rating ?? null;
  if (scoreValue === null) return null;

  return {
    scoreValue,
    ...buildLeadScorePersonalizationContext(scoreValue),
  };
};

export const getLeadPayloadScoreValue = (
  value: unknown,
  metadata: LeadPayloadRowMetadata = {},
): number | null =>
  normalizeStoredLeadPayload(value, metadata)?.outcomes.panatag_home_rating ?? null;

export const resolveStoredLeadContactName = resolveStoredLeadName;
