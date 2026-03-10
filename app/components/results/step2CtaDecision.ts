import { SOLUTION_OPTIONS } from "../../lib/formOptions";
import type { LeadTier } from "../../lib/types";

export type Step2CtaAction = "diy" | "call" | "book";
export type Step2FollowupChannel = "call" | "email";

export type Step2CtaDecision = {
  action: Step2CtaAction;
  showFollowup: boolean;
  followupChannel: Step2FollowupChannel | null;
};

type ResolveStep2CtaDecisionArgs = {
  leadTier: LeadTier;
  solution: string;
  mobile: string;
};

const VALID_PH_MOBILE_REGEX = /^09\d{9}$/;

const hasValidPhMobile = (mobile: string): boolean =>
  VALID_PH_MOBILE_REGEX.test(mobile.trim());

const getFallbackAction = (leadTier: LeadTier): Step2CtaAction => {
  if (leadTier === "Nurture") return "call";
  return "book";
};

const resolveMatrixAction = (
  leadTier: LeadTier,
  solution: string,
): Step2CtaAction | null => {
  switch (leadTier) {
    case "Nurture":
      if (solution === SOLUTION_OPTIONS.DIY_HOME_SAFETY_PLAN) return "diy";
      if (solution === SOLUTION_OPTIONS.ONE_ON_ONE_HOME_SECURITY_CONSULTATION) {
        return "call";
      }
      if (solution === SOLUTION_OPTIONS.DONE_FOR_YOU_SETUP) return "call";
      return null;
    case "Warm":
      if (solution === SOLUTION_OPTIONS.DIY_HOME_SAFETY_PLAN) return "diy";
      if (solution === SOLUTION_OPTIONS.ONE_ON_ONE_HOME_SECURITY_CONSULTATION) {
        return "book";
      }
      if (solution === SOLUTION_OPTIONS.DONE_FOR_YOU_SETUP) return "book";
      return null;
    case "Hot":
      if (solution === SOLUTION_OPTIONS.DIY_HOME_SAFETY_PLAN) return "call";
      if (solution === SOLUTION_OPTIONS.ONE_ON_ONE_HOME_SECURITY_CONSULTATION) {
        return "book";
      }
      if (solution === SOLUTION_OPTIONS.DONE_FOR_YOU_SETUP) return "book";
      return null;
    default:
      return null;
  }
};

export const resolveStep2CtaDecision = ({
  leadTier,
  solution,
  mobile,
}: ResolveStep2CtaDecisionArgs): Step2CtaDecision => {
  const action = resolveMatrixAction(leadTier, solution) ?? getFallbackAction(leadTier);
  const showFollowup =
    solution === SOLUTION_OPTIONS.DONE_FOR_YOU_SETUP && action === "book";
  const followupChannel = showFollowup
    ? hasValidPhMobile(mobile)
      ? "call"
      : "email"
    : null;

  return {
    action,
    showFollowup,
    followupChannel,
  };
};
