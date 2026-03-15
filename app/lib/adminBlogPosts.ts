import "server-only";

import { createClient } from "@supabase/supabase-js";
import type {
  BlogPost,
  BlogPostEmailUsage,
  BlogPostStatus,
} from "./blogPosts";
import {
  buildBlogStoredFields,
  convertLegacyBlogCtaFieldsToMarkdown,
  convertStoredBlogContentHtmlToMarkdown,
  convertStoredBlogCtaHtmlToMarkdown,
  deriveBlogPreviewText,
} from "./blogPosts";
import { getBlogPostEmailUsage } from "./blogPosts";
import {
  assertSupportedNewsletterPersonalizationTokens,
  EMAIL_PERSONALIZATION_RESULTS_LINK_TOKEN,
  EMAIL_PERSONALIZATION_SCORE_TOKENS,
  newsletterFieldsContainPersonalizationTokens,
} from "./emailPersonalization";
import { sendNewsletterEmail } from "./email";
import { getSavedEmailRecipientProfileByEmail } from "./emailRecipientProfile";
import { sendTrackedBroadcastNewsletterEmailByPostId } from "./newsletterCampaignEmail";
import { listSubscribedNewsletterRecipients } from "./newsletterCampaigns";
import { resolvePersonalizedResultsLinkByEmail } from "./resultsLinksServer";
import { siteUrl } from "./site";

export type AdminNewsletterState =
  | "not_enabled"
  | "ready"
  | "retry_needed"
  | "sent";

export type AdminBlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  status: BlogPostStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  newsletterEnabled: boolean;
  newsletterSendKey: string;
};

export type AdminBlogPost = Omit<BlogPost, "emailBuckets"> & {
  contentMarkdown: string;
  ctaMarkdown: string;
  newsletterEnabled: boolean;
  newsletterSendKey: string;
};

export type SaveAdminBlogPostInput = {
  postId?: string;
  title: string;
  slug: string;
  subject: string;
  previewText: string;
  contentMarkdown: string;
  ctaMarkdown: string;
  status: BlogPostStatus;
  newsletterEnabled: boolean;
};

export type SendAdminBlogPostNewsletterResult = {
  postId: string;
  sendKey: string;
  sentCount: number;
  skippedCount: number;
  failedCount: number;
  usage: BlogPostEmailUsage;
  newsletterState: AdminNewsletterState;
};

export type SendAdminBlogPostTestEmailInput = {
  postId: string;
  recipientEmail: string;
  recipientName?: string;
};

export type SendAdminBlogPostTestEmailResult = {
  postId: string;
  recipientEmail: string;
};

