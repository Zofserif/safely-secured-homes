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

export type BlogPost = BlogEmailAssetSource & {
  id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
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

type SupabaseError = {
  code?: string;
  message?: string;
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
let hasWarnedMissingBlogPostSchema = false;

const isMissingTableError = (error: SupabaseError | null | undefined) =>
  error?.code === "PGRST205";

const isMissingBlogPostSchemaError = (
  error: SupabaseError | null | undefined,
) => {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  const message = error.message?.toLowerCase() ?? "";
  return BLOG_POST_REQUIRED_COLUMNS.some((column) =>
    message.includes(column.toLowerCase()),
  );
};

const warnMissingBlogPostSchema = () => {
  if (hasWarnedMissingBlogPostSchema) return;
  hasWarnedMissingBlogPostSchema = true;
  console.warn(
    'Supabase "blog_posts" is still on the legacy schema. Run supabase/blog_posts.sql, then npm run backfill:blog-posts, and rerun supabase/blog_posts.sql to finish the migration.',
  );
};

const parseOptionalText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const sortByCreatedDateDesc = (a: BlogPost, b: BlogPost) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

const normalizeBlogPost = (row: BlogPostRow): BlogPost | null => {
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

const mapRowsToPosts = (rows: BlogPostRow[]): BlogPost[] =>
  rows
    .map((row) => normalizeBlogPost(row))
    .filter((post): post is BlogPost => Boolean(post))
    .sort(sortByCreatedDateDesc);

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

  return mapRowsToPosts((data as BlogPostRow[] | null) ?? []);
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
  return normalizeBlogPost(data as BlogPostRow) ?? undefined;
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
  return normalizeBlogPost(data as BlogPostRow) ?? undefined;
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
