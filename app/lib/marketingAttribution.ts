const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export type MarketingAttribution = {
  source: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
};

const readSearchParam = (
  searchParams: Pick<URLSearchParams, "get">,
  key: keyof MarketingAttribution,
) => toSafeString(searchParams.get(key));

export const readMarketingAttribution = (
  searchParams: Pick<URLSearchParams, "get">,
): MarketingAttribution => ({
  source: readSearchParam(searchParams, "source"),
  utm_source: readSearchParam(searchParams, "utm_source"),
  utm_medium: readSearchParam(searchParams, "utm_medium"),
  utm_campaign: readSearchParam(searchParams, "utm_campaign"),
});

export const readCurrentMarketingAttribution = (): MarketingAttribution => {
  if (typeof window === "undefined") {
    return {
      source: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
    };
  }

  return readMarketingAttribution(new URLSearchParams(window.location.search));
};
