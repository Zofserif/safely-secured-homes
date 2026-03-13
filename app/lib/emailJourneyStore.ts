import { createClient } from "@supabase/supabase-js";
import type {
  EmailJourneyDefinition,
  EmailJourneyKey,
  EmailJourneyStatus,
  EmailJourneyStepDefinition,
  EmailJourneyStepReference,
} from "./emailJourneys";

type JourneyRow = {
  key: string | null;
  name: string | null;
  objective_key: string | null;
  badge_key: string | null;
  badge_name: string | null;
  status: string | null;
};

type JourneyStepRow = {
  journey_key: string | null;
  step_key: string | null;
  step_order: number | null;
  delay_days: number | null;
  blog_post_id: string | null;
  cta_override_html: string | null;
  is_active: boolean | null;
};

type BlogPostSlugRow = {
  id: string | null;
  slug: string | null;
};

type SupabaseError = {
  code?: string;
  details?: string;
  message?: string;
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

const distinctValues = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

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

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase not configured for email journey configuration.");
  }

  return supabase;
};

export const isEmailJourneyStoreConfigured = () => Boolean(supabase);

const fetchJourneyRows = async ({
  journeyKeys,
  statuses,
}: {
  journeyKeys?: string[];
  statuses?: EmailJourneyStatus[];
} = {}) => {
  const client = requireSupabase();
  let query = client.from("email_journeys").select(JOURNEY_SELECT);

  const normalizedJourneyKeys = distinctValues(journeyKeys ?? []);
  if (normalizedJourneyKeys.length > 0) {
    query = query.in("key", normalizedJourneyKeys);
  }

  const normalizedStatuses = distinctValues(statuses ?? []);
  if (normalizedStatuses.length > 0) {
    query = query.in("status", normalizedStatuses);
  }

  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw error;

  return (data as JourneyRow[] | null) ?? [];
};

