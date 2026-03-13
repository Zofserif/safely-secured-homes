import assert from "node:assert/strict";

const blogPostContentModule = (await import(
  new URL("../app/lib/blogPostContent.ts", import.meta.url).href
)) as typeof import("../app/lib/blogPostContent");

const { convertStoredBlogContentHtmlToMarkdown, renderBlogContentHtml } =
  blogPostContentModule;

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

console.log("All blog content rendering checks passed.");
