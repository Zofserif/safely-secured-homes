import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { renderBlogContentHtml } from "../app/lib/blogPostContent.ts";

type BlogContentBackfillRow = {
  id: string | null;
  slug: string | null;
  content: string | null;
  content_markdown: string | null;
};

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

const toSafeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const isSameText = (left: string | null, right: string) =>
  (left ?? "").trim() === right.trim();

loadEnvFiles();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Load your Supabase env vars before running this backfill.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const { data, error } = await supabase
  .from("blog_posts")
  .select("id,slug,content,content_markdown")
  .order("updated_at", { ascending: false, nullsFirst: false });

if (error) {
  if (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205"
  ) {
    throw new Error(
      "Supabase blog_posts is missing the admin blog schema. Run supabase/blog_posts.sql and npm run backfill:blog-admin-fields first.",
    );
  }

  throw new Error(
    `Failed to load blog posts for content backfill: ${error.message}`,
  );
}

const rows = (data as BlogContentBackfillRow[] | null) ?? [];
const updates: Array<{ id: string; slug: string; content: string }> = [];
let skippedBlankMarkdownCount = 0;

for (const row of rows) {
  const rowId = toSafeString(row.id);
  const rowSlug = toSafeString(row.slug) || rowId;
  const markdownContent = toSafeString(row.content_markdown);

  if (!rowId) {
    console.log("Skipping row without an id.");
    continue;
  }

  if (!markdownContent) {
    skippedBlankMarkdownCount += 1;
    console.log(`Skipping ${rowSlug}: content_markdown is blank.`);
    continue;
  }

  const nextContent = renderBlogContentHtml(markdownContent);
  if (isSameText(row.content, nextContent)) {
    continue;
  }

  updates.push({
    id: rowId,
    slug: rowSlug,
    content: nextContent,
  });
}

console.log(
  `Scanned ${rows.length} blog posts. ${updates.length} row(s) require content regeneration.${dryRun ? " Dry run only." : ""}`,
);
console.log(`Skipped for blank content_markdown: ${skippedBlankMarkdownCount}`);

if (dryRun || updates.length === 0) {
  process.exit(0);
}

for (const update of updates) {
  const { error: updateError } = await supabase
    .from("blog_posts")
    .update({
      content: update.content,
    })
    .eq("id", update.id);

  if (updateError) {
    throw new Error(
      `Failed to update ${update.slug}: ${updateError.message}`,
    );
  }

  console.log(`Updated ${update.slug}`);
}

console.log(`Backfilled ${updates.length} blog post row(s).`);
