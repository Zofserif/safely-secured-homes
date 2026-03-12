import { createClient } from "@supabase/supabase-js";
import type { BlogEmailAssetSource } from "./blogPostContent";
import {
  WEEKLY_NEWSLETTER_BADGE,
  getEmailJourneyStepReferencesByPostSlug,
} from "./emailJourneys";

export type {
  BlogEmailAssetDiagnostics,
  BlogEmailAssets,
  LegacyBlogPostContentRow,
} from "./blogPostContent";
export {
  buildBlogCtaHtml,
  convertLegacyBlogPostToStoredFields,
  getBlogEmailAssetDiagnostics,
  getBlogEmailAssets,
  renderBlogContentHtml,
} from "./blogPostContent";

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
  stepKey: string;
  stepOrder: number;
  delayDays: number;
};

export type BlogPostEmailUsage = {
  broadcastSends: BlogPostEmailUsageBroadcastSend[];
  journeySteps: BlogPostEmailUsageJourneyStep[];
};

export type BlogPost = BlogEmailAssetSource & {
  id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
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
  created_at: string | null;
  updated_at: string | null;
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
  createdAt: string;
  updatedAt: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const BLOG_TABLE = "blog_posts";
const BLOG_POST_SELECT =
  "id,slug,subject,title,content,preview_text,cta,created_at,updated_at";
const BLOG_POST_REQUIRED_COLUMNS = [
  "subject",
  "content",
  "preview_text",
  "cta",
  "created_at",
  "updated_at",
];
const EMAIL_DELIVERIES_TABLE = "email_deliveries";
const EMAIL_DELIVERY_USAGE_SELECT =
  "blog_post_id,send_key,status,queued_at,processed_at,subscriber_id";

let hasWarnedMissingBlogPostSchema = false;
let hasWarnedMissingEmailCoreSchema = false;

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

const isMissingEmailCoreSchemaError = (
  error: SupabaseError | null | undefined,
) =>
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
    'Supabase "blog_posts" is still on the legacy schema. Run supabase/blog_posts.sql, then npm run backfill:blog-posts, and rerun supabase/blog_posts.sql to finish the migration.',
  );
};

const warnMissingEmailCoreSchema = () => {
  if (hasWarnedMissingEmailCoreSchema) return;
  hasWarnedMissingEmailCoreSchema = true;
  console.warn(
    'Supabase email schema is missing. Run supabase/email_core.sql before using blog email usage helpers.',
  );
};

const parseOptionalText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const distinctValues = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const sortByCreatedDateDesc = <T extends { createdAt: string }>(a: T, b: T) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

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

  return {
    id,
    slug,
    subject: parseOptionalText(row.subject),
    title,
    content: parseOptionalText(row.content),
    previewText: parseOptionalText(row.preview_text),
    cta: parseOptionalText(row.cta),
    createdAt,
    updatedAt: row.updated_at || createdAt,
  };
};

const sortBuckets = (a: BlogPostEmailBucket, b: BlogPostEmailBucket) =>
  a.name.localeCompare(b.name) || a.key.localeCompare(b.key);

