import "server-only";

import { getEmailJourneyDefinition } from "./emailJourneyStore";
import type { EmailJourneyKey } from "./emailJourneys";

export type JourneyAssignmentReadinessReason =
  | "missing"
  | "inactive"
  | "no_active_steps"
  | "lookup_failed";

export type JourneyAssignmentReadiness = {
  journeyKey: EmailJourneyKey;
  exists: boolean;
  isActive: boolean;
  activeStepCount: number;
  isAssignable: boolean;
  reason: JourneyAssignmentReadinessReason | null;
  errorMessage: string;
};

const toSafeString = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export async function getJourneyAssignmentReadiness(
  journeyKey: EmailJourneyKey,
): Promise<JourneyAssignmentReadiness> {
  const normalizedJourneyKey = toSafeString(journeyKey);
  if (!normalizedJourneyKey) {
    return {
      journeyKey: normalizedJourneyKey,
      exists: false,
      isActive: false,
      activeStepCount: 0,
      isAssignable: false,
      reason: "missing",
      errorMessage: "Journey key is required.",
    };
  }

  try {
    const definition = await getEmailJourneyDefinition(normalizedJourneyKey, {
      includeInactiveSteps: true,
    });

    if (!definition) {
      return {
        journeyKey: normalizedJourneyKey,
        exists: false,
        isActive: false,
        activeStepCount: 0,
        isAssignable: false,
        reason: "missing",
        errorMessage: "",
      };
    }

    const activeStepCount = definition.steps.filter((step) => step.isActive).length;
    const isActive = definition.status === "active";
    const isAssignable = isActive && activeStepCount > 0;

    return {
      journeyKey: definition.key,
      exists: true,
      isActive,
      activeStepCount,
      isAssignable,
      reason: !isActive
        ? "inactive"
        : activeStepCount === 0
          ? "no_active_steps"
          : null,
      errorMessage: "",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Journey readiness lookup failed.";
    console.error("Failed to load journey assignment readiness:", {
      journeyKey: normalizedJourneyKey,
      error: errorMessage,
    });

    return {
      journeyKey: normalizedJourneyKey,
      exists: false,
      isActive: false,
      activeStepCount: 0,
      isAssignable: false,
      reason: "lookup_failed",
      errorMessage,
    };
  }
}
