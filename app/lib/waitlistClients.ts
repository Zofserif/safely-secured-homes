import "server-only";

import { randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { deriveNameFromEmail, normalizeEmail } from "./contactName";
import { getEmailJourneyDefinition } from "./emailJourneyStore";
import { EMAIL_JOURNEY_KEYS, type EmailJourneyKey } from "./emailJourneys";
import { getJourneyAssignmentReadiness } from "./journeyAssignmentReadiness";

export type WaitlistedClientStatus =
  | "waitlisted"
  | "unsubscribed"
  | "bounced"
  | "complained";

export type WaitlistJourneyEnrollmentStatus =
  | "active"
  | "completed"
  | "cancelled";

export type WaitlistEmailDeliveryKind = "journey" | "broadcast";
export type WaitlistEmailDeliveryStatus = "queued" | "sent" | "failed";

type WaitlistedClientRow = {
  id: string | null;
  email: string | null;
  name: string | null;
  status: WaitlistedClientStatus | null;
  unsubscribe_token: string | null;
  joined_at: string | null;
  unsubscribed_at: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  pending_journey_enrollment: boolean | null;
};

type WaitlistJourneyEnrollmentRow = {
  id: string | null;
  waitlisted_client_id: string | null;
  journey_key: string | null;
  status: WaitlistJourneyEnrollmentStatus | null;
  entered_at: string | null;
  exited_at: string | null;
  exit_reason: string | null;
  current_step_key: string | null;
  current_step_order: number | null;
  assignment_reason: string | null;
};

type WaitlistJourneyEnrollmentDetailRow = WaitlistJourneyEnrollmentRow & {
  waitlisted_client: WaitlistedClientRow | WaitlistedClientRow[] | null;
};

type WaitlistEmailDeliveryRow = {
  id: string | null;
  waitlisted_client_id: string | null;
  enrollment_id: string | null;
  delivery_kind: WaitlistEmailDeliveryKind | null;
  send_key: string | null;
  journey_key: string | null;
  step_key: string | null;
  blog_post_id: string | null;
  provider_message_id: string | null;
  status: WaitlistEmailDeliveryStatus | null;
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

type InsertWaitlistJourneyEnrollmentPayload = {
  audience: "waitlist";
  subscriber_id: null;
  waitlisted_client_id: string;
  journey_key: string;
  status: WaitlistJourneyEnrollmentStatus;
  entered_at: string;
  current_step_key: string;
  current_step_order: number | null;
  assignment_reason: string;
};

type InsertWaitlistEmailDeliveryPayload = {
  audience: "waitlist";
  subscriber_id: null;
  waitlisted_client_id: string;
  enrollment_id: string | null;
  delivery_kind: WaitlistEmailDeliveryKind;
  send_key: string | null;
  journey_key: string | null;
  step_key: string;
  blog_post_id: string | null;
  provider_message_id: string | null;
  status: WaitlistEmailDeliveryStatus;
  queued_at: string;
  processed_at: string | null;
  error_message: string;
};

export type SyncWaitlistedClientInput = {
  email: string;
  name: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export type SyncWaitlistedClientResult = {
  waitlistedClientId: string;
  email: string;
  created: boolean;
  reactivated: boolean;
  journeyReady: boolean;
  enrolled: boolean;
  enrollmentId: string | null;
  unsubscribeToken: string;
};

export type WaitlistedClientRecord = {
  waitlistedClientId: string;
  email: string;
  name: string;
  status: WaitlistedClientStatus;
  unsubscribeToken: string;
  joinedAt: string | null;
  unsubscribedAt: string | null;
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  pendingJourneyEnrollment: boolean;
};

export type ActiveWaitlistJourneyEnrollment = {
  enrollmentId: string;
  journeyKey: EmailJourneyKey;
  journeyName: string;
  journeyObjectiveKey: string;
  waitlistedClientId: string;
  clientEmail: string;
  clientName: string;
  clientStatus: WaitlistedClientStatus;
  enteredAt: string;
  currentStepKey: string;
  currentStepOrder: number | null;
  assignmentReason: string;
};

export type WaitlistEmailDeliveryLog = {
  id: string;
  waitlistedClientId: string;
  enrollmentId: string | null;
  deliveryKind: WaitlistEmailDeliveryKind;
  sendKey: string;
  journeyKey: string;
  stepKey: string;
  blogPostId: string;
  providerMessageId: string;
  status: WaitlistEmailDeliveryStatus;
  queuedAt: string | null;
  processedAt: string | null;
  errorMessage: string;
  createdAt: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const WAITLIST_UNSUBSCRIBE_TOKEN_BYTES = 18;
const WAITLIST_AUDIENCE = "waitlist" as const;
const WAITLIST_JOURNEY_KEY = EMAIL_JOURNEY_KEYS.reportsWaitlistJourney;
const CLIENT_SELECT =
  "id,email,name,status,unsubscribe_token,joined_at,unsubscribed_at,source,utm_source,utm_medium,utm_campaign,pending_journey_enrollment";
const ENROLLMENT_SELECT =
  "id,waitlisted_client_id,journey_key,status,entered_at,exited_at,exit_reason,current_step_key,current_step_order,assignment_reason";
const ENROLLMENT_WITH_CLIENT_SELECT = `${ENROLLMENT_SELECT},waitlisted_client:waitlisted_clients!email_journey_enrollments_waitlisted_client_id_fkey(${CLIENT_SELECT})`;
const DELIVERY_SELECT =
  "id,waitlisted_client_id,enrollment_id,delivery_kind,send_key,journey_key,step_key,blog_post_id,provider_message_id,status,queued_at,processed_at,error_message,created_at";

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toNullableString = (value: unknown): string | null => {
  const safeValue = toSafeString(value);
  return safeValue ? safeValue : null;
};

const normalizeWaitlistedClientName = (name: string | undefined, email: string) => {
  const safeName = toSafeString(name).replace(/\s+/g, " ").trim();
  return safeName || deriveNameFromEmail(email);
};

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase not configured for waitlist flows.");
  }

  return supabase;
};

const generateWaitlistUnsubscribeToken = () =>
  randomBytes(WAITLIST_UNSUBSCRIBE_TOKEN_BYTES).toString("hex");

const normalizeWaitlistedClient = (
  row: WaitlistedClientRow | null | undefined,
): WaitlistedClientRecord | null => {
  const waitlistedClientId = toSafeString(row?.id);
  const email = toSafeString(row?.email);
  const status = row?.status;
  const unsubscribeToken = toSafeString(row?.unsubscribe_token);

  if (!waitlistedClientId || !email || !status || !unsubscribeToken) {
    return null;
  }

  return {
    waitlistedClientId,
    email,
    name: toSafeString(row?.name) || deriveNameFromEmail(email),
    status,
    unsubscribeToken,
    joinedAt: toNullableString(row?.joined_at),
    unsubscribedAt: toNullableString(row?.unsubscribed_at),
    source: toSafeString(row?.source),
    utmSource: toSafeString(row?.utm_source),
    utmMedium: toSafeString(row?.utm_medium),
    utmCampaign: toSafeString(row?.utm_campaign),
    pendingJourneyEnrollment: row?.pending_journey_enrollment === true,
  };
};

const normalizeWaitlistEmailDelivery = (
  row: WaitlistEmailDeliveryRow | null | undefined,
): WaitlistEmailDeliveryLog | null => {
  const id = toSafeString(row?.id);
  const waitlistedClientId = toSafeString(row?.waitlisted_client_id);
  const deliveryKind = row?.delivery_kind;
  const status = row?.status;

  if (!id || !waitlistedClientId || !deliveryKind || !status) {
    return null;
  }

  return {
    id,
    waitlistedClientId,
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

const normalizeActiveWaitlistJourneyEnrollment = (
  row: WaitlistJourneyEnrollmentDetailRow | null | undefined,
): ActiveWaitlistJourneyEnrollment | null => {
  const waitlistedClient = Array.isArray(row?.waitlisted_client)
    ? row?.waitlisted_client[0]
    : row?.waitlisted_client;
  const enrollmentId = toSafeString(row?.id);
  const journeyKey = toSafeString(row?.journey_key) as EmailJourneyKey;
  const waitlistedClientId = toSafeString(waitlistedClient?.id);
  const clientEmail = toSafeString(waitlistedClient?.email);
  const clientName = toSafeString(waitlistedClient?.name);
  const clientStatus = waitlistedClient?.status;
  const enteredAt = toSafeString(row?.entered_at);

  if (
    !enrollmentId ||
    !journeyKey ||
    !waitlistedClientId ||
    !clientEmail ||
    !clientName ||
    !clientStatus ||
    !enteredAt
  ) {
    return null;
  }

  return {
    enrollmentId,
    journeyKey,
    journeyName: journeyKey,
    journeyObjectiveKey: "",
    waitlistedClientId,
    clientEmail,
    clientName,
    clientStatus,
    enteredAt,
    currentStepKey: toSafeString(row?.current_step_key),
    currentStepOrder: row?.current_step_order ?? null,
    assignmentReason: toSafeString(row?.assignment_reason),
  };
};

const fetchWaitlistedClientByEmail = async (email: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("waitlisted_clients")
    .select(CLIENT_SELECT)
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return (data as WaitlistedClientRow | null) ?? null;
};

const fetchWaitlistedClientById = async (waitlistedClientId: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("waitlisted_clients")
    .select(CLIENT_SELECT)
    .eq("id", waitlistedClientId)
    .maybeSingle();

  if (error) throw error;
  return (data as WaitlistedClientRow | null) ?? null;
};

const fetchWaitlistedClientByUnsubscribeToken = async (unsubscribeToken: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("waitlisted_clients")
    .select(CLIENT_SELECT)
    .eq("unsubscribe_token", unsubscribeToken)
    .maybeSingle();

  if (error) throw error;
  return (data as WaitlistedClientRow | null) ?? null;
};

const updateWaitlistedClient = async (
  waitlistedClientId: string,
  payload: Record<string, string | boolean | null>,
) => {
  const client = requireSupabase();
  if (Object.keys(payload).length === 0) return;

  const { error } = await client
    .from("waitlisted_clients")
    .update(payload)
    .eq("id", waitlistedClientId);

  if (error) throw error;
};

const insertWaitlistedClient = async (
  payload: Record<string, string | boolean | null>,
) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("waitlisted_clients")
    .insert(payload)
    .select(CLIENT_SELECT)
    .single();

  if (error) throw error;
  return data as WaitlistedClientRow;
};

const fetchWaitlistJourneyEnrollmentRows = async ({
  waitlistedClientId,
  journeyKey,
  status = "active",
}: {
  waitlistedClientId: string;
  journeyKey?: EmailJourneyKey;
  status?: WaitlistJourneyEnrollmentStatus;
}) => {
  const client = requireSupabase();
  let query = client
    .from("email_journey_enrollments")
    .select(ENROLLMENT_SELECT)
    .eq("audience", WAITLIST_AUDIENCE)
    .eq("waitlisted_client_id", waitlistedClientId)
    .eq("status", status)
    .order("entered_at", { ascending: false, nullsFirst: false });

  if (toSafeString(journeyKey)) {
    query = query.eq("journey_key", toSafeString(journeyKey));
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as WaitlistJourneyEnrollmentRow[] | null) ?? [];
};

const fetchActiveWaitlistJourneyEnrollment = async (
  waitlistedClientId: string,
  journeyKey: EmailJourneyKey,
) => {
  const rows = await fetchWaitlistJourneyEnrollmentRows({
    waitlistedClientId,
    journeyKey,
    status: "active",
  });
  return rows[0] ?? null;
};

const fetchAnyActiveWaitlistJourneyEnrollment = async (waitlistedClientId: string) => {
  const rows = await fetchWaitlistJourneyEnrollmentRows({
    waitlistedClientId,
    status: "active",
  });
  return rows[0] ?? null;
};

const updateWaitlistJourneyEnrollment = async (
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

const insertWaitlistJourneyEnrollment = async (
  payload: InsertWaitlistJourneyEnrollmentPayload,
) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_journey_enrollments")
    .insert(payload)
    .select(ENROLLMENT_SELECT)
    .single();

  if (error) throw error;
  return data as WaitlistJourneyEnrollmentRow;
};

const cancelWaitlistJourneyEnrollmentRecord = async (
  enrollmentId: string,
  exitReason: string,
) => {
  await updateWaitlistJourneyEnrollment(enrollmentId, {
    status: "cancelled",
    exited_at: new Date().toISOString(),
    exit_reason: toSafeString(exitReason),
    current_step_key: "",
    current_step_order: null,
  });
};

const fetchWaitlistJourneyEnrollmentById = async (enrollmentId: string) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_journey_enrollments")
    .select(ENROLLMENT_WITH_CLIENT_SELECT)
    .eq("audience", WAITLIST_AUDIENCE)
    .eq("id", enrollmentId)
    .maybeSingle();

  if (error) throw error;
  return (data as WaitlistJourneyEnrollmentDetailRow | null) ?? null;
};

const fetchWaitlistEmailDeliveryByEnrollmentStep = async (
  enrollmentId: string,
  stepKey: string,
) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_deliveries")
    .select(DELIVERY_SELECT)
    .eq("audience", WAITLIST_AUDIENCE)
    .eq("enrollment_id", enrollmentId)
    .eq("step_key", stepKey)
    .maybeSingle();

  if (error) throw error;
  return normalizeWaitlistEmailDelivery((data as WaitlistEmailDeliveryRow | null) ?? null);
};

const fetchWaitlistEmailDeliveryBySendKey = async (
  sendKey: string,
  waitlistedClientId: string,
) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_deliveries")
    .select(DELIVERY_SELECT)
    .eq("audience", WAITLIST_AUDIENCE)
    .eq("send_key", sendKey)
    .eq("waitlisted_client_id", waitlistedClientId)
    .maybeSingle();

  if (error) throw error;
  return normalizeWaitlistEmailDelivery((data as WaitlistEmailDeliveryRow | null) ?? null);
};