const buildDerivedEmailBuckets = ({
  slug,
  hasBroadcastSends,
}: {
  slug: string;
  hasBroadcastSends: boolean;
}): BlogPostEmailBucket[] => {
  const buckets = new Map<string, BlogPostEmailBucket>();

  for (const reference of getEmailJourneyStepReferencesByPostSlug(slug)) {
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
): BlogPost => ({
  ...post,
  emailBuckets: buildDerivedEmailBuckets({
    slug: post.slug,
    hasBroadcastSends: broadcastPostIds.has(post.id),
  }),
});

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

const enrichPostsWithEmailBuckets = async (posts: BlogPostBase[]) => {
  const broadcastPostIds = await fetchBroadcastPostIds(posts.map((post) => post.id));
  return posts.map((post) => attachEmailBuckets(post, broadcastPostIds));
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

const fetchJourneyStepsByPostSlug = (
  postSlug: string,
): BlogPostEmailUsageJourneyStep[] =>
  getEmailJourneyStepReferencesByPostSlug(postSlug)
    .map((reference) => ({
      id: `${reference.journeyKey}:${reference.stepKey}`,
      journeyKey: reference.journeyKey,
      journeyName: reference.journeyName,
      stepKey: reference.stepKey,
      stepOrder: reference.stepOrder,
      delayDays: reference.delayDays,
    }))
    .sort(
      (a, b) =>
        a.journeyName.localeCompare(b.journeyName) ||
        a.stepOrder - b.stepOrder ||
        a.stepKey.localeCompare(b.stepKey),
    );

export const getBlogPosts = async (): Promise<BlogPost[]> => {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping blog posts fetch.");
    return [];
  }

  const { data, error } = await supabase
    .from(BLOG_TABLE)
    .select(BLOG_POST_SELECT)
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error) {
    if (isMissingTableError(error as SupabaseError | null)) {
      console.warn(`Supabase table "${BLOG_TABLE}" not found yet.`);
      return [];
    }
    if (isMissingBlogPostSchemaError(error as SupabaseError | null)) {
      warnMissingBlogPostSchema();
      return [];
    }
    console.error("Failed to fetch blog posts:", error);
    return [];
  }

  const posts = ((data as BlogPostRow[] | null) ?? [])
    .map((row) => normalizeBlogPostBase(row))
    .filter((post): post is BlogPostBase => Boolean(post));

  return (await enrichPostsWithEmailBuckets(posts)).sort(sortByCreatedDateDesc);
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

  const { data, error } = await supabase
    .from(BLOG_TABLE)
    .select(BLOG_POST_SELECT)
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error as SupabaseError | null)) {
      console.warn(`Supabase table "${BLOG_TABLE}" not found yet.`);
      return undefined;
    }
    if (isMissingBlogPostSchemaError(error as SupabaseError | null)) {
      warnMissingBlogPostSchema();
      return undefined;
    }
    console.error("Failed to fetch blog post by slug:", error);
    return undefined;
  }

  if (!data) return undefined;

  const post = normalizeBlogPostBase(data as BlogPostRow);
  if (!post) return undefined;

  const broadcastPostIds = await fetchBroadcastPostIds([post.id]);
  return attachEmailBuckets(post, broadcastPostIds);
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

  const { data, error } = await supabase
    .from(BLOG_TABLE)
    .select(BLOG_POST_SELECT)
    .eq("id", normalizedId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error as SupabaseError | null)) {
      console.warn(`Supabase table "${BLOG_TABLE}" not found yet.`);
      return undefined;
    }
    if (isMissingBlogPostSchemaError(error as SupabaseError | null)) {
      warnMissingBlogPostSchema();
      return undefined;
    }
    console.error("Failed to fetch blog post by id:", error);
    return undefined;
  }

  if (!data) return undefined;

  const post = normalizeBlogPostBase(data as BlogPostRow);
  if (!post) return undefined;

  const broadcastPostIds = await fetchBroadcastPostIds([post.id]);
  return attachEmailBuckets(post, broadcastPostIds);
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
    Promise.resolve(fetchJourneyStepsByPostSlug(post.slug)),
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

  const { data, error } = await supabase
    .from(BLOG_TABLE)
    .select("slug")
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error) {
    if (isMissingTableError(error as SupabaseError | null)) {
      console.warn(`Supabase table "${BLOG_TABLE}" not found yet.`);
      return [];
    }
    console.error("Failed to fetch blog slugs:", error);
    return [];
  }

  return (data ?? [])
    .map((item) => {
      const itemSlug = (item as { slug?: unknown }).slug;
      return typeof itemSlug === "string" ? itemSlug.trim() : "";
    })
    .filter(Boolean);
};
