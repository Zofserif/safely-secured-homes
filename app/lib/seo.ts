import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://www.safelysecuredhomes.com";
const DEFAULT_SITE_NAME = "Safely Secured Homes";
const DEFAULT_OG_IMAGE_PATH = "/assets/img/Logo/Black Header.png";

type OgType = "website" | "article";

export type SeoPageConfig = {
  title: string;
  description: string;
  path: string;
  indexable?: boolean;
  ogType?: OgType;
};

const resolveEnvSiteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_VERCEL_URL ||
  process.env.VERCEL_URL ||
  DEFAULT_SITE_URL;

export const normalizeSiteUrl = (input: string): string => {
  const rawValue = input.trim();
  if (!rawValue) return DEFAULT_SITE_URL;

  const withProtocol =
    rawValue.startsWith("http://") || rawValue.startsWith("https://")
      ? rawValue
      : `https://${rawValue}`;

  const url = new URL(withProtocol);
  const pathname = url.pathname.replace(/\/+$/, "");
  url.pathname = pathname || "/";

  const normalized = url.toString();
  return normalized.endsWith("/")
    ? normalized.slice(0, normalized.length - 1)
    : normalized;
};

const getRuntimeSiteUrl = () => normalizeSiteUrl(resolveEnvSiteUrl());

export const absoluteUrl = (path: string): string => {
  const baseUrl = getRuntimeSiteUrl();
  if (!path || path === "/") return baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${baseUrl}/`).toString();
};

export const buildPageMetadata = ({
  title,
  description,
  path,
  indexable = true,
  ogType = "website",
}: SeoPageConfig): Metadata => {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const pageUrl = absoluteUrl(canonicalPath);
  const ogImageUrl = absoluteUrl(DEFAULT_OG_IMAGE_PATH);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    robots: indexable
      ? undefined
      : {
          index: false,
          follow: false,
        },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: DEFAULT_SITE_NAME,
      type: ogType,
      images: [
        {
          url: ogImageUrl,
          width: 1260,
          height: 750,
          alt: "Safely Secured Homes - Happy family in a secure home",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
};
