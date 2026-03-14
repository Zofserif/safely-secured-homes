import "server-only";

import { getLeadPayloadHasBonus } from "./leadPayload";
import { getLatestLeadPayloadByEmail } from "./leadPayloadStore";

export async function getLatestLeadHasBonusByEmail(
  email: string,
): Promise<boolean> {
  const latestLead = await getLatestLeadPayloadByEmail(email);
  if (!latestLead) return false;

  return getLeadPayloadHasBonus(latestLead.payload);
}
