import "server-only";

import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { deriveNameFromEmail, normalizeEmail } from "./contactName";
import { getEmailJourneyDefinition } from "./emailJourneyStore";
import { EMAIL_JOURNEY_KEYS, type EmailJourneyKey } from "./emailJourneys";
import { canReceiveWeeklyNewsletter } from "./weeklyNewsletterEligibility";
export { EMAIL_JOURNEY_KEYS } from "./emailJourneys";
export type { EmailJourneyKey } from "./emailJourneys";

export type NewsletterSubscriberStatus =
  | "subscribed"
  | "unsubscribed"
  | "bounced"
  | "complained";

export type EmailJourneyEnrollmentStatus = "active" | "completed" | "cancelled";
export type EmailDeliveryKind = "journey" | "broadcast";
export type EmailDeliveryStatus = "queued" | "sent" | "failed";
export type NewsletterAssignmentProfile = "newsletter_signup" | "lead_capture";

export const EMAIL_CAMPAIGN_KEYS = EMAIL_JOURNEY_KEYS;

export type EmailCampaignKey = EmailJourneyKey;

type SubscriberRow = {
  id: string | null;
  email: string | null;
  name: string | null;
  status: NewsletterSubscriberStatus | null;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
  unsubscribe_token: string | null;
  acquisition_source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

type JourneyEnrollmentRow = {
  id: string | null;
  subscriber_id: string | null;
  journey_key: string | null;
  status: EmailJourneyEnrollmentStatus | null;
  entered_at: string | null;
  exited_at: string | null;
  exit_reason: string | null;
  current_step_key: string | null;
  current_step_order: number | null;
  assignment_reason: string | null;
};

type JourneyEnrollmentDetailRow = JourneyEnrollmentRow & {
  subscriber: SubscriberRow | SubscriberRow[] | null;
};

type EmailDeliveryRow = {
  id: string | null;
  subscriber_id: string | null;
  enrollment_id: string | null;
  delivery_kind: EmailDeliveryKind | null;
  send_key: string | null;
  journey_key: string | null;
  step_key: string | null;
  blog_post_id: string | null;
  provider_message_id: string | null;
  status: EmailDeliveryStatus | null;
  queued_at: string | null;
  processed_at: string | null;
  error_message: string | null;
  created_at: string | null;
};

type SupabaseError = {
  code?: string;
  details?: string;
  message?: string;
};

type JourneyAssignment = {
  journeyKey: EmailJourneyKey;
  assignmentReason: string;
};

type InsertJourneyEnrollmentPayload = {
  audience: "newsletter";
  subscriber_id: string;
  journey_key: string;
  status: EmailJourneyEnrollmentStatus;
  entered_at: string;
  current_step_key: string;
  current_step_order: number | null;
  assignment_reason: string;
};

type InsertEmailDeliveryPayload = {
  audience: "newsletter";
  subscriber_id: string;
  enrollment_id: string | null;
  delivery_kind: EmailDeliveryKind;
  send_key: string | null;
  journey_key: string | null;
  step_key: string;
  blog_post_id: string | null;
  provider_message_id: string | null;
  status: EmailDeliveryStatus;
  queued_at: string;
  processed_at: string | null;
  error_message: string;
};

export type SyncNewsletterSubscriberInput = {
  email: string;
  name?: string;
  acquisitionSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  assignmentProfile?: NewsletterAssignmentProfile;
};

export type SyncNewsletterSubscriberResult = {
  subscriberId: string;
  email: string;
  created: boolean;
  reactivated: boolean;
  journeyKeys: EmailJourneyKey[];
  campaignKeys: EmailJourneyKey[];
  unsubscribeToken: string;
};

export type NewsletterSubscriberRecord = {
  subscriberId: string;
  email: string;
  name: string;
  status: NewsletterSubscriberStatus;
  unsubscribeToken: string;
};

export type EnsureJourneyEnrollmentInput = {
  subscriberId: string;
  journeyKey: EmailJourneyKey;
  currentStepKey?: string;
  currentStepOrder?: number | null;
  assignmentReason?: string;
};

export type EnsureJourneyEnrollmentResult = {
  enrollmentId: string;
  journeyKey: EmailJourneyKey;
  created: boolean;
};

export type AssignJourneyEnrollmentInput = {
  subscriberId: string;
  journeyKey: EmailJourneyKey;
  assignmentReason?: string;
};

export type AssignJourneyEnrollmentResult = {
  enrollmentId: string;
  journeyKey: EmailJourneyKey;
  created: boolean;
  replacedEnrollmentId: string | null;
};

export type EmailJourneyStep = {
  journeyKey: EmailJourneyKey;
  stepKey: string;
  stepOrder: number;
  delayDays: number;
  blogPostId: string;
  blogPostSlug: string;
  ctaOverrideHtml: string;
};

export type EmailDeliveryLog = {
  id: string;
  subscriberId: string;
  enrollmentId: string | null;
  deliveryKind: EmailDeliveryKind;
  sendKey: string;
  journeyKey: string;
  stepKey: string;
  blogPostId: string;
  providerMessageId: string;
  status: EmailDeliveryStatus;
  queuedAt: string | null;
  processedAt: string | null;
  errorMessage: string;
  createdAt: string | null;
};

export type CampaignSendLog = EmailDeliveryLog;

export type ActiveJourneyEnrollment = {
  enrollmentId: string;
  journeyKey: EmailJourneyKey;
  journeyName: string;
  journeyObjectiveKey: string;
  subscriberId: string;
  subscriberEmail: string;
  subscriberName: string;
  subscriberStatus: NewsletterSubscriberStatus;
  enteredAt: string;
  currentStepKey: string;
  currentStepOrder: number | null;
  assignmentReason: string;
};

export type ActiveCampaignEnrollment = ActiveJourneyEnrollment;

export type EnsureEmailDeliveryInput = {
  subscriberId: string;
  deliveryKind: EmailDeliveryKind;
  enrollmentId?: string;
  sendKey?: string;
  journeyKey?: string;
  stepKey?: string;
  blogPostId?: string;
  providerMessageId?: string;
  status?: EmailDeliveryStatus;
  errorMessage?: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const SUBSCRIBER_SELECT =
  "id,email,name,status,subscribed_at,unsubscribed_at,unsubscribe_token,acquisition_source,utm_source,utm_medium,utm_campaign";
const ENROLLMENT_SELECT =
  "id,subscriber_id,journey_key,status,entered_at,exited_at,exit_reason,current_step_key,current_step_order,assignment_reason";
const ENROLLMENT_WITH_SUBSCRIBER_SELECT = `${ENROLLMENT_SELECT},subscriber:newsletter_subscribers!email_journey_enrollments_subscriber_id_fkey(${SUBSCRIBER_SELECT})`;
const EMAIL_DELIVERY_SELECT =
  "id,subscriber_id,enrollment_id,delivery_kind,send_key,journey_key,step_key,blog_post_id,provider_message_id,status,queued_at,processed_at,error_message,created_at";
const NEWSLETTER_UNSUBSCRIBE_TOKEN_BYTES = 18;
const NEWSLETTER_AUDIENCE = "newsletter" as const;

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toNullableString = (value: unknown): string | null => {
  const safeValue = toSafeString(value);
  return safeValue ? safeValue : null;
};

const isReplaceableName = (value: string | null | undefined) => {
  const normalizedValue = toSafeString(value).toLowerCase();
  return !normalizedValue || normalizedValue === "there";
};

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase not configured for newsletter email flows.");
  }

  return supabase;
};

