import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const blogPostContentModule = (await import(
  new URL("../app/lib/blogPostContent.ts", import.meta.url).href
)) as typeof import("../app/lib/blogPostContent");

const {
  convertLegacyBlogCtaFieldsToMarkdown,
  convertStoredBlogContentHtmlToMarkdown,
  convertStoredBlogCtaHtmlToMarkdown,
} = blogPostContentModule;

const ENV_FILES = [".env.local", ".env"];

const loadEnvFiles = () => {
  for (const envFile of ENV_FILES) {
    const fullPath = path.resolve(process.cwd(), envFile);
    if (!existsSync(fullPath)) continue;

    const fileContents = readFileSync(fullPath, "utf8");
    for (const rawLine of fileContents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const normalizedLine = line.startsWith("export ")
        ? line.slice("export ".length)
        : line;
      const separatorIndex = normalizedLine.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = normalizedLine.slice(0, separatorIndex).trim();
      if (!key || process.env[key] !== undefined) continue;

      let value = normalizedLine.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value.replace(/\\n/g, "\n");
    }
  }
};

type BlogAdminBackfillRow = {
  id: string | null;
  slug: string | null;
  content: string | null;
  cta: string | null;
  content_markdown?: string | null;
  cta_markdown?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
};

const toSafeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

loadEnvFiles();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env/.env.local.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const { data, error } = await supabase
  .from("blog_posts")
  .select("id,slug,content,cta,content_markdown,cta_markdown,cta_label,cta_url")
  .order("created_at", { ascending: true, nullsFirst: false });

if (error) {
  throw error;
}

const rows = (data as BlogAdminBackfillRow[] | null) ?? [];
let updatedCount = 0;
let skippedCount = 0;

for (const row of rows) {
  const rowId = toSafeString(row.id);
  const rowSlug = toSafeString(row.slug);
  if (!rowId || !rowSlug) {
    skippedCount += 1;
    continue;
  }

  const currentMarkdown = toSafeString(row.content_markdown);
  const currentCtaMarkdown = toSafeString(row.cta_markdown);
  const currentCtaLabel = toSafeString(row.cta_label);
  const currentCtaUrl = toSafeString(row.cta_url);
  const derivedMarkdown =
    currentMarkdown || convertStoredBlogContentHtmlToMarkdown(toSafeString(row.content));
  const derivedCtaMarkdown =
    currentCtaMarkdown ||
    convertLegacyBlogCtaFieldsToMarkdown({
      label: currentCtaLabel,
      url: currentCtaUrl,
    }).ctaMarkdown ||
    convertStoredBlogCtaHtmlToMarkdown(toSafeString(row.cta));

  const nextMarkdown = currentMarkdown || derivedMarkdown;
  const nextCtaMarkdown = currentCtaMarkdown || derivedCtaMarkdown;

  if (
    nextMarkdown === currentMarkdown &&
    nextCtaMarkdown === currentCtaMarkdown
  ) {
    skippedCount += 1;
    continue;
  }

  const { error: updateError } = await supabase
    .from("blog_posts")
    .update({
      content_markdown: nextMarkdown,
      cta_markdown: nextCtaMarkdown,
    })
    .eq("id", rowId);

  if (updateError) {
    throw updateError;
  }

  updatedCount += 1;
  console.log(`Backfilled admin source fields for ${rowSlug}`);
}

console.log(`Rows updated: ${updatedCount}`);
console.log(`Rows skipped: ${skippedCount}`);
