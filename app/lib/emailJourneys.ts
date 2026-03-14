export const EMAIL_JOURNEY_KEYS = {
  leadFollowUpJourney: "lead_follow_up_journey",
  smartHomeJourney: "smart_home_journey",
} as const;

export type EmailJourneyKey = string;

export type EmailJourneyStatus =
  | "draft"
  | "active"
  | "paused"
  | "archived";

export type EmailJourneyBadge = {
  key: string;
  name: string;
};

export type EmailJourneyStepDefinition = {
  stepKey: string;
  stepOrder: number;
  delayDays: number;
  blogPostId: string;
  blogPostSlug: string;
  ctaOverrideMarkdown: string;
  ctaOverrideHtml: string;
  isActive: boolean;
};

export type EmailJourneyDefinition = {
  key: EmailJourneyKey;
  name: string;
  objectiveKey: string;
  status: EmailJourneyStatus;
  badge: EmailJourneyBadge;
  steps: EmailJourneyStepDefinition[];
};

export type EmailJourneyStepReference = {
  journeyKey: EmailJourneyKey;
  journeyName: string;
  journeyObjectiveKey: string;
  journeyStatus: EmailJourneyStatus;
  badge: EmailJourneyBadge;
  stepKey: string;
  stepOrder: number;
  delayDays: number;
  blogPostId: string;
  blogPostSlug: string;
  ctaOverrideMarkdown: string;
  ctaOverrideHtml: string;
  isStepActive: boolean;
};

export const WEEKLY_NEWSLETTER_BADGE = {
  key: "weekly_newsletter",
  name: "Weekly Newsletter",
} as const;

export const buildScheduleCallCta = (source: string) =>
  `<div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/schedule-call?source=${source}" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Book a Free Site Visit</a></div>`;
