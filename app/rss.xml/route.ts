import { NextResponse } from "next/server";
import { getBlogPosts } from "../lib/blogPosts";
import { absoluteUrl } from "../lib/seo";
import { siteDescription, siteName } from "../lib/site";

export const revalidate = 3600;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  const posts = await getBlogPosts();

  const items = posts
    .map((post) => {
      const postUrl = absoluteUrl(`/blog/${post.slug}`);
      const publishedDate = new Date(post.publishedAt).toUTCString();

      return `<item>
  <title>${escapeXml(post.title)}</title>
  <description>${escapeXml(post.excerpt)}</description>
  <link>${escapeXml(postUrl)}</link>
  <guid>${escapeXml(postUrl)}</guid>
  <pubDate>${escapeXml(publishedDate)}</pubDate>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(siteName)} Blog</title>
  <description>${escapeXml(siteDescription)}</description>
  <link>${escapeXml(absoluteUrl("/blog"))}</link>
  <language>en-PH</language>
  ${items}
</channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
