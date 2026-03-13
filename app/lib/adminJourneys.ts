import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  getEmailJourneyDefinition,
  listEmailJourneyDefinitions,
} from "./emailJourneyStore";
import type { EmailJourneyKey, EmailJourneyStatus } from "./emailJourneys";

type JourneyStepRow = {
  journey_key: string | null;
  step_key: string | null;
  step_order: number | null;
  delay_days: number | null;
  blog_post_id: string | null;
  cta_override_html: string | null;
  is_active: boolean | null;
};

type BlogPostOptionRow = {
  id: string | null;
  slug: string | null;
  title: string | null;
  status?: string | null;
};

type SupabaseError = {
  code?: string;
  details?: string;
  message?: string;
};

export type AdminPublishedBlogPostOption = {
  id: string;
  slug: string;
  title: string;
};

export type AdminJourneyStep = {
  stepKey: string;
  stepOrder: number;
  delayDays: number;
  blogPostId: string;
  blogPostSlug: string;
  blogPostTitle: string;
  ctaOverrideHtml: string;
  isActive: boolean;
};

export type AdminJourneySummary = {
  key: string;
  name: string;
  objectiveKey: string;
  badgeKey: string;
  badgeName: string;
  status: EmailJourneyStatus;
  stepCount: number;
  activeStepCount: number;
};

export type AdminJourney = AdminJourneySummary & {
  steps: AdminJourneyStep[];
};

export type SaveAdminJourneyInput = {
  existingKey?: string;
  key: string;
  name: string;
  objectiveKey: string;
  badgeKey: string;
  badgeName: string;
  status: EmailJourneyStatus;
};

export type SaveAdminJourneyStepInput = {
  journeyKey: string;
  existingStepKey?: string;
  stepKey: string;
  stepOrder: number;
  delayDays: number;
  blogPostId: string;
  ctaOverrideHtml: string;
  isActive: boolean;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const JOURNEY_SELECT = "key,name,objective_key,badge_key,badge_name,status";
const JOURNEY_STEP_SELECT =
  "journey_key,step_key,step_order,delay_days,blog_post_id,cta_override_html,is_active";

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toJourneyStatus = (value: unknown): EmailJourneyStatus => {
  switch (value) {
    case "active":
    case "paused":
    case "archived":
      return value;
    default:
      return "draft";
  }
};

const distinctValues = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured for admin journeys.");
  }

  return supabase;
};

const normalizeJourneyKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");

const normalizeJourneyStepKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");

const normalizePublishedBlogPostOption = (
  row: BlogPostOptionRow | null | undefined,
): AdminPublishedBlogPostOption | null => {
  const id = toSafeString(row?.id);
  const slug = toSafeString(row?.slug);
  const title = toSafeString(row?.title);
  if (!id || !slug || !title) return null;

  return {
    id,
    slug,
    title,
  };
};

const fetchBlogPostsByIds = async (blogPostIds: string[]) => {
  const normalizedBlogPostIds = distinctValues(blogPostIds);
  if (normalizedBlogPostIds.length === 0) {
    return new Map<string, AdminPublishedBlogPostOption>();
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("blog_posts")
    .select("id,slug,title,status")
    .in("id", normalizedBlogPostIds);

  if (error) throw error;

  const blogPostsById = new Map<string, AdminPublishedBlogPostOption>();
  for (const row of (data as BlogPostOptionRow[] | null) ?? []) {
    const normalized = normalizePublishedBlogPostOption(row);
    if (normalized) {
      blogPostsById.set(normalized.id, normalized);
    }
  }

  return blogPostsById;
};

const toSummary = (
  journey: Awaited<ReturnType<typeof getEmailJourneyDefinition>>,
): AdminJourneySummary | null => {
  if (!journey) return null;

  return {
    key: journey.key,
    name: journey.name,
    objectiveKey: journey.objectiveKey,
    badgeKey: journey.badge.key,
    badgeName: journey.badge.name,
    status: journey.status,
    stepCount: journey.steps.length,
    activeStepCount: journey.steps.filter((step) => step.isActive).length,
  };
};

const sortJourneySummaries = (a: AdminJourneySummary, b: AdminJourneySummary) =>
  a.name.localeCompare(b.name) || a.key.localeCompare(b.key);

export async function getAdminJourneySummaries(): Promise<AdminJourneySummary[]> {
  const journeys = await listEmailJourneyDefinitions({
    includeInactiveSteps: true,
  });

  return journeys
    .map((journey) => toSummary(journey))
    .filter((journey): journey is AdminJourneySummary => Boolean(journey))
    .sort(sortJourneySummaries);
}

export async function getAdminJourneyByKey(
  journeyKey: EmailJourneyKey,
): Promise<AdminJourney | undefined> {
  const normalizedJourneyKey = normalizeJourneyKey(journeyKey);
  if (!normalizedJourneyKey) return undefined;

  const journey = await getEmailJourneyDefinition(normalizedJourneyKey, {
    includeInactiveSteps: true,
  });
  const summary = toSummary(journey);
  if (!journey || !summary) return undefined;

  const blogPostsById = await fetchBlogPostsByIds(
    journey.steps.map((step) => step.blogPostId),
  );

  return {
    ...summary,
    steps: journey.steps.map((step) => ({
      stepKey: step.stepKey,
      stepOrder: step.stepOrder,
      delayDays: step.delayDays,
      blogPostId: step.blogPostId,
      blogPostSlug: step.blogPostSlug,
      blogPostTitle:
        blogPostsById.get(step.blogPostId)?.title || step.blogPostSlug,
      ctaOverrideHtml: step.ctaOverrideHtml,
      isActive: step.isActive,
    })),
  };
}

export async function listPublishedBlogPostOptions(): Promise<
  AdminPublishedBlogPostOption[]
> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("blog_posts")
    .select("id,slug,title,status")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) throw error;

  return ((data as BlogPostOptionRow[] | null) ?? [])
    .map((row) => normalizePublishedBlogPostOption(row))
    .filter((row): row is AdminPublishedBlogPostOption => Boolean(row));
}

