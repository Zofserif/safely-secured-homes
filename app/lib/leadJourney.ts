import "server-only";

import { getEmailJourneyDefinition } from "./emailJourneyStore";
import {
  completeJourneyEnrollment,
  EMAIL_JOURNEY_KEYS,
  getEmailDeliveriesByEnrollmentId,
  getJourneyEnrollmentById,
  getJourneySteps,
  listActiveJourneyEnrollments,
  setJourneyEnrollmentNextStep,
  type EmailDeliveryLog,
  type EmailJourneyKey,
  type EmailJourneyStep,
} from "./newsletterCampaigns";
import { sendTrackedEnrollmentNewsletterCampaignEmailByPostId } from "./newsletterCampaignEmail";
import { getPublicSiteSettings } from "./siteAdminSettingsServer";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const QUEUED_RETRY_WINDOW_MS = 10 * 60 * 1000;

type JourneyProcessSkipReason =
  | "journey_mismatch"
  | "journey_not_active"
  | "enrollment_missing"
  | "not_due"
  | "no_steps"
  | "email_disabled"
  | "queued_recently"
  | "subscriber_not_subscribed";

export type JourneyProcessResult =
  | {
      action: "completed";
      enrollmentId: string;
      reason: "journey_finished";
    }
  | {
      action: "failed";
      enrollmentId: string;
      reason: string;
      stepKey?: string;
    }
  | {
      action: "sent";
      enrollmentId: string;
      stepKey: string;
      sendLogId: string;
    }
  | {
      action: "skipped";
      enrollmentId: string;
      reason: JourneyProcessSkipReason;
      stepKey?: string;
      dueAt?: string;
    };

export type ProcessDueJourneyStepsResult = {
  processedAt: string;
  counts: {
    sent: number;
    skipped: number;
    completed: number;
    failed: number;
  };
  results: JourneyProcessResult[];
};

const isFinalizedSendStatus = (status: EmailDeliveryLog["status"]) =>
  status === "sent";

const resolveDueAt = (enteredAt: string, delayDays: number) =>
  new Date(new Date(enteredAt).getTime() + delayDays * DAY_IN_MS);

const findNextPendingStep = (
  steps: EmailJourneyStep[],
  sendLogsByStepKey: Map<string, EmailDeliveryLog>,
) => {
  for (const step of steps) {
    const sendLog = sendLogsByStepKey.get(step.stepKey);
    if (sendLog && isFinalizedSendStatus(sendLog.status)) {
      continue;
    }

    return { step, sendLog };
  }

  return null;
};

const advanceJourneyAfterProcessedStep = async (
  enrollmentId: string,
  steps: EmailJourneyStep[],
  stepKey: string,
) => {
  const currentIndex = steps.findIndex((candidate) => candidate.stepKey === stepKey);
  const nextStep = currentIndex === -1 ? null : steps[currentIndex + 1] ?? null;

  if (nextStep) {
    await setJourneyEnrollmentNextStep(enrollmentId, {
      stepKey: nextStep.stepKey,
      stepOrder: nextStep.stepOrder,
    });
    return;
  }

  await completeJourneyEnrollment(enrollmentId, "journey_finished");
};

