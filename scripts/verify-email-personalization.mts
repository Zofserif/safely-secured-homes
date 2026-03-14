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
  DEFAULT_EMAIL_PERSONALIZATION_SCORE,
  DEFAULT_EMAIL_PERSONALIZATION_SCORE_COMMENT,
  EMAIL_PERSONALIZATION_SCORE_TOKENS,
  buildLeadScorePersonalizationContext,
  formatLeadScoreDisplay,
  getLeadScoreComment,
  newsletterFieldsContainPersonalizationTokens,
  personalizeNewsletterFields,
  resolveEmailPersonalizationName,
  resolveEmailPersonalizationScore,
  resolveEmailPersonalizationScoreComment,
} = emailPersonalizationModule;
const { deriveNameFromEmail } = contactNameModule;
const { renderBlogCtaMarkdownHtml } = blogPostContentModule;

const authoredFields = {
  subject: "This is the best offer {name} at {score} {score_comment}",
  title: "Congrats, {name}. It's {score}",
  previewText: "Hi {name}, your score is {score}. {score_comment}",
  content:
    '<p>Congrats! {name}</p><p>It\'s {score}. {score_comment}</p><p><a href="https://example.com/{name}/{score}">See {name}\'s offer at {score}</a></p>',
  cta: renderBlogCtaMarkdownHtml(
    "Claim for [{name} at {score}](https://example.com/{name}/{score})",
  ),
};

const scoreContext = buildLeadScorePersonalizationContext(67);
const personalizedFields = personalizeNewsletterFields(authoredFields, {
  name: 'Lemon & <Team>',
  ...scoreContext,
});

