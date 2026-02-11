import { MetadataRoute } from "next";
import { siteUrl } from "./lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/form",
    "/results",
    "/newsletter",
    "/newsletter/thank-you",
    "/schedule-call",
    "/apply",
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