const normalizeSubscriberName = (name: string | undefined, email: string) => {
  const safeName = toSafeString(name);
  return safeName || deriveNameFromEmail(email);
};

const generateNewsletterUnsubscribeToken = () =>
  randomBytes(NEWSLETTER_UNSUBSCRIBE_TOKEN_BYTES).toString("hex");

const normalizeSubscriber = (
  row: SubscriberRow | null | undefined,
): NewsletterSubscriberRecord | null => {
  const subscriberId = toSafeString(row?.id);
  const email = toSafeString(row?.email);
  const status = row?.status;
  const unsubscribeToken = toSafeString(row?.unsubscribe_token);

  if (!subscriberId || !email || !status || !unsubscribeToken) {
    return null;
  }

  return {
    subscriberId,
    email,
    name: toSafeString(row?.name) || deriveNameFromEmail(email),
    status,
    unsubscribeToken,
  };
};

const normalizeDelivery = (
  row: EmailDeliveryRow | null | undefined,
): EmailDeliveryLog | null => {
  const id = toSafeString(row?.id);
  const subscriberId = toSafeString(row?.subscriber_id);
  const deliveryKind = row?.delivery_kind;
  const status = row?.status;

  if (!id || !subscriberId || !deliveryKind || !status) {
    return null;
  }

  return {
    id,
    subscriberId,
    enrollmentId: toNullableString(row?.enrollment_id),
    deliveryKind,
    sendKey: toSafeString(row?.send_key),
    journeyKey: toSafeString(row?.journey_key),
    stepKey: toSafeString(row?.step_key),
    blogPostId: toSafeString(row?.blog_post_id),
    providerMessageId: toSafeString(row?.provider_message_id),
    status,
    queuedAt: toNullableString(row?.queued_at),
    processedAt: toNullableString(row?.processed_at),
    errorMessage: toSafeString(row?.error_message),
    createdAt: toNullableString(row?.created_at),
  };
};

const normalizeActiveJourneyEnrollment = (
  row: JourneyEnrollmentDetailRow | null | undefined,
): ActiveJourneyEnrollment | null => {
  const subscriber = Array.isArray(row?.subscriber)
    ? row?.subscriber[0]
    : row?.subscriber;
  const enrollmentId = toSafeString(row?.id);
  const journeyKey = toSafeString(row?.journey_key) as EmailJourneyKey;
  const subscriberId = toSafeString(subscriber?.id);
  const subscriberEmail = toSafeString(subscriber?.email);
  const subscriberName = toSafeString(subscriber?.name);
  const subscriberStatus = subscriber?.status;
  const enteredAt = toSafeString(row?.entered_at);

  if (
    !enrollmentId ||
    !journeyKey ||
    !subscriberId ||
    !subscriberEmail ||
    !subscriberName ||
    !subscriberStatus ||
    !enteredAt
  ) {
    return null;
  }

  return {
    enrollmentId,
    journeyKey,
    journeyName: journeyKey,
    journeyObjectiveKey: "",
    subscriberId,
    subscriberEmail,
    subscriberName,
    subscriberStatus,
    enteredAt,
    currentStepKey: toSafeString(row?.current_step_key),
    currentStepOrder: row?.current_step_order ?? null,
    assignmentReason: toSafeString(row?.assignment_reason),
  };
};

