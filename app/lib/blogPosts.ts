import { createClient } from "@supabase/supabase-js";
import { siteUrl } from "./site";

export type BlogEmailAssets = {
  subject: string;
  previewText: string;
  plainTextBody: string;
  htmlBody: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  markdownContent: string;
  emailAssets: BlogEmailAssets;
};

type BlogPostRow = {
  slug: string | null;
  title: string | null;
  excerpt: string | null;
  published_at: string | null;
  content_markdown?: unknown;
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

const BLOG_POST_SELECT_WITH_MARKDOWN =
  "slug,title,excerpt,published_at,content_markdown";
const BLOG_POST_SELECT_FALLBACK = "slug,title,excerpt,published_at";
const BLOG_TABLE = "blog_posts";
const FOOTER_LOGO_URL =
  "https://raw.githubusercontent.com/Zofserif/SafelySecuredHomesAssets/refs/heads/main/Safely%20Secured%20Homes%20Logo%20Footer.png";

const isMissingTableError = (error: SupabaseError | null | undefined) =>
  error?.code === "PGRST205";

const isMissingColumnError = (error: SupabaseError | null | undefined) =>
  error?.code === "PGRST204" ||
  error?.code === "42703" ||
  Boolean(error?.message?.includes("content_markdown"));

const parseMarkdownContent = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const stripMarkdownSyntax = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_~]+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const HEADING_2_STYLE =
  "font-weight:bold;margin:0 0 12px 0;font-size:22px;line-height:1.35;";
const HEADING_3_STYLE =
  "font-weight:bold;margin:0 0 10px 0;font-size:19px;line-height:1.4;";
const PARAGRAPH_STYLE = "margin:0 0 14px 0;font-weight:normal;";
const BLOCKQUOTE_STYLE =
  "margin:0 0 14px 0;padding:0 0 0 12px;border-left:4px solid #BEE9E8;";
const UNORDERED_LIST_STYLE =
  "margin:0 0 14px 24px;padding:0;list-style-type:disc;";
const ORDERED_LIST_STYLE =
  "margin:0 0 14px 24px;padding:0;list-style-type:decimal;";
const LIST_ITEM_STYLE = "margin-bottom:8px;";

const parseInlineMarkdownForEmail = (value: string) => {
  let html = escapeHtml(value);

  html = html.replace(
    /`([^`]+)`/g,
    (_match, code: string) =>
      `<code style="font-family:Courier, monospace;background-color:#EEF2F7;padding:1px 4px;border-radius:4px;">${code}</code>`,
  );
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, "$1<em>$2</em>$3");
  html = html.replace(/(^|[^_])_([^_]+)_([^_]|$)/g, "$1<em>$2</em>$3");
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_match, label: string, href: string) =>
      `<a href="${escapeHtml(href)}" target="_blank" style="color:#0E79B2;text-decoration:underline;">${label}</a>`,
  );

  return html;
};

const flushParagraphBlock = (paragraphLines: string[], blocks: string[]) => {
  if (paragraphLines.length === 0) return;

  const paragraphContent = parseInlineMarkdownForEmail(
    paragraphLines.join(" ").trim(),
  );
  blocks.push(`<p style="${PARAGRAPH_STYLE}">${paragraphContent}</p>`);
  paragraphLines.length = 0;
};

const flushListBlock = (
  listType: "ul" | "ol" | null,
  listItems: string[],
  blocks: string[],
) => {
  if (!listType || listItems.length === 0) return;

  const listTag = listType === "ul" ? "ul" : "ol";
  const listStyle =
    listType === "ul" ? UNORDERED_LIST_STYLE : ORDERED_LIST_STYLE;
  const itemsHtml = listItems
    .map(
      (item) =>
        `<li style="${LIST_ITEM_STYLE}">${parseInlineMarkdownForEmail(item)}</li>`,
    )
    .join("");

  blocks.push(`<${listTag} style="${listStyle}">${itemsHtml}</${listTag}>`);
  listItems.length = 0;
};

const renderMarkdownToEmailHtml = (markdownContent: string) => {
  const normalizedMarkdown = markdownContent.trim();
  if (!normalizedMarkdown) return "";

  const lines = normalizedMarkdown.split(/\r?\n/);
  const blocks: string[] = [];
  const paragraphLines: string[] = [];
  const listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushParagraphBlock(paragraphLines, blocks);
      flushListBlock(listType, listItems, blocks);
      listType = null;
      continue;
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraphBlock(paragraphLines, blocks);
      flushListBlock(listType, listItems, blocks);
      listType = null;

      const headingDepth = headingMatch[1].length;
      const headingText = parseInlineMarkdownForEmail(headingMatch[2]);
      const headingTag = headingDepth <= 2 ? "h3" : "h4";
      const headingStyle =
        headingDepth <= 2 ? HEADING_2_STYLE : HEADING_3_STYLE;
      blocks.push(
        `<${headingTag} style="${headingStyle}">${headingText}</${headingTag}>`,
      );
      continue;
    }

    const unorderedListMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
    if (unorderedListMatch) {
      flushParagraphBlock(paragraphLines, blocks);
      if (listType !== "ul") {
        flushListBlock(listType, listItems, blocks);
        listType = "ul";
      }
      listItems.push(unorderedListMatch[1].trim());
      continue;
    }

    const orderedListMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
    if (orderedListMatch) {
      flushParagraphBlock(paragraphLines, blocks);
      if (listType !== "ol") {
        flushListBlock(listType, listItems, blocks);
        listType = "ol";
      }
      listItems.push(orderedListMatch[1].trim());
      continue;
    }

    const blockquoteMatch = trimmedLine.match(/^>\s+(.+)$/);
    if (blockquoteMatch) {
      flushParagraphBlock(paragraphLines, blocks);
      flushListBlock(listType, listItems, blocks);
      listType = null;
      blocks.push(
        `<blockquote style="${BLOCKQUOTE_STYLE}"><p style="${PARAGRAPH_STYLE}">${parseInlineMarkdownForEmail(
          blockquoteMatch[1],
        )}</p></blockquote>`,
      );
      continue;
    }

    flushListBlock(listType, listItems, blocks);
    listType = null;
    paragraphLines.push(trimmedLine);
  }

  flushParagraphBlock(paragraphLines, blocks);
  flushListBlock(listType, listItems, blocks);

  return blocks.join("");
};

const buildBlogHtmlBody = ({
  title,
  excerpt,
  markdownContent,
}: {
  title: string;
  excerpt: string;
  markdownContent: string;
}) => {
  const excerptHtml = excerpt.trim()
    ? `<div style="padding:16px 24px 0px 24px">${renderMarkdownToEmailHtml(
        excerpt,
      )}</div>`
    : "";

  const markdownHtml = renderMarkdownToEmailHtml(markdownContent);

  const contentHtml = markdownHtml
    ? `<div style="padding:16px 24px 0px 24px">${markdownHtml}</div>`
    : "";

  return `<!doctype html>
