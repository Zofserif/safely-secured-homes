export type BlogEmailAssets = {
  subject: string;
  preview_text: string;
  content: string;
  cta: string;
};

export type BlogEmailAssetDiagnostics = {
  warnings: string[];
  totalDynamicVariableBytes: number;
  nearLimit: boolean;
  overLimit: boolean;
};

export type BlogEmailAssetSource = {
  subject: string;
  title: string;
  previewText: string;
  content: string;
  cta: string;
};

export type LegacyBlogPostContentRow = {
  title?: unknown;
  excerpt?: unknown;
  content_markdown?: unknown;
  cta_label?: unknown;
  cta_url?: unknown;
};

const DEFAULT_SITE_URL = "https://www.safelysecuredhomes.com";
export const DEFAULT_BLOG_PREVIEW_TEXT =
  "Practical home security guidance for safer, smarter homes.";
const EMAILJS_VARIABLE_LIMIT_BYTES = 50 * 1024;
const EMAILJS_VARIABLE_WARNING_BYTES = 45 * 1024;
const utf8Encoder = new TextEncoder();

const normalizeSiteUrl = (input: string): string => {
  const rawValue = input.trim();
  if (!rawValue) return DEFAULT_SITE_URL;

  const withProtocol =
    rawValue.startsWith("http://") || rawValue.startsWith("https://")
      ? rawValue
      : `https://${rawValue}`;

  const url = new URL(withProtocol);
  const pathname = url.pathname.replace(/\/+$/, "");
  url.pathname = pathname || "/";

  const normalized = url.toString();
  return normalized.endsWith("/")
    ? normalized.slice(0, normalized.length - 1)
    : normalized;
};

const resolveSiteUrl = () => {
  const envSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL;

  return envSiteUrl
    ? normalizeSiteUrl(envSiteUrl)
    : process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : DEFAULT_SITE_URL;
};

const parseOptionalText = (value: unknown) =>
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

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const resolveContentHref = (href: string) => {
  const trimmedHref = href.trim();
  if (!trimmedHref) return "";

  const siteUrl = resolveSiteUrl();

  if (trimmedHref.startsWith("/")) {
    try {
      return new URL(trimmedHref, siteUrl).toString();
    } catch {
      return "";
    }
  }

  try {
    const parsedUrl = new URL(trimmedHref);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString();
    }
  } catch {
    return "";
  }

  return "";
};

const resolveCtaUrl = (value: string) => resolveContentHref(value);

const getUtf8ByteLength = (value: string) => utf8Encoder.encode(value).length;

