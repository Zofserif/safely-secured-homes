import { publicSiteUrl } from "./site.ts";

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
  cta_markdown?: unknown;
  cta_label?: unknown;
  cta_url?: unknown;
};

export const DEFAULT_BLOG_PREVIEW_TEXT =
  "Practical home security guidance for safer, smarter homes.";
const EMAILJS_VARIABLE_LIMIT_BYTES = 50 * 1024;
const EMAILJS_VARIABLE_WARNING_BYTES = 45 * 1024;
const utf8Encoder = new TextEncoder();

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

  if (trimmedHref.startsWith("/")) {
    try {
      return new URL(trimmedHref, publicSiteUrl).toString();
    } catch {
      return "";
    }
  }

  try {
    const parsedUrl = new URL(trimmedHref);
    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return trimmedHref;
    }
  } catch {
    return "";
  }

  return "";
};

const getUtf8ByteLength = (value: string) => utf8Encoder.encode(value).length;

const CONTENT_PARAGRAPH_STYLE =
  "margin:0;color:#334155;font-size:16px;line-height:28px;";
const CONTENT_HEADING_TWO_STYLE =
  "margin:0;color:#1F2937;font-size:32px;font-weight:700;line-height:38px;";
const CONTENT_HEADING_THREE_STYLE =
  "margin:0;color:#1F2937;font-size:28px;font-weight:700;line-height:34px;";
const CONTENT_UNORDERED_LIST_STYLE =
  "margin:0;padding-left:20px;color:#334155;font-size:16px;line-height:28px;list-style-type:disc;";
const CONTENT_ORDERED_LIST_STYLE =
  "margin:0;padding-left:20px;color:#334155;font-size:16px;line-height:28px;list-style-type:decimal;";
const CONTENT_LIST_ITEM_STYLE = "margin:0;";
const CONTENT_BLOCKQUOTE_STYLE =
  "margin:0;padding-left:16px;border-left:4px solid #BEE9E8;color:#475569;font-size:16px;line-height:28px;";
const CONTENT_SPACER_STYLE =
  "display:block;margin:0;height:28px;line-height:28px;font-size:16px;";
const CONTENT_CENTERED_PARAGRAPH_STYLE = `${CONTENT_PARAGRAPH_STYLE}text-align:center;`;
const CONTENT_SPACER_MARKER = 'data-ssh-spacer="true"';
const CONTENT_CENTER_MARKER = 'data-ssh-center="true"';
const CONTENT_CENTER_CONTAINER_STYLE = "margin:0;padding:0;text-align:center;";
const CENTER_MARKDOWN_OPEN_TAG = "[center]";
const CENTER_MARKDOWN_CLOSE_TAG = "[/center]";
const RESULTS_LINK_MARKDOWN_HREF = "{results_link}";

const parseInlineMarkdownForHtml = (value: string) => {
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
    /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+|\{results_link\})\)/g,
    (_match, label: string, href: string) => {
      if (href === RESULTS_LINK_MARKDOWN_HREF) {
        return `<a href="${escapeHtml(
          href,
        )}" style="color:#0E79B2;font-weight:600;text-decoration:underline;">${label}</a>`;
      }

      const resolvedHref = resolveContentHref(href);
      if (!resolvedHref) return label;
      const externalAttributes = resolvedHref.startsWith(publicSiteUrl)
        ? ""
        : ' target="_blank" rel="noreferrer"';
      return `<a href="${escapeHtml(
        resolvedHref,
      )}"${externalAttributes} style="color:#0E79B2;font-weight:600;text-decoration:underline;">${label}</a>`;
    },
  );

  return html;
};

const createSpacerBlock = (tagName: "div" | "span" = "div") =>
  `<${tagName} ${CONTENT_SPACER_MARKER} style="${CONTENT_SPACER_STYLE}">&nbsp;</${tagName}>`;

const stripCenterMarkdownTags = (value: string) =>
  value
    .replaceAll(CENTER_MARKDOWN_OPEN_TAG, "")
    .replaceAll(CENTER_MARKDOWN_CLOSE_TAG, "");