<html>
  <body>
    <div
      style='background-color:#F5F5F5;color:#262626;font-family:"Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif;font-size:16px;font-weight:400;letter-spacing:0.15008px;line-height:1.5;margin:0;padding:32px 0;min-height:100%;width:100%'
    >
      <table
        align="center"
        width="100%"
        style="margin:0 auto;max-width:600px;background-color:#FFFFFF"
        role="presentation"
        cellspacing="0"
        cellpadding="0"
        border="0"
      >
        <tbody>
          <tr style="width:100%">
            <td>
              <h2
                style="font-weight:bold;text-align:center;margin:0;font-size:24px;padding:16px 24px 16px 24px"
              >
                ${escapeHtml(title)}
              </h2>
              ${excerptHtml}
              ${contentHtml}
              <div style="padding:0px 24px 0px 24px;text-align:center">
                <a
                  href="${escapeHtml(siteUrl)}"
                  style="text-decoration:none"
                  target="_blank"
                  ><img
                    alt="Safely Secured Homes Logo"
                    src="${FOOTER_LOGO_URL}"
                    height="70"
                    style="height:70px;outline:none;border:none;text-decoration:none;vertical-align:middle;display:inline-block;max-width:100%"
                /></a>
              </div>
              <div
                style="font-size:12px;font-weight:bold;text-align:center;padding:0px 24px 0px 24px"
              >
                Safely Secured Homes, Candelaria, Quezon, 4323, Philippines
              </div>
              <div
                style="font-size:12px;text-align:center;padding:0px 24px 0px 24px"
              >
                <a href="mailto:vallarta.troy@gmail.com" style="color:#262626">
                  Unsubscribe
                </a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>`;
};

const getPreviewText = (excerpt: string, markdownContent: string) => {
  if (excerpt.trim()) return excerpt.trim();

  const normalizedMarkdown = stripMarkdownSyntax(markdownContent);
  if (!normalizedMarkdown) {
    return "Practical home security guidance for safer, smarter homes.";
  }

  return normalizedMarkdown.length > 160
    ? `${normalizedMarkdown.slice(0, 157)}...`
    : normalizedMarkdown;
};

const buildBlogPlainTextBody = ({
  slug,
  title,
  excerpt,
  markdownContent,
}: {
  slug: string;
  title: string;
  excerpt: string;
  markdownContent: string;
}) => {
  const articleUrl = `${siteUrl}/blog/${slug}`;
  const lines: string[] = [];

  lines.push(title);
  lines.push("");

  if (excerpt.trim()) {
    lines.push(stripMarkdownSyntax(excerpt));
    lines.push("");
  }

  const plainArticleContent = stripMarkdownSyntax(markdownContent);
  if (plainArticleContent) {
    lines.push(plainArticleContent);
    lines.push("");
  }

  lines.push("Read the full article:");
  lines.push(articleUrl);
  lines.push("");
  lines.push("Safely Secured Homes");

  return lines.join("\n");
};

const buildEmailAssetsFromContent = ({
  slug,
  title,
  excerpt,
  markdownContent,
}: {
  slug: string;
  title: string;
  excerpt: string;
  markdownContent: string;
}): BlogEmailAssets => ({
  subject: title,
  previewText: getPreviewText(excerpt, markdownContent),
  plainTextBody: buildBlogPlainTextBody({ slug, title, excerpt, markdownContent }),
  htmlBody: buildBlogHtmlBody({ title, excerpt, markdownContent }),
});

const sortByPublishedDateDesc = (a: BlogPost, b: BlogPost) =>
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

const normalizeBlogPost = (row: BlogPostRow): BlogPost | null => {
  const slug = typeof row.slug === "string" ? row.slug.trim() : "";
  const title = typeof row.title === "string" ? row.title.trim() : "";
  if (!slug || !title) return null;

  const excerpt = typeof row.excerpt === "string" ? row.excerpt : "";
  const storedMarkdown = parseMarkdownContent(row.content_markdown);
  const markdownContent = storedMarkdown || excerpt.trim();

  const emailAssets = buildEmailAssetsFromContent({
    slug,
    title,
    excerpt,
    markdownContent,
  });

  return {
    slug,
    title,
    excerpt,
    publishedAt: row.published_at || new Date().toISOString(),
    markdownContent,
    emailAssets,
  };
};

const mapRowsToPosts = (rows: BlogPostRow[]): BlogPost[] =>
  rows
    .map(normalizeBlogPost)
    .filter((post): post is BlogPost => Boolean(post))
    .sort(sortByPublishedDateDesc);

export const getBlogPosts = async (): Promise<BlogPost[]> => {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping blog posts fetch.");
    return [];
  }

  const primaryResult = await supabase
    .from(BLOG_TABLE)
    .select(BLOG_POST_SELECT_WITH_MARKDOWN)
    .order("published_at", { ascending: false, nullsFirst: false });

  let data = primaryResult.data as BlogPostRow[] | null;
  let error = primaryResult.error as SupabaseError | null;

  if (error && isMissingColumnError(error)) {
    const fallbackResult = await supabase
      .from(BLOG_TABLE)
      .select(BLOG_POST_SELECT_FALLBACK)
      .order("published_at", { ascending: false, nullsFirst: false });

    data = fallbackResult.data as BlogPostRow[] | null;
    error = fallbackResult.error as SupabaseError | null;
  }

  if (error) {
    if (isMissingTableError(error)) {
      console.warn(`Supabase table "${BLOG_TABLE}" not found yet.`);
      return [];
    }
    console.error("Failed to fetch blog posts:", error);
    return [];
  }

  return mapRowsToPosts(data ?? []);
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

  const primaryResult = await supabase
    .from(BLOG_TABLE)
    .select(BLOG_POST_SELECT_WITH_MARKDOWN)
    .eq("slug", normalizedSlug)
    .maybeSingle();

  let data = primaryResult.data as BlogPostRow | null;
  let error = primaryResult.error as SupabaseError | null;

  if (error && isMissingColumnError(error)) {
    const fallbackResult = await supabase
      .from(BLOG_TABLE)
      .select(BLOG_POST_SELECT_FALLBACK)
      .eq("slug", normalizedSlug)
      .maybeSingle();

    data = fallbackResult.data as BlogPostRow | null;
    error = fallbackResult.error as SupabaseError | null;
  }

  if (error) {
    if (isMissingTableError(error)) {
      console.warn(`Supabase table "${BLOG_TABLE}" not found yet.`);
      return undefined;
    }
    console.error("Failed to fetch blog post by slug:", error);
    return undefined;
  }

  if (!data) return undefined;
  return normalizeBlogPost(data) ?? undefined;
};

export const getBlogSlugs = async (): Promise<string[]> => {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping blog slugs fetch.");
    return [];
  }

  const { data, error } = await supabase
    .from(BLOG_TABLE)
    .select("slug")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    if (isMissingTableError(error)) {
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