export async function listAssignableJourneySummaries(): Promise<
  AdminJourneySummary[]
> {
  const journeys = await getAdminJourneySummaries();
  return journeys.filter(
    (journey) => journey.status === "active" && journey.activeStepCount > 0,
  );
}

const assertJourneyInput = ({
  key,
  name,
}: {
  key: string;
  name: string;
}) => {
  if (!key) {
    throw new Error("Journey key is required.");
  }
  if (!name) {
    throw new Error("Journey name is required.");
  }
};

export async function saveAdminJourney(input: SaveAdminJourneyInput): Promise<{
  journey: AdminJourney;
  affectedBlogSlugs: string[];
}> {
  const client = requireSupabase();
  const existingKey = normalizeJourneyKey(input.existingKey || "");
  const key = normalizeJourneyKey(input.key);
  const name = toSafeString(input.name);
  assertJourneyInput({ key, name });

  if (existingKey && key !== existingKey) {
    throw new Error("Journey key cannot be changed after creation.");
  }

  const currentJourney = existingKey
    ? await getAdminJourneyByKey(existingKey)
    : undefined;
  const payload = {
    key,
    name,
    objective_key: toSafeString(input.objectiveKey),
    badge_key: toSafeString(input.badgeKey) || key,
    badge_name: toSafeString(input.badgeName) || name,
    status: toJourneyStatus(input.status),
  };

  const query = existingKey
    ? client.from("email_journeys").update(payload).eq("key", existingKey)
    : client.from("email_journeys").insert(payload);

  const { error } = await query.select(JOURNEY_SELECT).single();
  if (error) {
    const saveError = error as SupabaseError;
    if (saveError.code === "23505") {
      throw new Error("That journey key is already in use.");
    }
    throw error;
  }

  const savedJourney = await getAdminJourneyByKey(key);
  if (!savedJourney) {
    throw new Error("Saved journey could not be reloaded.");
  }

  return {
    journey: savedJourney,
    affectedBlogSlugs: distinctValues([
      ...(currentJourney?.steps.map((step) => step.blogPostSlug) ?? []),
      ...savedJourney.steps.map((step) => step.blogPostSlug),
    ]),
  };
}

const fetchPublishedBlogPostOptionById = async (
  blogPostId: string,
): Promise<AdminPublishedBlogPostOption | null> => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("blog_posts")
    .select("id,slug,title,status")
    .eq("id", blogPostId)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return normalizePublishedBlogPostOption((data as BlogPostOptionRow | null) ?? null);
};

const assertJourneyStepInput = ({
  journeyKey,
  stepKey,
  stepOrder,
  delayDays,
  blogPostId,
}: {
  journeyKey: string;
  stepKey: string;
  stepOrder: number;
  delayDays: number;
  blogPostId: string;
}) => {
  if (!journeyKey) {
    throw new Error("Journey key is required.");
  }
  if (!stepKey) {
    throw new Error("Step key is required.");
  }
  if (!Number.isFinite(stepOrder) || stepOrder < 1) {
    throw new Error("Step order must be 1 or greater.");
  }
  if (!Number.isFinite(delayDays) || delayDays < 0) {
    throw new Error("Delay days must be 0 or greater.");
  }
  if (!blogPostId) {
    throw new Error("Select a published blog post for this step.");
  }
};