const fetchSubscriberByEmail = async (email: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("newsletter_subscribers")
    .select(SUBSCRIBER_SELECT)
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return (data as SubscriberRow | null) ?? null;
};

const fetchSubscriberById = async (subscriberId: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("newsletter_subscribers")
    .select(SUBSCRIBER_SELECT)
    .eq("id", subscriberId)
    .maybeSingle();

  if (error) throw error;
  return (data as SubscriberRow | null) ?? null;
};

const fetchSubscriberByUnsubscribeToken = async (unsubscribeToken: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("newsletter_subscribers")
    .select(SUBSCRIBER_SELECT)
    .eq("unsubscribe_token", unsubscribeToken)
    .maybeSingle();

  if (error) throw error;
  return (data as SubscriberRow | null) ?? null;
};

const updateSubscriber = async (
  subscriberId: string,
  payload: Record<string, string | null>,
) => {
  const client = requireSupabase();

  if (Object.keys(payload).length === 0) return;

  const { error } = await client
    .from("newsletter_subscribers")
    .update(payload)
    .eq("id", subscriberId);

  if (error) throw error;
};

const insertSubscriber = async (payload: Record<string, string | null>) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("newsletter_subscribers")
    .insert(payload)
    .select(SUBSCRIBER_SELECT)
    .single();

  if (error) throw error;
  return data as SubscriberRow;
};

const fetchJourneyEnrollmentRows = async ({
  subscriberId,
  journeyKey,
  status = "active",
}: {
  subscriberId: string;
  journeyKey?: EmailJourneyKey;
  status?: EmailJourneyEnrollmentStatus;
}) => {
  const client = requireSupabase();
  let query = client
    .from("email_journey_enrollments")
    .select(ENROLLMENT_SELECT)
    .eq("audience", NEWSLETTER_AUDIENCE)
    .eq("subscriber_id", subscriberId)
    .eq("status", status)
    .order("entered_at", { ascending: false, nullsFirst: false });

  if (toSafeString(journeyKey)) {
    query = query.eq("journey_key", toSafeString(journeyKey));
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as JourneyEnrollmentRow[] | null) ?? [];
};

const fetchActiveJourneyEnrollment = async (
  subscriberId: string,
  journeyKey: EmailJourneyKey,
) => {
  const rows = await fetchJourneyEnrollmentRows({
    subscriberId,
    journeyKey,
    status: "active",
  });
  return rows[0] ?? null;
};

const fetchAnyActiveJourneyEnrollment = async (subscriberId: string) => {
  const rows = await fetchJourneyEnrollmentRows({
    subscriberId,
    status: "active",
  });
  return rows[0] ?? null;
};

const updateJourneyEnrollment = async (
  enrollmentId: string,
  payload: Record<string, string | number | null>,
) => {
  const client = requireSupabase();
  if (Object.keys(payload).length === 0) return;

  const { error } = await client
    .from("email_journey_enrollments")
    .update(payload)
    .eq("id", enrollmentId);

  if (error) throw error;
};

const insertJourneyEnrollment = async (
  payload: InsertJourneyEnrollmentPayload,
) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_journey_enrollments")
    .insert(payload)
    .select(ENROLLMENT_SELECT)
    .single();

  if (error) throw error;
  return data as JourneyEnrollmentRow;
};

const cancelJourneyEnrollmentRecord = async (
  enrollmentId: string,
  exitReason: string,
) => {
  await updateJourneyEnrollment(enrollmentId, {
    status: "cancelled",
    exited_at: new Date().toISOString(),
    exit_reason: toSafeString(exitReason),
    current_step_key: "",
    current_step_order: null,
  });
};

const fetchJourneyEnrollmentById = async (enrollmentId: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_journey_enrollments")
    .select(ENROLLMENT_WITH_SUBSCRIBER_SELECT)
    .eq("audience", NEWSLETTER_AUDIENCE)
    .eq("id", enrollmentId)
    .maybeSingle();

  if (error) throw error;
  return (data as JourneyEnrollmentDetailRow | null) ?? null;
};

const fetchEmailDeliveryByEnrollmentStep = async (
  enrollmentId: string,
  stepKey: string,
) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_deliveries")
    .select(EMAIL_DELIVERY_SELECT)
    .eq("audience", NEWSLETTER_AUDIENCE)
    .eq("enrollment_id", enrollmentId)
    .eq("step_key", stepKey)
    .maybeSingle();

  if (error) throw error;
  return normalizeDelivery((data as EmailDeliveryRow | null) ?? null);
};

const fetchEmailDeliveryBySendKey = async (
  sendKey: string,
  subscriberId: string,
) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_deliveries")
    .select(EMAIL_DELIVERY_SELECT)
    .eq("audience", NEWSLETTER_AUDIENCE)
    .eq("send_key", sendKey)
    .eq("subscriber_id", subscriberId)
    .maybeSingle();

  if (error) throw error;
  return normalizeDelivery((data as EmailDeliveryRow | null) ?? null);
};

