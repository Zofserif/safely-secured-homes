"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteAdminJourneyStep,
  saveAdminJourney,
  saveAdminJourneyStep,
} from "../lib/adminJourneys";
import {
  deleteAdminDraftBlogPost,
  getAdminBlogPostById,
  normalizeBlogSlug,
  saveAdminBlogPost,
  sendAdminBlogPostNewsletter,
  sendAdminBlogPostTestEmail,
} from "../lib/adminBlogPosts";
import { getAdminSubscriberDetail } from "../lib/adminSubscribers";
import {
  clearAdminSession,
  createAdminSession,
  getAdminAuthConfigurationError,
  isValidAdminPassword,
  requireAdminSession,
} from "../lib/adminAuth";
import { processJourneyEnrollment } from "../lib/leadJourney";
import { saveSiteAdminSettings } from "../lib/siteAdminSettingsServer";
import {
  assignJourneyEnrollment,
  cancelJourneyEnrollment,
  getAnyActiveJourneyEnrollmentForSubscriber,
} from "../lib/newsletterCampaigns";

const buildAdminBlogRedirect = ({
  postId,
  isNew,
  flash,
  error,
}: {
  postId?: string;
  isNew?: boolean;
  flash?: string;
  error?: string;
}) => {
  const params = new URLSearchParams();
  if (postId) {
    params.set("post", postId);
  } else if (isNew) {
    params.set("new", "1");
  }
  if (flash) {
    params.set("flash", flash);
  }
  if (error) {
    params.set("error", error);
  }

  const query = params.toString();
  return query ? `/admin/blog?${query}` : "/admin/blog";
};

const buildAdminJourneyRedirect = ({
  journeyKey,
  isNew,
  flash,
  error,
}: {
  journeyKey?: string;
  isNew?: boolean;
  flash?: string;
  error?: string;
}) => {
  const params = new URLSearchParams();
  if (journeyKey) {
    params.set("journey", journeyKey);
  } else if (isNew) {
    params.set("new", "1");
  }
  if (flash) {
    params.set("flash", flash);
  }
  if (error) {
    params.set("error", error);
  }

  const query = params.toString();
  return query ? `/admin/journeys?${query}` : "/admin/journeys";
};

const buildAdminSubscriberRedirect = ({
  subscriberId,
  query,
  flash,
  error,
}: {
  subscriberId?: string;
  query?: string;
  flash?: string;
  error?: string;
}) => {
  const params = new URLSearchParams();
  if (subscriberId) {
    params.set("subscriber", subscriberId);
  }
  if (query) {
    params.set("q", query);
  }
  if (flash) {
    params.set("flash", flash);
  }
  if (error) {
    params.set("error", error);
  }

  const queryString = params.toString();
  return queryString ? `/admin/subscribers?${queryString}` : "/admin/subscribers";
};

const buildAdminSettingsRedirect = ({
  flash,
  error,
}: {
  flash?: string;
  error?: string;
}) => {
  const params = new URLSearchParams();
  if (flash) {
    params.set("flash", flash);
  }
  if (error) {
    params.set("error", error);
  }

  const queryString = params.toString();
  return queryString ? `/admin/settings?${queryString}` : "/admin/settings";
};

const toSafeString = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : "";

const toBooleanField = (value: FormDataEntryValue | null) =>
  typeof value === "string" && value === "on";

const toIntegerField = (value: FormDataEntryValue | null, fallback = 0) => {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toOptionalIntegerField = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseSaveInput = (
  formData: FormData,
  status: "draft" | "published",
) => {
  const title = toSafeString(formData.get("title"));
  const requestedSlug = toSafeString(formData.get("slug"));

  return {
    postId: toSafeString(formData.get("postId")) || undefined,
    title,
    slug: normalizeBlogSlug(requestedSlug || title),
    subject: toSafeString(formData.get("subject")),
    previewText: toSafeString(formData.get("previewText")),
    contentMarkdown: toSafeString(formData.get("contentMarkdown")),
    ctaMarkdown: toSafeString(formData.get("ctaMarkdown")),
    newsletterEnabled: toBooleanField(formData.get("newsletterEnabled")),
    status,
  } as const;
};

const resolveActionErrorMessage = (error: unknown) => {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.code === "string" && record.code === "23505") {
      return "That slug is already in use.";
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message.trim();
    }
  }

  return "The admin action failed.";
};

