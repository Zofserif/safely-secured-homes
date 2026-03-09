import posthog, { isPostHogEnabled } from "../posthog";
import { FORM_STEPS } from "./formSteps";
import { getSafetySummary } from "./safetyScores";
import type { CalculationResult, FormData } from "./types";

const ENABLE_LEGACY_DUAL_WRITE = true;
export const LEGACY_DUAL_WRITE_REMOVE_AFTER = "2026-03-19";
const GA4_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() ?? "";

const APP_VIEW_PATH: Record<AppView, string> = {
  home: "/",
  form: "/form",
  results: "/results",
};

const FUNNEL_PAGE_PATH: Record<FunnelPage, string> = {
  home: "/",
  apply: "/apply",
  form: "/form",
  results: "/results",
  apply_success: "/apply-success",
  newsletter: "/newsletter",
  newsletter_thank_you: "/newsletter/thank-you",
  schedule_call: "/schedule-call",
};

type EventProps = Record<string, unknown>;

export type FlowSource = "apply" | "newsletter" | "direct" | "unknown";
export type FlowMode = "default" | "newsletter";
export type FunnelPage =
  | "home"
  | "apply"
  | "form"
  | "results"
  | "apply_success"
  | "newsletter"
  | "newsletter_thank_you"
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

const toNullableBooleanState = (value: boolean | null): "yes" | "no" | "unknown" => {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unknown";
};

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
  if (!isPostHogEnabled()) return;
  if (props) {
    posthog.capture(event, stripEmpty(props));
    return;
  }
  posthog.capture(event);
};

const captureGa4 = (event: string, props?: EventProps) => {
  if (!isBrowser()) return;
  if (!GA4_MEASUREMENT_ID) return;

  const gtagFn = (
    window as Window & {
      gtag?: (...args: unknown[]) => void;
    }
  ).gtag;

  if (typeof gtagFn !== "function") return;

  gtagFn("event", event, props ? stripEmpty(props) : {});
};

const getEmailDomain = (email: string) => {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return "";
  return email.slice(atIndex + 1).toLowerCase();
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
  household_stage: normalizeString(data.household_stage),
  desired_outcome: normalizeString(data.desired_outcome),
  goal_obstacle: normalizeString(data.goal_obstacle),
  has_additional_notes: data.has_additional_notes,
  goal_obstacle_other: normalizeString(data.goal_obstacle_other),
  solution: normalizeString(data.solution),
  has_spare_key: data.has_spare_key,
  changed_wifi_default_password: data.changed_wifi_default_password,
  sleeps_with_earphones: data.sleeps_with_earphones,
  locks_windows_gate_at_night: data.locks_windows_gate_at_night,
  has_security_cameras: data.has_security_cameras,
  has_smoke_alarm_or_fire_extinguisher: data.has_smoke_alarm_or_fire_extinguisher,
  has_first_aid_or_medicine_ready: data.has_first_aid_or_medicine_ready,
  knows_local_emergency_contacts: data.knows_local_emergency_contacts,
  safety_gate_entry: data.safety_gate_entry,
  safety_blindspots: data.safety_blindspots,
  safety_driveway_garage: data.safety_driveway_garage,
  safety_emergency_readiness: data.safety_emergency_readiness,
  // Safety summary now uses a 0..100 safety-oriented field scale.
  safety_score_avg: getSafetySummary(data).average,
  email_domain: getEmailDomain(data.email),
});