const insertEmailDelivery = async (payload: InsertEmailDeliveryPayload) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_deliveries")
    .insert(payload)
    .select(EMAIL_DELIVERY_SELECT)
    .single();

  if (error) throw error;
  return normalizeDelivery(data as EmailDeliveryRow);
};

const resolveJourneySteps = async (
  journeyKey: EmailJourneyKey,
): Promise<EmailJourneyStep[]> => {
  const definition = await getEmailJourneyDefinition(journeyKey, {
    includeInactiveSteps: true,
  });
  if (!definition) return [];

  return definition.steps
    .filter((step) => step.isActive && step.blogPostId && step.blogPostSlug)
    .map((step) => ({
      journeyKey,
      stepKey: step.stepKey,
      stepOrder: step.stepOrder,
      delayDays: step.delayDays,
      blogPostId: step.blogPostId,
      blogPostSlug: step.blogPostSlug,
      ctaOverrideHtml: step.ctaOverrideHtml,
    }));
};

const buildJourneyAssignments = (
  assignmentProfile: NewsletterAssignmentProfile,
  acquisitionSource: string,
): JourneyAssignment[] => {
  const assignmentSuffix = toSafeString(acquisitionSource) || "direct";

  if (assignmentProfile === "lead_capture") {
    return [
      {
        journeyKey: EMAIL_JOURNEY_KEYS.leadFollowUpJourney,
        assignmentReason: `lead_capture:${assignmentSuffix}`,
      },
    ];
  }

  return [];
};

export const isNewsletterCampaignsConfigured = () => Boolean(supabase);

export async function getNewsletterSubscriberById(
  subscriberId: string,
): Promise<NewsletterSubscriberRecord | null> {
  return normalizeSubscriber(await fetchSubscriberById(toSafeString(subscriberId)));
}

export async function getNewsletterSubscriberByEmail(
  email: string,
): Promise<NewsletterSubscriberRecord | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  return normalizeSubscriber(await fetchSubscriberByEmail(normalizedEmail));
}

export async function getNewsletterSubscriberByUnsubscribeToken(
  unsubscribeToken: string,
): Promise<NewsletterSubscriberRecord | null> {
  return normalizeSubscriber(
    await fetchSubscriberByUnsubscribeToken(
      toSafeString(unsubscribeToken).toLowerCase(),
    ),
  );
}

export async function getJourneySteps(
  journeyKey: EmailJourneyKey,
): Promise<EmailJourneyStep[]> {
  return resolveJourneySteps(journeyKey);
}

export const getCampaignSteps = getJourneySteps;

export async function getJourneyEnrollmentById(
  enrollmentId: string,
): Promise<ActiveJourneyEnrollment | null> {
  return normalizeActiveJourneyEnrollment(
    await fetchJourneyEnrollmentById(toSafeString(enrollmentId)),
  );
}

export const getCampaignEnrollmentById = getJourneyEnrollmentById;

export async function getActiveJourneyEnrollmentForSubscriber(
  subscriberId: string,
  journeyKey: EmailJourneyKey,
): Promise<ActiveJourneyEnrollment | null> {
  const row = await fetchActiveJourneyEnrollment(subscriberId, journeyKey);
  const enrollmentId = toSafeString(row?.id);
  if (!enrollmentId) return null;

  return getJourneyEnrollmentById(enrollmentId);
}

export const getActiveCampaignEnrollmentForSubscriber =
  getActiveJourneyEnrollmentForSubscriber;

export async function getAnyActiveJourneyEnrollmentForSubscriber(
  subscriberId: string,
): Promise<ActiveJourneyEnrollment | null> {
  const row = await fetchAnyActiveJourneyEnrollment(subscriberId);
  const enrollmentId = toSafeString(row?.id);
  if (!enrollmentId) return null;

  return getJourneyEnrollmentById(enrollmentId);
}

export async function listActiveJourneyEnrollments(
  {
    journeyKey,
  }: {
    journeyKey?: EmailJourneyKey;
  } = {},
): Promise<ActiveJourneyEnrollment[]> {
  const client = requireSupabase();
  let query = client
    .from("email_journey_enrollments")
    .select(ENROLLMENT_WITH_SUBSCRIBER_SELECT)
    .eq("audience", NEWSLETTER_AUDIENCE)
    .eq("status", "active")
    .order("entered_at", { ascending: true, nullsFirst: false });

  if (toSafeString(journeyKey)) {
    query = query.eq("journey_key", toSafeString(journeyKey));
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data as JourneyEnrollmentDetailRow[] | null) ?? [])
    .map((row) => normalizeActiveJourneyEnrollment(row))
    .filter((row): row is ActiveJourneyEnrollment => Boolean(row));
}

export async function listActiveJourneyEnrollmentsByJourneyKey(
  journeyKey: EmailJourneyKey,
): Promise<ActiveJourneyEnrollment[]> {
  return listActiveJourneyEnrollments({ journeyKey });
}

