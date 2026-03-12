import { createClient } from "@supabase/supabase-js";
import type { BlogEmailAssetSource } from "./blogPostContent";

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

export type BlogPostEmailUsageBroadcastCampaign = {
  id: string;
  key: string;
  name: string;
  status: string;
};

export type BlogPostEmailUsageJourneyStep = {
  id: string;
  campaignId: string;
  campaignKey: string;
  campaignName: string;
  campaignStatus: string;
  stepKey: string;
  stepOrder: number;
  delayDays: number;
};

export type BlogPostEmailUsage = {
  manualBuckets: BlogPostEmailBucket[];
  broadcastCampaigns: BlogPostEmailUsageBroadcastCampaign[];
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

type EmailContentBucketRow = {
  id: string | null;
  key: string | null;
  name: string | null;
  display_order: number | null;
};

type BlogPostEmailBucketAssignmentRow = {
  blog_post_id: string | null;
  bucket_id: string | null;
};

type EmailCampaignRow = {
  id: string | null;
  key: string | null;
  name: string | null;
  status: string | null;
  created_at: string | null;
};

type EmailCampaignStepRow = {
  id: string | null;
  campaign_id: string | null;
  step_key: string | null;
  step_order: number | null;
  delay_days: number | null;
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

type EmailContentBucket = {
  id: string;
  key: string;
  name: string;
  displayOrder: number;
};

type BlogPostEmailBucketAssignment = {
  blogPostId: string;
  bucketId: string;
};

type EmailCampaignUsage = {
  id: string;
  key: string;
  name: string;
  status: string;
  createdAt: string | null;
};

type EmailCampaignStepUsage = {
  id: string;
  campaignId: string;
  stepKey: string;
  stepOrder: number;
  delayDays: number;
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
const EMAIL_BUCKETS_TABLE = "email_content_buckets";
const BLOG_POST_EMAIL_BUCKETS_TABLE = "blog_post_email_buckets";
const EMAIL_CAMPAIGNS_TABLE = "email_campaigns";
const EMAIL_CAMPAIGN_STEPS_TABLE = "email_campaign_steps";
const EMAIL_BUCKET_SELECT = "id,key,name,display_order";
const EMAIL_BUCKET_ASSIGNMENT_SELECT = "blog_post_id,bucket_id";
const EMAIL_CAMPAIGN_USAGE_SELECT = "id,key,name,status,created_at";
const EMAIL_CAMPAIGN_STEP_USAGE_SELECT =
  "id,campaign_id,step_key,step_order,delay_days";

let hasWarnedMissingBlogPostSchema = false;
let hasWarnedMissingEmailBucketSchema = false;
let hasWarnedMissingCampaignTrackingSchema = false;

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

const isMissingEmailBucketSchemaError = (
  error: SupabaseError | null | undefined,
) =>
  isMissingSchemaError(error, [
    EMAIL_BUCKETS_TABLE,
    BLOG_POST_EMAIL_BUCKETS_TABLE,
    "bucket_id",
    "display_order",
  ]);

const isMissingCampaignTrackingSchemaError = (
  error: SupabaseError | null | undefined,
) =>
  isMissingSchemaError(error, [
    EMAIL_CAMPAIGNS_TABLE,
    EMAIL_CAMPAIGN_STEPS_TABLE,
    "blog_post_id",
    "objective_key",
    "campaign_id",
    "step_order",
    "delay_days",
  ]);

const warnMissingBlogPostSchema = () => {
  if (hasWarnedMissingBlogPostSchema) return;
  hasWarnedMissingBlogPostSchema = true;
  console.warn(
    'Supabase "blog_posts" is still on the legacy schema. Run supabase/blog_posts.sql, then npm run backfill:blog-posts, and rerun supabase/blog_posts.sql to finish the migration.',
  );
};

const warnMissingEmailBucketSchema = () => {
  if (hasWarnedMissingEmailBucketSchema) return;
  hasWarnedMissingEmailBucketSchema = true;
  console.warn(
    'Supabase email bucket schema is missing. Run supabase/newsletter_campaign_tracking.sql to add "email_content_buckets" and "blog_post_email_buckets".',
  );
};

const warnMissingCampaignTrackingSchema = () => {
  if (hasWarnedMissingCampaignTrackingSchema) return;
  hasWarnedMissingCampaignTrackingSchema = true;
  console.warn(
    'Supabase campaign tracking schema is missing. Run supabase/newsletter_campaign_tracking.sql to add "email_campaigns" and "email_campaign_steps".',
  );
};

const parseOptionalText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const distinctValues = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const sortByCreatedDateDesc = <T extends { createdAt: string }>(a: T, b: T) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

const sortEmailContentBuckets = (a: EmailContentBucket, b: EmailContentBucket) =>
  a.displayOrder - b.displayOrder ||
  a.name.localeCompare(b.name) ||
  a.key.localeCompare(b.key);

const toBlogPostEmailBucket = (
  bucket: EmailContentBucket,
): BlogPostEmailBucket => ({
  key: bucket.key,
  name: bucket.name,
});

const createEmptyBlogPostEmailUsage = (): BlogPostEmailUsage => ({
  manualBuckets: [],
  broadcastCampaigns: [],
  journeySteps: [],
});

const dedupeAndSortEmailContentBuckets = (buckets: EmailContentBucket[]) =>
  Array.from(new Map(buckets.map((bucket) => [bucket.id, bucket])).values()).sort(
    sortEmailContentBuckets,
  );

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

const normalizeEmailContentBucket = (
  row: EmailContentBucketRow,
): EmailContentBucket | null => {
  const id = parseOptionalText(row.id);
  const key = parseOptionalText(row.key);
  const name = parseOptionalText(row.name);

  if (!id || !key || !name) return null;

  return {
    id,
    key,
    name,
    displayOrder:
      typeof row.display_order === "number" ? row.display_order : Number.MAX_SAFE_INTEGER,
  };
};

const normalizeBlogPostEmailBucketAssignment = (
  row: BlogPostEmailBucketAssignmentRow,
): BlogPostEmailBucketAssignment | null => {
  const blogPostId = parseOptionalText(row.blog_post_id);
  const bucketId = parseOptionalText(row.bucket_id);

  if (!blogPostId || !bucketId) return null;

  return {
    blogPostId,
    bucketId,
  };
};

const normalizeEmailCampaignUsage = (
  row: EmailCampaignRow,
): EmailCampaignUsage | null => {
  const id = parseOptionalText(row.id);
  const key = parseOptionalText(row.key);
  const name = parseOptionalText(row.name);
  const status = parseOptionalText(row.status);

  if (!id || !key || !name || !status) return null;

  return {
    id,
    key,
    name,
    status,
    createdAt: row.created_at || null,
  };
};

const normalizeEmailCampaignStepUsage = (
  row: EmailCampaignStepRow,
): EmailCampaignStepUsage | null => {
  const id = parseOptionalText(row.id);
  const campaignId = parseOptionalText(row.campaign_id);
  const stepKey = parseOptionalText(row.step_key);

  if (
    !id ||
    !campaignId ||
    !stepKey ||
    typeof row.step_order !== "number" ||
    typeof row.delay_days !== "number"
  ) {
    return null;
  }

  return {
    id,
    campaignId,
    stepKey,
    stepOrder: row.step_order,
    delayDays: row.delay_days,
  };
};

const attachEmailBuckets = (
  post: BlogPostBase,
  bucketsByPostId: Map<string, EmailContentBucket[]>,
): BlogPost => ({
  ...post,
  emailBuckets: (bucketsByPostId.get(post.id) ?? []).map(toBlogPostEmailBucket),
});

const fetchManualEmailBucketsByPostIds = async (postIds: string[]) => {
  const bucketsByPostId = new Map<string, EmailContentBucket[]>();
  if (!supabase) return bucketsByPostId;

  const normalizedPostIds = distinctValues(postIds);
  if (normalizedPostIds.length === 0) return bucketsByPostId;

  const { data: assignmentData, error: assignmentError } = await supabase
    .from(BLOG_POST_EMAIL_BUCKETS_TABLE)
    .select(EMAIL_BUCKET_ASSIGNMENT_SELECT)
    .in("blog_post_id", normalizedPostIds);

  if (assignmentError) {
    if (isMissingEmailBucketSchemaError(assignmentError as SupabaseError | null)) {
      warnMissingEmailBucketSchema();
      return bucketsByPostId;
    }
    console.error("Failed to fetch blog post email bucket assignments:", assignmentError);
    return bucketsByPostId;
  }

  const assignments = ((assignmentData as BlogPostEmailBucketAssignmentRow[] | null) ?? [])
    .map((row) => normalizeBlogPostEmailBucketAssignment(row))
    .filter((assignment): assignment is BlogPostEmailBucketAssignment =>
      Boolean(assignment),
    );

  const bucketIds = distinctValues(assignments.map((assignment) => assignment.bucketId));
  if (bucketIds.length === 0) return bucketsByPostId;

  const { data: bucketData, error: bucketError } = await supabase
    .from(EMAIL_BUCKETS_TABLE)
    .select(EMAIL_BUCKET_SELECT)
    .in("id", bucketIds);

  if (bucketError) {
    if (isMissingEmailBucketSchemaError(bucketError as SupabaseError | null)) {
      warnMissingEmailBucketSchema();
      return bucketsByPostId;
    }
    console.error("Failed to fetch email content buckets:", bucketError);
    return bucketsByPostId;
  }

  const bucketsById = new Map<string, EmailContentBucket>();
  for (const row of (bucketData as EmailContentBucketRow[] | null) ?? []) {
    const bucket = normalizeEmailContentBucket(row);
    if (!bucket) continue;
    bucketsById.set(bucket.id, bucket);
  }

  for (const assignment of assignments) {
    const bucket = bucketsById.get(assignment.bucketId);
    if (!bucket) continue;

    const existingBuckets = bucketsByPostId.get(assignment.blogPostId) ?? [];
    existingBuckets.push(bucket);
    bucketsByPostId.set(assignment.blogPostId, existingBuckets);
  }

  for (const [postId, buckets] of Array.from(bucketsByPostId.entries())) {
    bucketsByPostId.set(postId, dedupeAndSortEmailContentBuckets(buckets));
  }

  return bucketsByPostId;
};

const enrichPostsWithEmailBuckets = async (posts: BlogPostBase[]) => {
  const bucketsByPostId = await fetchManualEmailBucketsByPostIds(
    posts.map((post) => post.id),
  );

  return posts.map((post) => attachEmailBuckets(post, bucketsByPostId));
};

const fetchBroadcastCampaignsByPostId = async (
  postId: string,
): Promise<BlogPostEmailUsageBroadcastCampaign[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(EMAIL_CAMPAIGNS_TABLE)
    .select(EMAIL_CAMPAIGN_USAGE_SELECT)
    .eq("kind", "broadcast")
    .eq("objective_key", "weekly_newsletter")
    .eq("blog_post_id", postId)
    .order("created_at", { ascending: false, nullsFirst: false });

  if (error) {
    if (isMissingCampaignTrackingSchemaError(error as SupabaseError | null)) {
      warnMissingCampaignTrackingSchema();
      return [];
    }
    console.error("Failed to fetch blog post broadcast campaigns:", error);
    return [];
  }

  return ((data as EmailCampaignRow[] | null) ?? [])
    .map((row) => normalizeEmailCampaignUsage(row))
    .filter((campaign): campaign is EmailCampaignUsage => Boolean(campaign))
    .map((campaign) => ({
      id: campaign.id,
      key: campaign.key,
      name: campaign.name,
      status: campaign.status,
    }));
};

const fetchJourneyStepsByPostId = async (
  postId: string,
): Promise<BlogPostEmailUsageJourneyStep[]> => {
  if (!supabase) return [];

  const { data: stepData, error: stepError } = await supabase
    .from(EMAIL_CAMPAIGN_STEPS_TABLE)
    .select(EMAIL_CAMPAIGN_STEP_USAGE_SELECT)
    .eq("blog_post_id", postId)
    .eq("is_active", true)
    .order("step_order", { ascending: true, nullsFirst: false });

  if (stepError) {
    if (isMissingCampaignTrackingSchemaError(stepError as SupabaseError | null)) {
      warnMissingCampaignTrackingSchema();
      return [];
    }
    console.error("Failed to fetch blog post journey steps:", stepError);
    return [];
  }

  const steps = ((stepData as EmailCampaignStepRow[] | null) ?? [])
    .map((row) => normalizeEmailCampaignStepUsage(row))
    .filter((step): step is EmailCampaignStepUsage => Boolean(step));

  const campaignIds = distinctValues(steps.map((step) => step.campaignId));
  if (campaignIds.length === 0) return [];

  const { data: campaignData, error: campaignError } = await supabase
    .from(EMAIL_CAMPAIGNS_TABLE)
    .select(EMAIL_CAMPAIGN_USAGE_SELECT)
    .eq("kind", "journey")
    .in("id", campaignIds);

  if (campaignError) {
    if (isMissingCampaignTrackingSchemaError(campaignError as SupabaseError | null)) {
      warnMissingCampaignTrackingSchema();
      return [];
    }
    console.error("Failed to fetch journey campaign details for blog post:", campaignError);
    return [];
  }

  const campaignsById = new Map<string, EmailCampaignUsage>();
  for (const row of (campaignData as EmailCampaignRow[] | null) ?? []) {
    const campaign = normalizeEmailCampaignUsage(row);
    if (!campaign) continue;
    campaignsById.set(campaign.id, campaign);
  }

  return steps
    .map((step) => {
      const campaign = campaignsById.get(step.campaignId);
      if (!campaign) return null;

      return {
        id: step.id,
        campaignId: campaign.id,
        campaignKey: campaign.key,
        campaignName: campaign.name,
        campaignStatus: campaign.status,
        stepKey: step.stepKey,
        stepOrder: step.stepOrder,
        delayDays: step.delayDays,
      };
    })
    .filter((step): step is BlogPostEmailUsageJourneyStep => Boolean(step))
    .sort(
      (a, b) =>
        a.campaignName.localeCompare(b.campaignName) ||
        a.stepOrder - b.stepOrder ||
        a.stepKey.localeCompare(b.stepKey),
    );
};

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

  const bucketsByPostId = await fetchManualEmailBucketsByPostIds([post.id]);
  return attachEmailBuckets(post, bucketsByPostId);
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

  const bucketsByPostId = await fetchManualEmailBucketsByPostIds([post.id]);
  return attachEmailBuckets(post, bucketsByPostId);
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

  const [manualBucketsByPostId, broadcastCampaigns, journeySteps] = await Promise.all([
    fetchManualEmailBucketsByPostIds([normalizedPostId]),
    fetchBroadcastCampaignsByPostId(normalizedPostId),
    fetchJourneyStepsByPostId(normalizedPostId),
  ]);

  return {
    manualBuckets: (manualBucketsByPostId.get(normalizedPostId) ?? []).map(
      toBlogPostEmailBucket,
    ),
    broadcastCampaigns,
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