assert.equal(
  personalizedFields.subject,
  "This is the best offer Lemon & <Team> at 67% Your score is nearly there, and only needs minor changes",
  "plain-text fields should replace every supported personalization token",
);
assert.equal(
  personalizedFields.title,
  "Congrats, Lemon & <Team>. It's 67%",
  "title should personalize name and score tokens",
);
assert.equal(
  personalizedFields.previewText,
  "Hi Lemon & <Team>, your score is 67%. Your score is nearly there, and only needs minor changes",
  "preview text should personalize name, score, and score_comment tokens",
);
assert.equal(
  personalizedFields.content,
  '<p>Congrats! Lemon &amp; &lt;Team&gt;</p><p>It\'s 67%. Your score is nearly there, and only needs minor changes</p><p><a href="https://example.com/{name}/{score}">See Lemon &amp; &lt;Team&gt;\'s offer at 67%</a></p>',
  "HTML personalization should escape inserted values and leave href attributes literal",
);
assert.match(
  personalizedFields.cta,
  /href="https:\/\/example\.com\/\{name\}\/\{score\}"[\s\S]*Lemon &amp; &lt;Team&gt; at 67%/,
  "CTA personalization should affect visible copy without mutating the URL",
);
assert.ok(
  newsletterFieldsContainPersonalizationTokens(
    authoredFields,
    EMAIL_PERSONALIZATION_SCORE_TOKENS,
  ),
  "score token detection should recognize score-based author tokens",
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
assert.equal(
  resolveEmailPersonalizationScore(),
  DEFAULT_EMAIL_PERSONALIZATION_SCORE,
  "missing scores should resolve to the shared public fallback",
);
assert.equal(
  resolveEmailPersonalizationScoreComment(),
  DEFAULT_EMAIL_PERSONALIZATION_SCORE_COMMENT,
  "missing score comments should resolve to the shared public fallback",
);
assert.ok(
  !publicFallbackFields.subject.includes("{name}") &&
    !publicFallbackFields.title.includes("{name}") &&
    !publicFallbackFields.previewText.includes("{name}") &&
    !publicFallbackFields.subject.includes("{score}") &&
    !publicFallbackFields.previewText.includes("{score_comment}") &&
    !publicVisibleCopy.includes("{name}"),
  "public fallback personalization should remove literal {name} tokens from visible public copy",
);
assert.ok(
  publicFallbackFields.subject.includes(DEFAULT_EMAIL_PERSONALIZATION_NAME),
  "public fallback should use the default placeholder name",
);
assert.ok(
  publicFallbackFields.previewText.includes(DEFAULT_EMAIL_PERSONALIZATION_SCORE),
  "public fallback should use the default score placeholder",
);
assert.ok(
  publicVisibleCopy.includes(DEFAULT_EMAIL_PERSONALIZATION_SCORE_COMMENT),
  "public fallback should use the default score comment placeholder",
);
assert.ok(
  !newsletterFieldsContainPersonalizationTokens(publicFallbackFields),
  "fallback-personalized fields should no longer expose raw personalization tokens",
);

const derivedRecipientName = deriveNameFromEmail("lemon.squeezy@example.com");
assert.equal(
  derivedRecipientName,
  "Lemon",
  "recipient names should continue deriving from the email address when missing",
);
const sendTimeFields = personalizeNewsletterFields(authoredFields, {
  name: derivedRecipientName,
  ...buildLeadScorePersonalizationContext(31),
});
assert.equal(
  sendTimeFields.title,
  "Congrats, Lemon. It's 31%",
  "send-time personalization should use the derived recipient name and score display",
);
assert.equal(
  sendTimeFields.previewText,
  "Hi Lemon, your score is 31%. Not bad, but not good either, we've got more work to do",
  "send-time personalization should cover preview text with the derived name and score comment",
);
assert.match(
  sendTimeFields.content,
  /Congrats! Lemon[\s\S]*It's 31%/,
  "send-time personalization should cover HTML email body content",
);
const sendTimeVisibleCtaCopy = sendTimeFields.cta
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();
assert.match(
  sendTimeVisibleCtaCopy,
  /Claim for Lemon at 31%/,
  "send-time personalization should cover CTA copy and score display",
);
assert.match(
  sendTimeFields.cta,
  /href="https:\/\/example\.com\/\{name\}\/\{score\}"/,
  "send-time CTA URLs should remain literal even when labels contain personalization tokens",
);

const scoreBoundaryCases = [
  {
    score: 0,
    display: "0%",
    comment:
      "Your score is kinda low for comfort, that's why we need to strengthen it",
  },
  {
    score: 30,
    display: "30%",
    comment:
      "Your score is kinda low for comfort, that's why we need to strengthen it",
  },
  {
    score: 31,
    display: "31%",
    comment: "Not bad, but not good either, we've got more work to do",
  },
  {
    score: 60,
    display: "60%",
    comment: "Not bad, but not good either, we've got more work to do",
  },
  {
    score: 61,
    display: "61%",
    comment: "Your score is nearly there, and only needs minor changes",
  },
  {
    score: 100,
    display: "100%",
    comment: "Your score is nearly there, and only needs minor changes",
  },
] as const;

for (const testCase of scoreBoundaryCases) {
  assert.equal(
    formatLeadScoreDisplay(testCase.score),
    testCase.display,
    `score ${testCase.score} should render the expected display value`,
  );
  assert.equal(
    getLeadScoreComment(testCase.score),
    testCase.comment,
    `score ${testCase.score} should map to the expected score comment`,
  );
  assert.deepEqual(
    buildLeadScorePersonalizationContext(testCase.score),
    {
      score: testCase.display,
      scoreComment: testCase.comment,
    },
    `score ${testCase.score} should build a complete personalization context`,
  );
}

const blogPostsSource = readFileSync(
  new URL("../app/lib/blogPosts.ts", import.meta.url),
  "utf8",
);
const emailSource = readFileSync(
  new URL("../app/lib/email.ts", import.meta.url),
  "utf8",
);
const leadScorePersonalizationSource = readFileSync(
  new URL("../app/lib/leadScorePersonalization.ts", import.meta.url),
  "utf8",
);
const leadPayloadStoreSource = readFileSync(
  new URL("../app/lib/leadPayloadStore.ts", import.meta.url),
  "utf8",
);
const newsletterCampaignEmailSource = readFileSync(
  new URL("../app/lib/newsletterCampaignEmail.ts", import.meta.url),
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
  /buildNewsletterTemplateParams[\s\S]*personalizeNewsletterFields\(post,\s*\{\s*\.\.\.personalizationContext,\s*name:\s*resolvedRecipient\.name,\s*\}\)/,
  "newsletter template params should merge extra personalization context before sending",
);
assert.match(
  emailSource,
  /buildNewsletterTemplateParams[\s\S]*cta:\s*buildEmailCtaWithFooter\(\s*personalizedPost\.cta,\s*recipient\.unsubscribeUrl/,
  "newsletter template params should append the shared footer after CTA personalization",
);
assert.match(
  emailSource,
  /sendNewsletterEmail\([\s\S]*buildNewsletterTemplateParams\(post,\s*recipient,\s*personalizationContext\)/,
  "newsletter email sends should pass the optional personalization context through to template building",
);

assert.match(
  leadPayloadStoreSource,
  /normalizeEmail\(email\)/,
  "latest lead payload lookup should normalize email addresses before querying",
);
assert.match(
  leadPayloadStoreSource,
  /\.order\("created_at",\s*\{\s*ascending:\s*false,\s*nullsFirst:\s*false\s*\}\)\s*\.limit\(1\)\s*\.maybeSingle\(\)/,
  "latest lead payload lookup should read the latest lead row by created_at",
);
assert.match(
  leadPayloadStoreSource,
  /\.select\("email,name,payload,created_at"\)/,
  "latest lead payload lookup should fetch the canonical payload row metadata",
);

assert.match(
  leadScorePersonalizationSource,
  /getLatestLeadPayloadByEmail\(email\)/,
  "lead score personalization should read from the canonical latest lead payload helper",
);
assert.match(
  leadScorePersonalizationSource,
  /getLeadPayloadScorePersonalization\(latestLead\.payload\)/,
  "lead score personalization should derive email fields from the canonical payload",
);

assert.match(
  newsletterCampaignEmailSource,
  /newsletterFieldsContainPersonalizationTokens\(\s*post,\s*EMAIL_PERSONALIZATION_SCORE_TOKENS/,
  "tracked journey sends should detect score-token usage before sending",
);
assert.match(
  newsletterCampaignEmailSource,
  /getLatestLeadScorePersonalizationByEmail\(recipientEmail\)/,
  "lead journey sends should look up the latest lead score personalization by email",
);
assert.match(
  newsletterCampaignEmailSource,
  /Lead Panatag rating is required to send score-personalized lead journey email/,
  "lead journey sends should fail clearly when score-personalized content has no score data",
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
  /\{name\}[\s\S]*\{score\}[\s\S]*\{score_comment\}/,
  "admin blog manager should document the name and score merge tags",
);
assert.match(
  emailAssetsPanelSource,
  /\{name\}[\s\S]*\{score\}[\s\S]*\{score_comment\}/,
  "email assets helper copy should document the name and score merge tags",
);

console.log("All email personalization checks passed.");
