import "server-only";

import { getEmailJourneyDefinition } from "./emailJourneyStore";
import { EMAIL_JOURNEY_KEYS, type EmailJourneyKey } from "./emailJourneys";
import { getJourneyAssignmentReadiness } from "./journeyAssignmentReadiness";
import { getPublicSiteSettings } from "./siteAdminSettingsServer";
import {
  assignWaitlistJourneyEnrollment,
  completeWaitlistJourneyEnrollment,
  getWaitlistEmailDeliveriesByEnrollmentId,
  getWaitlistJourneyEnrollmentById,
  getWaitlistJourneySteps,
  listActiveWaitlistJourneyEnrollments,
  listPendingWaitlistedClientsForJourneyEnrollment,
  setWaitlistJourneyEnrollmentNextStep,
  setWaitlistedClientPendingJourneyEnrollment,
  type WaitlistEmailDeliveryLog,
} from "./waitlistClients";
import { sendTrackedWaitlistJourneyEmailByPostId } from "./waitlistJourneyEmail";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const QUEUED_RETRY_WINDOW_MS = 10 * 60 * 1000;
const WAITLIST_JOURNEY_KEY = EMAIL_JOURNEY_KEYS.reportsWaitlistJourney;

type WaitlistJourneyProcessSkipReason =
  | "journey_mismatch"
  | "journey_not_active"
  | "enrollment_missing"
  | "not_due"
  | "no_steps"
  | "email_disabled"
  | "queued_recently"
  | "client_not_waitlisted";

export type WaitlistJourneyProcessResult =
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
      reason: WaitlistJourneyProcessSkipReason;
      stepKey?: string;
      dueAt?: string;
    };

export type ProcessDueWaitlistJourneyStepsResult = {
  processedAt: string;
  counts: {
    sent: number;
    skipped: number;
    completed: number;
    failed: number;
  };
  results: WaitlistJourneyProcessResult[];
};

export type ProcessPendingWaitlistEnrollmentsResult = {
  processedAt: string;
  journeyReady: boolean;
  counts: {
    enrolled: number;
    alreadyEnrolled: number;
    failed: number;
  };
  results: Array<{
    waitlistedClientId: string;
    enrollmentId?: string;
    action: "enrolled" | "already_enrolled" | "failed";
    reason?: string;
  }>;
};

const isFinalizedSendStatus = (status: WaitlistEmailDeliveryLog["status"]) =>
  status === "sent";

const resolveDueAt = (enteredAt: string, delayDays: number) =>
  new Date(new Date(enteredAt).getTime() + delayDays * DAY_IN_MS);

const findNextPendingStep = (
  steps: Awaited<ReturnType<typeof getWaitlistJourneySteps>>,
  sendLogsByStepKey: Map<string, WaitlistEmailDeliveryLog>,
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
  steps: Awaited<ReturnType<typeof getWaitlistJourneySteps>>,
  stepKey: string,
) => {
  const currentIndex = steps.findIndex((candidate) => candidate.stepKey === stepKey);
  const nextStep = currentIndex === -1 ? null : steps[currentIndex + 1] ?? null;

  if (nextStep) {
    await setWaitlistJourneyEnrollmentNextStep(enrollmentId, {
      stepKey: nextStep.stepKey,
      stepOrder: nextStep.stepOrder,
    });
    return;
  }

  await completeWaitlistJourneyEnrollment(enrollmentId, "journey_finished");
};

