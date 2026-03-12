import "server-only";

import { createClient } from "@supabase/supabase-js";
import { deriveNameFromEmail, normalizeEmail } from "./contactName";

export type NewsletterSubscriberStatus =
  | "subscribed"
  | "unsubscribed"
  | "bounced"
  | "complained";

export type EmailCampaignKind = "broadcast" | "journey";
export type EmailCampaignStatus = "draft" | "active" | "paused" | "archived";
export type CampaignEnrollmentStatus =
  | "active"
  | "paused"
  | "completed"
  | "cancelled";
export type CampaignAssignmentMethod = "rule" | "manual";
export type CampaignSendStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "failed";
export type NewsletterAssignmentProfile = "newsletter_signup" | "lead_capture";

export const EMAIL_CAMPAIGN_KEYS = {
  newsletterWelcomeJourney: "newsletter_welcome_journey",
  leadFollowUpJourney: "lead_follow_up_journey",
} as const;

export type EmailCampaignKey =
  (typeof EMAIL_CAMPAIGN_KEYS)[keyof typeof EMAIL_CAMPAIGN_KEYS];

type SubscriberRow = {
  id: string | null;
  email: string | null;
  name: string | null;
  status: NewsletterSubscriberStatus | null;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
  acquisition_source: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

type EmailCampaignRow = {
  id: string | null;
  key: string | null;
  name: string | null;
  kind: EmailCampaignKind | null;
  objective_key: string | null;
  status: EmailCampaignStatus | null;
  blog_post_id: string | null;
};

type CampaignEnrollmentRow = {
  id: string | null;
  subscriber_id: string | null;
  campaign_id: string | null;
  status: CampaignEnrollmentStatus | null;
  entered_at: string | null;
  exited_at: string | null;
  current_step_key: string | null;
  current_step_order: number | null;
  assignment_method: CampaignAssignmentMethod | null;
  assignment_reason: string | null;
};

type EmailCampaignStepRow = {
  id: string | null;
  campaign_id: string | null;
  step_key: string | null;
  step_order: number | null;
  delay_days: number | null;
  blog_post_id: string | null;
  cta_override_html: string | null;
  is_active: boolean | null;
};

type CampaignSendRow = {
  id: string | null;
  subscriber_id: string | null;
  campaign_id: string | null;
  enrollment_id: string | null;
  step_key: string | null;
  provider_message_id: string | null;
  status: CampaignSendStatus | null;
  queued_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  failed_at: string | null;
  error_message: string | null;
};

type CampaignMembershipRow = Omit<CampaignEnrollmentRow, "campaign_id"> & {
  campaign: EmailCampaignRow | EmailCampaignRow[] | null;
};

type CampaignEnrollmentDetailRow = CampaignEnrollmentRow & {
  campaign: EmailCampaignRow | EmailCampaignRow[] | null;
  subscriber: SubscriberRow | SubscriberRow[] | null;
};

type SupabaseError = {
  code?: string;
  details?: string;
  message?: string;
};

type EmailCampaignDefinition = {
  key: EmailCampaignKey;
  name: string;
  kind: EmailCampaignKind;
  objectiveKey: string;
  status: EmailCampaignStatus;
};

type CampaignAssignment = {
  campaignKey: EmailCampaignKey;
  currentStepKey: string;
  currentStepOrder: number | null;
  assignmentMethod: CampaignAssignmentMethod;
  assignmentReason: string;
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
  campaignKeys: string[];
};

export type EnsureCampaignEnrollmentInput = {
  subscriberId: string;
  campaignKey: EmailCampaignKey;
  currentStepKey?: string;
  currentStepOrder?: number | null;
  assignmentMethod?: CampaignAssignmentMethod;
  assignmentReason?: string;
};

export type EnsureCampaignEnrollmentResult = {
  enrollmentId: string;
  campaignId: string;
  campaignKey: string;
  created: boolean;
};

export type SubscriberCampaignMembership = {
  enrollmentId: string;
  enrollmentStatus: CampaignEnrollmentStatus;
  enteredAt: string;
  exitedAt: string | null;
  currentStepKey: string;
  currentStepOrder: number | null;
  assignmentMethod: CampaignAssignmentMethod;
  assignmentReason: string;
  campaignId: string;
  campaignKey: string;
  campaignName: string;
  campaignKind: EmailCampaignKind;
  campaignStatus: EmailCampaignStatus;
  campaignObjectiveKey: string;
};

export type CreateCampaignSendLogInput = {
  subscriberId: string;
  campaignId: string;
  enrollmentId?: string;
  stepKey?: string;
  providerMessageId?: string;
  status?: CampaignSendStatus;
  errorMessage?: string;
};

export type EmailCampaignStep = {
  id: string;
  campaignId: string;
  stepKey: string;
  stepOrder: number;
  delayDays: number;
  blogPostId: string;
  ctaOverrideHtml: string;
  isActive: boolean;
};

export type CampaignSendLog = {
  id: string;
  subscriberId: string;
  campaignId: string;
  enrollmentId: string | null;
  stepKey: string;
  providerMessageId: string;
  status: CampaignSendStatus;
  queuedAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  failedAt: string | null;
  errorMessage: string;
};

export type ActiveCampaignEnrollment = {
  enrollmentId: string;
  campaignId: string;
  campaignKey: string;
  campaignName: string;
  subscriberId: string;
  subscriberEmail: string;
  subscriberName: string;
  subscriberStatus: NewsletterSubscriberStatus;
  enteredAt: string;
  currentStepKey: string;
  currentStepOrder: number | null;
  assignmentMethod: CampaignAssignmentMethod;
  assignmentReason: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const SUBSCRIBER_SELECT =
  "id,email,name,status,subscribed_at,unsubscribed_at,acquisition_source,source,utm_source,utm_medium,utm_campaign";
const CAMPAIGN_SELECT =
  "id,key,name,kind,objective_key,status,blog_post_id";
const CAMPAIGN_STEP_SELECT =
  "id,campaign_id,step_key,step_order,delay_days,blog_post_id,cta_override_html,is_active";
const ENROLLMENT_SELECT =
  "id,subscriber_id,campaign_id,status,entered_at,exited_at,current_step_key,current_step_order,assignment_method,assignment_reason";
const ENROLLMENT_WITH_CAMPAIGN_SELECT = `${ENROLLMENT_SELECT},campaign:email_campaigns!campaign_enrollments_campaign_id_fkey(${CAMPAIGN_SELECT})`;
const ENROLLMENT_WITH_RELATIONS_SELECT = `${ENROLLMENT_SELECT},campaign:email_campaigns!campaign_enrollments_campaign_id_fkey(${CAMPAIGN_SELECT}),subscriber:newsletter_subscribers!campaign_enrollments_subscriber_id_fkey(${SUBSCRIBER_SELECT})`;
const CAMPAIGN_SEND_SELECT =
  "id,subscriber_id,campaign_id,enrollment_id,step_key,provider_message_id,status,queued_at,sent_at,delivered_at,opened_at,clicked_at,bounced_at,failed_at,error_message";

const EMAIL_CAMPAIGN_DEFINITIONS: Record<
  EmailCampaignKey,
  EmailCampaignDefinition
> = {
  [EMAIL_CAMPAIGN_KEYS.newsletterWelcomeJourney]: {
    key: EMAIL_CAMPAIGN_KEYS.newsletterWelcomeJourney,
    name: "Newsletter Welcome Journey",
    kind: "journey",
    objectiveKey: "welcome",
    status: "active",
  },
  [EMAIL_CAMPAIGN_KEYS.leadFollowUpJourney]: {
    key: EMAIL_CAMPAIGN_KEYS.leadFollowUpJourney,
    name: "Lead Follow-up Journey",
    kind: "journey",
    objectiveKey: "education",
    status: "active",
  },
};

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toNullableString = (value: unknown): string | null => {
  const safeValue = toSafeString(value);
  return safeValue ? safeValue : null;
};

const firstNonEmpty = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const safeValue = toSafeString(value);
    if (safeValue) return safeValue;
  }
  return "";
};

