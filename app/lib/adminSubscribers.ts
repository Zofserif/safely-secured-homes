import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getWeeklyNewsletterEligibilityState } from "./weeklyNewsletterEligibility";
import type {
  EmailJourneyEnrollmentStatus,
  NewsletterSubscriberStatus,
} from "./newsletterCampaigns";

type SubscriberRow = {
  id: string | null;
  email: string | null;
  name: string | null;
  status: NewsletterSubscriberStatus | null;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
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

type JourneyRow = {
  key: string | null;
  name: string | null;
};

export type AdminSubscriberJourneySummary = {
  enrollmentId: string;
  journeyKey: string;
  journeyName: string;
  status: EmailJourneyEnrollmentStatus;
  enteredAt: string;
  exitedAt: string | null;
  exitReason: string;
  currentStepKey: string;
  currentStepOrder: number | null;
  assignmentReason: string;
};

export type AdminSubscriberListItem = {
  subscriberId: string;
  email: string;
  name: string;
  status: NewsletterSubscriberStatus;
  subscribedAt: string | null;
  acquisitionSource: string;
  activeJourney: AdminSubscriberJourneySummary | null;
  weeklyNewsletterEligibilityState: ReturnType<
    typeof getWeeklyNewsletterEligibilityState
  >;
  canReceiveWeeklyNewsletter: boolean;
};

export type AdminSubscriberDetail = AdminSubscriberListItem & {
  unsubscribedAt: string | null;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  history: AdminSubscriberJourneySummary[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const SUBSCRIBER_SELECT =
  "id,email,name,status,subscribed_at,unsubscribed_at,acquisition_source,utm_source,utm_medium,utm_campaign";
const ENROLLMENT_SELECT =
  "id,subscriber_id,journey_key,status,entered_at,exited_at,exit_reason,current_step_key,current_step_order,assignment_reason";

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured for admin subscriber management.");
  }

  return supabase;
};

const distinctValues = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const fetchJourneyNameMap = async (journeyKeys: string[]) => {
  const normalizedJourneyKeys = distinctValues(journeyKeys);
  if (normalizedJourneyKeys.length === 0) {
    return new Map<string, string>();
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("email_journeys")
    .select("key,name")
    .in("key", normalizedJourneyKeys);

  if (error) throw error;

  const journeyNames = new Map<string, string>();
  for (const row of (data as JourneyRow[] | null) ?? []) {
    const key = toSafeString(row.key);
    const name = toSafeString(row.name);
    if (key && name) {
      journeyNames.set(key, name);
    }
  }

  return journeyNames;
};

const normalizeJourneySummary = ({
  enrollment,
  journeyNames,
}: {
  enrollment: JourneyEnrollmentRow;
  journeyNames: Map<string, string>;
}): AdminSubscriberJourneySummary | null => {
  const enrollmentId = toSafeString(enrollment.id);
  const journeyKey = toSafeString(enrollment.journey_key);
  const status = enrollment.status;
  const enteredAt = toSafeString(enrollment.entered_at);

  if (!enrollmentId || !journeyKey || !status || !enteredAt) {
    return null;
  }

  return {
    enrollmentId,
    journeyKey,
    journeyName: journeyNames.get(journeyKey) || journeyKey,
    status,
    enteredAt,
    exitedAt: toSafeString(enrollment.exited_at) || null,
    exitReason: toSafeString(enrollment.exit_reason),
    currentStepKey: toSafeString(enrollment.current_step_key),
    currentStepOrder: enrollment.current_step_order ?? null,
    assignmentReason: toSafeString(enrollment.assignment_reason),
  };
};

const normalizeSubscriberListItem = ({
  subscriber,
  activeJourney,
}: {
  subscriber: SubscriberRow;
  activeJourney: AdminSubscriberJourneySummary | null;
}): AdminSubscriberListItem | null => {
  const subscriberId = toSafeString(subscriber.id);
  const email = toSafeString(subscriber.email);
  const status = subscriber.status;

  if (!subscriberId || !email || !status) {
    return null;
  }

  const weeklyNewsletterEligibilityState = getWeeklyNewsletterEligibilityState({
    subscriberStatus: status,
    hasActiveJourney: Boolean(activeJourney),
  });

  return {
    subscriberId,
    email,
    name: toSafeString(subscriber.name) || email,
    status,
    subscribedAt: toSafeString(subscriber.subscribed_at) || null,
    acquisitionSource: toSafeString(subscriber.acquisition_source),
    activeJourney,
    weeklyNewsletterEligibilityState,
    canReceiveWeeklyNewsletter: weeklyNewsletterEligibilityState === "eligible",
  };
};

const fetchActiveJourneyRowsBySubscriberIds = async (subscriberIds: string[]) => {
  const normalizedSubscriberIds = distinctValues(subscriberIds);
  if (normalizedSubscriberIds.length === 0) {
    return new Map<string, JourneyEnrollmentRow>();
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("email_journey_enrollments")
    .select(ENROLLMENT_SELECT)
    .in("subscriber_id", normalizedSubscriberIds)
    .eq("audience", "newsletter")
    .eq("status", "active")
    .order("entered_at", { ascending: false, nullsFirst: false });

  if (error) throw error;

  const activeJourneyBySubscriberId = new Map<string, JourneyEnrollmentRow>();
  for (const enrollment of (data as JourneyEnrollmentRow[] | null) ?? []) {
    const subscriberId = toSafeString(enrollment.subscriber_id);
    if (subscriberId && !activeJourneyBySubscriberId.has(subscriberId)) {
      activeJourneyBySubscriberId.set(subscriberId, enrollment);
    }
  }

  return activeJourneyBySubscriberId;
};

export async function searchAdminSubscribers({
  query = "",
  limit = 40,
}: {
  query?: string;
  limit?: number;
} = {}): Promise<AdminSubscriberListItem[]> {
  const client = requireSupabase();
  const normalizedQuery = toSafeString(query);

  let subscriberQuery = client
    .from("newsletter_subscribers")
    .select(SUBSCRIBER_SELECT)
    .order("subscribed_at", { ascending: false, nullsFirst: false })
    .limit(Math.max(1, Math.floor(limit)));

  if (normalizedQuery) {
    const escapedQuery = normalizedQuery.replace(/[%_,()']/g, "");
    subscriberQuery = subscriberQuery.or(
      `email.ilike.%${escapedQuery}%,name.ilike.%${escapedQuery}%`,
    );
  }

  const { data, error } = await subscriberQuery;
  if (error) throw error;

  const subscribers = (data as SubscriberRow[] | null) ?? [];
  const activeJourneyRowsBySubscriberId = await fetchActiveJourneyRowsBySubscriberIds(
    subscribers.map((subscriber) => toSafeString(subscriber.id)),
  );
  const journeyNames = await fetchJourneyNameMap(
    Array.from(activeJourneyRowsBySubscriberId.values()).map((row) =>
      toSafeString(row.journey_key),
    ),
  );

  return subscribers
    .map((subscriber) => {
      const activeEnrollment = activeJourneyRowsBySubscriberId.get(
        toSafeString(subscriber.id),
      );
      return normalizeSubscriberListItem({
        subscriber,
        activeJourney: activeEnrollment
          ? normalizeJourneySummary({
              enrollment: activeEnrollment,
              journeyNames,
            })
          : null,
      });
    })
    .filter((subscriber): subscriber is AdminSubscriberListItem => Boolean(subscriber));
}

export async function getAdminSubscriberDetail(
  subscriberId: string,
): Promise<AdminSubscriberDetail | undefined> {
  const normalizedSubscriberId = toSafeString(subscriberId);
  if (!normalizedSubscriberId) return undefined;

  const client = requireSupabase();
  const { data: subscriberData, error: subscriberError } = await client
    .from("newsletter_subscribers")
    .select(SUBSCRIBER_SELECT)
    .eq("id", normalizedSubscriberId)
    .maybeSingle();

  if (subscriberError) throw subscriberError;

  const subscriber = (subscriberData as SubscriberRow | null) ?? null;
  if (!subscriber) return undefined;

  const { data: enrollmentData, error: enrollmentError } = await client
    .from("email_journey_enrollments")
    .select(ENROLLMENT_SELECT)
    .eq("subscriber_id", normalizedSubscriberId)
    .eq("audience", "newsletter")
    .order("entered_at", { ascending: false, nullsFirst: false });

  if (enrollmentError) throw enrollmentError;

  const enrollments = (enrollmentData as JourneyEnrollmentRow[] | null) ?? [];
  const journeyNames = await fetchJourneyNameMap(
    enrollments.map((enrollment) => toSafeString(enrollment.journey_key)),
  );

  const history = enrollments
    .map((enrollment) =>
      normalizeJourneySummary({
        enrollment,
        journeyNames,
      }),
    )
    .filter((enrollment): enrollment is AdminSubscriberJourneySummary => Boolean(enrollment));
  const activeJourney = history.find((enrollment) => enrollment.status === "active") ?? null;

  const summary = normalizeSubscriberListItem({
    subscriber,
    activeJourney,
  });
  if (!summary) return undefined;

  return {
    ...summary,
    unsubscribedAt: toSafeString(subscriber.unsubscribed_at) || null,
    utmSource: toSafeString(subscriber.utm_source),
    utmMedium: toSafeString(subscriber.utm_medium),
    utmCampaign: toSafeString(subscriber.utm_campaign),
    history,
  };
}