export async function processWaitlistJourneyEnrollment(
  enrollmentId: string,
  nowIso = new Date().toISOString(),
  expectedJourneyKey: EmailJourneyKey = WAITLIST_JOURNEY_KEY,
): Promise<WaitlistJourneyProcessResult> {
  const enrollment = await getWaitlistJourneyEnrollmentById(enrollmentId);
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

  if (enrollment.clientStatus !== "waitlisted") {
    return {
      action: "skipped",
      enrollmentId,
      reason: "client_not_waitlisted",
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

  const steps = await getWaitlistJourneySteps(enrollment.journeyKey);
  if (steps.length === 0) {
    return {
      action: "skipped",
      enrollmentId,
      reason: "no_steps",
    };
  }

  const sendLogs = await getWaitlistEmailDeliveriesByEnrollmentId(enrollment.enrollmentId);
  const sendLogsByStepKey = new Map<string, WaitlistEmailDeliveryLog>();
  for (const sendLog of sendLogs) {
    sendLogsByStepKey.set(sendLog.stepKey, sendLog);
  }

  const nextPending = findNextPendingStep(steps, sendLogsByStepKey);
  if (!nextPending) {
    await completeWaitlistJourneyEnrollment(enrollment.enrollmentId, "journey_finished");
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
    await setWaitlistJourneyEnrollmentNextStep(enrollment.enrollmentId, {
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
    const sendResult = await sendTrackedWaitlistJourneyEmailByPostId({
      waitlistedClientId: enrollment.waitlistedClientId,
      enrollmentId: enrollment.enrollmentId,
      recipientEmail: enrollment.clientEmail,
      recipientName: enrollment.clientName,
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
      reason: error instanceof Error ? error.message : "Waitlist journey send failed.",
    };
  }
}

export async function processDueWaitlistJourneySteps({
  limit = 200,
  nowIso = new Date().toISOString(),
  journeyKey = WAITLIST_JOURNEY_KEY,
}: {
  limit?: number;
  nowIso?: string;
  journeyKey?: EmailJourneyKey;
} = {}): Promise<ProcessDueWaitlistJourneyStepsResult> {
  const activeEnrollments = await listActiveWaitlistJourneyEnrollments({
    journeyKey,
  });
  const selectedEnrollments = activeEnrollments.slice(0, Math.max(0, limit));
  const results: WaitlistJourneyProcessResult[] = [];

  for (const enrollment of selectedEnrollments) {
    results.push(
      await processWaitlistJourneyEnrollment(
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

export async function processPendingWaitlistJourneyEnrollments({
  limit = 200,
  nowIso = new Date().toISOString(),
}: {
  limit?: number;
  nowIso?: string;
} = {}): Promise<ProcessPendingWaitlistEnrollmentsResult> {
  const readiness = await getJourneyAssignmentReadiness(WAITLIST_JOURNEY_KEY);
  if (!readiness.isAssignable) {
    return {
      processedAt: nowIso,
      journeyReady: false,
      counts: {
        enrolled: 0,
        alreadyEnrolled: 0,
        failed: 0,
      },
      results: [],
    };
  }

  const pendingWaitlistedClients = await listPendingWaitlistedClientsForJourneyEnrollment({
    limit,
  });
  const results: ProcessPendingWaitlistEnrollmentsResult["results"] = [];

  for (const waitlistedClient of pendingWaitlistedClients) {
    try {
      const enrollment = await assignWaitlistJourneyEnrollment({
        waitlistedClientId: waitlistedClient.waitlistedClientId,
        journeyKey: WAITLIST_JOURNEY_KEY,
        assignmentReason: `waitlist_capture:${waitlistedClient.source || "waitlist"}`,
      });
      await setWaitlistedClientPendingJourneyEnrollment(
        waitlistedClient.waitlistedClientId,
        false,
      );
      results.push({
        waitlistedClientId: waitlistedClient.waitlistedClientId,
        enrollmentId: enrollment.enrollmentId,
        action: enrollment.created ? "enrolled" : "already_enrolled",
      });
    } catch (error) {
      results.push({
        waitlistedClientId: waitlistedClient.waitlistedClientId,
        action: "failed",
        reason:
          error instanceof Error
            ? error.message
            : "Pending waitlist enrollment failed.",
      });
    }
  }

  return {
    processedAt: nowIso,
    journeyReady: true,
    counts: {
      enrolled: results.filter((result) => result.action === "enrolled").length,
      alreadyEnrolled: results.filter(
        (result) => result.action === "already_enrolled",
      ).length,
      failed: results.filter((result) => result.action === "failed").length,
    },
    results,
  };
}