export const listActiveCampaignEnrollmentsByCampaignKey =
  listActiveJourneyEnrollmentsByJourneyKey;

export async function getEmailDeliveriesByEnrollmentId(
  enrollmentId: string,
): Promise<EmailDeliveryLog[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_deliveries")
    .select(EMAIL_DELIVERY_SELECT)
    .eq("audience", NEWSLETTER_AUDIENCE)
    .eq("enrollment_id", enrollmentId)
    .order("queued_at", { ascending: true, nullsFirst: false });

  if (error) throw error;

  return ((data as EmailDeliveryRow[] | null) ?? [])
    .map((row) => normalizeDelivery(row))
    .filter((row): row is EmailDeliveryLog => Boolean(row));
}

export const getCampaignSendLogsByEnrollmentId = getEmailDeliveriesByEnrollmentId;

const resolveInitialJourneyStep = async ({
  journeyKey,
  requestedStepKey,
  requestedStepOrder,
}: {
  journeyKey: EmailJourneyKey;
  requestedStepKey?: string;
  requestedStepOrder?: number | null;
}) => {
  const definition = await getEmailJourneyDefinition(journeyKey, {
    includeInactiveSteps: true,
  });
  if (!definition) {
    throw new Error(`Journey "${journeyKey}" was not found.`);
  }
  if (definition.status !== "active") {
    throw new Error(`Journey "${journeyKey}" is not active.`);
  }

  const steps = await resolveJourneySteps(journeyKey);
  if (steps.length === 0) {
    throw new Error(
      `Journey "${journeyKey}" must have at least one active step before it can be assigned.`,
    );
  }

  const normalizedRequestedStepKey = toSafeString(requestedStepKey);
  const requestedStep = normalizedRequestedStepKey
    ? steps.find((step) => step.stepKey === normalizedRequestedStepKey)
    : null;
  const initialStep = requestedStep ?? steps[0];

  return {
    stepKey: initialStep.stepKey,
    stepOrder:
      requestedStep && typeof requestedStepOrder === "number"
        ? requestedStepOrder
        : initialStep.stepOrder,
  };
};

export async function assignJourneyEnrollment({
  subscriberId,
  journeyKey,
  assignmentReason = "",
}: AssignJourneyEnrollmentInput): Promise<AssignJourneyEnrollmentResult> {
  const normalizedSubscriberId = toSafeString(subscriberId);
  const normalizedJourneyKey = toSafeString(journeyKey);
  if (!normalizedSubscriberId) {
    throw new Error("Subscriber id is required.");
  }
  if (!normalizedJourneyKey) {
    throw new Error("Journey key is required.");
  }

  const initialStep = await resolveInitialJourneyStep({
    journeyKey: normalizedJourneyKey,
  });

  const activeEnrollments = await fetchJourneyEnrollmentRows({
    subscriberId: normalizedSubscriberId,
    status: "active",
  });
  const sameJourneyEnrollment =
    activeEnrollments.find(
      (enrollment) =>
        toSafeString(enrollment.journey_key) === normalizedJourneyKey,
    ) ?? null;

  let replacedEnrollmentId: string | null = null;

  for (const enrollment of activeEnrollments) {
    const enrollmentId = toSafeString(enrollment.id);
    if (!enrollmentId) continue;
    if (sameJourneyEnrollment?.id && enrollmentId === sameJourneyEnrollment.id) {
      continue;
    }

    replacedEnrollmentId = replacedEnrollmentId || enrollmentId;
    await cancelJourneyEnrollmentRecord(
      enrollmentId,
      `reassigned:${normalizedJourneyKey}`,
    );
  }

  if (sameJourneyEnrollment?.id) {
    const updatePayload: Record<string, string | number | null> = {};

    if (!toSafeString(sameJourneyEnrollment.current_step_key)) {
      updatePayload.current_step_key = initialStep.stepKey;
    }
    if (sameJourneyEnrollment.current_step_order == null) {
      updatePayload.current_step_order = initialStep.stepOrder;
    }
    if (
      !toSafeString(sameJourneyEnrollment.assignment_reason) &&
      toSafeString(assignmentReason)
    ) {
      updatePayload.assignment_reason = toSafeString(assignmentReason);
    }

    await updateJourneyEnrollment(toSafeString(sameJourneyEnrollment.id), updatePayload);

    return {
      enrollmentId: toSafeString(sameJourneyEnrollment.id),
      journeyKey: normalizedJourneyKey,
      created: false,
      replacedEnrollmentId,
    };
  }

  try {
    const insertedEnrollment = await insertJourneyEnrollment({
      audience: NEWSLETTER_AUDIENCE,
      subscriber_id: normalizedSubscriberId,
      journey_key: normalizedJourneyKey,
      status: "active",
      entered_at: new Date().toISOString(),
      current_step_key: initialStep.stepKey,
      current_step_order: initialStep.stepOrder,
      assignment_reason: toSafeString(assignmentReason),
    });

    const enrollmentId = toSafeString(insertedEnrollment.id);
    if (!enrollmentId) {
      throw new Error(
        `Journey enrollment for "${normalizedJourneyKey}" was created without an id.`,
      );
    }

    return {
      enrollmentId,
      journeyKey: normalizedJourneyKey,
      created: true,
      replacedEnrollmentId,
    };
  } catch (error) {
    const insertError = error as SupabaseError;
    if (insertError.code !== "23505") throw error;

    const existingEnrollment = await fetchActiveJourneyEnrollment(
      normalizedSubscriberId,
      normalizedJourneyKey,
    );
    const enrollmentId = toSafeString(existingEnrollment?.id);
    if (!enrollmentId) throw error;

    return {
      enrollmentId,
      journeyKey: normalizedJourneyKey,
      created: false,
      replacedEnrollmentId,
    };
  }
}

