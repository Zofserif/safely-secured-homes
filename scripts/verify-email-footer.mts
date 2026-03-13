import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const emailFooterModule = (await import(
  new URL("../app/lib/emailFooter.ts", import.meta.url).href
)) as typeof import("../app/lib/emailFooter");

const {
  EMAIL_FOOTER_ADDRESS,
  EMAIL_FOOTER_HOME_URL,
  EMAIL_FOOTER_LOGO_URL,
  buildEmailCtaWithFooter,
  buildSharedEmailFooter,
} = emailFooterModule;

const unsubscribeUrl =
  "https://www.safelysecuredhomes.com/unsubscribe/0123456789abcdef0123456789abcdef0123";
const emailSource = readFileSync(
  new URL("../app/lib/email.ts", import.meta.url),
  "utf8",
);

assert.ok(
  buildSharedEmailFooter(unsubscribeUrl).includes(`src="${EMAIL_FOOTER_LOGO_URL}"`),
  "shared footer should include the branded footer logo",
);
assert.ok(
  buildSharedEmailFooter(unsubscribeUrl).includes(`href="${EMAIL_FOOTER_HOME_URL}"`),
  "footer logo should link to the site homepage",
);
assert.ok(
  buildSharedEmailFooter(unsubscribeUrl).includes(EMAIL_FOOTER_ADDRESS),
  "footer should include the canonical company address",
);
assert.ok(
  buildSharedEmailFooter(unsubscribeUrl).includes(`href="${unsubscribeUrl}"`),
  "shared footer should include the token unsubscribe URL",
);
assert.ok(
  buildSharedEmailFooter(unsubscribeUrl).includes(">Unsubscribe<"),
  "shared footer should render the unsubscribe link label",
);

assert.ok(
  buildEmailCtaWithFooter('<div style="margin:24px 0 0 0;">CTA</div>', unsubscribeUrl)
    .startsWith('<div style="margin:24px 0 0 0;">CTA</div>'),
  "existing CTA HTML should remain before the shared footer",
);
assert.ok(
  buildEmailCtaWithFooter("", unsubscribeUrl).includes(`src="${EMAIL_FOOTER_LOGO_URL}"`),
  "emails without a CTA should still render the shared footer",
);
assert.ok(
  !buildEmailCtaWithFooter("", unsubscribeUrl).includes("undefined"),
  "footer-only output should not introduce undefined placeholders",
);

assert.match(
  emailSource,
  /buildLeadTemplateParams[\s\S]*?cta:\s*buildEmailCtaWithFooter\([\s\S]*?input\.unsubscribe_url/,
  "lead template params should append the shared footer",
);
assert.match(
  emailSource,
  /buildChecklistTemplateParams[\s\S]*?cta:\s*buildEmailCtaWithFooter\([\s\S]*?input\.unsubscribe_url/,
  "checklist template params should append the shared footer",
);
assert.match(
  emailSource,
  /buildNewsletterTemplateParams[\s\S]*?cta:\s*buildEmailCtaWithFooter\(post\.cta, recipient\.unsubscribeUrl\)/,
  "newsletter template params should append the shared footer",
);

console.log("All email footer checks passed.");