const flushParagraphBlock = (
  paragraphLines: string[],
  blocks: string[],
  paragraphStyle = CONTENT_PARAGRAPH_STYLE,
) => {
  if (paragraphLines.length === 0) return;

  const paragraphContent = paragraphLines
    .map((line) => parseInlineMarkdownForHtml(line))
    .join("<br />")
    .trim();
  blocks.push(`<p style="${paragraphStyle}">${paragraphContent}</p>`);
  paragraphLines.length = 0;
};

const renderParagraphOnlyBlocks = ({
  lines,
  paragraphStyle = CONTENT_PARAGRAPH_STYLE,
  spacerTagName = "div",
}: {
  lines: string[];
  paragraphStyle?: string;
  spacerTagName?: "div" | "span";
}) => {
  const blocks: string[] = [];
  const paragraphLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushParagraphBlock(paragraphLines, blocks, paragraphStyle);
      blocks.push(createSpacerBlock(spacerTagName));
      continue;
    }

    paragraphLines.push(trimmedLine);
  }

  flushParagraphBlock(paragraphLines, blocks, paragraphStyle);
  return blocks;
};

const renderCenteredBlock = (lines: string[]) => {
  const centeredBlocks = renderParagraphOnlyBlocks({
    lines,
    paragraphStyle: CONTENT_CENTERED_PARAGRAPH_STYLE,
    spacerTagName: "span",
  });

  if (centeredBlocks.length === 0) return "";

  return `<div ${CONTENT_CENTER_MARKER} style="${CONTENT_CENTER_CONTAINER_STYLE}">${centeredBlocks.join("")}</div>`;
};

const findMatchingCenterCloseLine = (lines: string[], startIndex: number) => {
  for (let index = startIndex; index < lines.length; index += 1) {
    if (lines[index].trim() === CENTER_MARKDOWN_CLOSE_TAG) {
      return index;
    }
  }

  return -1;
};

const flushListBlock = (
  listType: "ul" | "ol" | null,
  listItems: string[],
  blocks: string[],
) => {
  if (!listType || listItems.length === 0) return;

  const listTag = listType === "ul" ? "ul" : "ol";
  const listStyle =
    listType === "ul" ? CONTENT_UNORDERED_LIST_STYLE : CONTENT_ORDERED_LIST_STYLE;
  const itemsHtml = listItems
    .map(
      (item) =>
        `<li style="${CONTENT_LIST_ITEM_STYLE}">${parseInlineMarkdownForHtml(item)}</li>`,
    )
    .join("");

  blocks.push(`<${listTag} style="${listStyle}">${itemsHtml}</${listTag}>`);
  listItems.length = 0;
};