const parseInlineMarkdownForHtml = (value: string) => {
  const siteUrl = resolveSiteUrl();
  let html = escapeHtml(value);

  html = html.replace(
    /`([^`]+)`/g,
    (_match, code: string) => `<code>${code}</code>`,
  );
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*]+)\*([^*]|$)/g, "$1<em>$2</em>$3");
  html = html.replace(/(^|[^_])_([^_]+)_([^_]|$)/g, "$1<em>$2</em>$3");
  html = html.replace(
    /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g,
    (_match, label: string, href: string) => {
      const resolvedHref = resolveContentHref(href);
      if (!resolvedHref) return label;
      const externalAttributes = resolvedHref.startsWith(siteUrl)
        ? ""
        : ' target="_blank" rel="noreferrer"';
      return `<a href="${escapeHtml(resolvedHref)}"${externalAttributes}>${label}</a>`;
    },
  );

  return html;
};

const flushParagraphBlock = (paragraphLines: string[], blocks: string[]) => {
  if (paragraphLines.length === 0) return;

  const paragraphContent = paragraphLines
    .map((line) => parseInlineMarkdownForHtml(line))
    .join("<br />")
    .trim();
  blocks.push(`<p>${paragraphContent}</p>`);
  paragraphLines.length = 0;
};

const flushListBlock = (
  listType: "ul" | "ol" | null,
  listItems: string[],
  blocks: string[],
) => {
  if (!listType || listItems.length === 0) return;

  const listTag = listType === "ul" ? "ul" : "ol";
  const itemsHtml = listItems
    .map((item) => `<li>${parseInlineMarkdownForHtml(item)}</li>`)
    .join("");

  blocks.push(`<${listTag}>${itemsHtml}</${listTag}>`);
  listItems.length = 0;
};

export const renderBlogContentHtml = (markdownContent: string) => {
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
      const headingText = parseInlineMarkdownForHtml(headingMatch[2]);
      const headingTag = headingDepth <= 2 ? "h2" : "h3";
      blocks.push(`<${headingTag}>${headingText}</${headingTag}>`);
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
        `<blockquote><p>${parseInlineMarkdownForHtml(blockquoteMatch[1])}</p></blockquote>`,
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

export const buildBlogCtaHtml = ({
  label,
  url,
}: {
  label: string;
  url: string;
}) =>
  `<div style="margin:24px 0 0 0;"><a href="${escapeHtml(
    url,
  )}" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">${escapeHtml(
    label,
  )}</a></div>`;

export const deriveBlogPreviewText = (
  excerpt: string,
  markdownContent: string,
) => {
  if (excerpt.trim()) return excerpt.trim();

  const normalizedMarkdown = stripMarkdownSyntax(markdownContent);
  if (!normalizedMarkdown) {
    return DEFAULT_BLOG_PREVIEW_TEXT;
  }

  return normalizedMarkdown.length > 160
    ? `${normalizedMarkdown.slice(0, 157)}...`
    : normalizedMarkdown;
};

export const resolveBlogCtaHtml = ({
  label,
  url,
}: {
  label: string;
  url: string;
}) => {
  const resolvedLabel = parseOptionalText(label);
  const resolvedUrl = parseOptionalText(url);
  const warnings: string[] = [];

  if (!resolvedLabel && !resolvedUrl) {
    return {
      cta: "",
      warnings,
    };
  }

  if (!resolvedLabel) {
    warnings.push("CTA label is blank. CTA field was left empty.");
    return {
      cta: "",
      warnings,
    };
  }

  if (!resolvedUrl) {
    warnings.push("CTA URL is blank. CTA field was left empty.");
    return {
      cta: "",
      warnings,
    };
  }

  const absoluteCtaUrl = resolveCtaUrl(resolvedUrl);
  if (!absoluteCtaUrl) {
    warnings.push(
      "CTA URL must be an absolute http(s) URL or a root-relative path. CTA field was left empty.",
    );
    return {
      cta: "",
      warnings,
    };
  }

  return {
    cta: buildBlogCtaHtml({
      label: resolvedLabel,
      url: absoluteCtaUrl,
    }),
    warnings,
  };
};

export const buildBlogStoredFields = ({
  previewText,
  markdownContent,
  ctaLabel,
  ctaUrl,
}: {
  previewText: string;
  markdownContent: string;
  ctaLabel: string;
  ctaUrl: string;
}) => {
  const ctaResult = resolveBlogCtaHtml({
    label: ctaLabel,
    url: ctaUrl,
  });

  return {
    previewText: deriveBlogPreviewText(previewText, markdownContent),
    content: renderBlogContentHtml(markdownContent),
    cta: ctaResult.cta,
    warnings: ctaResult.warnings,
  };
};

export const convertLegacyBlogPostToStoredFields = ({
  title,
  excerpt,
  content_markdown,
  cta_label,
  cta_url,
}: LegacyBlogPostContentRow): {
  subject: string;
  previewText: string;
  content: string;
  cta: string;
  warnings: string[];
} => {
  const resolvedTitle = parseOptionalText(title);
  const resolvedExcerpt = parseOptionalText(excerpt);
  const resolvedMarkdown = parseOptionalText(content_markdown);
  const resolvedCtaLabel = parseOptionalText(cta_label);
  const resolvedCtaUrl = parseOptionalText(cta_url);
  const markdownSource = resolvedMarkdown || resolvedExcerpt;
  const storedFields = buildBlogStoredFields({
    previewText: resolvedExcerpt,
    markdownContent: markdownSource,
    ctaLabel: resolvedCtaLabel,
    ctaUrl: resolvedCtaUrl,
  });

  return {
    subject: resolvedTitle,
    previewText: storedFields.previewText,
    content: storedFields.content,
    cta: storedFields.cta,
    warnings: storedFields.warnings,
  };
};

const stripHtmlTags = (value: string) => decodeHtmlEntities(value.replace(/<[^>]+>/g, ""));

const normalizeMarkdownWhitespace = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const convertInlineHtmlToMarkdown = (value: string): string => {
  let normalized = value.trim();

  normalized = normalized.replace(/<br\s*\/?>/gi, "\n");
  normalized = normalized.replace(
    /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_match, href: string, label: string) =>
      `[${convertInlineHtmlToMarkdown(label)}](${decodeHtmlEntities(href).trim()})`,
  );
  normalized = normalized.replace(
    /<(strong|b)>([\s\S]*?)<\/\1>/gi,
    (_match, _tag: string, content: string) =>
      `**${convertInlineHtmlToMarkdown(content)}**`,
  );
  normalized = normalized.replace(
    /<(em|i)>([\s\S]*?)<\/\1>/gi,
    (_match, _tag: string, content: string) =>
      `*${convertInlineHtmlToMarkdown(content)}*`,
  );
  normalized = normalized.replace(
    /<code>([\s\S]*?)<\/code>/gi,
    (_match, content: string) => `\`${stripHtmlTags(content).trim()}\``,
  );
  normalized = stripHtmlTags(normalized);
  return normalized
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const convertStoredBlogContentHtmlToMarkdown = (htmlContent: string) => {
  const normalizedHtml = htmlContent.trim();
  if (!normalizedHtml) return "";

  const blocks: string[] = [];
  const blockPattern = /<(h2|h3|p|ul|ol|blockquote)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null = null;

  while ((match = blockPattern.exec(normalizedHtml))) {
    const tag = match[1].toLowerCase();
    const innerHtml = match[2].trim();

    if (tag === "h2") {
      blocks.push(`## ${convertInlineHtmlToMarkdown(innerHtml)}`);
      continue;
    }

    if (tag === "h3") {
      blocks.push(`### ${convertInlineHtmlToMarkdown(innerHtml)}`);
      continue;
    }

    if (tag === "p") {
      blocks.push(convertInlineHtmlToMarkdown(innerHtml));
      continue;
    }

    if (tag === "blockquote") {
      const quoteBody = innerHtml.replace(/^<p>([\s\S]*?)<\/p>$/i, "$1");
      const quoteLines = convertInlineHtmlToMarkdown(quoteBody)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `> ${line}`)
        .join("\n");

      if (quoteLines) {
        blocks.push(quoteLines);
      }
      continue;
    }

    const itemPattern = /<li>([\s\S]*?)<\/li>/gi;
    const items: string[] = [];
    let itemMatch: RegExpExecArray | null = null;
    while ((itemMatch = itemPattern.exec(innerHtml))) {
      const itemText = convertInlineHtmlToMarkdown(itemMatch[1]);
      if (itemText) {
        items.push(itemText);
      }
    }

    if (items.length === 0) continue;

    if (tag === "ul") {
      blocks.push(items.map((item) => `- ${item}`).join("\n"));
      continue;
    }

    blocks.push(items.map((item, index) => `${index + 1}. ${item}`).join("\n"));
  }

  return normalizeMarkdownWhitespace(blocks.join("\n\n"));
};

