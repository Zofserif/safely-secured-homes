export const EMAIL_JOURNEY_KEYS = {
  leadFollowUpJourney: "lead_follow_up_journey",
} as const;

export type EmailJourneyKey =
  (typeof EMAIL_JOURNEY_KEYS)[keyof typeof EMAIL_JOURNEY_KEYS];

export type EmailJourneyStepDefinition = {
  stepKey: string;
  stepOrder: number;
  delayDays: number;
  blogPostSlug: string;
  ctaOverrideHtml: string;
};

export type EmailJourneyDefinition = {
  key: EmailJourneyKey;
  name: string;
  objectiveKey: string;
  badge: {
    key: string;
    name: string;
  };
  steps: EmailJourneyStepDefinition[];
};

const buildScheduleCallCta = (source: string) =>
  `<div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/schedule-call?source=${source}" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Book a Free Site Visit</a></div>`;

const EMAIL_JOURNEY_DEFINITIONS: Record<
  EmailJourneyKey,
  EmailJourneyDefinition
> = {
  [EMAIL_JOURNEY_KEYS.leadFollowUpJourney]: {
    key: EMAIL_JOURNEY_KEYS.leadFollowUpJourney,
    name: "Lead Follow-up Journey",
    objectiveKey: "education",
    badge: {
      key: "lead_journey",
      name: "Lead Journey",
    },
    steps: [
      {
        stepKey: "lead_day_0_story",
        stepOrder: 1,
        delayDays: 0,
        blogPostSlug: "camera-placement-mistakes-families-make",
        ctaOverrideHtml: buildScheduleCallCta("lead_journey_day_0"),
      },
      {
        stepKey: "lead_day_3_lighting",
        stepOrder: 2,
        delayDays: 3,
        blogPostSlug: "smart-lighting-rules-for-safer-nights",
        ctaOverrideHtml: buildScheduleCallCta("lead_journey_day_3"),
      },
      {
        stepKey: "lead_day_6_routine",
        stepOrder: 3,
        delayDays: 6,
        blogPostSlug: "weekly-security-routine-15-minutes",
        ctaOverrideHtml: buildScheduleCallCta("lead_journey_day_6"),
      },
      {
        stepKey: "lead_day_10_site_visit",
        stepOrder: 4,
        delayDays: 10,
        blogPostSlug: "what-happens-during-a-home-security-site-visit",
        ctaOverrideHtml: buildScheduleCallCta("lead_journey_day_10"),
      },
    ],
  },
};

export const WEEKLY_NEWSLETTER_BADGE = {
  key: "weekly_newsletter",
  name: "Weekly Newsletter",
} as const;

export const listEmailJourneyDefinitions = (): EmailJourneyDefinition[] =>
  Object.values(EMAIL_JOURNEY_DEFINITIONS);

export const getEmailJourneyDefinition = (
  journeyKey: EmailJourneyKey,
): EmailJourneyDefinition | null => EMAIL_JOURNEY_DEFINITIONS[journeyKey] ?? null;

export const getEmailJourneyStepReferencesByPostSlug = (postSlug: string) => {
  const normalizedSlug = postSlug.trim();
  if (!normalizedSlug) return [];

  return listEmailJourneyDefinitions().flatMap((journey) =>
    journey.steps
      .filter((step) => step.blogPostSlug === normalizedSlug)
      .map((step) => ({
        journeyKey: journey.key,
        journeyName: journey.name,
        journeyObjectiveKey: journey.objectiveKey,
        badge: journey.badge,
        stepKey: step.stepKey,
        stepOrder: step.stepOrder,
        delayDays: step.delayDays,
        blogPostSlug: step.blogPostSlug,
        ctaOverrideHtml: step.ctaOverrideHtml,
      })),
  );
};
