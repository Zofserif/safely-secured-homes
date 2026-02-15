import { normalizeSiteUrl } from "./seo";

const defaultSiteUrl = "https://www.safelysecuredhomes.com";
const envSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_VERCEL_URL ||
  process.env.VERCEL_URL;

export const siteName = "Safely Secured Homes";
export const siteDescription =
  "Custom home security and smart home solutions. Get a free personalized security plan tailored to your home in 60 seconds.";
export const sitePhone = "+63 995 995 9229";
export const siteAddressLocality = "Candelaria";
export const siteAddressRegion = "Quezon";
export const sitePostalCode = "4323";
export const siteCountryCode = "PH";
export const siteUrl = envSiteUrl
  ? normalizeSiteUrl(envSiteUrl)
  : process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : defaultSiteUrl;
export const ogImagePath = "/assets/img/Logo/Black Header.png";
export const ogImageUrl = new URL(ogImagePath, siteUrl).toString();