export async function ensureJourneyEnrollment({
  subscriberId,
  journeyKey,
  currentStepKey,
  currentStepOrder,
  assignmentReason = "",
}: EnsureJourneyEnrollmentInput): Promise<EnsureJourneyEnrollmentResult> {
  const initialStep = await resolveInitialJourneyStep({
    journeyKey,
    requestedStepKey: currentStepKey,
    requestedStepOrder: currentStepOrder,
  });

  const result = await assignJourneyEnrollment({
    subscriberId,
    journeyKey,
    assignmentReason,
  });

  const activeEnrollment = await fetchActiveJourneyEnrollment(subscriberId, journeyKey);
  if (activeEnrollment?.id) {
    const updatePayload: Record<string, string | number | null> = {};

    if (!toSafeString(activeEnrollment.current_step_key)) {
      updatePayload.current_step_key = initialStep.stepKey;
    }
    if (activeEnrollment.current_step_order == null) {
      updatePayload.current_step_order = initialStep.stepOrder;
    }

    await updateJourneyEnrollment(toSafeString(activeEnrollment.id), updatePayload);
  }

  return {
    enrollmentId: result.enrollmentId,
    journeyKey: result.journeyKey,
    created: result.created,
  };
}

export const ensureCampaignEnrollment = ensureJourneyEnrollment;

export async function syncNewsletterSubscriber({
  email,
  name,
  acquisitionSource,
  utmSource,
  utmMedium,
  utmCampaign,
  assignmentProfile = "newsletter_signup",
}: SyncNewsletterSubscriberInput): Promise<SyncNewsletterSubscriberResult> {
  const normalizedSubscriberEmail = normalizeEmail(email);
  if (!normalizedSubscriberEmail) {
    throw new Error("Subscriber email is required.");
  }

  const resolvedName = normalizeSubscriberName(name, normalizedSubscriberEmail);
  const safeAcquisitionSource =
    toSafeString(acquisitionSource) ||
    (assignmentProfile === "lead_capture" ? "website" : "newsletter");
  const safeUtmSource = toNullableString(utmSource);
  const safeUtmMedium = toNullableString(utmMedium);
  const safeUtmCampaign = toNullableString(utmCampaign);
  const nowIso = new Date().toISOString();

  let existingSubscriber = await fetchSubscriberByEmail(normalizedSubscriberEmail);
  let created = false;
  let reactivated = false;

  if (existingSubscriber?.id) {
    reactivated =
      toSafeString(existingSubscriber.status).toLowerCase() !== "subscribed";

    const updatePayload: Record<string, string | null> = {};

    if (isReplaceableName(existingSubscriber.name) && resolvedName !== "there") {
      updatePayload.name = resolvedName;
    }
    if (!toSafeString(existingSubscriber.acquisition_source) && safeAcquisitionSource) {
      updatePayload.acquisition_source = safeAcquisitionSource;
    }
    if (!toSafeString(existingSubscriber.utm_source) && safeUtmSource) {
      updatePayload.utm_source = safeUtmSource;
    }
    if (!toSafeString(existingSubscriber.utm_medium) && safeUtmMedium) {
      updatePayload.utm_medium = safeUtmMedium;
    }
    if (!toSafeString(existingSubscriber.utm_campaign) && safeUtmCampaign) {
      updatePayload.utm_campaign = safeUtmCampaign;
    }
    if (!existingSubscriber.subscribed_at) {
      updatePayload.subscribed_at = nowIso;
    }
    if (!toSafeString(existingSubscriber.unsubscribe_token)) {
      updatePayload.unsubscribe_token = generateNewsletterUnsubscribeToken();
    }
    if (reactivated) {
      updatePayload.status = "subscribed";
      updatePayload.unsubscribed_at = null;
    }

    await updateSubscriber(existingSubscriber.id, updatePayload);
    existingSubscriber = {
      ...existingSubscriber,
      ...updatePayload,
      status: "subscribed",
      unsubscribed_at: null,
      subscribed_at: existingSubscriber.subscribed_at || nowIso,
      unsubscribe_token:
        toSafeString(updatePayload.unsubscribe_token) ||
        existingSubscriber.unsubscribe_token,
    };
  } else {
    try {
      existingSubscriber = await insertSubscriber({
        email: normalizedSubscriberEmail,
        name: resolvedName,
        status: "subscribed",
        subscribed_at: nowIso,
        unsubscribed_at: null,
        unsubscribe_token: generateNewsletterUnsubscribeToken(),
        acquisition_source: safeAcquisitionSource,
        utm_source: safeUtmSource,
        utm_medium: safeUtmMedium,
        utm_campaign: safeUtmCampaign,
      });
      created = true;
    } catch (error) {
      const insertError = error as SupabaseError;
      if (insertError.code !== "23505") throw error;

      existingSubscriber = await fetchSubscriberByEmail(normalizedSubscriberEmail);
      if (!existingSubscriber?.id) throw error;

      reactivated =
        toSafeString(existingSubscriber.status).toLowerCase() !== "subscribed";

      const updatePayload: Record<string, string | null> = {};

      if (isReplaceableName(existingSubscriber.name) && resolvedName !== "there") {
        updatePayload.name = resolvedName;
      }
      if (
        !toSafeString(existingSubscriber.acquisition_source) &&
        safeAcquisitionSource
      ) {
        updatePayload.acquisition_source = safeAcquisitionSource;
      }
      if (!toSafeString(existingSubscriber.utm_source) && safeUtmSource) {
        updatePayload.utm_source = safeUtmSource;
      }
      if (!toSafeString(existingSubscriber.utm_medium) && safeUtmMedium) {
        updatePayload.utm_medium = safeUtmMedium;
      }
      if (!toSafeString(existingSubscriber.utm_campaign) && safeUtmCampaign) {
        updatePayload.utm_campaign = safeUtmCampaign;
      }
      if (!existingSubscriber.subscribed_at) {
        updatePayload.subscribed_at = nowIso;
      }
      if (!toSafeString(existingSubscriber.unsubscribe_token)) {
        updatePayload.unsubscribe_token = generateNewsletterUnsubscribeToken();
      }
      if (reactivated) {
        updatePayload.status = "subscribed";
        updatePayload.unsubscribed_at = null;
      }

      await updateSubscriber(existingSubscriber.id, updatePayload);
      existingSubscriber = {
        ...existingSubscriber,
        ...updatePayload,
        status: "subscribed",
        unsubscribed_at: null,
        subscribed_at: existingSubscriber.subscribed_at || nowIso,
        unsubscribe_token:
          toSafeString(updatePayload.unsubscribe_token) ||
          existingSubscriber.unsubscribe_token,
      };
    }
  }

  const subscriberId = toSafeString(existingSubscriber?.id);
  const unsubscribeToken = toSafeString(existingSubscriber?.unsubscribe_token);
  if (!subscriberId) {
    throw new Error(
      `Subscriber "${normalizedSubscriberEmail}" could not be resolved after sync.`,
    );
  }
  if (!unsubscribeToken) {
    throw new Error(
      `Subscriber "${normalizedSubscriberEmail}" is missing an unsubscribe token.`,
    );
  }

  const assignments = buildJourneyAssignments(
    assignmentProfile,
    safeAcquisitionSource,
  );
  const enrollmentResults = await Promise.all(
    assignments.map((assignment) =>
      assignJourneyEnrollment({
        subscriberId,
        journeyKey: assignment.journeyKey,
        assignmentReason: assignment.assignmentReason,
      }),
    ),
  );

  const journeyKeys = enrollmentResults.map((result) => result.journeyKey);

  return {
    subscriberId,
    email: normalizedSubscriberEmail,
    created,
    reactivated,
    journeyKeys,
    campaignKeys: journeyKeys,
    unsubscribeToken,
  };
}

