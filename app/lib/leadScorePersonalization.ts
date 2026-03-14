import "server-only";

import { getLeadPayloadName, getLeadPayloadScorePersonalization } from "./leadPayload";
import { getLatestLeadPayloadByEmail } from "./leadPayloadStore";

export type LeadRecipientProfile = {
  name: string;
  scoreValue: number | null;
  score?: string | null;
  scoreComment?: string | null;
};

export async function getLatestLeadScorePersonalizationByEmail(email: string) {
  const profile = await getLatestLeadRecipientProfileByEmail(email);
  if (!profile || profile.scoreValue === null) {
    return null;
  }

  return {
    scoreValue: profile.scoreValue,
    score: profile.score ?? null,
    scoreComment: profile.scoreComment ?? null,
  };
}

export async function getLatestLeadRecipientProfileByEmail(
  email: string,
): Promise<LeadRecipientProfile | null> {
  const latestLead = await getLatestLeadPayloadByEmail(email);
  if (!latestLead) return null;

  const personalization = getLeadPayloadScorePersonalization(latestLead.payload);
  const scoreValue = personalization?.scoreValue ?? null;

  return {
    name:
      getLeadPayloadName(latestLead.payload, {
        email: latestLead.email,
        name: latestLead.name,
      }) || latestLead.name,
    scoreValue,
    ...(personalization ?? {}),
  };
}
