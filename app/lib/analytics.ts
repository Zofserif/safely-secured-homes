import posthog from "../posthog";
import { FORM_STEPS } from "./formSteps";
import type { CalculationResult, FormData } from "./types";

const ENABLE_LEGACY_DUAL_WRITE = true;
export const LEGACY_DUAL_WRITE_REMOVE_AFTER = "2026-03-19";

const APP_VIEW_PATH: Record<AppView, string> = {
  home: "/",
  form: "/form",
  results: "/results",
};

const FUNNEL_PAGE_PATH: Record<FunnelPage, string> = {
  apply: "/apply",
  form: "/form",
  results: "/results",
  apply_success: "/apply-success",
  schedule_call: "/schedule-call",
};

type EventProps = Record<string, unknown>;

export type FlowSource = "apply" | "newsletter" | "direct" | "unknown";
export type FlowMode = "default" | "newsletter";
export type FunnelPage =
  | "apply"
  | "form"
  | "results"
  | "apply_success"
  | "schedule_call";
export type FunnelOutcome = "results" | "apply_success" | "schedule_call";
export type FunnelContext = {
  flow_source: FlowSource;
  flow_mode: FlowMode;
  source_raw?: string;
};
export type AppView = "home" | "form" | "results";

type StepTrackOptions = {
  legacy?: boolean;
};

const DEFAULT_FUNNEL_CONTEXT: FunnelContext = {
  flow_source: "direct",
  flow_mode: "default",
};

const isBrowser = () => typeof window !== "undefined";

const normalizeString = (value: string) => value.trim();

const safeArray = (values: string[]) => values.map((value) => value.trim()).filter(Boolean);

const slugify = (value: string) =>
  normalizeString(value)
    .replace(/\+/g, " plus ")
    .replace(/≤/g, " lte ")
    .replace(/≥/g, " gte ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const stripEmpty = (props: EventProps) => {
  const cleaned: EventProps = {};

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    cleaned[key] = value;
  }

  return cleaned;
};

const capture = (event: string, props?: EventProps) => {
  if (!isBrowser()) return;
  if (props) {
    posthog.capture(event, stripEmpty(props));
    return;
  }
  posthog.capture(event);
};

const getEmailDomain = (email: string) => {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return "";
  return email.slice(atIndex + 1).toLowerCase();
};

const getSafetyScores = (data: FormData) =>
  [
    data.safety_gate_entry,
    data.safety_blindspots,
    data.safety_side_back_entry,
    data.safety_windows_terrace,
    data.safety_driveway_garage,
    data.safety_indoor_choke_points,
    data.safety_emergency_readiness,
  ].filter((value): value is number => typeof value === "number");

const getSafetySummary = (data: FormData) => {
  const values = getSafetyScores(data);
  if (values.length === 0) {
    return {
      total: undefined,
      average: undefined,
    };
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    total,
    average: total / values.length,
  };
};

const normalizeContext = (context?: FunnelContext): FunnelContext => {
  const merged: FunnelContext = { ...DEFAULT_FUNNEL_CONTEXT, ...context };
  if (merged.flow_source !== "unknown") {
    return {
      flow_source: merged.flow_source,
      flow_mode: merged.flow_mode,
    };
  }

  const sourceRaw = normalizeString(merged.source_raw ?? "");
  return sourceRaw
    ? {
        flow_source: merged.flow_source,
        flow_mode: merged.flow_mode,
        source_raw: sourceRaw,
      }
    : {
        flow_source: merged.flow_source,
        flow_mode: merged.flow_mode,
      };
};

const funnelBaseProps = (page: FunnelPage, context?: FunnelContext): EventProps => {
  const resolvedContext = normalizeContext(context);

  return stripEmpty({
    schema_version: 2,
    flow_name: "home_security_lead",
    flow_source: resolvedContext.flow_source,
    flow_mode: resolvedContext.flow_mode,
    route_name: page,
    route_path: FUNNEL_PAGE_PATH[page],
    source_raw:
      resolvedContext.flow_source === "unknown"
        ? resolvedContext.source_raw
        : undefined,
  });
};

const trackV2 = (
  event: string,
  page: FunnelPage,
  context?: FunnelContext,
  props?: EventProps
) => {
  capture(event, {
    ...funnelBaseProps(page, context),
    ...(props ?? {}),
  });
};

const legacyFormProps = (data: FormData): EventProps => ({
  property_type: normalizeString(data.property_type),
  home_size: normalizeString(data.home_size),
  floors: normalizeString(data.floors),
  priority_areas: safeArray(data.priority_areas),
  priority_areas_count: data.priority_areas.length,
  current_setup: normalizeString(data.current_setup),
  safety_gate_entry: data.safety_gate_entry,
  safety_blindspots: data.safety_blindspots,
  safety_side_back_entry: data.safety_side_back_entry,
  safety_windows_terrace: data.safety_windows_terrace,
  safety_driveway_garage: data.safety_driveway_garage,
  safety_indoor_choke_points: data.safety_indoor_choke_points,
  safety_emergency_readiness: data.safety_emergency_readiness,
  safety_score_avg: getSafetySummary(data).average,
  features_must: safeArray(data.features_must),
  features_must_count: data.features_must.length,
  smart_home_interest: Boolean(data.smart_home_interest),
  diy_security_plan: Boolean(data.diy_security_plan),
  budget_band: normalizeString(data.budget_band),
  timeline: normalizeString(data.timeline),
  email_domain: getEmailDomain(data.email),
});