const unsubscribeNewsletterSubscriberById = async (subscriberId: string) => {
  const client = requireSupabase();
  const nowIso = new Date().toISOString();

  const { error: subscriberUpdateError } = await client
    .from("newsletter_subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: nowIso,
    })
    .eq("id", subscriberId);

  if (subscriberUpdateError) throw subscriberUpdateError;

  const { error: enrollmentUpdateError } = await client
    .from("email_journey_enrollments")
    .update({
      status: "cancelled",
      exited_at: nowIso,
      exit_reason: "unsubscribe",
      current_step_key: "",
      current_step_order: null,
    })
    .eq("audience", NEWSLETTER_AUDIENCE)
    .eq("subscriber_id", subscriberId)
    .eq("status", "active");

  if (enrollmentUpdateError) throw enrollmentUpdateError;
};

export async function unsubscribeNewsletterSubscriberByToken(
  unsubscribeToken: string,
): Promise<boolean> {
  const subscriber = await getNewsletterSubscriberByUnsubscribeToken(unsubscribeToken);
  if (!subscriber) return false;

  if (subscriber.status === "subscribed") {
    await unsubscribeNewsletterSubscriberById(subscriber.subscriberId);
  }

  return true;
}

export async function ensureEmailDelivery({
  subscriberId,
  deliveryKind,
  enrollmentId,
  sendKey,
  journeyKey,
  stepKey,
  blogPostId,
  providerMessageId,
  status = "queued",
  errorMessage,
}: EnsureEmailDeliveryInput): Promise<EmailDeliveryLog> {
  const safeEnrollmentId = toNullableString(enrollmentId);
  const safeSendKey = toNullableString(sendKey);
  const safeStepKey = toSafeString(stepKey);

  if (safeEnrollmentId && safeStepKey) {
    const existing = await fetchEmailDeliveryByEnrollmentStep(
      safeEnrollmentId,
      safeStepKey,
    );
    if (existing) return existing;
  } else if (safeSendKey) {
    const existing = await fetchEmailDeliveryBySendKey(safeSendKey, subscriberId);
    if (existing) return existing;
  }

  try {
    const insertedDelivery = await insertEmailDelivery({
      audience: NEWSLETTER_AUDIENCE,
      subscriber_id: subscriberId,
      enrollment_id: safeEnrollmentId,
      delivery_kind: deliveryKind,
      send_key: safeSendKey,
      journey_key: toNullableString(journeyKey),
      step_key: safeStepKey,
      blog_post_id: toNullableString(blogPostId),
      provider_message_id: toNullableString(providerMessageId),
      status,
      queued_at: new Date().toISOString(),
      processed_at: status === "queued" ? null : new Date().toISOString(),
      error_message: toSafeString(errorMessage),
    });

    if (!insertedDelivery) {
      throw new Error("Email delivery log insert returned no record.");
    }

    return insertedDelivery;
  } catch (error) {
    const insertError = error as SupabaseError;
    if (insertError.code !== "23505") throw error;

    if (safeEnrollmentId && safeStepKey) {
      const existing = await fetchEmailDeliveryByEnrollmentStep(
        safeEnrollmentId,
        safeStepKey,
      );
      if (existing) return existing;
    }
    if (safeSendKey) {
      const existing = await fetchEmailDeliveryBySendKey(safeSendKey, subscriberId);
      if (existing) return existing;
    }

    throw error;
  }
}