const insertWaitlistEmailDelivery = async (
  payload: InsertWaitlistEmailDeliveryPayload,
) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_deliveries")
    .insert(payload)
    .select(DELIVERY_SELECT)
    .single();

  if (error) throw error;
  return normalizeWaitlistEmailDelivery(data as WaitlistEmailDeliveryRow);
};

const resolveWaitlistJourneySteps = async (
  journeyKey: EmailJourneyKey,
) => {
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

const resolveInitialWaitlistJourneyStep = async ({
  journeyKey,
}: {
  journeyKey: EmailJourneyKey;
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

  const steps = await resolveWaitlistJourneySteps(journeyKey);
  if (steps.length === 0) {
    throw new Error(
      `Journey "${journeyKey}" must have at least one active step before it can be assigned.`,
    );
  }

  return {
    stepKey: steps[0].stepKey,
    stepOrder: steps[0].stepOrder,
  };
};

export const isWaitlistConfigured = () => Boolean(supabase);

export async function getWaitlistedClientById(
  waitlistedClientId: string,
): Promise<WaitlistedClientRecord | null> {
  return normalizeWaitlistedClient(
    await fetchWaitlistedClientById(toSafeString(waitlistedClientId)),
  );
}

export async function getWaitlistedClientByEmail(
  email: string,
): Promise<WaitlistedClientRecord | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  return normalizeWaitlistedClient(await fetchWaitlistedClientByEmail(normalizedEmail));
}

export async function getWaitlistedClientByUnsubscribeToken(
  unsubscribeToken: string,
): Promise<WaitlistedClientRecord | null> {
  return normalizeWaitlistedClient(
    await fetchWaitlistedClientByUnsubscribeToken(
      toSafeString(unsubscribeToken).toLowerCase(),
    ),
  );
}

export async function setWaitlistedClientPendingJourneyEnrollment(
  waitlistedClientId: string,
  pending: boolean,
) {
  await updateWaitlistedClient(toSafeString(waitlistedClientId), {
    pending_journey_enrollment: pending,
  });
}

export async function listPendingWaitlistedClientsForJourneyEnrollment(
  { limit = 200 }: { limit?: number } = {},
): Promise<WaitlistedClientRecord[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("waitlisted_clients")
    .select(CLIENT_SELECT)
    .eq("status", "waitlisted")
    .eq("pending_journey_enrollment", true)
    .order("joined_at", { ascending: true, nullsFirst: false })
    .limit(Math.max(1, Math.floor(limit)));

  if (error) throw error;

  return ((data as WaitlistedClientRow[] | null) ?? [])
    .map((row) => normalizeWaitlistedClient(row))
    .filter((row): row is WaitlistedClientRecord => Boolean(row));
}

export async function getWaitlistJourneySteps(journeyKey: EmailJourneyKey) {
  return resolveWaitlistJourneySteps(journeyKey);
}

export async function getWaitlistJourneyEnrollmentById(
  enrollmentId: string,
): Promise<ActiveWaitlistJourneyEnrollment | null> {
  return normalizeActiveWaitlistJourneyEnrollment(
    await fetchWaitlistJourneyEnrollmentById(toSafeString(enrollmentId)),
  );
}

export async function getActiveWaitlistJourneyEnrollmentForClient(
  waitlistedClientId: string,
  journeyKey: EmailJourneyKey,
): Promise<ActiveWaitlistJourneyEnrollment | null> {
  const row = await fetchActiveWaitlistJourneyEnrollment(
    toSafeString(waitlistedClientId),
    journeyKey,
  );
  const enrollmentId = toSafeString(row?.id);
  if (!enrollmentId) return null;

  return getWaitlistJourneyEnrollmentById(enrollmentId);
}

export async function getAnyActiveWaitlistJourneyEnrollmentForClient(
  waitlistedClientId: string,
): Promise<ActiveWaitlistJourneyEnrollment | null> {
  const row = await fetchAnyActiveWaitlistJourneyEnrollment(
    toSafeString(waitlistedClientId),
  );
  const enrollmentId = toSafeString(row?.id);
  if (!enrollmentId) return null;

  return getWaitlistJourneyEnrollmentById(enrollmentId);
}

export async function listActiveWaitlistJourneyEnrollments(
  {
    journeyKey,
  }: {
    journeyKey?: EmailJourneyKey;
  } = {},
): Promise<ActiveWaitlistJourneyEnrollment[]> {
  const client = requireSupabase();
  let query = client
    .from("email_journey_enrollments")
    .select(ENROLLMENT_WITH_CLIENT_SELECT)
    .eq("audience", WAITLIST_AUDIENCE)
    .eq("status", "active")
    .order("entered_at", { ascending: true, nullsFirst: false });

  if (toSafeString(journeyKey)) {
    query = query.eq("journey_key", toSafeString(journeyKey));
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data as WaitlistJourneyEnrollmentDetailRow[] | null) ?? [])
    .map((row) => normalizeActiveWaitlistJourneyEnrollment(row))
    .filter((row): row is ActiveWaitlistJourneyEnrollment => Boolean(row));
}

