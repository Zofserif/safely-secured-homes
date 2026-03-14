import { createClient } from "@supabase/supabase-js";
import type { BlogEmailAssetSource } from "./blogPostContent";
import { personalizeNewsletterFields } from "./emailPersonalization";
import {
  isMissingEmailJourneySchemaError,
  listEmailJourneyStepReferencesByPostIds,
} from "./emailJourneyStore";
import { WEEKLY_NEWSLETTER_BADGE } from "./emailJourneys";

export type {
  BlogEmailAssetDiagnostics,
  BlogEmailAssets,
  LegacyBlogPostContentRow,
} from "./blogPostContent";
export {
  buildBlogCtaHtml,
  buildBlogStoredFields,
  convertLegacyBlogCtaFieldsToMarkdown,
  convertLegacyBlogPostToStoredFields,
  convertStoredBlogContentHtmlToMarkdown,
  convertStoredBlogCtaHtmlToMarkdown,
  deriveBlogPreviewText,
  getBlogEmailAssetDiagnostics,
  getBlogEmailAssets,
  parseStoredBlogCtaHtml,
  renderBlogCtaMarkdownHtml,
  renderBlogContentHtml,
  resolveBlogCtaHtml,
} from "./blogPostContent";

export type BlogPostStatus = "draft" | "published";

export type BlogPostEmailBucket = {
  key: string;
  name: string;
};

export type BlogPostEmailUsageBroadcastSend = {
  sendKey: string;
  queuedAt: string;
  processedAt: string | null;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  queuedCount: number;
};

export type BlogPostEmailUsageJourneyStep = {
  id: string;
  journeyKey: string;
  journeyName: string;
  journeyStatus: string;
  stepKey: string;
  stepOrder: number;
  delayDays: number;
  isStepActive: boolean;
};

export type BlogPostEmailUsage = {
  broadcastSends: BlogPostEmailUsageBroadcastSend[];
  journeySteps: BlogPostEmailUsageJourneyStep[];
};

export type BlogPost = BlogEmailAssetSource & {
  id: string;
  slug: string;
  status: BlogPostStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  emailBuckets: BlogPostEmailBucket[];
};

type BlogPostRow = {
  id: string | null;
  slug: string | null;
  subject: string | null;
  title: string | null;
  content: string | null;
  preview_text: string | null;
  cta: string | null;
  status?: string | null;
  created_at: string | null;
  updated_at: string | null;
  published_at?: string | null;
};

type EmailDeliveryUsageRow = {
  blog_post_id: string | null;
  send_key: string | null;
  status: "queued" | "sent" | "failed" | null;
  queued_at: string | null;
  processed_at: string | null;
  subscriber_id: string | null;
};

type SupabaseError = {
  code?: string;
  details?: string;
  message?: string;
};

