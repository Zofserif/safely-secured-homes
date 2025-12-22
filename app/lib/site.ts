const defaultSiteUrl = "https://www.safelysecuredhomes.com";

export const siteName = "Safely Secured Homes";
export const siteDescription =
  "Custom home security and smart home solutions. Get a free personalized security plan tailored to your home in 60 seconds.";
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : defaultSiteUrl);
