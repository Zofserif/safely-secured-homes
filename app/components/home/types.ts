export type HomePageProps = {
  onPrimaryCtaClick: (
    target: HomeCtaTarget,
    location: HomeCtaLocation
  ) => void;
  reportsRemaining: number | null;
  reportsLoading: boolean;
  reportsError: boolean;
  hasExistingPlan: boolean;
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

export type HomeScarcityState = {
  show: boolean;
  loading: boolean;
  error: boolean;
  reportsRemaining: number | null;
  soldOut: boolean;
  countdownLabel: string;
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