const isReplaceableName = (value: string | null | undefined) => {
  const normalizedValue = toSafeString(value).toLowerCase();
  return !normalizedValue || normalizedValue === "there";
};

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase not configured for newsletter campaigns.");
  }

  return supabase;
};

const normalizeSubscriberName = (name: string | undefined, email: string) => {
  const safeName = toSafeString(name);
  return safeName || deriveNameFromEmail(email);
};

const normalizeCampaignStep = (row: EmailCampaignStepRow): EmailCampaignStep | null => {
  const id = toSafeString(row.id);
  const campaignId = toSafeString(row.campaign_id);
  const stepKey = toSafeString(row.step_key);
  const blogPostId = toSafeString(row.blog_post_id);

  if (
    !id ||
    !campaignId ||
    !stepKey ||
    !blogPostId ||
    row.step_order == null ||
    row.delay_days == null ||
    row.is_active == null
  ) {
    return null;
  }

  return {
    id,
    campaignId,
    stepKey,
    stepOrder: row.step_order,
    delayDays: row.delay_days,
    blogPostId,
    ctaOverrideHtml: toSafeString(row.cta_override_html),
    isActive: row.is_active,
  };
};

const normalizeCampaignSendLog = (row: CampaignSendRow): CampaignSendLog | null => {
  const id = toSafeString(row.id);
  const subscriberId = toSafeString(row.subscriber_id);
  const campaignId = toSafeString(row.campaign_id);
  const stepKey = toSafeString(row.step_key);
  const status = row.status;

  if (!id || !subscriberId || !campaignId || !stepKey || !status) {
    return null;
  }

  return {
    id,
    subscriberId,
    campaignId,
    enrollmentId: toNullableString(row.enrollment_id),
    stepKey,
    providerMessageId: toSafeString(row.provider_message_id),
    status,
    queuedAt: toNullableString(row.queued_at),
    sentAt: toNullableString(row.sent_at),
    deliveredAt: toNullableString(row.delivered_at),
    openedAt: toNullableString(row.opened_at),
    clickedAt: toNullableString(row.clicked_at),
    bouncedAt: toNullableString(row.bounced_at),
    failedAt: toNullableString(row.failed_at),
    errorMessage: toSafeString(row.error_message),
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

const buildCampaignAssignments = (
  assignmentProfile: NewsletterAssignmentProfile,
  acquisitionSource: string,
): CampaignAssignment[] => {
  const assignmentSuffix = toSafeString(acquisitionSource) || "direct";

  if (assignmentProfile === "lead_capture") {
    return [
      {
        campaignKey: EMAIL_CAMPAIGN_KEYS.leadFollowUpJourney,
        currentStepKey: "lead_day_0_story",
        currentStepOrder: 1,
        assignmentMethod: "rule",
        assignmentReason: `lead_capture:${assignmentSuffix}`,
      },
    ];
  }

  return [
    {
      campaignKey: EMAIL_CAMPAIGN_KEYS.newsletterWelcomeJourney,
      currentStepKey: "welcome_start",
      currentStepOrder: 1,
      assignmentMethod: "rule",
      assignmentReason: `newsletter_signup:${assignmentSuffix}`,
    },
  ];
};

const ensureEmailCampaign = async (
  campaignKey: EmailCampaignKey,
): Promise<EmailCampaignRow> => {
  const client = requireSupabase();
  const definition = EMAIL_CAMPAIGN_DEFINITIONS[campaignKey];

  if (!definition) {
    throw new Error(`Unknown email campaign "${campaignKey}".`);
  }

  const { data, error } = await client
    .from("email_campaigns")
    .upsert(
      {
        key: definition.key,
        name: definition.name,
        kind: definition.kind,
        objective_key: definition.objectiveKey,
        status: definition.status,
      },
      { onConflict: "key" },
    )
    .select(CAMPAIGN_SELECT)
    .single();

  if (error) throw error;
  return data as EmailCampaignRow;
};

const fetchActiveEnrollment = async (subscriberId: string, campaignId: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("campaign_enrollments")
    .select(ENROLLMENT_SELECT)
    .eq("subscriber_id", subscriberId)
    .eq("campaign_id", campaignId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return (data as CampaignEnrollmentRow | null) ?? null;
};

const insertEnrollment = async (
  payload: Record<string, string | number | null>,
) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("campaign_enrollments")
    .insert(payload)
    .select(ENROLLMENT_SELECT)
    .single();

  if (error) throw error;
  return data as CampaignEnrollmentRow;
};

const fetchCampaignEnrollmentById = async (enrollmentId: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("campaign_enrollments")
    .select(ENROLLMENT_WITH_RELATIONS_SELECT)
    .eq("id", enrollmentId)
    .maybeSingle();

  if (error) throw error;
  return (data as CampaignEnrollmentDetailRow | null) ?? null;
};

const fetchCampaignSteps = async (campaignId: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_campaign_steps")
    .select(CAMPAIGN_STEP_SELECT)
    .eq("campaign_id", campaignId)
    .eq("is_active", true)
    .order("step_order", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return ((data as EmailCampaignStepRow[] | null) ?? [])
    .map((row) => normalizeCampaignStep(row))
    .filter((row): row is EmailCampaignStep => Boolean(row));
};

const fetchCampaignSendLogsByEnrollmentId = async (enrollmentId: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("campaign_sends")
    .select(CAMPAIGN_SEND_SELECT)
    .eq("enrollment_id", enrollmentId)
    .order("queued_at", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return ((data as CampaignSendRow[] | null) ?? [])
    .map((row) => normalizeCampaignSendLog(row))
    .filter((row): row is CampaignSendLog => Boolean(row));
};

export const isNewsletterCampaignsConfigured = () => Boolean(supabase);

export async function getCampaignSteps(
  campaignId: string,
): Promise<EmailCampaignStep[]> {
  return fetchCampaignSteps(campaignId);
}

export async function getCampaignEnrollmentById(
  enrollmentId: string,
): Promise<ActiveCampaignEnrollment | null> {
  const row = await fetchCampaignEnrollmentById(enrollmentId);
  const campaign = Array.isArray(row?.campaign) ? row?.campaign[0] : row?.campaign;
  const subscriber = Array.isArray(row?.subscriber)
    ? row?.subscriber[0]
    : row?.subscriber;

  const normalizedEnrollmentId = toSafeString(row?.id);
  const campaignId = toSafeString(campaign?.id);
  const campaignKey = toSafeString(campaign?.key);
  const campaignName = toSafeString(campaign?.name);
  const subscriberId = toSafeString(subscriber?.id);
  const subscriberEmail = toSafeString(subscriber?.email);
  const subscriberName = toSafeString(subscriber?.name);
  const subscriberStatus = subscriber?.status;
  const enteredAt = toSafeString(row?.entered_at);
  const assignmentMethod = row?.assignment_method;

  if (
    !row ||
    !normalizedEnrollmentId ||
    !campaignId ||
    !campaignKey ||
    !campaignName ||
    !subscriberId ||
    !subscriberEmail ||
    !subscriberName ||
    !subscriberStatus ||
    !enteredAt ||
    !assignmentMethod
  ) {
    return null;
  }

  return {
    enrollmentId: normalizedEnrollmentId,
    campaignId,
    campaignKey,
    campaignName,
    subscriberId,
    subscriberEmail,
    subscriberName,
    subscriberStatus,
    enteredAt,
    currentStepKey: toSafeString(row.current_step_key),
    currentStepOrder: row.current_step_order,
    assignmentMethod,
    assignmentReason: toSafeString(row.assignment_reason),
  };
}

export async function getActiveCampaignEnrollmentForSubscriber(
  subscriberId: string,
  campaignKey: EmailCampaignKey,
): Promise<ActiveCampaignEnrollment | null> {
  const campaign = await ensureEmailCampaign(campaignKey);
  const campaignId = toSafeString(campaign.id);

  if (!campaignId) {
    throw new Error(`Email campaign "${campaignKey}" is missing an id.`);
  }

  const row = await fetchActiveEnrollment(subscriberId, campaignId);
  const enrollmentId = toSafeString(row?.id);
  if (!enrollmentId) return null;

  return getCampaignEnrollmentById(enrollmentId);
}

export async function listActiveCampaignEnrollmentsByCampaignKey(
  campaignKey: EmailCampaignKey,
): Promise<ActiveCampaignEnrollment[]> {
  const client = requireSupabase();
  const campaign = await ensureEmailCampaign(campaignKey);
  const campaignId = toSafeString(campaign.id);

  if (!campaignId) {
    throw new Error(`Email campaign "${campaignKey}" is missing an id.`);
  }

  const { data, error } = await client
    .from("campaign_enrollments")
    .select(ENROLLMENT_WITH_RELATIONS_SELECT)
    .eq("campaign_id", campaignId)
    .eq("status", "active")
    .order("entered_at", { ascending: true, nullsFirst: false });

  if (error) throw error;

  return ((data as CampaignEnrollmentDetailRow[] | null) ?? []).flatMap((row) => {
    const campaignRow = Array.isArray(row.campaign) ? row.campaign[0] : row.campaign;
    const subscriber = Array.isArray(row.subscriber)
      ? row.subscriber[0]
      : row.subscriber;

    const enrollmentId = toSafeString(row.id);
    const normalizedCampaignId = toSafeString(campaignRow?.id);
    const normalizedCampaignKey = toSafeString(campaignRow?.key);
    const campaignName = toSafeString(campaignRow?.name);
    const normalizedSubscriberId = toSafeString(subscriber?.id);
    const subscriberEmail = toSafeString(subscriber?.email);
    const subscriberName = toSafeString(subscriber?.name);
    const subscriberStatus = subscriber?.status;
    const enteredAt = toSafeString(row.entered_at);
    const assignmentMethod = row.assignment_method;

    if (
      !enrollmentId ||
      !normalizedCampaignId ||
      !normalizedCampaignKey ||
      !campaignName ||
      !normalizedSubscriberId ||
      !subscriberEmail ||
      !subscriberName ||
      !subscriberStatus ||
      !enteredAt ||
      !assignmentMethod
    ) {
      return [];
    }

    return [
      {
        enrollmentId,
        campaignId: normalizedCampaignId,
        campaignKey: normalizedCampaignKey,
        campaignName,
        subscriberId: normalizedSubscriberId,
        subscriberEmail,
        subscriberName,
        subscriberStatus,
        enteredAt,
        currentStepKey: toSafeString(row.current_step_key),
        currentStepOrder: row.current_step_order,
        assignmentMethod,
        assignmentReason: toSafeString(row.assignment_reason),
      },
    ];
  });
}

export async function getCampaignSendLogsByEnrollmentId(
  enrollmentId: string,
): Promise<CampaignSendLog[]> {
  return fetchCampaignSendLogsByEnrollmentId(enrollmentId);
}

export async function ensureCampaignEnrollment({
  subscriberId,
  campaignKey,
  currentStepKey,
  currentStepOrder,
  assignmentMethod = "rule",
  assignmentReason = "",
}: EnsureCampaignEnrollmentInput): Promise<EnsureCampaignEnrollmentResult> {
  const campaign = await ensureEmailCampaign(campaignKey);
  const campaignId = toSafeString(campaign.id);

  if (!campaignId) {
    throw new Error(`Email campaign "${campaignKey}" is missing an id.`);
  }

  const activeEnrollment = await fetchActiveEnrollment(subscriberId, campaignId);
  if (activeEnrollment?.id) {
    const updatePayload: Record<string, string | number | null> = {};
    if (
      !toSafeString(activeEnrollment.current_step_key) &&
      toSafeString(currentStepKey)
    ) {
      updatePayload.current_step_key = toSafeString(currentStepKey);
    }
    if (
      activeEnrollment.current_step_order == null &&
      typeof currentStepOrder === "number"
    ) {
      updatePayload.current_step_order = currentStepOrder;
    }
    if (
      !toSafeString(activeEnrollment.assignment_reason) &&
      toSafeString(assignmentReason)
    ) {
      updatePayload.assignment_reason = toSafeString(assignmentReason);
    }

    if (Object.keys(updatePayload).length > 0) {
      const client = requireSupabase();
      const { error } = await client
        .from("campaign_enrollments")
        .update(updatePayload)
        .eq("id", activeEnrollment.id);

      if (error) throw error;
    }

    return {
      enrollmentId: activeEnrollment.id,
      campaignId,
      campaignKey,
      created: false,
    };
  }

  try {
    const insertedEnrollment = await insertEnrollment({
      subscriber_id: subscriberId,
      campaign_id: campaignId,
      status: "active",
      entered_at: new Date().toISOString(),
      current_step_key: toSafeString(currentStepKey),
      current_step_order:
        typeof currentStepOrder === "number" ? currentStepOrder : null,
      assignment_method: assignmentMethod,
      assignment_reason: toSafeString(assignmentReason),
    });

    const enrollmentId = toSafeString(insertedEnrollment.id);
    if (!enrollmentId) {
      throw new Error(
        `Campaign enrollment for "${campaignKey}" was created without an id.`,
      );
    }

    return {
      enrollmentId,
      campaignId,
      campaignKey,
      created: true,
    };
  } catch (error) {
    const insertError = error as SupabaseError;
    if (insertError.code !== "23505") throw error;

    const existingEnrollment = await fetchActiveEnrollment(subscriberId, campaignId);
    const enrollmentId = toSafeString(existingEnrollment?.id);
    if (!enrollmentId) throw error;

    return {
      enrollmentId,
      campaignId,
      campaignKey,
      created: false,
    };
  }
}

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

    const initialAcquisitionSource = firstNonEmpty(
      existingSubscriber.acquisition_source,
      existingSubscriber.source,
      safeAcquisitionSource,
    );
    const updatePayload: Record<string, string | null> = {};

    if (isReplaceableName(existingSubscriber.name) && resolvedName !== "there") {
      updatePayload.name = resolvedName;
    }
    if (!toSafeString(existingSubscriber.acquisition_source) && initialAcquisitionSource) {
      updatePayload.acquisition_source = initialAcquisitionSource;
    }
    if (!toSafeString(existingSubscriber.source) && initialAcquisitionSource) {
      updatePayload.source = initialAcquisitionSource;
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
    };
  } else {
    try {
      existingSubscriber = await insertSubscriber({
        email: normalizedSubscriberEmail,
        name: resolvedName,
        status: "subscribed",
        subscribed_at: nowIso,
        unsubscribed_at: null,
        acquisition_source: safeAcquisitionSource,
        source: safeAcquisitionSource,
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
      const initialAcquisitionSource = firstNonEmpty(
        existingSubscriber.acquisition_source,
        existingSubscriber.source,
        safeAcquisitionSource,
      );
      const updatePayload: Record<string, string | null> = {};

      if (isReplaceableName(existingSubscriber.name) && resolvedName !== "there") {
        updatePayload.name = resolvedName;
      }
      if (
        !toSafeString(existingSubscriber.acquisition_source) &&
        initialAcquisitionSource
      ) {
        updatePayload.acquisition_source = initialAcquisitionSource;
      }
      if (!toSafeString(existingSubscriber.source) && initialAcquisitionSource) {
        updatePayload.source = initialAcquisitionSource;
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
      };
    }
  }

  const subscriberId = toSafeString(existingSubscriber?.id);
  if (!subscriberId) {
    throw new Error(
      `Subscriber "${normalizedSubscriberEmail}" could not be resolved after sync.`,
    );
  }

  const assignments = buildCampaignAssignments(
    assignmentProfile,
    safeAcquisitionSource,
  );
  const enrollmentResults = await Promise.all(
    assignments.map((assignment) =>
      ensureCampaignEnrollment({
        subscriberId,
        campaignKey: assignment.campaignKey,
        currentStepKey: assignment.currentStepKey,
        currentStepOrder: assignment.currentStepOrder,
        assignmentMethod: assignment.assignmentMethod,
        assignmentReason: assignment.assignmentReason,
      }),
    ),
  );

  return {
    subscriberId,
    email: normalizedSubscriberEmail,
    created,
    reactivated,
    campaignKeys: enrollmentResults.map((result) => result.campaignKey),
  };
}

export async function unsubscribeNewsletterSubscriberByEmail(email: string) {
  const client = requireSupabase();
  const normalizedSubscriberEmail = normalizeEmail(email);
  if (!normalizedSubscriberEmail) {
    throw new Error("Subscriber email is required to unsubscribe.");
  }

  const subscriber = await fetchSubscriberByEmail(normalizedSubscriberEmail);
  if (!subscriber?.id) return;

  const nowIso = new Date().toISOString();

  const { error: subscriberUpdateError } = await client
    .from("newsletter_subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: nowIso,
    })
    .eq("id", subscriber.id);

  if (subscriberUpdateError) throw subscriberUpdateError;

  const { error: enrollmentUpdateError } = await client
    .from("campaign_enrollments")
    .update({
      status: "cancelled",
      exited_at: nowIso,
      exit_reason: "unsubscribe",
    })
    .eq("subscriber_id", subscriber.id)
    .in("status", ["active", "paused"]);

  if (enrollmentUpdateError) throw enrollmentUpdateError;
}

export async function getSubscriberCampaignMembershipsByEmail(
  email: string,
  { activeOnly = false }: { activeOnly?: boolean } = {},
): Promise<SubscriberCampaignMembership[]> {
  const client = requireSupabase();
  const normalizedSubscriberEmail = normalizeEmail(email);
  if (!normalizedSubscriberEmail) return [];

  const subscriber = await fetchSubscriberByEmail(normalizedSubscriberEmail);
  if (!subscriber?.id) return [];

  let query = client
    .from("campaign_enrollments")
    .select(ENROLLMENT_WITH_CAMPAIGN_SELECT)
    .eq("subscriber_id", subscriber.id)
    .order("entered_at", { ascending: false, nullsFirst: false });

  if (activeOnly) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data as CampaignMembershipRow[] | null) ?? []).flatMap((row) => {
    const campaign = Array.isArray(row.campaign) ? row.campaign[0] : row.campaign;
    const enrollmentId = toSafeString(row.id);
    const campaignId = toSafeString(campaign?.id);
    const campaignKey = toSafeString(campaign?.key);
    const campaignName = toSafeString(campaign?.name);
    const campaignKind = campaign?.kind;
    const campaignStatus = campaign?.status;
    const enrollmentStatus = row.status;
    const assignmentMethod = row.assignment_method;
    const enteredAt = toSafeString(row.entered_at);

    if (
      !enrollmentId ||
      !campaignId ||
      !campaignKey ||
      !campaignName ||
      !campaignKind ||
      !campaignStatus ||
      !enrollmentStatus ||
      !assignmentMethod ||
      !enteredAt
    ) {
      return [];
    }

    return [
      {
        enrollmentId,
        enrollmentStatus,
        enteredAt,
        exitedAt: row.exited_at,
        currentStepKey: toSafeString(row.current_step_key),
        currentStepOrder: row.current_step_order,
        assignmentMethod,
        assignmentReason: toSafeString(row.assignment_reason),
        campaignId,
        campaignKey,
        campaignName,
        campaignKind,
        campaignStatus,
        campaignObjectiveKey: toSafeString(campaign.objective_key),
      },
    ];
  });
}

export async function createCampaignSendLog({
  subscriberId,
  campaignId,
  enrollmentId,
  stepKey,
  providerMessageId,
  status = "queued",
  errorMessage,
}: CreateCampaignSendLogInput) {
  const client = requireSupabase();
  const nowIso = new Date().toISOString();
  const payload = {
    subscriber_id: subscriberId,
    campaign_id: campaignId,
    enrollment_id: toNullableString(enrollmentId),
    step_key: toSafeString(stepKey),
    provider_message_id: toNullableString(providerMessageId),
    status,
    queued_at: nowIso,
    sent_at: status === "sent" ? nowIso : null,
    delivered_at: status === "delivered" ? nowIso : null,
    opened_at: status === "opened" ? nowIso : null,
    clicked_at: status === "clicked" ? nowIso : null,
    bounced_at: status === "bounced" ? nowIso : null,
    failed_at: status === "failed" ? nowIso : null,
    error_message: toSafeString(errorMessage),
  };

  const hasEnrollmentStepKey =
    Boolean(toNullableString(enrollmentId)) && Boolean(toSafeString(stepKey));

  const query = hasEnrollmentStepKey
    ? client
        .from("campaign_sends")
        .upsert(payload, { onConflict: "enrollment_id,step_key" })
    : client.from("campaign_sends").insert(payload);

  const { data, error } = await query.select("id").single();

  if (error) throw error;
  return { id: toSafeString((data as { id?: string | null } | null)?.id) };
}

export async function setCampaignEnrollmentNextStep(
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
    .from("campaign_enrollments")
    .update({
      current_step_key: toSafeString(stepKey),
      current_step_order: stepOrder,
    })
    .eq("id", enrollmentId);

  if (error) throw error;
}

export async function completeCampaignEnrollment(
  enrollmentId: string,
  exitReason: string,
) {
  const client = requireSupabase();
  const { error } = await client
    .from("campaign_enrollments")
    .update({
      status: "completed",
      exited_at: new Date().toISOString(),
      exit_reason: toSafeString(exitReason),
      current_step_key: "",
      current_step_order: null,
    })
    .eq("id", enrollmentId);

  if (error) throw error;
}

export async function updateCampaignSendLogStatus(
  sendId: string,
  status: CampaignSendStatus,
  {
    providerMessageId,
    errorMessage,
    occurredAt,
  }: {
    providerMessageId?: string;
    errorMessage?: string;
    occurredAt?: string;
  } = {},
) {
  const client = requireSupabase();
  const timestamp = toSafeString(occurredAt) || new Date().toISOString();
  const payload: Record<string, string | null> = {
    status,
  };

  if (providerMessageId) {
    payload.provider_message_id = providerMessageId;
  }
  if (errorMessage) {
    payload.error_message = errorMessage;
  }

  if (status === "sent") payload.sent_at = timestamp;
  if (status === "delivered") payload.delivered_at = timestamp;
  if (status === "opened") payload.opened_at = timestamp;
  if (status === "clicked") payload.clicked_at = timestamp;
  if (status === "bounced") payload.bounced_at = timestamp;
  if (status === "failed") payload.failed_at = timestamp;

  const { error } = await client
    .from("campaign_sends")
    .update(payload)
    .eq("id", sendId);

  if (error) throw error;
}