type AdminBlogPostRow = {
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
  content_markdown?: string | null;
  cta_markdown?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  newsletter_enabled?: boolean | null;
  newsletter_send_key?: string | null;
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

const BLOG_TABLE = "blog_posts";
const ADMIN_BLOG_SELECT =
  "id,slug,subject,title,content,preview_text,cta,status,created_at,updated_at,published_at,content_markdown,cta_markdown,newsletter_enabled,newsletter_send_key";
const ADMIN_BLOG_COMPAT_SELECT =
  "id,slug,subject,title,content,preview_text,cta,status,created_at,updated_at,published_at,content_markdown,cta_label,cta_url,newsletter_enabled,newsletter_send_key";
const ADMIN_BLOG_LEGACY_SELECT =
  "id,slug,subject,title,content,preview_text,cta,created_at,updated_at";
const ADMIN_SCHEMA_COLUMNS = [
  "status",
  "published_at",
  "content_markdown",
  "cta_markdown",
  "newsletter_enabled",
  "newsletter_send_key",
];
const TEST_EMAIL_UNSUBSCRIBE_URL = new URL("/unsubscribe", siteUrl).toString();

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const toBlogPostStatus = (value: unknown): BlogPostStatus =>
  value === "draft" ? "draft" : "published";

const normalizeBoolean = (value: unknown) => value === true;

const requireSupabase = () => {
  if (!supabase) {
    throw new Error("Supabase is not configured for admin blog management.");
  }

  return supabase;
};

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

const assertAdminSchemaError = (error: SupabaseError | null | undefined) => {
  if (!isMissingSchemaError(error, ADMIN_SCHEMA_COLUMNS)) return;
  throw new Error(
    'Supabase blog admin schema is missing. Run supabase/blog_posts.sql and npm run backfill:blog-admin-fields before using /admin/blog.',
  );
};

export const normalizeBlogSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const formatWeeklySendKeyDate = (value: Date) => {
  const year = value.getUTCFullYear();
  const month = `${value.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${value.getUTCDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
};

const createWeeklySendKey = (slug: string, date = new Date()) =>
  `weekly_${formatWeeklySendKeyDate(date)}_${slug}`;

const normalizeAdminBlogPost = (row: AdminBlogPostRow): AdminBlogPost | null => {
  const id = toSafeString(row.id);
  const slug = toSafeString(row.slug);
  const title = toSafeString(row.title);
  if (!id || !slug || !title) return null;

  const createdAt = row.created_at || new Date().toISOString();
  const status = toBlogPostStatus(row.status);
  const publishedAt =
    toSafeString(row.published_at) || (status === "published" ? createdAt : null);
  const ctaHtml = toSafeString(row.cta);
  const contentMarkdown =
    toSafeString(row.content_markdown) ||
    convertStoredBlogContentHtmlToMarkdown(toSafeString(row.content));
  const legacyCtaMarkdown = convertLegacyBlogCtaFieldsToMarkdown({
    label: toSafeString(row.cta_label),
    url: toSafeString(row.cta_url),
  }).ctaMarkdown;
  const ctaMarkdown =
    toSafeString(row.cta_markdown) ||
    legacyCtaMarkdown ||
    convertStoredBlogCtaHtmlToMarkdown(ctaHtml);

  return {
    id,
    slug,
    subject: toSafeString(row.subject),
    title,
    content: toSafeString(row.content),
    previewText: toSafeString(row.preview_text) || deriveBlogPreviewText("", contentMarkdown),
    cta: ctaHtml,
    status,
    createdAt,
    updatedAt: row.updated_at || createdAt,
    publishedAt,
    contentMarkdown,
    ctaMarkdown,
    newsletterEnabled: normalizeBoolean(row.newsletter_enabled),
    newsletterSendKey: toSafeString(row.newsletter_send_key),
  };
};

const fetchAdminRows = async (): Promise<AdminBlogPostRow[]> => {
  const client = requireSupabase();
  const { data, error } = await client
    .from(BLOG_TABLE)
    .select(ADMIN_BLOG_SELECT)
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (!error) {
    return (data as AdminBlogPostRow[] | null) ?? [];
  }

  if (isMissingSchemaError(error, ADMIN_SCHEMA_COLUMNS)) {
    const compatResult = await client
      .from(BLOG_TABLE)
      .select(ADMIN_BLOG_COMPAT_SELECT)
      .order("updated_at", { ascending: false, nullsFirst: false });

    if (!compatResult.error) {
      return (compatResult.data as AdminBlogPostRow[] | null) ?? [];
    }

    if (!isMissingSchemaError(compatResult.error, ADMIN_SCHEMA_COLUMNS)) {
      throw compatResult.error;
    }

    const legacyResult = await client
      .from(BLOG_TABLE)
      .select(ADMIN_BLOG_LEGACY_SELECT)
      .order("updated_at", { ascending: false, nullsFirst: false });

    if (legacyResult.error) {
      throw legacyResult.error;
    }

    return (legacyResult.data as AdminBlogPostRow[] | null) ?? [];
  }

  throw error;
};

const fetchAdminRowById = async (
  postId: string,
): Promise<AdminBlogPostRow | null> => {
  const client = requireSupabase();
  const { data, error } = await client
    .from(BLOG_TABLE)
    .select(ADMIN_BLOG_SELECT)
    .eq("id", postId)
    .maybeSingle();

  if (!error) {
    return (data as AdminBlogPostRow | null) ?? null;
  }

  if (isMissingSchemaError(error, ADMIN_SCHEMA_COLUMNS)) {
    const compatResult = await client
      .from(BLOG_TABLE)
      .select(ADMIN_BLOG_COMPAT_SELECT)
      .eq("id", postId)
      .maybeSingle();

    if (!compatResult.error) {
      return (compatResult.data as AdminBlogPostRow | null) ?? null;
    }

    if (!isMissingSchemaError(compatResult.error, ADMIN_SCHEMA_COLUMNS)) {
      throw compatResult.error;
    }

    const legacyResult = await client
      .from(BLOG_TABLE)
      .select(ADMIN_BLOG_LEGACY_SELECT)
      .eq("id", postId)
      .maybeSingle();

    if (legacyResult.error) {
      throw legacyResult.error;
    }

    return (legacyResult.data as AdminBlogPostRow | null) ?? null;
  }

  throw error;
};

const toSummary = (post: AdminBlogPost): AdminBlogPostSummary => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  status: post.status,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  publishedAt: post.publishedAt,
  newsletterEnabled: post.newsletterEnabled,
  newsletterSendKey: post.newsletterSendKey,
});

const sortAdminPosts = (a: AdminBlogPostSummary, b: AdminBlogPostSummary) => {
  if (a.status !== b.status) {
    return a.status === "draft" ? -1 : 1;
  }

  const aDate = new Date(a.status === "published" ? a.publishedAt || a.updatedAt : a.updatedAt).getTime();
  const bDate = new Date(b.status === "published" ? b.publishedAt || b.updatedAt : b.updatedAt).getTime();
  return bDate - aDate;
};

export async function getAdminBlogPosts(): Promise<AdminBlogPostSummary[]> {
  const rows = await fetchAdminRows();
  return rows
    .map((row) => normalizeAdminBlogPost(row))
    .filter((post): post is AdminBlogPost => Boolean(post))
    .map((post) => toSummary(post))
    .sort(sortAdminPosts);
}

export async function getAdminBlogPostById(
  postId: string,
): Promise<AdminBlogPost | undefined> {
  const normalizedId = toSafeString(postId);
  if (!normalizedId) return undefined;

  const row = await fetchAdminRowById(normalizedId);
  if (!row) return undefined;

  return normalizeAdminBlogPost(row) ?? undefined;
}

const validateAdminBlogPost = ({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) => {
  if (!title) {
    throw new Error("Title is required.");
  }

  if (!slug) {
    throw new Error("Slug is required.");
  }
};

const savePayloadFromInput = ({
  input,
  existingPost,
}: {
  input: SaveAdminBlogPostInput;
  existingPost?: AdminBlogPost;
}) => {
  const safeTitle = toSafeString(input.title);
  const safeSlug = normalizeBlogSlug(input.slug);
  validateAdminBlogPost({
    title: safeTitle,
    slug: safeSlug,
  });

  const safeSubject = toSafeString(input.subject) || safeTitle;
  const safePreviewText = toSafeString(input.previewText);
  const safeContentMarkdown = toSafeString(input.contentMarkdown);
  const safeCtaMarkdown = toSafeString(input.ctaMarkdown);
  const safeStatus = input.status === "draft" ? "draft" : "published";
  const now = new Date().toISOString();
  const storedFields = buildBlogStoredFields({
    previewText: safePreviewText,
    markdownContent: safeContentMarkdown,
    ctaMarkdown: safeCtaMarkdown,
  });

  return {
    slug: safeSlug,
    subject: safeSubject,
    title: safeTitle,
    content: storedFields.content,
    preview_text: storedFields.previewText,
    cta: storedFields.cta,
    status: safeStatus,
    published_at:
      safeStatus === "published"
        ? existingPost?.status === "published" && existingPost.publishedAt
          ? existingPost.publishedAt
          : now
        : null,
    content_markdown: safeContentMarkdown,
    cta_markdown: safeCtaMarkdown,
    newsletter_enabled: input.newsletterEnabled,
    newsletter_send_key: existingPost?.newsletterSendKey || null,
  };
};

export async function saveAdminBlogPost(
  input: SaveAdminBlogPostInput,
): Promise<AdminBlogPost> {
  const client = requireSupabase();
  const postId = toSafeString(input.postId);
  const existingPost = postId ? await getAdminBlogPostById(postId) : undefined;
  const payload = savePayloadFromInput({
    input,
    existingPost,
  });

  const query = postId
    ? client.from(BLOG_TABLE).update(payload).eq("id", postId)
    : client.from(BLOG_TABLE).insert(payload);

  const { data, error } = await query.select(ADMIN_BLOG_SELECT).single();

  if (error) {
    assertAdminSchemaError(error as SupabaseError | null);
    throw error;
  }

  const savedPost = normalizeAdminBlogPost(data as AdminBlogPostRow);
  if (!savedPost) {
    throw new Error("Saved admin blog post returned no usable record.");
  }

  return savedPost;
}

export async function deleteAdminDraftBlogPost(
  postId: string,
): Promise<AdminBlogPost> {
  const client = requireSupabase();
  const post = await getAdminBlogPostById(postId);

  if (!post) {
    throw new Error("Blog post not found.");
  }

  if (post.status !== "draft") {
    throw new Error("Only draft posts can be deleted.");
  }

  const { error } = await client.from(BLOG_TABLE).delete().eq("id", post.id);

  if (error) {
    assertAdminSchemaError(error as SupabaseError | null);

    const deleteError = error as SupabaseError;
    if (deleteError.code === "23503") {
      throw new Error(
        "This draft is still referenced by an email journey and cannot be deleted.",
      );
    }

    throw error;
  }

  return post;
}

async function persistNewsletterSendKey(postId: string, sendKey: string) {
  const client = requireSupabase();
  const { error } = await client
    .from(BLOG_TABLE)
    .update({
      newsletter_send_key: sendKey,
    })
    .eq("id", postId);

  if (error) {
    assertAdminSchemaError(error as SupabaseError | null);
    throw error;
  }
}

export const resolveNewsletterBroadcastSummary = ({
  usage,
  newsletterSendKey,
}: {
  usage: BlogPostEmailUsage;
  newsletterSendKey: string;
}) =>
  usage.broadcastSends.find((send) => send.sendKey === newsletterSendKey) ?? null;

export const deriveAdminNewsletterState = ({
  newsletterEnabled,
  newsletterSendKey,
  usage,
}: {
  newsletterEnabled: boolean;
  newsletterSendKey: string;
  usage: BlogPostEmailUsage;
}): AdminNewsletterState => {
  if (!newsletterEnabled) return "not_enabled";
  if (!newsletterSendKey) return "ready";

  const summary = resolveNewsletterBroadcastSummary({
    usage,
    newsletterSendKey,
  });

  if (!summary) return "retry_needed";
  if (summary.failedCount > 0 || summary.queuedCount > 0) {
    return "retry_needed";
  }
  if (summary.sentCount > 0) {
    return "sent";
  }

  return "retry_needed";
};

export async function sendAdminBlogPostNewsletter(
  postId: string,
): Promise<SendAdminBlogPostNewsletterResult | { status: "no_subscribers" }> {
  const post = await getAdminBlogPostById(postId);
  if (!post) {
    throw new Error("Blog post not found.");
  }
  if (post.status !== "published") {
    throw new Error("Only published posts can be sent to newsletter subscribers.");
  }
  if (!post.newsletterEnabled) {
    throw new Error("Enable the newsletter toggle before sending this post.");
  }

  const recipients = await listSubscribedNewsletterRecipients();
  if (recipients.length === 0) {
    return { status: "no_subscribers" };
  }

  const sendKey = post.newsletterSendKey || createWeeklySendKey(post.slug);
  if (!post.newsletterSendKey) {
    await persistNewsletterSendKey(post.id, sendKey);
  }

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const recipient of recipients) {
    try {
      const result = await sendTrackedBroadcastNewsletterEmailByPostId({
        sendKey,
        subscriberId: recipient.subscriberId,
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        postId: post.id,
      });

      if (result.skipped) {
        skippedCount += 1;
        continue;
      }

      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      console.error(
        `Failed to send "${sendKey}" to ${recipient.email}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  const usage = await getBlogPostEmailUsage(post.id);
  return {
    postId: post.id,
    sendKey,
    sentCount,
    skippedCount,
    failedCount,
    usage,
    newsletterState: deriveAdminNewsletterState({
      newsletterEnabled: post.newsletterEnabled,
      newsletterSendKey: sendKey,
      usage,
    }),
  };
}

export async function sendAdminBlogPostTestEmail({
  postId,
  recipientEmail,
  recipientName,
}: SendAdminBlogPostTestEmailInput): Promise<SendAdminBlogPostTestEmailResult> {
  const normalizedPostId = toSafeString(postId);
  if (!normalizedPostId) {
    throw new Error("Post ID is required.");
  }

  const normalizedRecipientEmail = toSafeString(recipientEmail);
  if (!normalizedRecipientEmail) {
    throw new Error("Test email address is required.");
  }

  const post = await getAdminBlogPostById(normalizedPostId);
  if (!post) {
    throw new Error("Blog post not found.");
  }

  assertSupportedNewsletterPersonalizationTokens(post);

  const savedRecipientProfile =
    await getSavedEmailRecipientProfileByEmail(normalizedRecipientEmail);
  const requiresLeadScore = newsletterFieldsContainPersonalizationTokens(
    post,
    EMAIL_PERSONALIZATION_SCORE_TOKENS,
  );
  const requiresResultsLink = newsletterFieldsContainPersonalizationTokens(post, [
    EMAIL_PERSONALIZATION_RESULTS_LINK_TOKEN,
  ]);

  if (
    requiresLeadScore &&
    (!savedRecipientProfile?.personalization.score ||
      !savedRecipientProfile.personalization.scoreComment)
  ) {
    throw new Error(
      `Saved lead score data is required for "${normalizedRecipientEmail}" before sending score-personalized test emails.`,
    );
  }

  const resolvedResultsLink = requiresResultsLink
    ? await resolvePersonalizedResultsLinkByEmail(
        savedRecipientProfile?.email || normalizedRecipientEmail,
      )
    : null;

  const sendResult = await sendNewsletterEmail(
    post,
    {
      toEmail: savedRecipientProfile?.email || normalizedRecipientEmail,
      name: toSafeString(recipientName) || savedRecipientProfile?.name || undefined,
      unsubscribeUrl: TEST_EMAIL_UNSUBSCRIBE_URL,
    },
    {
      ...savedRecipientProfile?.personalization,
      resultsLink: resolvedResultsLink,
    },
  );

  if (!sendResult) {
    throw new Error("EmailJS is not configured for admin test sends.");
  }

  return {
    postId: post.id,
    recipientEmail: savedRecipientProfile?.email || normalizedRecipientEmail,
  };
}
