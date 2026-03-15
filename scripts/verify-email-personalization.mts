import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const emailPersonalizationModule = (await import(
  new URL("../app/lib/emailPersonalization.ts", import.meta.url).href
)) as typeof import("../app/lib/emailPersonalization");
const resultsLinksModule = (await import(
  new URL("../app/lib/resultsLinks.ts", import.meta.url).href
)) as typeof import("../app/lib/resultsLinks");
const contactNameModule = (await import(
  new URL("../app/lib/contactName.ts", import.meta.url).href
)) as typeof import("../app/lib/contactName");
const blogPostContentModule = (await import(
  new URL("../app/lib/blogPostContent.ts", import.meta.url).href
)) as typeof import("../app/lib/blogPostContent");

const {
  DEFAULT_EMAIL_PERSONALIZATION_NAME,
  DEFAULT_EMAIL_PERSONALIZATION_RESULTS_LINK,
  DEFAULT_EMAIL_PERSONALIZATION_SCORE,
  DEFAULT_EMAIL_PERSONALIZATION_SCORE_COMMENT,
  EMAIL_PERSONALIZATION_RESULTS_LINK_TOKEN,
  EMAIL_PERSONALIZATION_SCORE_TOKENS,
  buildLeadScorePersonalizationContext,
  formatLeadScoreDisplay,
  getLeadScoreComment,
  newsletterFieldsContainPersonalizationTokens,
  personalizeNewsletterFields,
  resolveEmailPersonalizationName,
  resolveEmailPersonalizationResultsLink,
  resolveEmailPersonalizationScore,
  resolveEmailPersonalizationScoreComment,
} = emailPersonalizationModule;
const {
  buildResultsLinkUrl,
  leadPayloadToResultsFormData,
  selectReusableResultsLink,
} = resultsLinksModule;
const { deriveNameFromEmail } = contactNameModule;
const {
  buildBlogStoredHtmlBackfillFields,
  renderBlogContentHtml,
  renderBlogCtaMarkdownHtml,
} = blogPostContentModule;

const renderedContent = renderBlogContentHtml(`Congrats! {name}

It's {score}. {score_comment}

[See your report]({results_link})

{results_link}

[See {name}'s offer at {score}](https://example.com/{name}/{score})`);

assert.match(
  renderedContent,
  /href="\{results_link\}"[\s\S]*>See your report<\/a>/,
  "body markdown should preserve {results_link} as a placeholder href so it can be personalized later",
);
assert.match(
  renderedContent,
  /<p style="[^"]*">\{results_link\}<\/p>/,
  "bare {results_link} in body markdown should remain plain text until personalization time",
);

const renderedCta = renderBlogCtaMarkdownHtml(`Claim for [{name} at {score}](https://example.com/{name}/{score})

[Open report]({results_link})

{results_link}`);

assert.match(
  renderedCta,
  /href="\{results_link\}"[\s\S]*>Open report<\/a>/,
  "CTA markdown should preserve {results_link} as a placeholder href with the authored label intact",
);
assert.match(
  renderedCta,
  /\{results_link\}/,
  "bare {results_link} in CTA markdown should remain visible text until personalization time",
);

const backfilledFields = buildBlogStoredHtmlBackfillFields({
  content:
    '<p style="margin:0;color:#334155;font-size:16px;line-height:28px;">You can revisit your results at [Tro&#39;s Panatag Rating]({results_link})</p>',
  cta:
    '<p style="margin:0;color:#334155;font-size:16px;line-height:28px;">[Open report]({results_link})</p>',
});

assert.equal(
  backfilledFields.contentMarkdown,
  "You can revisit your results at [Tro's Panatag Rating]({results_link})",
  "stored HTML backfill should recover missing content markdown from stale literal markdown HTML",
);
assert.equal(
  backfilledFields.ctaMarkdown,
  "[Open report]({results_link})",
  "stored HTML backfill should recover missing CTA markdown from stale literal markdown HTML",
);
assert.match(
  backfilledFields.content,
  /href="\{results_link\}"[\s\S]*>Tro&#39;s Panatag Rating<\/a>/,
  "stored HTML backfill should regenerate stale content into an anchor placeholder",
);
assert.match(
  backfilledFields.cta,
  /href="\{results_link\}"[\s\S]*>Open report<\/a>/,
  "stored HTML backfill should regenerate stale CTA HTML into an anchor placeholder",
);
assert.match(
  renderBlogContentHtml("See [your results](/results)"),
  /href="https:\/\/www\.safelysecuredhomes\.com\/results"/,
  "rendered public blog links should use the canonical production domain for root-relative hrefs",
);

const authoredFields = {
  subject:
    "This is the best offer {name} at {score} {score_comment} {results_link}",
  title: "Congrats, {name}. It's {score}",
  previewText: "Hi {name}, your score is {score}. {score_comment}",
  content: renderedContent,
  cta: renderedCta,
};

