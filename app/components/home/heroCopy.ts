export type HomeHeroCopyVariant = {
  headline: string;
  subcopy: string;
};

export type HomeHeroCopyVariantKey = "control" | "burglar_hook" | "panatag_rating" | "family_hug";

export const HOME_HERO_COPY_VARIANTS: Record<
  HomeHeroCopyVariantKey,
  HomeHeroCopyVariant
> = {
  control: {
    headline: "Your Personalized Safe & Smart Home Plan",
    subcopy:
      "In 60 seconds, take this short questions to know your **Free Home Panatag Rating** tailored to your home details. So your family can enjoy a safe and secured home with comfort in mind.",
  },
  burglar_hook: {
    headline:
      "Here's What a Burglar Doesn't Want You to Know About Being The [[Safest Home in The Neighborhood]]",
    subcopy:
      "In 60 seconds, take this short questions to know your **Free Home Panatag Rating** tailored to your home details. So your family can enjoy a safe and secured home with comfort in mind.",
  },
  panatag_rating: {
    headline:
      "How [[Panatag]] is Your Home?",
    subcopy:
      "60 second quick questions designed to know your **Free Home Panatag Rating** based on your home details. So you family can be ready for everyday safety tips you can do today!",
  },
  family_hug: {
    headline:
      "Does Your Home Feel like a [[Family's Hug]] truly Panatag?",
    subcopy:
      "In 60 seconds, take this short questions to know your **Free Home Panatag Rating** tailored to your home details. So your family can enjoy a safe and secured home with comfort in mind.",
  },
};

// Use [[...]] around any phrase to apply headline emphasis styling.
// Use **...** around any phrase to apply subheadline bold styling.
// Example: "Be the [[Safest Home in The Neighborhood]] in 60 seconds"
// Switch this key to quickly test a different hero headline/subcopy variant.
export const ACTIVE_HOME_HERO_COPY_VARIANT: HomeHeroCopyVariantKey =
  "panatag_rating";

export const HOME_HERO_COPY =
  HOME_HERO_COPY_VARIANTS[ACTIVE_HOME_HERO_COPY_VARIANT];