export async function processJourneyEnrollment(
  enrollmentId: string,
  nowIso = new Date().toISOString(),
  expectedJourneyKey?: EmailJourneyKey,
): Promise<JourneyProcessResult> {
  const enrollment = await getJourneyEnrollmentById(enrollmentId);
  if (!enrollment) {
    return {
      action: "skipped",
      enrollmentId,
      reason: "enrollment_missing",
    };
  }

  if (
    expectedJourneyKey &&
    enrollment.journeyKey !== expectedJourneyKey
  ) {
    return {
      action: "skipped",
      enrollmentId,
      reason: "journey_mismatch",
    };
  }

  if (enrollment.subscriberStatus !== "subscribed") {
    return {
      action: "skipped",
      enrollmentId,
      reason: "subscriber_not_subscribed",
    };
  }

  const definition = await getEmailJourneyDefinition(enrollment.journeyKey, {
    includeInactiveSteps: false,
  });
  if (!definition || definition.status !== "active") {
    return {
      action: "skipped",
      enrollmentId: enrollment.enrollmentId,
      reason: "journey_not_active",
    };
  }

  const steps = await getJourneySteps(enrollment.journeyKey);
  if (steps.length === 0) {
    return {
      action: "skipped",
      enrollmentId,
      reason: "no_steps",
    };
  }

  const sendLogs = await getEmailDeliveriesByEnrollmentId(enrollment.enrollmentId);
  const sendLogsByStepKey = new Map<string, EmailDeliveryLog>();
  for (const sendLog of sendLogs) {
    sendLogsByStepKey.set(sendLog.stepKey, sendLog);
  }

  const nextPending = findNextPendingStep(steps, sendLogsByStepKey);
  if (!nextPending) {
    await completeJourneyEnrollment(enrollment.enrollmentId, "journey_finished");
    return {
      action: "completed",
      enrollmentId: enrollment.enrollmentId,
      reason: "journey_finished",
    };
  }

  const { step, sendLog } = nextPending;
  const dueAt = resolveDueAt(enrollment.enteredAt, step.delayDays);
  const dueAtIso = dueAt.toISOString();

  if (
    enrollment.currentStepKey !== step.stepKey ||
    enrollment.currentStepOrder !== step.stepOrder
  ) {
    await setJourneyEnrollmentNextStep(enrollment.enrollmentId, {
      stepKey: step.stepKey,
      stepOrder: step.stepOrder,
    });
  }

  if (sendLog?.status === "queued" && sendLog.queuedAt) {
    const queuedAtMs = new Date(sendLog.queuedAt).getTime();
    const nowMs = new Date(nowIso).getTime();
    if (Number.isFinite(queuedAtMs) && nowMs - queuedAtMs < QUEUED_RETRY_WINDOW_MS) {
      return {
        action: "skipped",
        enrollmentId: enrollment.enrollmentId,
        stepKey: step.stepKey,
        reason: "queued_recently",
        dueAt: dueAtIso,
      };
    }
  }

  if (dueAt.getTime() > new Date(nowIso).getTime()) {
    return {
      action: "skipped",
      enrollmentId: enrollment.enrollmentId,
      stepKey: step.stepKey,
      reason: "not_due",
      dueAt: dueAtIso,
    };
  }

  const siteSettings = await getPublicSiteSettings();
  if (!siteSettings.emailSendingEnabled) {
    await advanceJourneyAfterProcessedStep(
      enrollment.enrollmentId,
      steps,
      step.stepKey,
    );
    return {
      action: "skipped",
      enrollmentId: enrollment.enrollmentId,
      stepKey: step.stepKey,
      reason: "email_disabled",
      dueAt: dueAtIso,
    };
  }

  try {
    const sendResult = await sendTrackedEnrollmentNewsletterCampaignEmailByPostId({
      journeyKey: enrollment.journeyKey,
      subscriberId: enrollment.subscriberId,
      enrollmentId: enrollment.enrollmentId,
      recipientEmail: enrollment.subscriberEmail,
      recipientName: enrollment.subscriberName,
      postId: step.blogPostId,
      stepKey: step.stepKey,
      ctaOverrideHtml: step.ctaOverrideHtml,
    });

    await advanceJourneyAfterProcessedStep(
      enrollment.enrollmentId,
      steps,
      step.stepKey,
    );

    return {
      action: "sent",
      enrollmentId: enrollment.enrollmentId,
      stepKey: step.stepKey,
      sendLogId: sendResult.sendLogId,
    };
  } catch (error) {
    return {
      action: "failed",
      enrollmentId: enrollment.enrollmentId,
      stepKey: step.stepKey,
      reason: error instanceof Error ? error.message : "Journey send failed.",
    };
  }
}

export async function processDueJourneySteps({
  limit = 200,
  nowIso = new Date().toISOString(),
  journeyKey,
}: {
  limit?: number;
  nowIso?: string;
  journeyKey?: EmailJourneyKey;
} = {}): Promise<ProcessDueJourneyStepsResult> {
  const activeEnrollments = await listActiveJourneyEnrollments({
    journeyKey,
  });
  const selectedEnrollments = activeEnrollments.slice(0, Math.max(0, limit));
  const results: JourneyProcessResult[] = [];

  for (const enrollment of selectedEnrollments) {
    results.push(
      await processJourneyEnrollment(
        enrollment.enrollmentId,
        nowIso,
        journeyKey,
      ),
    );
  }

  return {
    processedAt: nowIso,
    counts: {
      sent: results.filter((result) => result.action === "sent").length,
      skipped: results.filter((result) => result.action === "skipped").length,
      completed: results.filter((result) => result.action === "completed").length,
      failed: results.filter((result) => result.action === "failed").length,
    },
    results,
  };
}

export type LeadJourneyProcessResult = JourneyProcessResult;
export type ProcessDueLeadJourneyStepsResult = ProcessDueJourneyStepsResult;

export async function processLeadJourneyEnrollment(
  enrollmentId: string,
  nowIso = new Date().toISOString(),
) {
  return processJourneyEnrollment(
    enrollmentId,
    nowIso,
    EMAIL_JOURNEY_KEYS.leadFollowUpJourney,
  );
}

export async function processDueLeadJourneySteps({
  limit = 200,
  nowIso = new Date().toISOString(),
}: {
  limit?: number;
  nowIso?: string;
} = {}) {
  return processDueJourneySteps({
    limit,
    nowIso,
    journeyKey: EMAIL_JOURNEY_KEYS.leadFollowUpJourney,
  });
}
