import { MetadataRoute } from "next";
import { getBlogPosts } from "./lib/blogPosts";
import { absoluteUrl } from "./lib/seo";
import { SERVICE_AREAS, SERVICE_AREA_HUB_PATH } from "./lib/serviceAreas";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "/",
    "/blog",
    SERVICE_AREA_HUB_PATH,
    ...SERVICE_AREAS.map((area) => `/service-areas/${area.slug}`),
  ];

  const staticEntries = routes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "/" ? 1 : 0.8,
  }));

  const blogPosts = await getBlogPosts();
  const blogEntries = blogPosts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries];
}