const scoreContext = buildLeadScorePersonalizationContext(67);
const personalizedFields = personalizeNewsletterFields(authoredFields, {
  name: 'Lemon & <Team>',
  ...scoreContext,
  resultsLink: buildResultsLinkUrl("latest-share-link"),
});

assert.equal(
  personalizedFields.subject,
  "This is the best offer Lemon & <Team> at 67% Your score is nearly there, and only needs minor changes https://www.safelysecuredhomes.com/results?r=latest-share-link",
  "plain-text fields should replace every supported personalization token, including the results link URL",
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
assert.match(
  personalizedFields.content,
  /href="https:\/\/www\.safelysecuredhomes\.com\/results\?r=latest-share-link"[\s\S]*>See your report<\/a>/,
  "HTML personalization should replace exact href=\"{results_link}\" values without changing the authored label",
);
assert.match(
  personalizedFields.content,
  /<p style="[^"]*">https:\/\/www\.safelysecuredhomes\.com\/results\?r=latest-share-link<\/p>/,
  "bare {results_link} in HTML content should resolve to the raw personalized URL string",
);
assert.match(
  personalizedFields.content,
  /href="https:\/\/example\.com\/\{name\}\/\{score\}"[\s\S]*See Lemon &amp; &lt;Team&gt;&#39;s offer at 67%/,
  "HTML personalization should continue updating visible copy while leaving unrelated href attributes literal",
);
assert.doesNotMatch(
  personalizedFields.content,
  /View your results/,
  "results-link personalization should no longer force a fixed anchor label",
);
assert.match(
  personalizedFields.cta,
  /href="https:\/\/www\.safelysecuredhomes\.com\/results\?r=latest-share-link"[\s\S]*>Open report<\/a>/,
  "CTA personalization should preserve authored link text while swapping the placeholder href",
);
assert.match(
  personalizedFields.cta,
  /https:\/\/www\.safelysecuredhomes\.com\/results\?r=latest-share-link/,
  "bare {results_link} in CTA HTML should resolve to the raw personalized URL string",
);
assert.match(
  personalizedFields.cta,
  /Claim for[\s\S]*href="https:\/\/example\.com\/\{name\}\/\{score\}"[\s\S]*Lemon &amp; &lt;Team&gt; at 67%/,
  "CTA personalization should continue updating visible copy without mutating unrelated URLs",
);
assert.ok(
  newsletterFieldsContainPersonalizationTokens(authoredFields),
  "token detection should recognize all supported author tokens",
);
assert.ok(
  newsletterFieldsContainPersonalizationTokens(
    {
      subject: "",
      title: "",
      previewText: "",
      content: renderBlogContentHtml("[See your report]({results_link})"),
      cta: "",
    },
    [EMAIL_PERSONALIZATION_RESULTS_LINK_TOKEN],
  ),
  "results-link detection should recognize exact href=\"{results_link}\" placeholders even when the token is only used as a markdown link target",
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
assert.equal(
  resolveEmailPersonalizationResultsLink(),
  DEFAULT_EMAIL_PERSONALIZATION_RESULTS_LINK,
  "missing results links should resolve to the shared public fallback",
);
assert.ok(
  !publicFallbackFields.subject.includes("{name}") &&
    !publicFallbackFields.title.includes("{name}") &&
    !publicFallbackFields.previewText.includes("{name}") &&
    !publicFallbackFields.subject.includes("{score}") &&
    !publicFallbackFields.previewText.includes("{score_comment}") &&
    !publicFallbackFields.subject.includes("{results_link}") &&
    !publicVisibleCopy.includes("{name}") &&
    !publicVisibleCopy.includes("{results_link}"),
  "public fallback personalization should remove literal author tokens from visible copy",
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
assert.match(
  publicFallbackFields.content,
  /href="https:\/\/www\.safelysecuredhomes\.com\/results"[\s\S]*>See your report<\/a>/,
  "public fallback HTML should use the generic results URL while preserving the authored link text",
);
assert.match(
  publicFallbackFields.content,
  /<p style="[^"]*">https:\/\/www\.safelysecuredhomes\.com\/results<\/p>/,
  "bare {results_link} should fall back to the generic raw URL on public surfaces",
);
assert.match(
  publicFallbackFields.cta,
  /href="https:\/\/www\.safelysecuredhomes\.com\/results"[\s\S]*>Open report<\/a>/,
  "public fallback CTA HTML should use the generic results URL while preserving the authored label",
);
assert.doesNotMatch(
  publicFallbackFields.content,
  /View your results/,
  "public fallback should not inject a fixed results-link label",
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
  resultsLink: buildResultsLinkUrl("fresh-send-link"),
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
  /href="https:\/\/www\.safelysecuredhomes\.com\/results\?r=fresh-send-link"[\s\S]*>See your report<\/a>/,
  "send-time personalization should update the placeholder results-link href in content",
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
  sendTimeVisibleCtaCopy,
  /https:\/\/www\.safelysecuredhomes\.com\/results\?r=fresh-send-link/,
  "send-time personalization should preserve bare results-link tokens as raw URLs in CTA copy",
);
assert.match(
  sendTimeFields.cta,
  /href="https:\/\/example\.com\/\{name\}\/\{score\}"/,
  "send-time CTA URLs should remain literal for non-results-link hrefs",
);
assert.match(
  sendTimeFields.cta,
  /href="https:\/\/www\.safelysecuredhomes\.com\/results\?r=fresh-send-link"[\s\S]*>Open report<\/a>/,
  "send-time CTA personalization should preserve the authored results-link label",
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

assert.equal(
  buildResultsLinkUrl("abc123"),
  "https://www.safelysecuredhomes.com/results?r=abc123",
  "results link URLs should target the canonical results route",
);
assert.deepEqual(
  leadPayloadToResultsFormData({
    contact: {
      name: "Lemon",
      email: "lemon@example.com",
      mobile: "+639171234567",
    },
    answers: {
      property_type: "house",
      has_spare_key: true,
      changed_wifi_default_password: false,
      sleeps_with_earphones: false,
      locks_windows_gate_at_night: true,
      has_security_cameras: true,
      has_smoke_alarm_or_fire_extinguisher: true,
      has_first_aid_or_medicine_ready: true,
      knows_local_emergency_contacts: true,
      home_entrance: 75,
      windows_terrace: 60,
      neighborhood_safety_check: 55,
      emergency_readiness_home: 80,
      household_stage: "Family with kids",
      desired_outcome: "Feel safer at night",
      goal_obstacle: "Not sure where to start",
      has_additional_notes: false,
      additional_notes: "",
      solution: "CCTV",
    },
  }),
  {
    property_type: "house",
    has_spare_key: true,
    changed_wifi_default_password: false,
    sleeps_with_earphones: false,
    locks_windows_gate_at_night: true,
    has_security_cameras: true,
    has_smoke_alarm_or_fire_extinguisher: true,
    has_first_aid_or_medicine_ready: true,
    knows_local_emergency_contacts: true,
    home_entrance: 75,
    windows_terrace: 60,
    neighborhood_safety_check: 55,
    emergency_readiness_home: 80,
    household_stage: "Family with kids",
    desired_outcome: "Feel safer at night",
    goal_obstacle: "Not sure where to start",
    has_additional_notes: false,
    additional_notes: "",
    solution: "CCTV",
    name: "Lemon",
    email: "lemon@example.com",
    mobile: "+639171234567",
  },
  "lead payload conversion should rebuild the shareable results form data shape",
);
assert.equal(
  selectReusableResultsLink(
    [
      {
        linkKey: "stale-link",
        createdAt: "2026-03-01T00:00:00.000Z",
        expiresAt: "2026-06-01T00:00:00.000Z",
        revokedAt: null,
      },
    ],
    "2026-03-10T00:00:00.000Z",
    Date.parse("2026-03-15T00:00:00.000Z"),
  ),
  null,
  "stale results links should not be reused when a newer lead exists",
);
assert.deepEqual(
  selectReusableResultsLink(
    [
      {
        linkKey: "expired-link",
        createdAt: "2026-03-12T00:00:00.000Z",
        expiresAt: "2026-03-13T00:00:00.000Z",
        revokedAt: null,
      },
      {
        linkKey: "current-link",
        createdAt: "2026-03-11T00:00:00.000Z",
        expiresAt: "2026-06-01T00:00:00.000Z",
        revokedAt: null,
      },
    ],
    "2026-03-10T00:00:00.000Z",
    Date.parse("2026-03-15T00:00:00.000Z"),
  ),
  {
    linkKey: "current-link",
    createdAt: "2026-03-11T00:00:00.000Z",
    expiresAt: "2026-06-01T00:00:00.000Z",
    revokedAt: null,
  },
  "the newest valid results link should be reused when it is current for the latest lead",
);

const blogPostContentSource = readFileSync(
  new URL("../app/lib/blogPostContent.ts", import.meta.url),
  "utf8",
);
const blogPostsSource = readFileSync(
  new URL("../app/lib/blogPosts.ts", import.meta.url),
  "utf8",
);
const emailSource = readFileSync(
  new URL("../app/lib/email.ts", import.meta.url),
  "utf8",
);
const emailPersonalizationSource = readFileSync(
  new URL("../app/lib/emailPersonalization.ts", import.meta.url),
  "utf8",
);
const siteSource = readFileSync(
  new URL("../app/lib/site.ts", import.meta.url),
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
const resultsLinksServerSource = readFileSync(
  new URL("../app/lib/resultsLinksServer.ts", import.meta.url),
  "utf8",
);
const resultsLinksRouteSource = readFileSync(
  new URL("../app/api/results-links/route.ts", import.meta.url),
  "utf8",
);
const adminBlogPostsSource = readFileSync(
  new URL("../app/lib/adminBlogPosts.ts", import.meta.url),
  "utf8",
);
const backfillBlogContentSource = readFileSync(
  new URL("../scripts/backfill-blog-content-html.mts", import.meta.url),
  "utf8",
);
const getBlogPostByIdSection = blogPostsSource.slice(
  blogPostsSource.indexOf("export const getBlogPostById"),
  blogPostsSource.indexOf("export const getBlogPostEmailUsage"),
);

assert.match(
  blogPostContentSource,
  /RESULTS_LINK_MARKDOWN_HREF/,
  "blog markdown rendering should recognize {results_link} as a special-case link destination",
);
assert.doesNotMatch(
  blogPostContentSource,
  /localhost:3000|NEXT_PUBLIC_VERCEL_URL|VERCEL_URL/,
  "stored public blog HTML rendering should not fall back to localhost or preview domains",
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
  emailPersonalizationSource,
  /replaceExactHtmlAttributeValue/,
  "HTML personalization should include exact attribute-value replacement for the results-link href token",
);
assert.match(
  emailPersonalizationSource,
  /publicSiteUrl/,
  "results-link fallback personalization should use the canonical public site URL",
);
assert.doesNotMatch(
  emailPersonalizationSource,
  /createResultsLinkAnchorHtml|EMAIL_PERSONALIZATION_RESULTS_LINK_LABEL/,
  "results-link personalization should no longer hardcode a fixed anchor label",
);
assert.match(
  siteSource,
  /export const publicSiteUrl = normalizeSiteUrl\(\s*process\.env\.NEXT_PUBLIC_SITE_URL \|\| DEFAULT_SITE_URL/,
  "site helpers should expose a canonical public URL that ignores preview and localhost fallbacks",
);

assert.match(
  resultsLinksServerSource,
  /getLatestLeadPayloadByEmail\(normalizedEmail\)/,
  "results-link resolution should source the latest canonical lead payload by email",
);
assert.match(
  resultsLinksServerSource,
  /selectReusableResultsLink\(rows,\s*leadCreatedAt\)/,
  "results-link resolution should reuse the newest current, non-expired link before creating a new one",
);
assert.match(
  resultsLinksServerSource,
  /createResultsLinkFromFormData\(\s*leadPayloadToResultsFormData\(latestLead\.payload\)/,
  "results-link resolution should create fresh links from the latest canonical lead payload when needed",
);
assert.match(
  resultsLinksRouteSource,
  /createResultsLinkFromFormData\(formData,/,
  "the results-links API should reuse the shared insert helper",
);
assert.match(
  resultsLinksRouteSource,
  /getResultsLinkByKey\(key\)/,
  "the results-links API should reuse the shared fetch helper",
);
assert.match(
  backfillBlogContentSource,
  /buildBlogStoredHtmlBackfillFields/,
  "blog HTML backfill should reuse the shared stale-content regeneration helper",
);
assert.match(
  backfillBlogContentSource,
  /\.select\("id,slug,content,cta,content_markdown,cta_markdown,cta_label,cta_url"\)/,
  "blog HTML backfill should regenerate both content and CTA HTML from the markdown sources",
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
  /resolvePersonalizedResultsLinkByEmail\(recipientEmail\)/,
  "tracked sends should resolve a personalized results link when the token is present",
);
assert.match(
  newsletterCampaignEmailSource,
  /Lead Panatag rating is required to send score-personalized lead journey email/,
  "lead journey sends should fail clearly when score-personalized content has no score data",
);
assert.match(
  adminBlogPostsSource,
  /resolvePersonalizedResultsLinkByEmail\(/,
  "admin test sends should resolve personalized results links when the token is present",
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
  /\[your label\]\(\{results_link\}\)/,
  "admin blog manager should document markdown-link-target authoring for the results link",
);
assert.match(
  adminBlogSource,
  /raw URL/,
  "admin blog manager should explain bare-token backward compatibility",
);
assert.match(
  emailAssetsPanelSource,
  /\[label\]\(\{results_link\}\)/,
  "email assets helper copy should document markdown-link-target authoring for the results link",
);
assert.match(
  emailAssetsPanelSource,
  /raw URL/,
  "email assets helper copy should explain bare-token backward compatibility",
);
assert.doesNotMatch(
  emailAssetsPanelSource,
  /Do not use[\s\S]*\{results_link\}[\s\S]*markdown link destinations/,
  "email assets helper copy should no longer forbid using {results_link} as a markdown link target",
);

console.log("All email personalization checks passed.");
