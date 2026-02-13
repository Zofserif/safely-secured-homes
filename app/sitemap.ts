import { MetadataRoute } from "next";
import { getBlogPosts } from "./lib/blogPosts";
import { siteUrl } from "./lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "",
    "/form",
    "/results",
    "/blog",
    "/newsletter",
    "/newsletter/thank-you",
    "/schedule-call",
    "/apply",
  ];

  const staticEntries = routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const blogPosts = await getBlogPosts();
  const blogEntries = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries];
}