const fetchJourneyStepRows = async ({
  journeyKeys,
  blogPostIds,
  activeStepsOnly = false,
}: {
  journeyKeys?: string[];
  blogPostIds?: string[];
  activeStepsOnly?: boolean;
} = {}) => {
  const client = requireSupabase();
  let query = client.from("email_journey_steps").select(JOURNEY_STEP_SELECT);

  const normalizedJourneyKeys = distinctValues(journeyKeys ?? []);
  if (normalizedJourneyKeys.length > 0) {
    query = query.in("journey_key", normalizedJourneyKeys);
  }

  const normalizedBlogPostIds = distinctValues(blogPostIds ?? []);
  if (normalizedBlogPostIds.length > 0) {
    query = query.in("blog_post_id", normalizedBlogPostIds);
  }

  if (activeStepsOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.order("step_order", {
    ascending: true,
    nullsFirst: false,
  });
  if (error) throw error;

  return (data as JourneyStepRow[] | null) ?? [];
};

const fetchBlogPostSlugsByIds = async (blogPostIds: string[]) => {
  const normalizedBlogPostIds = distinctValues(blogPostIds);
  if (normalizedBlogPostIds.length === 0) {
    return new Map<string, string>();
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("blog_posts")
    .select("id,slug")
    .in("id", normalizedBlogPostIds);

  if (error) throw error;

  const blogPostSlugsById = new Map<string, string>();
  for (const row of (data as BlogPostSlugRow[] | null) ?? []) {
    const blogPostId = toSafeString(row.id);
    const blogPostSlug = toSafeString(row.slug);
    if (blogPostId && blogPostSlug) {
      blogPostSlugsById.set(blogPostId, blogPostSlug);
    }
  }

  return blogPostSlugsById;
};

const normalizeJourneyRow = (row: JourneyRow): Omit<EmailJourneyDefinition, "steps"> | null => {
  const key = toSafeString(row.key);
  const name = toSafeString(row.name);
  if (!key || !name) return null;

  return {
    key,
    name,
    objectiveKey: toSafeString(row.objective_key),
    status: toJourneyStatus(row.status),
    badge: {
      key: toSafeString(row.badge_key) || key,
      name: toSafeString(row.badge_name) || name,
    },
  };
};

const normalizeJourneyStep = ({
  row,
  blogPostSlugsById,
}: {
  row: JourneyStepRow;
  blogPostSlugsById: Map<string, string>;
}): EmailJourneyStepDefinition | null => {
  const stepKey = toSafeString(row.step_key);
  const journeyKey = toSafeString(row.journey_key);
  const blogPostId = toSafeString(row.blog_post_id);
  const blogPostSlug = blogPostSlugsById.get(blogPostId) ?? "";

  if (
    !journeyKey ||
    !stepKey ||
    !blogPostId ||
    !blogPostSlug ||
    typeof row.step_order !== "number" ||
    typeof row.delay_days !== "number"
  ) {
    return null;
  }

  return {
    stepKey,
    stepOrder: row.step_order,
    delayDays: row.delay_days,
    blogPostId,
    blogPostSlug,
    ctaOverrideHtml: toSafeString(row.cta_override_html),
    isActive: row.is_active === true,
  };
};

const buildJourneyDefinitions = async ({
  journeyRows,
  stepRows,
}: {
  journeyRows: JourneyRow[];
  stepRows: JourneyStepRow[];
}) => {
  const journeyDefinitions = journeyRows
    .map((row) => normalizeJourneyRow(row))
    .filter(
      (journey): journey is Omit<EmailJourneyDefinition, "steps"> => Boolean(journey),
    );
  const journeyMap = new Map<
    EmailJourneyKey,
    Omit<EmailJourneyDefinition, "steps"> & { steps: EmailJourneyStepDefinition[] }
  >();

  for (const journey of journeyDefinitions) {
    journeyMap.set(journey.key, {
      ...journey,
      steps: [],
    });
  }

  const blogPostSlugsById = await fetchBlogPostSlugsByIds(
    stepRows.map((row) => toSafeString(row.blog_post_id)),
  );

  for (const stepRow of stepRows) {
    const journeyKey = toSafeString(stepRow.journey_key);
    const journey = journeyMap.get(journeyKey);
    if (!journey) continue;

    const step = normalizeJourneyStep({
      row: stepRow,
      blogPostSlugsById,
    });
    if (!step) continue;

    journey.steps.push(step);
  }

  return Array.from(journeyMap.values()).map((journey) => ({
    ...journey,
    steps: journey.steps.sort(
      (a, b) =>
        a.stepOrder - b.stepOrder || a.stepKey.localeCompare(b.stepKey),
    ),
  }));
};

export async function listEmailJourneyDefinitions({
  statuses,
  includeInactiveSteps = true,
}: {
  statuses?: EmailJourneyStatus[];
  includeInactiveSteps?: boolean;
} = {}): Promise<EmailJourneyDefinition[]> {
  const journeyRows = await fetchJourneyRows({ statuses });
  if (journeyRows.length === 0) return [];

  const stepRows = await fetchJourneyStepRows({
    journeyKeys: journeyRows.map((row) => toSafeString(row.key)),
    activeStepsOnly: !includeInactiveSteps,
  });

  return buildJourneyDefinitions({
    journeyRows,
    stepRows,
  });
}

export async function getEmailJourneyDefinition(
  journeyKey: EmailJourneyKey,
  {
    includeInactiveSteps = true,
  }: {
    includeInactiveSteps?: boolean;
  } = {},
): Promise<EmailJourneyDefinition | null> {
  const normalizedJourneyKey = toSafeString(journeyKey);
  if (!normalizedJourneyKey) return null;

  const journeyRows = await fetchJourneyRows({
    journeyKeys: [normalizedJourneyKey],
  });
  if (journeyRows.length === 0) return null;

  const stepRows = await fetchJourneyStepRows({
    journeyKeys: [normalizedJourneyKey],
    activeStepsOnly: !includeInactiveSteps,
  });
  const definitions = await buildJourneyDefinitions({
    journeyRows,
    stepRows,
  });

  return definitions[0] ?? null;
}

export async function listEmailJourneyStepReferencesByPostIds(
  blogPostIds: string[],
  {
    activeJourneysOnly = false,
    activeStepsOnly = false,
  }: {
    activeJourneysOnly?: boolean;
    activeStepsOnly?: boolean;
  } = {},
): Promise<EmailJourneyStepReference[]> {
  const normalizedBlogPostIds = distinctValues(blogPostIds);
  if (normalizedBlogPostIds.length === 0) return [];

  const stepRows = await fetchJourneyStepRows({
    blogPostIds: normalizedBlogPostIds,
    activeStepsOnly,
  });
  if (stepRows.length === 0) return [];

  const journeyRows = await fetchJourneyRows({
    journeyKeys: stepRows.map((row) => toSafeString(row.journey_key)),
    statuses: activeJourneysOnly ? ["active"] : undefined,
  });
  if (journeyRows.length === 0) return [];

  const journeyMap = new Map<
    EmailJourneyKey,
    Omit<EmailJourneyDefinition, "steps">
  >();
  for (const row of journeyRows) {
    const journey = normalizeJourneyRow(row);
    if (journey) {
      journeyMap.set(journey.key, journey);
    }
  }

  const blogPostSlugsById = await fetchBlogPostSlugsByIds(
    stepRows.map((row) => toSafeString(row.blog_post_id)),
  );

  return stepRows
    .flatMap((row) => {
      const journeyKey = toSafeString(row.journey_key);
      const journey = journeyMap.get(journeyKey);
      const step = normalizeJourneyStep({
        row,
        blogPostSlugsById,
      });

      if (!journey || !step) return [];

      return [
        {
          journeyKey: journey.key,
          journeyName: journey.name,
          journeyObjectiveKey: journey.objectiveKey,
          journeyStatus: journey.status,
          badge: journey.badge,
          stepKey: step.stepKey,
          stepOrder: step.stepOrder,
          delayDays: step.delayDays,
          blogPostId: step.blogPostId,
          blogPostSlug: step.blogPostSlug,
          ctaOverrideHtml: step.ctaOverrideHtml,
          isStepActive: step.isActive,
        },
      ];
    })
    .sort(
      (a, b) =>
        a.journeyName.localeCompare(b.journeyName) ||
        a.stepOrder - b.stepOrder ||
        a.stepKey.localeCompare(b.stepKey),
    );
}

export const isMissingEmailJourneySchemaError = (
  error: SupabaseError | null | undefined,
) =>
  Boolean(
    error &&
      (error.code === "42703" ||
        error.code === "PGRST204" ||
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        `${error.message ?? ""} ${error.details ?? ""}`
          .toLowerCase()
          .includes("email_journey")),
  );
