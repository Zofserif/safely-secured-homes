import type { Metadata } from "next";
import Link from "next/link";
import AdminSectionNav from "../../components/admin/AdminSectionNav";
import {
  deriveAdminNewsletterState,
  getAdminBlogPostById,
  getAdminBlogPosts,
  resolveNewsletterBroadcastSummary,
  type AdminBlogPost,
} from "../../lib/adminBlogPosts";
import { requireAdminSession } from "../../lib/adminAuth";
import { getBlogPostEmailUsage } from "../../lib/blogPosts";
import {
  deleteDraftBlogPostAction,
  logoutAdminAction,
  publishBlogPostAction,
  saveDraftBlogPostAction,
  sendBlogNewsletterAction,
} from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Admin Blog Manager",
  robots: {
    index: false,
    follow: false,
  },
};

const readSearchParam = (
  value: string | string[] | undefined,
): string => {
  if (Array.isArray(value)) {
    return value[0]?.trim() || "";
  }

  return typeof value === "string" ? value.trim() : "";
};

const formatDateTime = (value: string | null) => {
  if (!value) return "Not set";

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "Not set";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatShortDate = (value: string | null) => {
  if (!value) return "Not published";

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "Not published";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const stateLabelMap = {
  not_enabled: "Not enabled",
  ready: "Ready to send",
  retry_needed: "Retry needed",
  sent: "Sent",
} as const;

const stateToneMap = {
  not_enabled: "border-slate-200 bg-slate-100 text-slate-700",
  ready: "border-sky-200 bg-sky-50 text-sky-700",
  retry_needed: "border-amber-200 bg-amber-50 text-amber-700",
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700",
} as const;

const newPostMarkdownPlaceholder = `## Example headline

Start with one clear problem your reader cares about.

- Add practical advice in short bullets
- Keep each section focused
- End with a next step or CTA`;

const emptyEditor: Pick<
  AdminBlogPost,
  | "id"
  | "title"
  | "slug"
  | "subject"
  | "previewText"
  | "contentMarkdown"
  | "ctaLabel"
  | "ctaUrl"
  | "status"
  | "newsletterEnabled"
  | "newsletterSendKey"
> = {
  id: "",
  title: "",
  slug: "",
  subject: "",
  previewText: "",
  contentMarkdown: "",
  ctaLabel: "",
  ctaUrl: "",
  status: "draft",
  newsletterEnabled: false,
  newsletterSendKey: "",
};

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminSession();

  const resolvedSearchParams = await searchParams;
  const postIdParam = readSearchParam(resolvedSearchParams.post);
  const isCreatingNew = readSearchParam(resolvedSearchParams.new) === "1";
  const isConfirmDeleteRequested =
    readSearchParam(resolvedSearchParams.confirmDelete) === "1";
  const flashMessage = readSearchParam(resolvedSearchParams.flash);
  const errorMessage = readSearchParam(resolvedSearchParams.error);

  const posts = await getAdminBlogPosts();
  const resolvedSelectedPostId =
    !isCreatingNew && postIdParam
      ? postIdParam
      : !isCreatingNew && posts.length > 0
        ? posts[0].id
        : "";

  const selectedPost = resolvedSelectedPostId
    ? await getAdminBlogPostById(resolvedSelectedPostId)
    : undefined;

  const selectedUsage = selectedPost
    ? await getBlogPostEmailUsage(selectedPost.id)
    : {
        broadcastSends: [],
        journeySteps: [],
      };

  const editorValues = selectedPost ?? emptyEditor;
  const editorContextKey = isCreatingNew
    ? "new"
    : selectedPost?.id || "empty";
  const newsletterState = selectedPost
    ? deriveAdminNewsletterState({
        newsletterEnabled: selectedPost.newsletterEnabled,
        newsletterSendKey: selectedPost.newsletterSendKey,
        usage: selectedUsage,
      })
    : "not_enabled";
  const currentBroadcastSummary = selectedPost
    ? resolveNewsletterBroadcastSummary({
        usage: selectedUsage,
        newsletterSendKey: selectedPost.newsletterSendKey,
      })
    : null;

  const canSendNewsletter = selectedPost
    ? selectedPost.status === "published" &&
      selectedPost.newsletterEnabled &&
      newsletterState !== "sent"
    : false;

  const sendButtonLabel = !selectedPost
    ? "Select a post"
    : selectedPost.status !== "published"
      ? "Publish before sending"
      : !selectedPost.newsletterEnabled
        ? "Enable newsletter toggle"
        : newsletterState === "retry_needed"
          ? "Retry Failed Sends"
          : newsletterState === "sent"
            ? "Newsletter Sent"
            : "Send Newsletter";
  const draftButtonLabel =
    selectedPost?.status === "published" ? "Unpublish Post" : "Save Draft";
  const isDraftDeleteConfirmation =
    isConfirmDeleteRequested && selectedPost?.status === "draft";
  const hasDeleteUsageWarning =
    selectedUsage.broadcastSends.length > 0 || selectedUsage.journeySteps.length > 0;
  const draftDeleteHref = selectedPost
    ? `/admin/blog?post=${encodeURIComponent(selectedPost.id)}&confirmDelete=1`
    : "/admin/blog";
  const draftEditorHref = selectedPost
    ? `/admin/blog?post=${encodeURIComponent(selectedPost.id)}`
    : "/admin/blog";

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-4 py-6 text-[#1F2937] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0E79B2]">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
              Blog Manager
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Create drafts, publish blog posts, and explicitly send published
              posts to newsletter subscribers.
            </p>
            <AdminSectionNav current="blog" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/blog?new=1"
              className="rounded-full border border-[#0E79B2] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0E79B2] transition hover:bg-[#0E79B2] hover:text-white"
            >
              New Post
            </Link>
            <form action={logoutAdminAction}>
              <button
                type="submit"
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Log Out
              </button>
            </form>
          </div>
        </div>

        {flashMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {flashMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-[#BEE9E8]/70 bg-white/95 p-4 shadow-lg shadow-[#0E79B2]/10">
            <div className="flex items-center justify-between px-2 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                Posts
              </h2>
              <span className="text-xs text-slate-500">{posts.length}</span>
            </div>

            <div className="space-y-3">
              {posts.length > 0 ? (
                posts.map((post) => {
                  const isActive = selectedPost?.id === post.id && !isCreatingNew;

                  return (
                    <Link
                      key={post.id}
                      href={`/admin/blog?post=${encodeURIComponent(post.id)}`}
                      className={`block rounded-3xl border px-4 py-4 transition ${
                        isActive
                          ? "border-[#0E79B2] bg-[#E8F5FB]"
                          : "border-slate-200 bg-white hover:border-[#BEE9E8]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                            post.status === "published"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {post.status}
                        </span>
                        {post.newsletterEnabled ? (
                          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">
                            newsletter
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-base font-bold leading-snug">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-500">{post.slug}</p>
                      <p className="mt-3 text-xs text-slate-500">
                        {post.status === "published"
                          ? `Published ${formatShortDate(post.publishedAt)}`
                          : `Updated ${formatShortDate(post.updatedAt)}`}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                  No blog posts yet.
                </div>
              )}
            </div>
          </aside>

          <section className="space-y-6">
            <div
              key={editorContextKey}
              className="rounded-[2rem] border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {selectedPost ? "Editing Post" : "New Post"}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    {selectedPost ? selectedPost.title : "Create a blog post"}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Leave the slug blank to auto-generate it from the title on
                    save. Subject and preview text are optional and will default
                    from the title/body when omitted.
                  </p>
                  {selectedPost?.status === "published" ? (
                    <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
                      Unpublishing removes this post from <code>/blog</code> and
                      keeps it here as a draft so you can revise or republish it
                      later.
                    </p>
                  ) : null}
                  {!selectedPost ? (
                    <p className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-800">
                      This blank editor is ready for a new draft. Use the
                      placeholders below as a guide for what each field expects.
                    </p>
                  ) : null}
                </div>

                {selectedPost ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div>Created: {formatDateTime(selectedPost.createdAt)}</div>
                    <div className="mt-1">
                      Published: {formatDateTime(selectedPost.publishedAt)}
                    </div>
                    <div className="mt-1">Updated: {formatDateTime(selectedPost.updatedAt)}</div>
                  </div>
                ) : null}
              </div>

              <form className="mt-8 space-y-6">
                <input type="hidden" name="postId" value={editorValues.id} />

                <div className="grid gap-6 lg:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Title</span>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editorValues.title}
                      placeholder="Example: Smart Lighting Rules That Make Homes Safer at Night"
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Slug</span>
                    <input
                      type="text"
                      name="slug"
                      defaultValue={editorValues.slug}
                      placeholder="Leave blank to auto-generate from the title"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                    />
                  </label>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Email Subject</span>
                    <input
                      type="text"
                      name="subject"
                      defaultValue={editorValues.subject}
                      placeholder="Newsletter/email subject line for this post"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Preview Text</span>
                    <input
                      type="text"
                      name="previewText"
                      defaultValue={editorValues.previewText}
                      placeholder="Short summary used on the blog card and as the email preheader"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Body Markdown
                  </span>
                  <textarea
                    name="contentMarkdown"
                    defaultValue={editorValues.contentMarkdown}
                    placeholder={newPostMarkdownPlaceholder}
                    rows={18}
                    className="mt-2 min-h-[22rem] w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                  />
                  <span className="mt-2 block text-sm leading-relaxed text-slate-500">
                    Single line breaks are preserved in the blog post and email
                    output. Use a blank line to start a new paragraph.
                  </span>
                </label>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">CTA Label</span>
                    <input
                      type="text"
                      name="ctaLabel"
                      defaultValue={editorValues.ctaLabel}
                      placeholder="Optional button text, for example: Book a Free Site Visit"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">CTA URL</span>
                    <input
                      type="url"
                      name="ctaUrl"
                      defaultValue={editorValues.ctaUrl}
                      placeholder="Optional CTA link, for example: https://www.safelysecuredhomes.com/schedule-call"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                    />
                  </label>
                </div>

                <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <input
                    type="checkbox"
                    name="newsletterEnabled"
                    defaultChecked={editorValues.newsletterEnabled}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0E79B2] focus:ring-[#0E79B2]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-700">
                      Enable newsletter send for this post
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-slate-600">
                      Publishing will not send automatically. Use the explicit
                      send button below after the post is published.
                    </span>
                  </span>
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    formAction={saveDraftBlogPostAction}
                    className="rounded-full border border-slate-300 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                  >
                    {draftButtonLabel}
                  </button>
                  <button
                    type="submit"
                    formAction={publishBlogPostAction}
                    className="rounded-full bg-[#0E79B2] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#0B5E8B]"
                  >
                    {selectedPost?.status === "published" ? "Update Post" : "Publish Post"}
                  </button>
                </div>
              </form>

              {selectedPost?.status === "draft" ? (
                <div className="mt-8 rounded-[1.75rem] border border-rose-200 bg-rose-50/70 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                        Danger Zone
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-rose-950">
                        Delete Draft
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-rose-900/80">
                        Permanently delete this draft when you no longer need it.
                        Published posts are not deletable here.
                      </p>
                    </div>

                    {!isDraftDeleteConfirmation ? (
                      <Link
                        href={draftDeleteHref}
                        className="rounded-full border border-rose-300 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
                      >
                        Delete Draft
                      </Link>
                    ) : null}
                  </div>

                  {isDraftDeleteConfirmation ? (
                    <div className="mt-5 rounded-[1.5rem] border border-rose-300 bg-white px-5 py-5">
                      <h4 className="text-base font-bold text-rose-950">
                        Confirm draft deletion
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-rose-900/80">
                        This permanently deletes <strong>{selectedPost.title}</strong>{" "}
                        and cannot be undone.
                      </p>

                      {hasDeleteUsageWarning ? (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
                          This draft has related email activity or journey
                          references. Deletion may be blocked until those
                          references are removed.
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <form action={deleteDraftBlogPostAction}>
                          <input type="hidden" name="postId" value={selectedPost.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-rose-700 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-rose-800"
                          >
                            Confirm Delete
                          </button>
                        </form>

                        <Link
                          href={draftEditorHref}
                          className="rounded-full border border-slate-300 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                        >
                          Cancel
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Newsletter Broadcast</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Sends are explicit and idempotent per stored send key.
                    Retrying skips recipients who already received the post.
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                    stateToneMap[newsletterState]
                  }`}
                >
                  {stateLabelMap[newsletterState]}
                </span>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  <div>Current status: {selectedPost ? selectedPost.status : "Draft"}</div>
                  <div className="mt-1">
                    Newsletter enabled: {selectedPost?.newsletterEnabled ? "Yes" : "No"}
                  </div>
                  <div className="mt-1">
                    Send key: {selectedPost?.newsletterSendKey || "Not sent yet"}
                  </div>
                  <div className="mt-1">
                    Sent: {currentBroadcastSummary?.sentCount ?? 0} / Failed:{" "}
                    {currentBroadcastSummary?.failedCount ?? 0} / Queued:{" "}
                    {currentBroadcastSummary?.queuedCount ?? 0}
                  </div>
                </div>

                <form action={sendBlogNewsletterAction}>
                  <input type="hidden" name="postId" value={selectedPost?.id ?? ""} />
                  <button
                    type="submit"
                    disabled={!canSendNewsletter}
                    className="w-full rounded-full bg-[#0E79B2] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#0B5E8B] disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                  >
                    {sendButtonLabel}
                  </button>
                </form>
              </div>

              {selectedUsage.broadcastSends.length > 0 ? (
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      <tr>
                        <th className="pb-3 pr-4">Send Key</th>
                        <th className="pb-3 pr-4">Queued</th>
                        <th className="pb-3 pr-4">Sent</th>
                        <th className="pb-3 pr-4">Failed</th>
                        <th className="pb-3 pr-4">Queued Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUsage.broadcastSends.map((send) => (
                        <tr key={send.sendKey} className="border-t border-slate-200">
                          <td className="py-3 pr-4 font-medium text-slate-700">
                            {send.sendKey}
                          </td>
                          <td className="py-3 pr-4 text-slate-600">
                            {formatDateTime(send.queuedAt)}
                          </td>
                          <td className="py-3 pr-4 text-slate-600">{send.sentCount}</td>
                          <td className="py-3 pr-4 text-slate-600">{send.failedCount}</td>
                          <td className="py-3 pr-4 text-slate-600">{send.queuedCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
                  No broadcast sends recorded for this post yet.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Journey Usage</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    This shows which DB-backed journeys currently reference this
                    post. Use the journey editor to change the connected blog post
                    or the step timing.
                  </p>
                </div>
              </div>

              {selectedUsage.journeySteps.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {selectedUsage.journeySteps.map((step) => (
                    <div
                      key={step.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">
                              {step.journeyName}
                            </h3>
                            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                              {step.journeyStatus}
                            </span>
                            {!step.isStepActive ? (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                                step inactive
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            Step {step.stepOrder} • {step.stepKey} • Delay {step.delayDays} day
                            {step.delayDays === 1 ? "" : "s"}
                          </p>
                        </div>

                        <Link
                          href={`/admin/journeys?journey=${encodeURIComponent(step.journeyKey)}`}
                          className="rounded-full border border-[#0E79B2] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0E79B2] transition hover:bg-[#0E79B2] hover:text-white"
                        >
                          Edit Journey
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
                  No journey steps currently reference this post.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
