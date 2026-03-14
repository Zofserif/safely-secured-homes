import assert from "node:assert/strict";

const blogPostContentModule = (await import(
  new URL("../app/lib/blogPostContent.ts", import.meta.url).href
)) as typeof import("../app/lib/blogPostContent");

const {
  convertLegacyBlogCtaFieldsToMarkdown,
  convertStoredBlogContentHtmlToMarkdown,
  convertStoredBlogCtaHtmlToMarkdown,
  renderBlogContentHtml,
  renderBlogCtaMarkdownHtml,
} = blogPostContentModule;

const signatureMarkdown = "Troy\nFounder, Safely Secured Homes";
assert.equal(
  renderBlogContentHtml(signatureMarkdown),
  "<p>Troy<br />Founder, Safely Secured Homes</p>",
  "single line breaks inside a paragraph should render as <br />",
);

assert.equal(
  renderBlogContentHtml("First line\nSecond line\n\nNext paragraph"),
  "<p>First line<br />Second line</p><p>Next paragraph</p>",
  "blank lines should still split paragraphs",
);

assert.equal(
  renderBlogContentHtml("## Heading\n\n- First\n- Second\n\n1. One\n2. Two\n\n> Quote"),
  "<h2>Heading</h2><ul><li>First</li><li>Second</li></ul><ol><li>One</li><li>Two</li></ol><blockquote><p>Quote</p></blockquote>",
  "headings, lists, and blockquotes should retain their existing HTML output",
);

assert.equal(
  convertStoredBlogContentHtmlToMarkdown(
    "<p>Troy<br />Founder, Safely Secured Homes</p>",
  ),
  signatureMarkdown,
  "stored paragraph line breaks should round-trip back to markdown newlines",
);

const ctaMarkdown =
  "I would like to know more about what you know: [click here for FREE on-site visit](https://www.safelysecuredhomes.com/schedule-call)";
assert.equal(
  renderBlogCtaMarkdownHtml(ctaMarkdown),
  '<p>I would like to know more about what you know: <a href="https://www.safelysecuredhomes.com/schedule-call">click here for FREE on-site visit</a></p>',
  "CTA markdown should render with the shared markdown-to-HTML pipeline",
);

assert.equal(
  convertStoredBlogCtaHtmlToMarkdown(
    '<div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/schedule-call?source=blog_cta_book_call" target="_blank" style="display:inline-block;">Book a Free Site Visit</a></div>',
  ),
  "[Book a Free Site Visit](https://www.safelysecuredhomes.com/schedule-call?source=blog_cta_book_call)",
  "legacy button CTA HTML should fall back to a bare markdown link",
);

assert.equal(
  convertStoredBlogCtaHtmlToMarkdown(
    '<p>Need help deciding? <a href="https://www.safelysecuredhomes.com/schedule-call">Book a free site visit</a></p>',
  ),
  "Need help deciding? [Book a free site visit](https://www.safelysecuredhomes.com/schedule-call)",
  "paragraph CTA HTML should round-trip back to markdown text and links",
);

assert.equal(
  convertLegacyBlogCtaFieldsToMarkdown({
    label: "Book a Free Site Visit",
    url: "https://www.safelysecuredhomes.com/schedule-call",
  }).ctaMarkdown,
  "[Book a Free Site Visit](https://www.safelysecuredhomes.com/schedule-call)",
  "legacy CTA label/url fields should convert to markdown links",
);

console.log("All blog content rendering checks passed.");
