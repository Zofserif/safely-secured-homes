export const ENGAGEMENT_LINKS_TABLE = "engagement_links";

export const ENGAGEMENT_LINK_KIND_RESULTS = "results";
export const ENGAGEMENT_LINK_KIND_BONUS_CLAIM = "bonus_claim";
export const ENGAGEMENT_LINK_KIND_LIMITED_OFFER = "limited_offer";

export type EngagementLinkKind =
  | typeof ENGAGEMENT_LINK_KIND_RESULTS
  | typeof ENGAGEMENT_LINK_KIND_BONUS_CLAIM
  | typeof ENGAGEMENT_LINK_KIND_LIMITED_OFFER;