const normalizedFormProps = (data: FormData): EventProps => {
  const priorityAreas = safeArray(data.priority_areas);
  const featureList = safeArray(data.features_must);
  const smartHomeFeatures = safeArray(data.smart_home_features ?? []);
  const safety = getSafetySummary(data);

  return {
    property_type_key: slugify(data.property_type),
    home_size_key: slugify(data.home_size),
    floors_key: slugify(data.floors),
    current_setup_key: slugify(data.current_setup),
    priority_area_keys: priorityAreas.map((value) => slugify(value)),
    priority_area_count: priorityAreas.length,
    feature_keys: featureList.map((value) => slugify(value)),
    features_count: featureList.length,
    smart_home_feature_keys: smartHomeFeatures.map((value) => slugify(value)),
    smart_home_features_count: smartHomeFeatures.length,
    smart_home_interest: Boolean(data.smart_home_interest),
    diy_security_plan: Boolean(data.diy_security_plan),
    budget_band_key: slugify(data.budget_band),
    timeline_key: slugify(data.timeline),
    safety_score_avg: safety.average,
    safety_score_total: safety.total,
    email_domain: getEmailDomain(data.email),
    has_mobile: Boolean(normalizeString(data.mobile)),
  };
};

export const buildFunnelContext = (
  rawSource: string | null | undefined,
  flowMode: FlowMode
): FunnelContext => {
  const source = normalizeString(rawSource ?? "");
  const lowered = source.toLowerCase();

  if (!source) {
    return {
      flow_source: "direct",
      flow_mode: flowMode,
    };
  }

  if (lowered === "apply") {
    return {
      flow_source: "apply",
      flow_mode: flowMode,
    };
  }

  if (lowered === "newsletter") {
    return {
      flow_source: "newsletter",
      flow_mode: "newsletter",
    };
  }

  return {
    flow_source: "unknown",
    flow_mode: flowMode,
    source_raw: source,
  };
};

export const trackFunnelPageViewed = (page: FunnelPage, context?: FunnelContext) => {
  trackV2("funnel_page_viewed", page, context);
};

export const trackFunnelOutcomeViewed = (
  outcome: FunnelOutcome,
  page: FunnelPage,
  context?: FunnelContext
) => {
  trackV2("funnel_outcome_viewed", page, context, { outcome });
};

export const trackFunnelCtaClicked = (
  page: FunnelPage,
  props: {
    cta_id: string;
    cta_location: string;
    target_path?: string;
    target_url?: string;
  },
  context?: FunnelContext
) => {
  trackV2("funnel_cta_clicked", page, context, props);
};

export const trackPageView = (view: AppView, context?: FunnelContext) => {
  // Use a non-reserved event name for app-level view changes to avoid
  // PostHog's internal pageview ratio warnings in custom SPA flows.
  capture("app_page_viewed", {
    page: view,
    path: APP_VIEW_PATH[view],
  });

  if (view === "form" || view === "results") {
    trackFunnelPageViewed(view, context);
  }
};

export const trackFormStepCompleted = (
  stepIndex: number,
  context?: FunnelContext,
  options?: StepTrackOptions
) => {
  const step = FORM_STEPS[stepIndex];
  const stepNumber = stepIndex + 1;
  const completionPct = Number(((stepNumber / FORM_STEPS.length) * 100).toFixed(2));

  trackV2("funnel_step_completed", "form", context, {
    step_id: step?.id || "unknown",
    step_number: stepNumber,
    step_total: FORM_STEPS.length,
    completion_pct: completionPct,
    step_label: step?.label || "Unknown",
  });

  if (!ENABLE_LEGACY_DUAL_WRITE || options?.legacy === false) return;

  capture("form_step_completed", {
    step_index: stepIndex,
    step_number: stepNumber,
    step_total: FORM_STEPS.length,
    step_id: step?.id || "unknown",
    step_name: step?.id || "unknown",
    step_label: step?.label || "Unknown",
  });
};

export const trackFormSubmissionStarted = (data: FormData, context?: FunnelContext) => {
  trackV2("funnel_submission_started", "form", context, normalizedFormProps(data));

  if (!ENABLE_LEGACY_DUAL_WRITE) return;

  capture("form_submission_started", legacyFormProps(data));
};

export const trackLeadGenerated = (
  data: FormData,
  result: CalculationResult,
  context?: FunnelContext
) => {
  trackV2("funnel_submission_completed", "form", context, {
    ...normalizedFormProps(data),
    lead_tier: result.leadTier,
    lead_score: result.leadScore,
    camera_count: result.cameraCount,
    nvr_channel: result.nvrChannel,
    storage_1tb: result.storage1TB,
    recommendations_count: result.recommendations.length,
  });

  if (!ENABLE_LEGACY_DUAL_WRITE) return;

  capture("lead_generated", {
    ...legacyFormProps(data),
    lead_tier: result.leadTier,
    lead_score: result.leadScore,
    camera_count: result.cameraCount,
    nvr_channel: result.nvrChannel,
    storage_1tb: result.storage1TB,
    recommendations_count: result.recommendations.length,
  });
};
