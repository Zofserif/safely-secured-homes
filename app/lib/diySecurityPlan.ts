import { TIMELINE_VALUES } from "./formOptions";

export const isResearchingTimeline = (timeline: string): boolean =>
  timeline.trim() === TIMELINE_VALUES.RESEARCHING;

export const deriveDiySecurityPlan = (timeline: string): boolean =>
  isResearchingTimeline(timeline);

export const normalizeDiySecurityPlan = <
  T extends { timeline: string; diy_security_plan: boolean },
>(
  data: T,
): T => ({
  ...data,
  diy_security_plan: deriveDiySecurityPlan(data.timeline),
});