export async function getWaitlistEmailDeliveriesByEnrollmentId(
  enrollmentId: string,
): Promise<WaitlistEmailDeliveryLog[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_deliveries")
    .select(DELIVERY_SELECT)
    .eq("audience", WAITLIST_AUDIENCE)
    .eq("enrollment_id", toSafeString(enrollmentId))
    .order("queued_at", { ascending: true, nullsFirst: false });

  if (error) throw error;

  return ((data as WaitlistEmailDeliveryRow[] | null) ?? [])
    .map((row) => normalizeWaitlistEmailDelivery(row))
    .filter((row): row is WaitlistEmailDeliveryLog => Boolean(row));
}

export async function assignWaitlistJourneyEnrollment({
  waitlistedClientId,
  journeyKey,
  assignmentReason = "",
}: {
  waitlistedClientId: string;
  journeyKey: EmailJourneyKey;
  assignmentReason?: string;
}) {
  const normalizedWaitlistedClientId = toSafeString(waitlistedClientId);
  const normalizedJourneyKey = toSafeString(journeyKey);
  if (!normalizedWaitlistedClientId) {
    throw new Error("Waitlisted client id is required.");
  }
  if (!normalizedJourneyKey) {
    throw new Error("Journey key is required.");
  }

  const initialStep = await resolveInitialWaitlistJourneyStep({
    journeyKey: normalizedJourneyKey,
  });

  const activeEnrollments = await fetchWaitlistJourneyEnrollmentRows({
    waitlistedClientId: normalizedWaitlistedClientId,
    status: "active",
  });
  const sameJourneyEnrollment =
    activeEnrollments.find(
      (enrollment) => toSafeString(enrollment.journey_key) === normalizedJourneyKey,
    ) ?? null;

  let replacedEnrollmentId: string | null = null;

  for (const enrollment of activeEnrollments) {
    const enrollmentId = toSafeString(enrollment.id);
    if (!enrollmentId) continue;
    if (sameJourneyEnrollment?.id && enrollmentId === sameJourneyEnrollment.id) {
      continue;
    }

    replacedEnrollmentId = replacedEnrollmentId || enrollmentId;
    await cancelWaitlistJourneyEnrollmentRecord(
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

    await updateWaitlistJourneyEnrollment(
      toSafeString(sameJourneyEnrollment.id),
      updatePayload,
    );

    return {
      enrollmentId: toSafeString(sameJourneyEnrollment.id),
      journeyKey: normalizedJourneyKey,
      created: false,
      replacedEnrollmentId,
    };
  }

  try {
    const insertedEnrollment = await insertWaitlistJourneyEnrollment({
      audience: WAITLIST_AUDIENCE,
      subscriber_id: null,
      waitlisted_client_id: normalizedWaitlistedClientId,
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
        `Waitlist journey enrollment for "${normalizedJourneyKey}" was created without an id.`,
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

    const existingEnrollment = await fetchActiveWaitlistJourneyEnrollment(
      normalizedWaitlistedClientId,
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

export async function syncWaitlistedClient({
  email,
  name,
  source,
  utmSource,
  utmMedium,
  utmCampaign,
}: SyncWaitlistedClientInput): Promise<SyncWaitlistedClientResult> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Waitlist email is required.");
  }

  const resolvedName = normalizeWaitlistedClientName(name, normalizedEmail);
  const safeSource = toSafeString(source) || "waitlist";
  const safeUtmSource = toNullableString(utmSource);
  const safeUtmMedium = toNullableString(utmMedium);
  const safeUtmCampaign = toNullableString(utmCampaign);
  const nowIso = new Date().toISOString();

  let existingClient = await fetchWaitlistedClientByEmail(normalizedEmail);
  let created = false;
  let reactivated = false;

  if (existingClient?.id) {
    reactivated = toSafeString(existingClient.status).toLowerCase() !== "waitlisted";

    const updatePayload: Record<string, string | boolean | null> = {};

    if (resolvedName && resolvedName !== toSafeString(existingClient.name)) {
      updatePayload.name = resolvedName;
    }
    if (!toSafeString(existingClient.source) && safeSource) {
      updatePayload.source = safeSource;
    }
    if (!toSafeString(existingClient.utm_source) && safeUtmSource) {
      updatePayload.utm_source = safeUtmSource;
    }
    if (!toSafeString(existingClient.utm_medium) && safeUtmMedium) {
      updatePayload.utm_medium = safeUtmMedium;
    }
    if (!toSafeString(existingClient.utm_campaign) && safeUtmCampaign) {
      updatePayload.utm_campaign = safeUtmCampaign;
    }
    if (!existingClient.joined_at) {
      updatePayload.joined_at = nowIso;
    }
    if (!toSafeString(existingClient.unsubscribe_token)) {
      updatePayload.unsubscribe_token = generateWaitlistUnsubscribeToken();
    }
    if (reactivated) {
      updatePayload.status = "waitlisted";
      updatePayload.unsubscribed_at = null;
    }

    await updateWaitlistedClient(existingClient.id, updatePayload);
    existingClient = {
      ...existingClient,
      ...updatePayload,
      status: "waitlisted",
      unsubscribed_at: null,
      joined_at: existingClient.joined_at || nowIso,
      unsubscribe_token:
        toSafeString(updatePayload.unsubscribe_token) ||
        existingClient.unsubscribe_token,
    };
  } else {
    try {
      existingClient = await insertWaitlistedClient({
        email: normalizedEmail,
        name: resolvedName,
        status: "waitlisted",
        unsubscribe_token: generateWaitlistUnsubscribeToken(),
        joined_at: nowIso,
        unsubscribed_at: null,
        source: safeSource,
        utm_source: safeUtmSource,
        utm_medium: safeUtmMedium,
        utm_campaign: safeUtmCampaign,
        pending_journey_enrollment: true,
      });
      created = true;
    } catch (error) {
      const insertError = error as SupabaseError;
      if (insertError.code !== "23505") throw error;

      existingClient = await fetchWaitlistedClientByEmail(normalizedEmail);
      if (!existingClient?.id) throw error;

      reactivated = toSafeString(existingClient.status).toLowerCase() !== "waitlisted";

      const updatePayload: Record<string, string | boolean | null> = {};

      if (resolvedName && resolvedName !== toSafeString(existingClient.name)) {
        updatePayload.name = resolvedName;
      }
      if (!toSafeString(existingClient.source) && safeSource) {
        updatePayload.source = safeSource;
      }
      if (!toSafeString(existingClient.utm_source) && safeUtmSource) {
        updatePayload.utm_source = safeUtmSource;
      }
      if (!toSafeString(existingClient.utm_medium) && safeUtmMedium) {
        updatePayload.utm_medium = safeUtmMedium;
      }
      if (!toSafeString(existingClient.utm_campaign) && safeUtmCampaign) {
        updatePayload.utm_campaign = safeUtmCampaign;
      }
      if (!existingClient.joined_at) {
        updatePayload.joined_at = nowIso;
      }
      if (!toSafeString(existingClient.unsubscribe_token)) {
        updatePayload.unsubscribe_token = generateWaitlistUnsubscribeToken();
      }
      if (reactivated) {
        updatePayload.status = "waitlisted";
        updatePayload.unsubscribed_at = null;
      }

      await updateWaitlistedClient(existingClient.id, updatePayload);
      existingClient = {
        ...existingClient,
        ...updatePayload,
        status: "waitlisted",
        unsubscribed_at: null,
        joined_at: existingClient.joined_at || nowIso,
        unsubscribe_token:
          toSafeString(updatePayload.unsubscribe_token) ||
          existingClient.unsubscribe_token,
      };
    }
  }

  const waitlistedClientId = toSafeString(existingClient?.id);
  const unsubscribeToken = toSafeString(existingClient?.unsubscribe_token);
  if (!waitlistedClientId) {
    throw new Error(
      `Waitlisted client "${normalizedEmail}" could not be resolved after sync.`,
    );
  }
  if (!unsubscribeToken) {
    throw new Error(
      `Waitlisted client "${normalizedEmail}" is missing an unsubscribe token.`,
    );
  }

  const readiness = await getJourneyAssignmentReadiness(WAITLIST_JOURNEY_KEY);
  const existingEnrollment = await getAnyActiveWaitlistJourneyEnrollmentForClient(
    waitlistedClientId,
  );

  let enrollmentId: string | null = existingEnrollment?.enrollmentId ?? null;
  let enrolled = Boolean(existingEnrollment);

  if (readiness.isAssignable) {
    const enrollmentResult = await assignWaitlistJourneyEnrollment({
      waitlistedClientId,
      journeyKey: WAITLIST_JOURNEY_KEY,
      assignmentReason: `waitlist_capture:${safeSource || "direct"}`,
    });
    enrollmentId = enrollmentResult.enrollmentId;
    enrolled = true;
    await setWaitlistedClientPendingJourneyEnrollment(waitlistedClientId, false);
  } else if (existingEnrollment) {
    await setWaitlistedClientPendingJourneyEnrollment(waitlistedClientId, false);
  } else {
    await setWaitlistedClientPendingJourneyEnrollment(waitlistedClientId, true);
  }

  return {
    waitlistedClientId,
    email: normalizedEmail,
    created,
    reactivated,
    journeyReady: readiness.isAssignable,
    enrolled,
    enrollmentId,
    unsubscribeToken,
  };
}

export async function unsubscribeWaitlistedClientByToken(
  unsubscribeToken: string,
): Promise<boolean> {
  const waitlistedClient = await getWaitlistedClientByUnsubscribeToken(unsubscribeToken);
  if (!waitlistedClient) return false;

  if (waitlistedClient.status === "waitlisted") {
    const client = requireSupabase();
    const nowIso = new Date().toISOString();

    const { error: waitlistedClientUpdateError } = await client
      .from("waitlisted_clients")
      .update({
        status: "unsubscribed",
        unsubscribed_at: nowIso,
        pending_journey_enrollment: false,
      })
      .eq("id", waitlistedClient.waitlistedClientId);

    if (waitlistedClientUpdateError) throw waitlistedClientUpdateError;

    const { error: enrollmentUpdateError } = await client
      .from("email_journey_enrollments")
      .update({
        status: "cancelled",
        exited_at: nowIso,
        exit_reason: "unsubscribe",
        current_step_key: "",
        current_step_order: null,
      })
      .eq("audience", WAITLIST_AUDIENCE)
      .eq("waitlisted_client_id", waitlistedClient.waitlistedClientId)
      .eq("status", "active");

    if (enrollmentUpdateError) throw enrollmentUpdateError;
  }

  return true;
}

export async function ensureWaitlistEmailDelivery({
  waitlistedClientId,
  deliveryKind,
  enrollmentId,
  sendKey,
  journeyKey,
  stepKey,
  blogPostId,
  providerMessageId,
  status = "queued",
  errorMessage,
}: {
  waitlistedClientId: string;
  deliveryKind: WaitlistEmailDeliveryKind;
  enrollmentId?: string;
  sendKey?: string;
  journeyKey?: string;
  stepKey?: string;
  blogPostId?: string;
  providerMessageId?: string;
  status?: WaitlistEmailDeliveryStatus;
  errorMessage?: string;
}): Promise<WaitlistEmailDeliveryLog> {
  const safeEnrollmentId = toNullableString(enrollmentId);
  const safeSendKey = toNullableString(sendKey);
  const safeStepKey = toSafeString(stepKey);

  if (safeEnrollmentId && safeStepKey) {
    const existing = await fetchWaitlistEmailDeliveryByEnrollmentStep(
      safeEnrollmentId,
      safeStepKey,
    );
    if (existing) return existing;
  } else if (safeSendKey) {
    const existing = await fetchWaitlistEmailDeliveryBySendKey(
      safeSendKey,
      waitlistedClientId,
    );
    if (existing) return existing;
  }

  try {
    const insertedDelivery = await insertWaitlistEmailDelivery({
      audience: WAITLIST_AUDIENCE,
      subscriber_id: null,
      waitlisted_client_id: waitlistedClientId,
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
      throw new Error("Waitlist email delivery log insert returned no record.");
    }

    return insertedDelivery;
  } catch (error) {
    const insertError = error as SupabaseError;
    if (insertError.code !== "23505") throw error;

    if (safeEnrollmentId && safeStepKey) {
      const existing = await fetchWaitlistEmailDeliveryByEnrollmentStep(
        safeEnrollmentId,
        safeStepKey,
      );
      if (existing) return existing;
    }
    if (safeSendKey) {
      const existing = await fetchWaitlistEmailDeliveryBySendKey(
        safeSendKey,
        waitlistedClientId,
      );
      if (existing) return existing;
    }

    throw error;
  }
}

export async function setWaitlistJourneyEnrollmentNextStep(
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

const finalizeWaitlistJourneyEnrollment = async (
  enrollmentId: string,
  status: "completed" | "cancelled",
  exitReason: string,
) => {
  await updateWaitlistJourneyEnrollment(enrollmentId, {
    status,
    exited_at: new Date().toISOString(),
    exit_reason: toSafeString(exitReason),
    current_step_key: "",
    current_step_order: null,
  });
};

export async function completeWaitlistJourneyEnrollment(
  enrollmentId: string,
  exitReason: string,
) {
  await finalizeWaitlistJourneyEnrollment(enrollmentId, "completed", exitReason);
}

export async function cancelWaitlistJourneyEnrollment(
  enrollmentId: string,
  exitReason: string,
) {
  await finalizeWaitlistJourneyEnrollment(enrollmentId, "cancelled", exitReason);
}

export async function updateWaitlistEmailDeliveryStatus(
  deliveryId: string,
  status: WaitlistEmailDeliveryStatus,
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