const renderBlogMarkdownHtml = (
  markdownContent: string,
  {
    enableCenteredBlocks = false,
  }: {
    enableCenteredBlocks?: boolean;
  } = {},
) => {
  const normalizedMarkdown = markdownContent.replace(/\r\n/g, "\n");
  if (!normalizedMarkdown.trim()) return "";

  const lines = normalizedMarkdown.split("\n");
  const blocks: string[] = [];
  const paragraphLines: string[] = [];
  const listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (
      enableCenteredBlocks &&
      trimmedLine.startsWith(CENTER_MARKDOWN_OPEN_TAG) &&
      trimmedLine.endsWith(CENTER_MARKDOWN_CLOSE_TAG)
    ) {
      const centerCloseIndex = trimmedLine.lastIndexOf(CENTER_MARKDOWN_CLOSE_TAG);
      const centeredLine = trimmedLine
        .slice(CENTER_MARKDOWN_OPEN_TAG.length, centerCloseIndex)
        .trim();
      const centeredBlock = centeredLine.length > 0 ? renderCenteredBlock([centeredLine]) : "";
      if (centeredBlock) {
        flushParagraphBlock(paragraphLines, blocks);
        flushListBlock(listType, listItems, blocks);
        listType = null;
        blocks.push(centeredBlock);
        continue;
      }
    }

    if (enableCenteredBlocks && trimmedLine === CENTER_MARKDOWN_OPEN_TAG) {
      const closingIndex = findMatchingCenterCloseLine(lines, index + 1);
      if (closingIndex !== -1) {
        const centeredBlock = renderCenteredBlock(lines.slice(index + 1, closingIndex));
        if (centeredBlock) {
          flushParagraphBlock(paragraphLines, blocks);
          flushListBlock(listType, listItems, blocks);
          listType = null;
          blocks.push(centeredBlock);
          index = closingIndex;
          continue;
        }
      }
    }

    if (!trimmedLine) {
      flushParagraphBlock(paragraphLines, blocks);
      flushListBlock(listType, listItems, blocks);
      listType = null;
      blocks.push(createSpacerBlock());
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
      const headingStyle =
        headingTag === "h2" ? CONTENT_HEADING_TWO_STYLE : CONTENT_HEADING_THREE_STYLE;
      blocks.push(`<${headingTag} style="${headingStyle}">${headingText}</${headingTag}>`);
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
        `<blockquote style="${CONTENT_BLOCKQUOTE_STYLE}">${parseInlineMarkdownForHtml(
          blockquoteMatch[1],
        )}</blockquote>`,
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

export const renderBlogContentHtml = (markdownContent: string) =>
  renderBlogMarkdownHtml(markdownContent, { enableCenteredBlocks: true });

export const renderBlogCtaMarkdownHtml = (ctaMarkdown: string) =>
  renderBlogMarkdownHtml(ctaMarkdown);

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

  const normalizedMarkdown = stripMarkdownSyntax(
    stripCenterMarkdownTags(markdownContent),
  );
  if (!normalizedMarkdown) {
    return DEFAULT_BLOG_PREVIEW_TEXT;
  }

  return normalizedMarkdown.length > 160
    ? `${normalizedMarkdown.slice(0, 157)}...`
    : normalizedMarkdown;
};

export const convertLegacyBlogCtaFieldsToMarkdown = ({
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
      ctaMarkdown: "",
      warnings,
    };
  }

  if (!resolvedLabel) {
    warnings.push("CTA label is blank. CTA field was left empty.");
    return {
      ctaMarkdown: "",
      warnings,
    };
  }

  if (!resolvedUrl) {
    warnings.push("CTA URL is blank. CTA field was left empty.");
    return {
      ctaMarkdown: "",
      warnings,
    };
  }

  const resolvedCtaUrl = resolveContentHref(resolvedUrl);
  if (!resolvedCtaUrl) {
    warnings.push(
      "CTA URL should be an absolute http(s) URL or a root-relative path. Generated markdown may need manual review.",
    );
  }

  return {
    ctaMarkdown: `[${resolvedLabel}](${resolvedCtaUrl || resolvedUrl})`,
    warnings,
  };
};

export const resolveBlogCtaHtml = ({
  markdown,
}: {
  markdown: string;
}) => ({
  cta: renderBlogCtaMarkdownHtml(parseOptionalText(markdown)),
  warnings: [] as string[],
});

