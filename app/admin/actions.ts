"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getAdminBlogPostById,
  normalizeBlogSlug,
  saveAdminBlogPost,
  sendAdminBlogPostNewsletter,
} from "../lib/adminBlogPosts";
import {
  clearAdminSession,
  createAdminSession,
  getAdminAuthConfigurationError,
  isValidAdminPassword,
  requireAdminSession,
} from "../lib/adminAuth";

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

const toSafeString = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : "";

const toBooleanField = (value: FormDataEntryValue | null) =>
  typeof value === "string" && value === "on";

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
    ctaLabel: toSafeString(formData.get("ctaLabel")),
    ctaUrl: toSafeString(formData.get("ctaUrl")),
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
        flash: "Draft saved.",
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
    const result = await sendAdminBlogPostNewsletter(post.id);
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
