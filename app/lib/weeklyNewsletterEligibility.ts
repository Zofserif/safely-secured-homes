export type WeeklyNewsletterEligibilityState =
  | "eligible"
  | "suppressed_active_journey"
  | "ineligible_status";

export const getWeeklyNewsletterEligibilityState = ({
  subscriberStatus,
  hasActiveJourney,
}: {
  subscriberStatus: string | null | undefined;
  hasActiveJourney: boolean;
}): WeeklyNewsletterEligibilityState => {
  if (subscriberStatus !== "subscribed") {
    return "ineligible_status";
  }

  if (hasActiveJourney) {
    return "suppressed_active_journey";
  }

  return "eligible";
};

export const canReceiveWeeklyNewsletter = ({
  subscriberStatus,
  hasActiveJourney,
}: {
  subscriberStatus: string | null | undefined;
  hasActiveJourney: boolean;
}): boolean =>
  getWeeklyNewsletterEligibilityState({
    subscriberStatus,
    hasActiveJourney,
  }) === "eligible";