const fetchJourneyStepRow = async ({
  journeyKey,
  stepKey,
}: {
  journeyKey: string;
  stepKey: string;
}) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from("email_journey_steps")
    .select(JOURNEY_STEP_SELECT)
    .eq("journey_key", journeyKey)
    .eq("step_key", stepKey)
    .maybeSingle();

  if (error) throw error;
  return (data as JourneyStepRow | null) ?? null;
};

export async function saveAdminJourneyStep(
  input: SaveAdminJourneyStepInput,
): Promise<{
  journey: AdminJourney;
  affectedBlogSlugs: string[];
}> {
  const client = requireSupabase();
  const journeyKey = normalizeJourneyKey(input.journeyKey);
  const existingStepKey = normalizeJourneyStepKey(input.existingStepKey || "");
  const stepKey = normalizeJourneyStepKey(input.stepKey);
  const stepOrder = Math.max(1, Math.floor(input.stepOrder));
  const delayDays = Math.max(0, Math.floor(input.delayDays));
  const blogPostId = toSafeString(input.blogPostId);

  assertJourneyStepInput({
    journeyKey,
    stepKey,
    stepOrder,
    delayDays,
    blogPostId,
  });

  const journey = await getAdminJourneyByKey(journeyKey);
  if (!journey) {
    throw new Error("Journey not found.");
  }

  const publishedBlogPost = await fetchPublishedBlogPostOptionById(blogPostId);
  if (!publishedBlogPost) {
    throw new Error("Step blog post must be a published post.");
  }

  const currentStep =
    existingStepKey
      ? await fetchJourneyStepRow({
          journeyKey,
          stepKey: existingStepKey,
        })
      : null;
  const currentBlogPost = currentStep?.blog_post_id
    ? await fetchPublishedBlogPostOptionById(toSafeString(currentStep.blog_post_id))
    : null;

  const payload = {
    journey_key: journeyKey,
    step_key: stepKey,
    step_order: stepOrder,
    delay_days: delayDays,
    blog_post_id: blogPostId,
    cta_override_html: toSafeString(input.ctaOverrideHtml),
    is_active: input.isActive,
  };

  const query =
    currentStep && existingStepKey
      ? client
          .from("email_journey_steps")
          .update(payload)
          .eq("journey_key", journeyKey)
          .eq("step_key", existingStepKey)
      : client.from("email_journey_steps").insert(payload);

  const { error } = await query.select(JOURNEY_STEP_SELECT).single();
  if (error) {
    const saveError = error as SupabaseError;
    if (saveError.code === "23505") {
      throw new Error("That step key or step order is already in use for this journey.");
    }
    throw error;
  }

  const savedJourney = await getAdminJourneyByKey(journeyKey);
  if (!savedJourney) {
    throw new Error("Journey step could not be reloaded.");
  }

  return {
    journey: savedJourney,
    affectedBlogSlugs: distinctValues([
      currentBlogPost?.slug ?? "",
      publishedBlogPost.slug,
    ]),
  };
}

export async function deleteAdminJourneyStep({
  journeyKey,
  stepKey,
}: {
  journeyKey: string;
  stepKey: string;
}): Promise<{ affectedBlogSlugs: string[] }> {
  const client = requireSupabase();
  const normalizedJourneyKey = normalizeJourneyKey(journeyKey);
  const normalizedStepKey = normalizeJourneyStepKey(stepKey);
  if (!normalizedJourneyKey || !normalizedStepKey) {
    throw new Error("Journey key and step key are required.");
  }

  const currentStep = await fetchJourneyStepRow({
    journeyKey: normalizedJourneyKey,
    stepKey: normalizedStepKey,
  });
  if (!currentStep) {
    throw new Error("Journey step not found.");
  }

  const currentBlogPost = currentStep.blog_post_id
    ? await fetchPublishedBlogPostOptionById(toSafeString(currentStep.blog_post_id))
    : null;

  const { error } = await client
    .from("email_journey_steps")
    .delete()
    .eq("journey_key", normalizedJourneyKey)
    .eq("step_key", normalizedStepKey);

  if (error) throw error;

  return {
    affectedBlogSlugs: distinctValues([currentBlogPost?.slug ?? ""]),
  };
}