const revalidateBlogPaths = (slug: string, previousSlug?: string) => {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/blog/${previousSlug}`);
  }
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
};

const revalidateJourneyRelatedPaths = (blogSlugs: string[] = []) => {
  revalidatePath("/admin/journeys");
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  for (const blogSlug of blogSlugs) {
    if (!blogSlug) continue;
    revalidatePath(`/blog/${blogSlug}`);
  }
};

export async function loginAdminAction(formData: FormData) {
  const configurationError = getAdminAuthConfigurationError();
  if (configurationError) {
    redirect(`/admin/login?error=${encodeURIComponent(configurationError)}`);
  }

  const password = toSafeString(formData.get("password"));
  if (!isValidAdminPassword(password)) {
    redirect("/admin/login?error=Invalid%20password.");
  }

  await createAdminSession();
  redirect("/admin/blog");
}

export async function logoutAdminAction() {
  await requireAdminSession();
  await clearAdminSession();
  redirect("/admin/login?flash=Logged%20out.");
}

export async function saveDraftBlogPostAction(formData: FormData) {
  await requireAdminSession();

  const postId = toSafeString(formData.get("postId"));
  const existingPost = postId ? await getAdminBlogPostById(postId) : undefined;

  try {
    const savedPost = await saveAdminBlogPost(parseSaveInput(formData, "draft"));
    revalidateBlogPaths(savedPost.slug, existingPost?.slug);
    redirect(
      buildAdminBlogRedirect({
        postId: savedPost.id,
        flash:
          existingPost?.status === "published"
            ? "Post unpublished."
            : "Draft saved.",
      }),
    );
  } catch (error) {
    redirect(
      buildAdminBlogRedirect({
        postId: postId || undefined,
        isNew: !postId,
        error: resolveActionErrorMessage(error),
      }),
    );
  }
}

export async function publishBlogPostAction(formData: FormData) {
  await requireAdminSession();

  const postId = toSafeString(formData.get("postId"));
  const existingPost = postId ? await getAdminBlogPostById(postId) : undefined;

  try {
    const savedPost = await saveAdminBlogPost(
      parseSaveInput(formData, "published"),
    );
    revalidateBlogPaths(savedPost.slug, existingPost?.slug);
    redirect(
      buildAdminBlogRedirect({
        postId: savedPost.id,
        flash: existingPost ? "Post updated." : "Post published.",
      }),
    );
  } catch (error) {
    redirect(
      buildAdminBlogRedirect({
        postId: postId || undefined,
        isNew: !postId,
        error: resolveActionErrorMessage(error),
      }),
    );
  }
}

export async function deleteDraftBlogPostAction(formData: FormData) {
  await requireAdminSession();

  const postId = toSafeString(formData.get("postId"));
  if (!postId) {
    redirect(
      buildAdminBlogRedirect({
        isNew: true,
        error: "Post ID is required.",
      }),
    );
  }

  const post = await getAdminBlogPostById(postId);
  if (!post) {
    redirect(
      buildAdminBlogRedirect({
        isNew: true,
        error: "Blog post not found.",
      }),
    );
  }

  try {
    const deletedPost = await deleteAdminDraftBlogPost(post.id);
    revalidateBlogPaths(deletedPost.slug);
    redirect(
      buildAdminBlogRedirect({
        isNew: true,
        flash: "Draft deleted.",
      }),
    );
  } catch (error) {
    redirect(
      buildAdminBlogRedirect({
        postId: post.id,
        error: resolveActionErrorMessage(error),
      }),
    );
  }
}

export async function saveJourneyAction(formData: FormData) {
  await requireAdminSession();

  const existingKey = toSafeString(formData.get("existingKey"));

  try {
    const result = await saveAdminJourney({
      existingKey: existingKey || undefined,
      key: toSafeString(formData.get("key")),
      name: toSafeString(formData.get("name")),
      objectiveKey: toSafeString(formData.get("objectiveKey")),
      badgeKey: toSafeString(formData.get("badgeKey")),
      badgeName: toSafeString(formData.get("badgeName")),
      status:
        toSafeString(formData.get("status")) === "active"
          ? "active"
          : toSafeString(formData.get("status")) === "paused"
            ? "paused"
            : toSafeString(formData.get("status")) === "archived"
              ? "archived"
              : "draft",
    });

    revalidateJourneyRelatedPaths(result.affectedBlogSlugs);
    redirect(
      buildAdminJourneyRedirect({
        journeyKey: result.journey.key,
        flash: existingKey ? "Journey updated." : "Journey created.",
      }),
    );
  } catch (error) {
    redirect(
      buildAdminJourneyRedirect({
        journeyKey: existingKey || undefined,
        isNew: !existingKey,
        error: resolveActionErrorMessage(error),
      }),
    );
  }
}

export async function saveJourneyStepAction(formData: FormData) {
  await requireAdminSession();

  const journeyKey = toSafeString(formData.get("journeyKey"));

  try {
    const result = await saveAdminJourneyStep({
      journeyKey,
      existingStepKey: toSafeString(formData.get("existingStepKey")) || undefined,
      stepKey: toSafeString(formData.get("stepKey")),
      stepOrder: toIntegerField(formData.get("stepOrder"), 1),
      delayDays: toIntegerField(formData.get("delayDays"), 0),
      blogPostId: toSafeString(formData.get("blogPostId")),
      ctaOverrideMarkdown: toSafeString(formData.get("ctaOverrideMarkdown")),
      isActive: toBooleanField(formData.get("isActive")),
    });

    revalidateJourneyRelatedPaths(result.affectedBlogSlugs);
    redirect(
      buildAdminJourneyRedirect({
        journeyKey: result.journey.key,
        flash: "Journey step saved.",
      }),
    );
  } catch (error) {
    redirect(
      buildAdminJourneyRedirect({
        journeyKey: journeyKey || undefined,
        error: resolveActionErrorMessage(error),
      }),
    );
  }
}

export async function deleteJourneyStepAction(formData: FormData) {
  await requireAdminSession();

  const journeyKey = toSafeString(formData.get("journeyKey"));

  try {
    const result = await deleteAdminJourneyStep({
      journeyKey,
      stepKey: toSafeString(formData.get("stepKey")),
    });

    revalidateJourneyRelatedPaths(result.affectedBlogSlugs);
    redirect(
      buildAdminJourneyRedirect({
        journeyKey: journeyKey || undefined,
        flash: "Journey step deleted.",
      }),
    );
  } catch (error) {
    redirect(
      buildAdminJourneyRedirect({
        journeyKey: journeyKey || undefined,
        error: resolveActionErrorMessage(error),
      }),
    );
  }
}

export async function assignSubscriberJourneyAction(formData: FormData) {
  await requireAdminSession();

  const subscriberId = toSafeString(formData.get("subscriberId"));
  const query = toSafeString(formData.get("query"));

  if (!subscriberId) {
    redirect(
      buildAdminSubscriberRedirect({
        query,
        error: "Subscriber ID is required.",
      }),
    );
  }

  const subscriber = await getAdminSubscriberDetail(subscriberId);
  if (!subscriber) {
    redirect(
      buildAdminSubscriberRedirect({
        query,
        error: "Subscriber not found.",
      }),
    );
  }

  try {
    const enrollment = await assignJourneyEnrollment({
      subscriberId: subscriber.subscriberId,
      journeyKey: toSafeString(formData.get("journeyKey")),
      assignmentReason: "manual_admin_assignment",
    });
    const immediateResult = await processJourneyEnrollment(enrollment.enrollmentId);

    if (immediateResult.action === "failed") {
      throw new Error(immediateResult.reason);
    }

    revalidatePath("/admin/subscribers");
    const flash =
      immediateResult.action === "sent"
        ? "Journey assigned and day-0 email sent."
        : immediateResult.action === "skipped" &&
            immediateResult.reason === "email_disabled"
          ? "Journey assigned. Day-0 email skipped because email sending is disabled."
        : "Journey assigned.";

    redirect(
      buildAdminSubscriberRedirect({
        subscriberId: subscriber.subscriberId,
        query,
        flash,
      }),
    );
  } catch (error) {
    redirect(
      buildAdminSubscriberRedirect({
        subscriberId: subscriber.subscriberId,
        query,
        error: resolveActionErrorMessage(error),
      }),
    );
  }
}

export async function cancelSubscriberJourneyAction(formData: FormData) {
  await requireAdminSession();

  const subscriberId = toSafeString(formData.get("subscriberId"));
  const query = toSafeString(formData.get("query"));

  if (!subscriberId) {
    redirect(
      buildAdminSubscriberRedirect({
        query,
        error: "Subscriber ID is required.",
      }),
    );
  }

  try {
    const activeEnrollment =
      await getAnyActiveJourneyEnrollmentForSubscriber(subscriberId);
    if (!activeEnrollment) {
      throw new Error("This subscriber has no active journey.");
    }

    await cancelJourneyEnrollment(
      activeEnrollment.enrollmentId,
      "manual_admin_cancel",
    );

    revalidatePath("/admin/subscribers");
    redirect(
      buildAdminSubscriberRedirect({
        subscriberId,
        query,
        flash: "Active journey cancelled.",
      }),
    );
  } catch (error) {
    redirect(
      buildAdminSubscriberRedirect({
        subscriberId: subscriberId || undefined,
        query,
        error: resolveActionErrorMessage(error),
      }),
    );
  }
}

export async function saveSiteSettingsAction(formData: FormData) {
  await requireAdminSession();

  try {
    await saveSiteAdminSettings({
      bonusEnabled: toBooleanField(formData.get("bonusEnabled")),
      panatagCycleLimit: toIntegerField(formData.get("panatagCycleLimit"), 0),
      testimonialJourneyEnabled: toBooleanField(
        formData.get("testimonialJourneyEnabled"),
      ),
      emailSendingEnabled: toBooleanField(formData.get("emailSendingEnabled")),
    });

    revalidatePath("/");
    revalidatePath("/form");
    revalidatePath("/results");
    revalidatePath("/admin/settings");

    redirect(
      buildAdminSettingsRedirect({
        flash: "Settings updated.",
      }),
    );
  } catch (error) {
    redirect(
      buildAdminSettingsRedirect({
        error: resolveActionErrorMessage(error),
      }),
    );
  }
}

export async function sendBlogNewsletterAction(formData: FormData) {
  await requireAdminSession();

  const postId = toSafeString(formData.get("postId"));
  if (!postId) {
    redirect(
      buildAdminBlogRedirect({
        isNew: true,
        error: "Post ID is required.",
      }),
    );
  }

  const post = await getAdminBlogPostById(postId);
  if (!post) {
    redirect(
      buildAdminBlogRedirect({
        isNew: true,
        error: "Blog post not found.",
      }),
    );
  }

  try {
    const result = await sendAdminBlogPostNewsletter(
      post.id,
      toOptionalIntegerField(formData.get("offerHours")),
    );
    if ("status" in result && result.status === "no_subscribers") {
      redirect(
        buildAdminBlogRedirect({
          postId: post.id,
          error: "No subscribed newsletter recipients were found.",
        }),
      );
    }

    const sendResult = result as Exclude<
      Awaited<ReturnType<typeof sendAdminBlogPostNewsletter>>,
      { status: "no_subscribers" }
    >;

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);

    const flash =
      sendResult.failedCount > 0
        ? `Newsletter send finished with ${sendResult.failedCount} failed recipient(s).`
        : sendResult.skippedCount > 0
          ? "Newsletter retry completed. Previously sent recipients were skipped."
          : "Newsletter send completed.";

    redirect(
      buildAdminBlogRedirect({
        postId: post.id,
        flash,
      }),
    );
  } catch (error) {
    redirect(
      buildAdminBlogRedirect({
        postId: post.id,
        error: resolveActionErrorMessage(error),
      }),
    );
  }
}

export async function sendTestBlogPostEmailAction(formData: FormData) {
  await requireAdminSession();

  const postId = toSafeString(formData.get("postId"));
  if (!postId) {
    redirect(
      buildAdminBlogRedirect({
        isNew: true,
        error: "Post ID is required.",
      }),
    );
  }

  const post = await getAdminBlogPostById(postId);
  if (!post) {
    redirect(
      buildAdminBlogRedirect({
        isNew: true,
        error: "Blog post not found.",
      }),
    );
  }

  try {
    const result = await sendAdminBlogPostTestEmail({
      postId: post.id,
      recipientEmail: toSafeString(formData.get("testEmail")),
      recipientName: toSafeString(formData.get("testName")) || undefined,
      offerHours: toOptionalIntegerField(formData.get("offerHours")),
    });

    redirect(
      buildAdminBlogRedirect({
        postId: post.id,
        flash: `Test email sent to ${result.recipientEmail}.`,
      }),
    );
  } catch (error) {
    redirect(
      buildAdminBlogRedirect({
        postId: post.id,
        error: resolveActionErrorMessage(error),
      }),
    );
  }
}
