import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const emailPersonalizationModule = (await import(
  new URL("../app/lib/emailPersonalization.ts", import.meta.url).href
)) as typeof import("../app/lib/emailPersonalization");

const contactNameModule = (await import(
  new URL("../app/lib/contactName.ts", import.meta.url).href
)) as typeof import("../app/lib/contactName");
const blogPostContentModule = (await import(
  new URL("../app/lib/blogPostContent.ts", import.meta.url).href
)) as typeof import("../app/lib/blogPostContent");

const {
  DEFAULT_EMAIL_PERSONALIZATION_NAME,
  personalizeNewsletterFields,
  resolveEmailPersonalizationName,
} = emailPersonalizationModule;
const { deriveNameFromEmail } = contactNameModule;
const { renderBlogCtaMarkdownHtml } = blogPostContentModule;

const authoredFields = {
  subject: "This is the best offer {name} for {name}",
  title: "Congrats, {name}",
  previewText: "Hi {name}, this one is for you.",
  content:
    '<p>Congrats! {name}</p><p><a href="https://example.com/{name}">See {name}\'s offer</a></p>',
  cta: renderBlogCtaMarkdownHtml("Claim for [{name}](https://example.com/{name})"),
};

const personalizedFields = personalizeNewsletterFields(authoredFields, {
  name: 'Lemon & <Team>',
});

assert.equal(
  personalizedFields.subject,
  "This is the best offer Lemon & <Team> for Lemon & <Team>",
  "plain-text fields should replace every {name} token",
);
assert.equal(
  personalizedFields.title,
  "Congrats, Lemon & <Team>",
  "title should personalize with the provided recipient name",
);
assert.equal(
  personalizedFields.previewText,
  "Hi Lemon & <Team>, this one is for you.",
  "preview text should personalize with the provided recipient name",
);
assert.equal(
  personalizedFields.content,
  '<p>Congrats! Lemon &amp; &lt;Team&gt;</p><p><a href="https://example.com/{name}">See Lemon &amp; &lt;Team&gt;\'s offer</a></p>',
  "HTML personalization should escape inserted values and leave href attributes literal",
);
assert.equal(
  personalizedFields.cta,
  '<p>Claim for <a href="https://example.com/{name}" target="_blank" rel="noreferrer">Lemon &amp; &lt;Team&gt;</a></p>',
  "CTA personalization should affect visible copy without mutating the URL",
);

const publicFallbackFields = personalizeNewsletterFields(authoredFields);
const publicVisibleCopy = `${publicFallbackFields.content} ${publicFallbackFields.cta}`
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();
assert.equal(
  resolveEmailPersonalizationName(),
  DEFAULT_EMAIL_PERSONALIZATION_NAME,
  "missing names should resolve to the shared fallback",
);
assert.ok(
  !publicFallbackFields.subject.includes("{name}") &&
    !publicFallbackFields.title.includes("{name}") &&
    !publicFallbackFields.previewText.includes("{name}") &&
    !publicVisibleCopy.includes("{name}"),
  "public fallback personalization should remove literal {name} tokens from visible public copy",
);
assert.ok(
  publicFallbackFields.subject.includes(DEFAULT_EMAIL_PERSONALIZATION_NAME),
  "public fallback should use the default placeholder name",
);

const derivedRecipientName = deriveNameFromEmail("lemon.squeezy@example.com");
assert.equal(
  derivedRecipientName,
  "Lemon",
  "recipient names should continue deriving from the email address when missing",
);
const sendTimeFields = personalizeNewsletterFields(authoredFields, {
  name: derivedRecipientName,
});
assert.equal(
  sendTimeFields.subject,
  "This is the best offer Lemon for Lemon",
  "send-time personalization should use the derived recipient name",
);
assert.equal(
  sendTimeFields.previewText,
  "Hi Lemon, this one is for you.",
  "send-time personalization should cover preview text with the derived name",
);
assert.match(
  sendTimeFields.content,
  /Congrats! Lemon/,
  "send-time personalization should cover HTML email body content",
);
const sendTimeVisibleCtaCopy = sendTimeFields.cta
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();
assert.match(
  sendTimeVisibleCtaCopy,
  /Claim for Lemon/,
  "send-time personalization should cover CTA copy",
);
assert.match(
  sendTimeFields.cta,
  /href="https:\/\/example\.com\/\{name\}"/,
  "send-time CTA URLs should remain literal even when the label contains {name}",
);

const blogPostsSource = readFileSync(
  new URL("../app/lib/blogPosts.ts", import.meta.url),
  "utf8",
);
const emailSource = readFileSync(
  new URL("../app/lib/email.ts", import.meta.url),
  "utf8",
);
const getBlogPostByIdSection = blogPostsSource.slice(
  blogPostsSource.indexOf("export const getBlogPostById"),
  blogPostsSource.indexOf("export const getBlogPostEmailUsage"),
);

assert.match(
  emailSource,
  /resolveRecipient[\s\S]*deriveNameFromEmail\(normalizedRecipientEmail\)/,
  "newsletter email params should continue deriving recipient names from email when missing",
);
assert.match(
  emailSource,
  /buildNewsletterTemplateParams[\s\S]*personalizeNewsletterFields\(post,\s*\{\s*name:\s*resolvedRecipient\.name,\s*\}\)/,
  "newsletter template params should personalize blog-managed fields before sending",
);
assert.match(
  emailSource,
  /buildNewsletterTemplateParams[\s\S]*cta:\s*buildEmailCtaWithFooter\(\s*personalizedPost\.cta,\s*recipient\.unsubscribeUrl/,
  "newsletter template params should append the shared footer after CTA personalization",
);

assert.match(
  blogPostsSource,
  /export const getBlogPosts[\s\S]*applyPublicBlogPersonalization/,
  "public blog listings should apply fallback personalization",
);
assert.match(
  blogPostsSource,
  /export const getBlogPostBySlug[\s\S]*applyPublicBlogPersonalization/,
  "public blog detail fetches should apply fallback personalization",
);
assert.doesNotMatch(
  getBlogPostByIdSection,
  /applyPublicBlogPersonalization/,
  "raw blog fetch-by-id should stay unpersonalized for send-time rendering",
);

const adminBlogSource = readFileSync(
  new URL("../app/admin/blog/page.tsx", import.meta.url),
  "utf8",
);
const emailAssetsPanelSource = readFileSync(
  new URL("../app/components/blog/EmailAssetsPanel.tsx", import.meta.url),
  "utf8",
);

assert.match(
  adminBlogSource,
  /\{name\}/,
  "admin blog manager should document the {name} merge tag",
);
assert.match(
  emailAssetsPanelSource,
  /\{name\}/,
  "email assets helper copy should document the {name} merge tag",
);

console.log("All email personalization checks passed.");
