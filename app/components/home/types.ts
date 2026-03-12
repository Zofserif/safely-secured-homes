export type HomePageProps = {
  onPrimaryCtaClick: (
    target: HomeCtaTarget,
    location: HomeCtaLocation
  ) => void;
  cta: HomeCtaState;
  scarcity: HomeScarcityState;
};

export type HomeCtaTarget = "newsletter" | "results" | "form";
export type HomeCtaLocation =
  | "hero_primary"
  | "midpage_primary"
  | "cta_banner_primary"
  | "navbar_primary";

export type HomeCtaState = {
  target: HomeCtaTarget;
  label: string;
  disabled: boolean;
};

export type HomeUrgencyTier = "normal" | "low" | "critical" | "sold_out";

export type HomeScarcityState = {
  show: boolean;
  loading: boolean;
  error: boolean;
  reportsRemaining: number | null;
  reportsLimit: number | null;
  reportsClaimed: number;
  urgencyTier: HomeUrgencyTier;
  soldOut: boolean;
  windowEndsAt: number | null;
  windowCountdown: string;
  windowDeadlinePht: string;
  bonusEndsAt: number | null;
  bonusCountdown: string;
  bonusExpired: boolean;
};

export type HomeTestimonial = {
  id: string;
  name: string;
  location: string;
  rating: number;
  review: string;
  profileImageUrl: string | null;
};