type BlogPostBase = BlogEmailAssetSource & {
  id: string;
  slug: string;
  status: BlogPostStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const BLOG_TABLE = "blog_posts";
const BLOG_POST_SELECT =
  "id,slug,subject,title,content,preview_text,cta,status,created_at,updated_at,published_at";
const BLOG_POST_LEGACY_SELECT =
  "id,slug,subject,title,content,preview_text,cta,created_at,updated_at";
const BLOG_POST_REQUIRED_COLUMNS = [
  "subject",
  "content",
  "preview_text",
  "cta",
  "created_at",
  "updated_at",
];
const BLOG_POST_VISIBILITY_COLUMNS = ["status", "published_at"];
const EMAIL_DELIVERIES_TABLE = "email_deliveries";
const EMAIL_DELIVERY_USAGE_SELECT =
  "blog_post_id,send_key,status,queued_at,processed_at,subscriber_id";

let hasWarnedMissingBlogPostSchema = false;
let hasWarnedMissingEmailCoreSchema = false;
let hasWarnedMissingEmailJourneySchema = false;

const isMissingTableError = (error: SupabaseError | null | undefined) =>
  error?.code === "PGRST205" || error?.code === "42P01";

const isMissingSchemaError = (
  error: SupabaseError | null | undefined,
  patterns: string[],
) => {
  if (!error) return false;
  if (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    error.code === "42P01"
  ) {
    return true;
  }

  const haystack = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return patterns.some((pattern) => haystack.includes(pattern.toLowerCase()));
};

const isMissingBlogPostSchemaError = (
  error: SupabaseError | null | undefined,
) => {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  const haystack = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return BLOG_POST_REQUIRED_COLUMNS.some((column) =>
    haystack.includes(column.toLowerCase()),
  );
};

const isMissingBlogVisibilitySchemaError = (
  error: SupabaseError | null | undefined,
) => isMissingSchemaError(error, BLOG_POST_VISIBILITY_COLUMNS);

const isMissingEmailCoreSchemaError = (error: SupabaseError | null | undefined) =>
  isMissingSchemaError(error, [
    EMAIL_DELIVERIES_TABLE,
    "delivery_kind",
    "send_key",
    "journey_key",
    "processed_at",
  ]);

const warnMissingBlogPostSchema = () => {
  if (hasWarnedMissingBlogPostSchema) return;
  hasWarnedMissingBlogPostSchema = true;
  console.warn(
    'Supabase "blog_posts" is missing the admin fields. Run supabase/blog_posts.sql and npm run backfill:blog-admin-fields before using the admin blog manager.',
  );
};

const warnMissingEmailCoreSchema = () => {
  if (hasWarnedMissingEmailCoreSchema) return;
  hasWarnedMissingEmailCoreSchema = true;
  console.warn(
    'Supabase email schema is missing. Run supabase/email_core.sql before using blog email usage helpers.',
  );
};

const warnMissingEmailJourneySchema = () => {
  if (hasWarnedMissingEmailJourneySchema) return;
  hasWarnedMissingEmailJourneySchema = true;
  console.warn(
    'Supabase email journey schema is missing. Run supabase/email_core.sql before using DB-backed journey mappings.',
  );
};

const parseOptionalText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const distinctValues = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const toBlogPostStatus = (value: unknown): BlogPostStatus =>
  value === "draft" ? "draft" : "published";

const resolveSortTimestamp = (post: Pick<BlogPostBase, "publishedAt" | "createdAt">) =>
  new Date(post.publishedAt || post.createdAt).getTime();

const sortByPublicDateDesc = <T extends Pick<BlogPostBase, "publishedAt" | "createdAt">>(
  a: T,
  b: T,
) => resolveSortTimestamp(b) - resolveSortTimestamp(a);

const createEmptyBlogPostEmailUsage = (): BlogPostEmailUsage => ({
  broadcastSends: [],
  journeySteps: [],
});

const normalizeBlogPostBase = (row: BlogPostRow): BlogPostBase | null => {
  const id = parseOptionalText(row.id);
  const slug = parseOptionalText(row.slug);
  const title = parseOptionalText(row.title);

  if (!id || !slug || !title) return null;

  const createdAt = row.created_at || new Date().toISOString();
  const status = toBlogPostStatus(row.status);
  const publishedAt = parseOptionalText(row.published_at) || (status === "published" ? createdAt : null);

  return {
    id,
    slug,
    subject: parseOptionalText(row.subject),
    title,
    content: parseOptionalText(row.content),
    previewText: parseOptionalText(row.preview_text),
    cta: parseOptionalText(row.cta),
    status,
    createdAt,
    updatedAt: row.updated_at || createdAt,
    publishedAt,
  };
};

const sortBuckets = (a: BlogPostEmailBucket, b: BlogPostEmailBucket) =>
  a.name.localeCompare(b.name) || a.key.localeCompare(b.key);

const buildDerivedEmailBuckets = ({
  journeyReferences,
  hasBroadcastSends,
}: {
  journeyReferences: Awaited<
    ReturnType<typeof listEmailJourneyStepReferencesByPostIds>
  >;
  hasBroadcastSends: boolean;
}): BlogPostEmailBucket[] => {
  const buckets = new Map<string, BlogPostEmailBucket>();

  for (const reference of journeyReferences) {
    buckets.set(reference.badge.key, reference.badge);
  }

  if (hasBroadcastSends) {
    buckets.set(WEEKLY_NEWSLETTER_BADGE.key, WEEKLY_NEWSLETTER_BADGE);
  }

  return Array.from(buckets.values()).sort(sortBuckets);
};

const attachEmailBuckets = (
  post: BlogPostBase,
  broadcastPostIds: Set<string>,
  journeyReferencesByPostId: Map<string, Awaited<
    ReturnType<typeof listEmailJourneyStepReferencesByPostIds>
  >>,
): BlogPost => ({
  ...post,
  emailBuckets: buildDerivedEmailBuckets({
    journeyReferences: journeyReferencesByPostId.get(post.id) ?? [],
    hasBroadcastSends: broadcastPostIds.has(post.id),
  }),
});

const applyPublicBlogPersonalization = <T extends BlogEmailAssetSource>(post: T): T =>
  personalizeNewsletterFields(post);

const fetchBroadcastPostIds = async (postIds: string[]) => {
  const broadcastPostIds = new Set<string>();
  if (!supabase) return broadcastPostIds;

  const normalizedPostIds = distinctValues(postIds);
  if (normalizedPostIds.length === 0) return broadcastPostIds;

  const { data, error } = await supabase
    .from(EMAIL_DELIVERIES_TABLE)
    .select("blog_post_id")
    .eq("delivery_kind", "broadcast")
    .in("blog_post_id", normalizedPostIds);

  if (error) {
    if (isMissingEmailCoreSchemaError(error as SupabaseError | null)) {
      warnMissingEmailCoreSchema();
      return broadcastPostIds;
    }
    console.error("Failed to fetch broadcast post ids:", error);
    return broadcastPostIds;
  }

  for (const row of (data as Array<{ blog_post_id?: string | null }> | null) ?? []) {
    const blogPostId = parseOptionalText(row.blog_post_id);
    if (blogPostId) {
      broadcastPostIds.add(blogPostId);
    }
  }

  return broadcastPostIds;
};

const groupJourneyReferencesByPostId = (
  references: Awaited<ReturnType<typeof listEmailJourneyStepReferencesByPostIds>>,
) => {
  const journeyReferencesByPostId = new Map<
    string,
    Awaited<ReturnType<typeof listEmailJourneyStepReferencesByPostIds>>
  >();

  for (const reference of references) {
    const existing = journeyReferencesByPostId.get(reference.blogPostId) ?? [];
    existing.push(reference);
    journeyReferencesByPostId.set(reference.blogPostId, existing);
  }

  return journeyReferencesByPostId;
};

const fetchActiveJourneyReferencesByPostIds = async (postIds: string[]) => {
  const normalizedPostIds = distinctValues(postIds);
  if (normalizedPostIds.length === 0) return [];

  try {
    return await listEmailJourneyStepReferencesByPostIds(normalizedPostIds, {
      activeJourneysOnly: true,
      activeStepsOnly: true,
    });
  } catch (error) {
    if (isMissingEmailJourneySchemaError(error as SupabaseError | null)) {
      warnMissingEmailJourneySchema();
      return [];
    }

    console.error("Failed to fetch active journey references for blog posts:", error);
    return [];
  }
};

const enrichPostsWithEmailBuckets = async (posts: BlogPostBase[]) => {
  const [broadcastPostIds, journeyReferences] = await Promise.all([
    fetchBroadcastPostIds(posts.map((post) => post.id)),
    fetchActiveJourneyReferencesByPostIds(posts.map((post) => post.id)),
  ]);
  const journeyReferencesByPostId = groupJourneyReferencesByPostId(journeyReferences);

  return posts.map((post) =>
    attachEmailBuckets(post, broadcastPostIds, journeyReferencesByPostId),
  );
};

const fetchBroadcastSendsByPostId = async (
  postId: string,
): Promise<BlogPostEmailUsageBroadcastSend[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(EMAIL_DELIVERIES_TABLE)
    .select(EMAIL_DELIVERY_USAGE_SELECT)
    .eq("blog_post_id", postId)
    .eq("delivery_kind", "broadcast")
    .order("queued_at", { ascending: false, nullsFirst: false });

  if (error) {
    if (isMissingEmailCoreSchemaError(error as SupabaseError | null)) {
      warnMissingEmailCoreSchema();
      return [];
    }
    console.error("Failed to fetch broadcast sends for blog post:", error);
    return [];
  }

  const groupedBroadcasts = new Map<string, BlogPostEmailUsageBroadcastSend>();

  for (const row of (data as EmailDeliveryUsageRow[] | null) ?? []) {
    const sendKey = parseOptionalText(row.send_key);
    if (!sendKey) continue;

    const queuedAt = row.queued_at || new Date().toISOString();
    const current = groupedBroadcasts.get(sendKey) ?? {
      sendKey,
      queuedAt,
      processedAt: row.processed_at || null,
      recipientCount: 0,
      sentCount: 0,
      failedCount: 0,
      queuedCount: 0,
    };

    current.recipientCount += 1;
    if (row.status === "sent") current.sentCount += 1;
    if (row.status === "failed") current.failedCount += 1;
    if (row.status === "queued") current.queuedCount += 1;

    if (new Date(queuedAt).getTime() > new Date(current.queuedAt).getTime()) {
      current.queuedAt = queuedAt;
    }

    if (
      row.processed_at &&
      (!current.processedAt ||
        new Date(row.processed_at).getTime() >
          new Date(current.processedAt).getTime())
    ) {
      current.processedAt = row.processed_at;
    }

    groupedBroadcasts.set(sendKey, current);
  }

  return Array.from(groupedBroadcasts.values()).sort(
    (a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime(),
  );
};

const fetchJourneyStepsByPostId = async (
  postId: string,
): Promise<BlogPostEmailUsageJourneyStep[]> => {
  try {
    return (
      await listEmailJourneyStepReferencesByPostIds([postId], {
        activeJourneysOnly: false,
        activeStepsOnly: false,
      })
    ).map((reference) => ({
      id: `${reference.journeyKey}:${reference.stepKey}`,
      journeyKey: reference.journeyKey,
      journeyName: reference.journeyName,
      journeyStatus: reference.journeyStatus,
      stepKey: reference.stepKey,
      stepOrder: reference.stepOrder,
      delayDays: reference.delayDays,
      isStepActive: reference.isStepActive,
    }));
  } catch (error) {
    if (isMissingEmailJourneySchemaError(error as SupabaseError | null)) {
      warnMissingEmailJourneySchema();
      return [];
    }

    console.error("Failed to fetch journey usage for blog post:", error);
    return [];
  }
};

const fetchPublishedBlogRows = async (): Promise<BlogPostRow[] | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(BLOG_TABLE)
    .select(BLOG_POST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (!error) {
    return (data as BlogPostRow[] | null) ?? [];
  }

  if (isMissingTableError(error as SupabaseError | null)) {
    console.warn(`Supabase table "${BLOG_TABLE}" not found yet.`);
    return [];
  }

  if (isMissingBlogVisibilitySchemaError(error as SupabaseError | null)) {
    const legacyResult = await supabase
      .from(BLOG_TABLE)
      .select(BLOG_POST_LEGACY_SELECT)
      .order("created_at", { ascending: false, nullsFirst: false });

    if (legacyResult.error) {
      if (isMissingBlogPostSchemaError(legacyResult.error as SupabaseError | null)) {
        warnMissingBlogPostSchema();
        return [];
      }
      console.error("Failed to fetch legacy blog posts:", legacyResult.error);
      return [];
    }

    return (legacyResult.data as BlogPostRow[] | null) ?? [];
  }

  if (isMissingBlogPostSchemaError(error as SupabaseError | null)) {
    warnMissingBlogPostSchema();
    return [];
  }

  console.error("Failed to fetch blog posts:", error);
  return [];
};

const fetchPublishedBlogRowBySlug = async (
  slug: string,
): Promise<BlogPostRow | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(BLOG_TABLE)
    .select(BLOG_POST_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!error) {
    return (data as BlogPostRow | null) ?? null;
  }

  if (isMissingTableError(error as SupabaseError | null)) {
    console.warn(`Supabase table "${BLOG_TABLE}" not found yet.`);
    return null;
  }

  if (isMissingBlogVisibilitySchemaError(error as SupabaseError | null)) {
    const legacyResult = await supabase
      .from(BLOG_TABLE)
      .select(BLOG_POST_LEGACY_SELECT)
      .eq("slug", slug)
      .maybeSingle();

    if (legacyResult.error) {
      if (isMissingBlogPostSchemaError(legacyResult.error as SupabaseError | null)) {
        warnMissingBlogPostSchema();
        return null;
      }
      console.error("Failed to fetch legacy blog post by slug:", legacyResult.error);
      return null;
    }

    return (legacyResult.data as BlogPostRow | null) ?? null;
  }

  if (isMissingBlogPostSchemaError(error as SupabaseError | null)) {
    warnMissingBlogPostSchema();
    return null;
  }

  console.error("Failed to fetch blog post by slug:", error);
  return null;
};

const fetchBlogRowById = async (id: string): Promise<BlogPostRow | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(BLOG_TABLE)
    .select(BLOG_POST_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!error) {
    return (data as BlogPostRow | null) ?? null;
  }

  if (isMissingTableError(error as SupabaseError | null)) {
    console.warn(`Supabase table "${BLOG_TABLE}" not found yet.`);
    return null;
  }

  if (isMissingBlogVisibilitySchemaError(error as SupabaseError | null)) {
    const legacyResult = await supabase
      .from(BLOG_TABLE)
      .select(BLOG_POST_LEGACY_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (legacyResult.error) {
      if (isMissingBlogPostSchemaError(legacyResult.error as SupabaseError | null)) {
        warnMissingBlogPostSchema();
        return null;
      }
      console.error("Failed to fetch legacy blog post by id:", legacyResult.error);
      return null;
    }

    return (legacyResult.data as BlogPostRow | null) ?? null;
  }

  if (isMissingBlogPostSchemaError(error as SupabaseError | null)) {
    warnMissingBlogPostSchema();
    return null;
  }

  console.error("Failed to fetch blog post by id:", error);
  return null;
};

export const getBlogPosts = async (): Promise<BlogPost[]> => {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping blog posts fetch.");
    return [];
  }

  const rows = await fetchPublishedBlogRows();
  if (!rows) return [];

  const posts = rows
    .map((row) => normalizeBlogPostBase(row))
    .filter((post): post is BlogPostBase => Boolean(post))
    .filter((post) => post.status === "published");

  return (await enrichPostsWithEmailBuckets(posts))
    .map((post) => applyPublicBlogPersonalization(post))
    .sort(sortByPublicDateDesc);
};