const normalizedFormProps = (data: FormData): EventProps => {
  const safety = getSafetySummary(data);

  return {
    property_type_key: slugify(data.property_type),
    household_stage_key: slugify(data.household_stage),
    desired_outcome_key: slugify(data.desired_outcome),
    goal_obstacle_key: slugify(data.goal_obstacle),
    has_additional_notes_state: toNullableBooleanState(data.has_additional_notes),
    has_goal_obstacle_other: Boolean(normalizeString(data.goal_obstacle_other)),
    solution_key: slugify(data.solution),
    has_spare_key_state: toNullableBooleanState(data.has_spare_key),
    changed_wifi_default_password_state: toNullableBooleanState(
      data.changed_wifi_default_password
    ),
    sleeps_with_earphones_state: toNullableBooleanState(data.sleeps_with_earphones),
    locks_windows_gate_at_night_state: toNullableBooleanState(
      data.locks_windows_gate_at_night
    ),
    has_security_cameras_state: toNullableBooleanState(data.has_security_cameras),
    has_smoke_alarm_or_fire_extinguisher_state: toNullableBooleanState(
      data.has_smoke_alarm_or_fire_extinguisher
    ),
    has_first_aid_or_medicine_ready_state: toNullableBooleanState(
      data.has_first_aid_or_medicine_ready
    ),
    knows_local_emergency_contacts_state: toNullableBooleanState(
      data.knows_local_emergency_contacts
    ),
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
    scarcity_state?: string;
    reports_remaining?: number;
    reports_limit?: number;
    cta_variant?: string;
    contact_channel?: "call" | "whatsapp";
  },
  context?: FunnelContext
) => {
  const inferredContactChannel =
    props.contact_channel ??
    (props.cta_id.endsWith("_whatsapp")
      ? "whatsapp"
      : props.cta_id.endsWith("_call_now")
        ? "call"
        : undefined);
  const enrichedProps = {
    ...props,
    contact_channel: inferredContactChannel,
  };

  trackV2("funnel_cta_clicked", page, context, enrichedProps);

  const extendedProps = {
    ...funnelBaseProps(page, context),
    ...enrichedProps,
  };
  const isWhatsAppCta = inferredContactChannel === "whatsapp";
  const isCallNowCta = inferredContactChannel === "call";

  if (
    props.cta_id === "checklist_download" ||
    props.cta_id === "results_checklist_download"
  ) {
    capture("checklist_download_click", extendedProps);
    captureGa4("checklist_download_click", extendedProps);
  }

  if (
    isCallNowCta ||
    isWhatsAppCta ||
    props.cta_id === "schedule_my_call" ||
    props.cta_id === "results_book_visit" ||
    props.cta_id === "results_call_us"
  ) {
    capture("book_consult_click", extendedProps);
    captureGa4("book_consult_click", extendedProps);
  }

  if (isWhatsAppCta) {
    capture("whatsapp_click", extendedProps);
    captureGa4("whatsapp_click", extendedProps);
  }
};

export const trackPageView = (view: AppView, context?: FunnelContext) => {
  // Use a non-reserved event name for app-level view changes to avoid
  // PostHog's internal pageview ratio warnings in custom SPA flows.
  capture("app_page_viewed", {
    page: view,
    path: APP_VIEW_PATH[view],
  });

  if (view === "home" || view === "form" || view === "results") {
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

  if (stepIndex === 0) {
    captureGa4("start_assessment", {
      ...funnelBaseProps("form", context),
      step_id: step?.id || "unknown",
      step_number: stepNumber,
      step_total: FORM_STEPS.length,
    });
  }

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
  const leadProps = {
    ...normalizedFormProps(data),
    lead_tier: result.leadTier,
    lead_score: result.leadScore,
    camera_count: result.cameraCount,
    nvr_channel: result.nvrChannel,
    storage_1tb: result.storage1TB,
    recommendations_count: result.recommendations.length,
  };

  trackV2("funnel_submission_completed", "form", context, {
    ...leadProps,
  });
  captureGa4("generate_lead", {
    ...funnelBaseProps("form", context),
    ...leadProps,
    lead_source: context?.flow_source ?? "direct",
    lead_channel: "assessment_form",
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

export const trackChecklistDownloadClick = (
  page: FunnelPage,
  context?: FunnelContext,
  props?: {
    cta_location?: string;
    target_path?: string;
  }
) => {
  trackV2("checklist_download_click", page, context, props);
  captureGa4("checklist_download_click", {
    ...funnelBaseProps(page, context),
    ...(props ?? {}),
  });
};

export const trackBookConsultClick = (
  page: FunnelPage,
  context?: FunnelContext,
  props?: {
    cta_location?: string;
    target_path?: string;
    target_url?: string;
  }
) => {
  trackV2("book_consult_click", page, context, props);
  captureGa4("book_consult_click", {
    ...funnelBaseProps(page, context),
    ...(props ?? {}),
  });
};

export const trackNewsletterLeadGenerated = (
  context?: FunnelContext,
  props?: {
    source?: string;
    method?: string;
    destination?: string;
  }
) => {
  const resolvedContext: FunnelContext = context ?? {
    flow_source: "newsletter",
    flow_mode: "newsletter",
  };
  const eventProps = {
    lead_source: resolvedContext.flow_source,
    lead_channel: "newsletter",
    ...(props ?? {}),
  };

  trackV2("funnel_submission_completed", "newsletter", resolvedContext, eventProps);
  captureGa4("generate_lead", {
    ...funnelBaseProps("newsletter", resolvedContext),
    ...eventProps,
  });
};