export const createCampaignSendLog = ensureEmailDelivery;

export async function setJourneyEnrollmentNextStep(
  enrollmentId: string,
  {
    stepKey,
    stepOrder,
  }: {
    stepKey: string;
    stepOrder: number | null;
  },
) {
  const client = requireSupabase();
  const { error } = await client
    .from("email_journey_enrollments")
    .update({
      current_step_key: toSafeString(stepKey),
      current_step_order: stepOrder,
    })
    .eq("id", enrollmentId);

  if (error) throw error;
}

export const setCampaignEnrollmentNextStep = setJourneyEnrollmentNextStep;

const finalizeJourneyEnrollment = async (
  enrollmentId: string,
  status: "completed" | "cancelled",
  exitReason: string,
): Promise<void> => {
  await updateJourneyEnrollment(enrollmentId, {
    status,
    exited_at: new Date().toISOString(),
    exit_reason: toSafeString(exitReason),
    current_step_key: "",
    current_step_order: null,
  });
};

export async function completeJourneyEnrollment(
  enrollmentId: string,
  exitReason: string,
) {
  await finalizeJourneyEnrollment(enrollmentId, "completed", exitReason);
}

export const completeCampaignEnrollment = completeJourneyEnrollment;

export async function cancelJourneyEnrollment(
  enrollmentId: string,
  exitReason: string,
) {
  await finalizeJourneyEnrollment(enrollmentId, "cancelled", exitReason);
}

export async function updateEmailDeliveryStatus(
  deliveryId: string,
  status: EmailDeliveryStatus,
  {
    providerMessageId,
    errorMessage,
    processedAt,
  }: {
    providerMessageId?: string;
    errorMessage?: string;
    processedAt?: string;
  } = {},
) {
  const client = requireSupabase();
  const payload: Record<string, string | null> = {
    status,
    processed_at:
      status === "queued"
        ? null
        : toSafeString(processedAt) || new Date().toISOString(),
  };

  if (providerMessageId) {
    payload.provider_message_id = providerMessageId;
  }
  if (errorMessage !== undefined) {
    payload.error_message = toSafeString(errorMessage);
  }

  const { error } = await client
    .from("email_deliveries")
    .update(payload)
    .eq("id", deliveryId);

  if (error) throw error;
}

export const updateCampaignSendLogStatus = updateEmailDeliveryStatus;

export async function listSubscribedNewsletterRecipients(
  { limit }: { limit?: number } = {},
): Promise<NewsletterSubscriberRecord[]> {
  const client = requireSupabase();
  const { data: activeEnrollmentData, error: activeEnrollmentError } = await client
    .from("email_journey_enrollments")
    .select("subscriber_id")
    .eq("audience", NEWSLETTER_AUDIENCE)
    .eq("status", "active");

  if (activeEnrollmentError) throw activeEnrollmentError;

  const suppressedSubscriberIds = new Set(
    ((activeEnrollmentData as Array<{ subscriber_id?: string | null }> | null) ?? [])
      .map((row) => toSafeString(row.subscriber_id))
      .filter(Boolean),
  );

  const query = client
    .from("newsletter_subscribers")
    .select(SUBSCRIBER_SELECT)
    .eq("status", "subscribed")
    .order("subscribed_at", { ascending: true, nullsFirst: false });

  const { data, error } = await query;
  if (error) throw error;

  const eligibleRecipients = ((data as SubscriberRow[] | null) ?? [])
    .map((row) => normalizeSubscriber(row))
    .filter((row): row is NewsletterSubscriberRecord => Boolean(row))
    .filter((row) =>
      canReceiveWeeklyNewsletter({
        subscriberStatus: row.status,
        hasActiveJourney: suppressedSubscriberIds.has(row.subscriberId),
      }),
    );

  if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
    return eligibleRecipients.slice(0, Math.floor(limit));
  }

  return eligibleRecipients;
}
