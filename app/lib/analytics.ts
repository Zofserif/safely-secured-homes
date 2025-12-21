import posthog from "../posthog";
import type { CalculationResult, FormData } from "./types";

const FORM_STEPS = [
  { id: "intro", label: "Intro" },
  { id: "property_type", label: "Property type" },
  { id: "current_setup", label: "Current setup" },
  { id: "main_goal", label: "Main goal" },
  { id: "priority_areas", label: "Priority areas" },
  { id: "system_preferences", label: "System preferences" },
  { id: "timeline", label: "Timeline" },
  { id: "contact_details", label: "Contact details" },
] as const;

type EventProps = Record<string, unknown>;

const isBrowser = () => typeof window !== "undefined";

const normalizeString = (value: string) => value.trim();

const safeArray = (values: string[]) => values.filter(Boolean);

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

const formProps = (data: FormData): EventProps => ({
  property_type: normalizeString(data.property_type),
  home_size: normalizeString(data.home_size),
  floors: normalizeString(data.floors),
  main_goal: normalizeString(data.main_goal),
  priority_areas: safeArray(data.priority_areas),
  priority_areas_count: data.priority_areas.length,
  current_setup: normalizeString(data.current_setup),
  safety_level: data.safety_level,
  features_must: safeArray(data.features_must),
  features_must_count: data.features_must.length,
  smart_home_interest: Boolean(data.smart_home_interest),
  budget_band: normalizeString(data.budget_band),
  timeline: normalizeString(data.timeline),
  email_domain: getEmailDomain(data.email),
});

export type AppView = "home" | "form" | "results" | "thankyou";

export const trackPageView = (view: AppView) => {
  capture("$pageview", {
    page: view,
    path: `/${view}`,
  });
};

export const trackFormStepCompleted = (stepIndex: number) => {
  const step = FORM_STEPS[stepIndex];
  const stepNumber = stepIndex + 1;

  capture("form_step_completed", {
    step_index: stepIndex,
    step_number: stepNumber,
    step_total: FORM_STEPS.length,
    step_id: step?.id || "unknown",
    step_name: step?.id || "unknown",
    step_label: step?.label || "Unknown",
  });
};

export const trackFormSubmissionStarted = (data: FormData) => {
  capture("form_submission_started", formProps(data));
};

export const identifyLead = (data: FormData) => {
  if (!isBrowser() || !data.email) return;
  const fullName = [data.first_name, data.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  posthog.identify(data.email, {
    name: fullName || undefined,
    first_name: data.first_name || undefined,
    last_name: data.last_name || undefined,
    email: data.email || undefined,
    phone: data.mobile || undefined,
    email_domain: getEmailDomain(data.email),
  });
};

export const trackLeadGenerated = (
  data: FormData,
  result: CalculationResult
) => {
  capture("lead_generated", {
    ...formProps(data),
    lead_tier: result.leadTier,
    lead_score: result.leadScore,
    camera_count: result.cameraCount,
    nvr_channel: result.nvrChannel,
    storage_1tb: result.storage1TB,
    recommendations_count: result.recommendations.length,
  });
};
