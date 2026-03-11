import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const blogPostsModule = (await import(
  new URL("../app/lib/blogPostContent.ts", import.meta.url).href
)) as typeof import("../app/lib/blogPostContent");

const { convertLegacyBlogPostToStoredFields } = blogPostsModule;

type LegacyBlogPostRow = {
  id: string | null;
  slug: string | null;
  title: string | null;
  excerpt: string | null;
  content_markdown: string | null;
  cta_label: string | null;
  cta_url: string | null;
  subject: string | null;
  preview_text: string | null;
  content: string | null;
  cta: string | null;
};

const ENV_FILES = [".env.local", ".env"];
const BATCH_SIZE = 50;

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

const isSameText = (left: string | null, right: string) =>
  (left ?? "").trim() === right.trim();

loadEnvFiles();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Load your Supabase env vars before running the backfill.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const { data, error } = await supabase
  .from("blog_posts")
  .select(
    "id,slug,title,excerpt,content_markdown,cta_label,cta_url,subject,preview_text,content,cta",
  )
  .order("created_at", { ascending: false, nullsFirst: false });

if (error) {
  if (error.code === "42703" || error.code === "PGRST204") {
    throw new Error(
      "Supabase blog_posts is still on the legacy schema. Run supabase/blog_posts.sql first, then rerun this backfill command.",
    );
  }
  throw new Error(`Failed to load blog posts for backfill: ${error.message}`);
}

const rows = (data ?? []) as LegacyBlogPostRow[];
const updates: Array<{
  id: string;
  subject: string;
  preview_text: string;
  content: string;
  cta: string;
}> = [];
const warnings: string[] = [];

for (const row of rows) {
  if (!row.id) {
    warnings.push("Skipped a blog post row without an id.");
    continue;
  }

  const converted = convertLegacyBlogPostToStoredFields({
    title: row.title,
    excerpt: row.excerpt,
    content_markdown: row.content_markdown,
    cta_label: row.cta_label,
    cta_url: row.cta_url,
  });

  for (const warning of converted.warnings) {
    warnings.push(`${row.slug ?? row.id}: ${warning}`);
  }

  const shouldUpdate =
    !isSameText(row.subject, converted.subject) ||
    !isSameText(row.preview_text, converted.previewText) ||
    !isSameText(row.content, converted.content) ||
    !isSameText(row.cta, converted.cta);

  if (!shouldUpdate) continue;

  updates.push({
    id: row.id,
    subject: converted.subject,
    preview_text: converted.previewText,
    content: converted.content,
    cta: converted.cta,
  });
}

console.log(
  `Scanned ${rows.length} blog posts. ${updates.length} row(s) require backfill.${dryRun ? " Dry run only." : ""}`,
);

if (warnings.length > 0) {
  console.log("Warnings:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

if (dryRun || updates.length === 0) {
  process.exit(0);
}

for (let index = 0; index < updates.length; index += BATCH_SIZE) {
  const batch = updates.slice(index, index + BATCH_SIZE);
  const { error: batchError } = await supabase
    .from("blog_posts")
    .upsert(batch, { onConflict: "id" });

  if (batchError) {
    throw new Error(`Failed to backfill blog posts: ${batchError.message}`);
  }
}

console.log(`Backfilled ${updates.length} blog post row(s).`);