export const getBlogPostBySlug = async (
  slug: string,
): Promise<BlogPost | undefined> => {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping blog post fetch.");
    return undefined;
  }

  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return undefined;

  const row = await fetchPublishedBlogRowBySlug(normalizedSlug);
  if (!row) return undefined;

  const post = normalizeBlogPostBase(row);
  if (!post || post.status !== "published") return undefined;

  const [broadcastPostIds, journeyReferences] = await Promise.all([
    fetchBroadcastPostIds([post.id]),
    fetchActiveJourneyReferencesByPostIds([post.id]),
  ]);
  return applyPublicBlogPersonalization(
    attachEmailBuckets(
      post,
      broadcastPostIds,
      groupJourneyReferencesByPostId(journeyReferences),
    ),
  );
};

export const getBlogPostById = async (
  id: string,
): Promise<BlogPost | undefined> => {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping blog post fetch.");
    return undefined;
  }

  const normalizedId = id.trim();
  if (!normalizedId) return undefined;

  const row = await fetchBlogRowById(normalizedId);
  if (!row) return undefined;

  const post = normalizeBlogPostBase(row);
  if (!post) return undefined;

  const [broadcastPostIds, journeyReferences] = await Promise.all([
    fetchBroadcastPostIds([post.id]),
    fetchActiveJourneyReferencesByPostIds([post.id]),
  ]);
  return attachEmailBuckets(
    post,
    broadcastPostIds,
    groupJourneyReferencesByPostId(journeyReferences),
  );
};

export const getBlogPostEmailUsage = async (
  postId: string,
): Promise<BlogPostEmailUsage> => {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping blog post email usage fetch.");
    return createEmptyBlogPostEmailUsage();
  }

  const normalizedPostId = postId.trim();
  if (!normalizedPostId) return createEmptyBlogPostEmailUsage();

  const post = await getBlogPostById(normalizedPostId);
  if (!post) return createEmptyBlogPostEmailUsage();

  const [broadcastSends, journeySteps] = await Promise.all([
    fetchBroadcastSendsByPostId(post.id),
    fetchJourneyStepsByPostId(post.id),
  ]);

  return {
    broadcastSends,
    journeySteps,
  };
};

export const getBlogSlugs = async (): Promise<string[]> => {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping blog slugs fetch.");
    return [];
  }

  const rows = await fetchPublishedBlogRows();
  if (!rows) return [];

  return rows
    .map((item) => {
      const itemSlug = (item as { slug?: unknown }).slug;
      return typeof itemSlug === "string" ? itemSlug.trim() : "";
    })
    .filter(Boolean);
};