export const parseStoredBlogCtaHtml = (ctaHtml: string) => {
  const normalizedHtml = ctaHtml.trim();
  if (!normalizedHtml) {
    return {
      label: "",
      url: "",
    };
  }

  const linkMatch = normalizedHtml.match(
    /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
  );
  if (!linkMatch) {
    return {
      label: "",
      url: "",
    };
  }

  return {
    label: stripHtmlTags(linkMatch[2]).trim(),
    url: decodeHtmlEntities(linkMatch[1]).trim(),
  };
};

export const getBlogEmailAssets = (
  post: BlogEmailAssetSource,
): BlogEmailAssets => ({
  subject: post.subject,
  preview_text: post.previewText,
  content: post.content,
  cta: post.cta,
});

export const getBlogEmailAssetDiagnostics = (
  post: BlogEmailAssetSource,
): BlogEmailAssetDiagnostics => {
  const emailAssets = getBlogEmailAssets(post);
  const warnings: string[] = [];

  if (!emailAssets.subject.trim()) {
    warnings.push("Subject is blank.");
  }
  if (!post.title.trim()) {
    warnings.push("Title is blank.");
  }
  if (!emailAssets.preview_text.trim()) {
    warnings.push("Preview text is blank.");
  }
  if (!emailAssets.content.trim()) {
    warnings.push("Content HTML is blank.");
  }

  const totalDynamicVariableBytes =
    getUtf8ByteLength(emailAssets.preview_text) +
    getUtf8ByteLength(emailAssets.content) +
    getUtf8ByteLength(emailAssets.cta);

  return {
    warnings,
    totalDynamicVariableBytes,
    nearLimit:
      totalDynamicVariableBytes >= EMAILJS_VARIABLE_WARNING_BYTES &&
      totalDynamicVariableBytes < EMAILJS_VARIABLE_LIMIT_BYTES,
    overLimit: totalDynamicVariableBytes >= EMAILJS_VARIABLE_LIMIT_BYTES,
  };
};