export const buildBlogStoredFields = ({
  previewText,
  markdownContent,
  ctaMarkdown,
}: {
  previewText: string;
  markdownContent: string;
  ctaMarkdown: string;
}) => {
  const ctaResult = resolveBlogCtaHtml({
    markdown: ctaMarkdown,
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
  cta_markdown,
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
  const resolvedCtaMarkdown = parseOptionalText(cta_markdown);
  const resolvedCtaLabel = parseOptionalText(cta_label);
  const resolvedCtaUrl = parseOptionalText(cta_url);
  const markdownSource = resolvedMarkdown || resolvedExcerpt;
  const legacyCta = convertLegacyBlogCtaFieldsToMarkdown({
    label: resolvedCtaLabel,
    url: resolvedCtaUrl,
  });
  const storedFields = buildBlogStoredFields({
    previewText: resolvedExcerpt,
    markdownContent: markdownSource,
    ctaMarkdown: resolvedCtaMarkdown || legacyCta.ctaMarkdown,
  });

  return {
    subject: resolvedTitle,
    previewText: storedFields.previewText,
    content: storedFields.content,
    cta: storedFields.cta,
    warnings: [...legacyCta.warnings, ...storedFields.warnings],
  };
};

const stripHtmlTags = (value: string) => decodeHtmlEntities(value.replace(/<[^>]+>/g, ""));

const normalizeMarkdownWhitespace = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
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

const convertStoredBlogHtmlToMarkdown = (
  htmlContent: string,
  {
    preserveCenteredBlocks = false,
  }: {
    preserveCenteredBlocks?: boolean;
  } = {},
) => {
  const normalizedHtml = htmlContent.trim();
  if (!normalizedHtml) return "";

  const blocks: string[] = [];
  const blockPattern =
    /<div[^>]*data-ssh-center="true"[^>]*>([\s\S]*?)<\/div>|<(?:div|span)[^>]*data-ssh-spacer="true"[^>]*>[\s\S]*?<\/(?:div|span)>|<(h2|h3|p|ul|ol|blockquote)(?:\s[^>]*)?>([\s\S]*?)<\/\2>/gi;
  let match: RegExpExecArray | null = null;

  while ((match = blockPattern.exec(normalizedHtml))) {
    if (match[0].includes(CONTENT_CENTER_MARKER)) {
      const centeredMarkdown = convertStoredBlogHtmlToMarkdown(match[1] || "", {
        preserveCenteredBlocks,
      });
      if (!centeredMarkdown) continue;

      if (!preserveCenteredBlocks) {
        blocks.push(centeredMarkdown);
        continue;
      }

      blocks.push(
        centeredMarkdown.includes("\n")
          ? `${CENTER_MARKDOWN_OPEN_TAG}\n${centeredMarkdown}\n${CENTER_MARKDOWN_CLOSE_TAG}`
          : `${CENTER_MARKDOWN_OPEN_TAG}${centeredMarkdown}${CENTER_MARKDOWN_CLOSE_TAG}`,
      );
      continue;
    }

    if (match[0].includes(CONTENT_SPACER_MARKER)) {
      blocks.push("");
      continue;
    }

    const tag = match[2].toLowerCase();
    const innerHtml = (match[3] || "").trim();

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
      const quoteBody = innerHtml.replace(/^<p(?:\s[^>]*)?>([\s\S]*?)<\/p>$/i, "$1");
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

    const itemPattern = /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi;
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

  return normalizeMarkdownWhitespace(blocks.join("\n"));
};

export const convertStoredBlogContentHtmlToMarkdown = (htmlContent: string) =>
  convertStoredBlogHtmlToMarkdown(htmlContent, { preserveCenteredBlocks: true });

export const convertStoredBlogCtaHtmlToMarkdown = (ctaHtml: string) => {
  const normalizedHtml = ctaHtml.trim();
  if (!normalizedHtml) return "";

  const convertedBlocks = convertStoredBlogHtmlToMarkdown(normalizedHtml);
  if (convertedBlocks) {
    return convertedBlocks;
  }

  const divWrappedMatch = normalizedHtml.match(/^<div[^>]*>([\s\S]+)<\/div>$/i);
  const inlineSource = divWrappedMatch?.[1]?.trim() || normalizedHtml;
  return normalizeMarkdownWhitespace(convertInlineHtmlToMarkdown(inlineSource));
};

export type BlogStoredHtmlBackfillSource = {
  content?: string | null;
  cta?: string | null;
  contentMarkdown?: string | null;
  ctaMarkdown?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

export const buildBlogStoredHtmlBackfillFields = ({
  content,
  cta,
  contentMarkdown,
  ctaMarkdown,
  ctaLabel,
  ctaUrl,
}: BlogStoredHtmlBackfillSource) => {
  const resolvedContentMarkdown =
    parseOptionalText(contentMarkdown) ||
    convertStoredBlogContentHtmlToMarkdown(parseOptionalText(content));
  const legacyCta = convertLegacyBlogCtaFieldsToMarkdown({
    label: parseOptionalText(ctaLabel),
    url: parseOptionalText(ctaUrl),
  });
  const resolvedCtaMarkdown =
    parseOptionalText(ctaMarkdown) ||
    legacyCta.ctaMarkdown ||
    convertStoredBlogCtaHtmlToMarkdown(parseOptionalText(cta));
  const storedFields = buildBlogStoredFields({
    previewText: "",
    markdownContent: resolvedContentMarkdown,
    ctaMarkdown: resolvedCtaMarkdown,
  });

  return {
    contentMarkdown: resolvedContentMarkdown,
    ctaMarkdown: resolvedCtaMarkdown,
    content: storedFields.content,
    cta: storedFields.cta,
  };
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
