import "server-only";

import {
  completeCampaignEnrollment,
  EMAIL_CAMPAIGN_KEYS,
  getCampaignEnrollmentById,
  getCampaignSendLogsByEnrollmentId,
  getCampaignSteps,
  listActiveCampaignEnrollmentsByCampaignKey,
  setCampaignEnrollmentNextStep,
  type CampaignSendLog,
  type EmailCampaignStep,
} from "./newsletterCampaigns";
import { sendTrackedEnrollmentNewsletterCampaignEmailByPostId } from "./newsletterCampaignEmail";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const QUEUED_RETRY_WINDOW_MS = 10 * 60 * 1000;

type LeadJourneySkipReason =
  | "campaign_mismatch"
  | "enrollment_missing"
  | "not_due"
  | "no_steps"
  | "queued_recently"
  | "subscriber_not_subscribed";

export type LeadJourneyProcessResult =
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
      reason: LeadJourneySkipReason;
      stepKey?: string;
      dueAt?: string;
    };

export type ProcessDueLeadJourneyStepsResult = {
  processedAt: string;
  counts: {
    sent: number;
    skipped: number;
    completed: number;
    failed: number;
  };
  results: LeadJourneyProcessResult[];
};

const isFinalizedSendStatus = (status: CampaignSendLog["status"]) =>
  status === "sent" ||
  status === "delivered" ||
  status === "opened" ||
  status === "clicked" ||
  status === "bounced";

const resolveDueAt = (enteredAt: string, delayDays: number) =>
  new Date(new Date(enteredAt).getTime() + delayDays * DAY_IN_MS);

const findNextPendingStep = (
  steps: EmailCampaignStep[],
  sendLogsByStepKey: Map<string, CampaignSendLog>,
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

export async function processLeadJourneyEnrollment(
  enrollmentId: string,
  nowIso = new Date().toISOString(),
): Promise<LeadJourneyProcessResult> {
  const enrollment = await getCampaignEnrollmentById(enrollmentId);
  if (!enrollment) {
    return {
      action: "skipped",
      enrollmentId,
      reason: "enrollment_missing",
    };
  }

  if (enrollment.campaignKey !== EMAIL_CAMPAIGN_KEYS.leadFollowUpJourney) {
    return {
      action: "skipped",
      enrollmentId,
      reason: "campaign_mismatch",
    };
  }

  if (enrollment.subscriberStatus !== "subscribed") {
    return {
      action: "skipped",
      enrollmentId,
      reason: "subscriber_not_subscribed",
    };
  }

  const steps = await getCampaignSteps(enrollment.campaignId);
  if (steps.length === 0) {
    return {
      action: "skipped",
      enrollmentId,
      reason: "no_steps",
    };
  }

  const sendLogs = await getCampaignSendLogsByEnrollmentId(enrollment.enrollmentId);
  const sendLogsByStepKey = new Map<string, CampaignSendLog>();
  for (const sendLog of sendLogs) {
    sendLogsByStepKey.set(sendLog.stepKey, sendLog);
  }

  const nextPending = findNextPendingStep(steps, sendLogsByStepKey);
  if (!nextPending) {
    await completeCampaignEnrollment(enrollment.enrollmentId, "journey_finished");
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
    await setCampaignEnrollmentNextStep(enrollment.enrollmentId, {
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

  try {
    const sendResult = await sendTrackedEnrollmentNewsletterCampaignEmailByPostId({
      campaignId: enrollment.campaignId,
      subscriberId: enrollment.subscriberId,
      enrollmentId: enrollment.enrollmentId,
      recipientEmail: enrollment.subscriberEmail,
      recipientName: enrollment.subscriberName,
      postId: step.blogPostId,
      stepKey: step.stepKey,
      ctaOverrideHtml: step.ctaOverrideHtml,
    });

    const currentIndex = steps.findIndex(
      (candidate) => candidate.stepKey === step.stepKey,
    );
    const nextStep = currentIndex === -1 ? null : steps[currentIndex + 1] ?? null;

    if (nextStep) {
      await setCampaignEnrollmentNextStep(enrollment.enrollmentId, {
        stepKey: nextStep.stepKey,
        stepOrder: nextStep.stepOrder,
      });
    } else {
      await completeCampaignEnrollment(enrollment.enrollmentId, "journey_finished");
    }

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
      reason: error instanceof Error ? error.message : "Lead journey send failed.",
    };
  }
}

export async function processDueLeadJourneySteps({
  limit = 200,
  nowIso = new Date().toISOString(),
}: {
  limit?: number;
  nowIso?: string;
} = {}): Promise<ProcessDueLeadJourneyStepsResult> {
  const activeEnrollments = await listActiveCampaignEnrollmentsByCampaignKey(
    EMAIL_CAMPAIGN_KEYS.leadFollowUpJourney,
  );
  const selectedEnrollments = activeEnrollments.slice(0, Math.max(0, limit));
  const results: LeadJourneyProcessResult[] = [];

  for (const enrollment of selectedEnrollments) {
    results.push(await processLeadJourneyEnrollment(enrollment.enrollmentId, nowIso));
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
