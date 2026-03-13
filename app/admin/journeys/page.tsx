import type { Metadata } from "next";
import Link from "next/link";
import AdminSectionNav from "../../components/admin/AdminSectionNav";
import {
  deleteJourneyStepAction,
  logoutAdminAction,
  saveJourneyAction,
  saveJourneyStepAction,
} from "../actions";
import { requireAdminSession } from "../../lib/adminAuth";
import {
  getAdminJourneyByKey,
  getAdminJourneySummaries,
  listPublishedBlogPostOptions,
  type AdminJourney,
} from "../../lib/adminJourneys";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Admin Journeys",
  robots: {
    index: false,
    follow: false,
  },
};

const readSearchParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0]?.trim() || "";
  }

  return typeof value === "string" ? value.trim() : "";
};

const statusLabelMap = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  archived: "Archived",
} as const;

const statusToneMap = {
  draft: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-slate-200 text-slate-700",
  archived: "bg-rose-100 text-rose-700",
} as const;

const emptyJourney: Pick<
  AdminJourney,
  "key" | "name" | "objectiveKey" | "badgeKey" | "badgeName" | "status" | "steps"
> = {
  key: "",
  name: "",
  objectiveKey: "",
  badgeKey: "",
  badgeName: "",
  status: "draft",
  steps: [],
};

export default async function AdminJourneysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminSession();

  const resolvedSearchParams = await searchParams;
  const selectedJourneyKeyParam = readSearchParam(resolvedSearchParams.journey);
  const isCreatingNew = readSearchParam(resolvedSearchParams.new) === "1";
  const flashMessage = readSearchParam(resolvedSearchParams.flash);
  const errorMessage = readSearchParam(resolvedSearchParams.error);

  const [journeys, blogPostOptions] = await Promise.all([
    getAdminJourneySummaries(),
    listPublishedBlogPostOptions(),
  ]);
  const resolvedSelectedJourneyKey =
    !isCreatingNew && selectedJourneyKeyParam
      ? selectedJourneyKeyParam
      : !isCreatingNew && journeys.length > 0
        ? journeys[0].key
        : "";
  const selectedJourney = resolvedSelectedJourneyKey
    ? await getAdminJourneyByKey(resolvedSelectedJourneyKey)
    : undefined;
  const editorValues = selectedJourney ?? emptyJourney;

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-4 py-6 text-[#1F2937] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0E79B2]">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
              Journey Manager
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Manage journey schedules, connect steps to blog posts, and keep the
              weekly newsletter focused on subscribers who are not in an active
              journey.
            </p>
            <AdminSectionNav current="journeys" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/journeys?new=1"
              className="rounded-full border border-[#0E79B2] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0E79B2] transition hover:bg-[#0E79B2] hover:text-white"
            >
              New Journey
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
                Journeys
              </h2>
              <span className="text-xs text-slate-500">{journeys.length}</span>
            </div>

            <div className="space-y-3">
              {journeys.length > 0 ? (
                journeys.map((journey) => {
                  const isActive =
                    selectedJourney?.key === journey.key && !isCreatingNew;

                  return (
                    <Link
                      key={journey.key}
                      href={`/admin/journeys?journey=${encodeURIComponent(journey.key)}`}
                      className={`block rounded-3xl border px-4 py-4 transition ${
                        isActive
                          ? "border-[#0E79B2] bg-[#E8F5FB]"
                          : "border-slate-200 bg-white hover:border-[#BEE9E8]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                            statusToneMap[journey.status]
                          }`}
                        >
                          {statusLabelMap[journey.status]}
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-bold leading-snug">
                        {journey.name}
                      </h3>
                      <p className="mt-2 text-xs text-slate-500">{journey.key}</p>
                      <p className="mt-3 text-xs text-slate-500">
                        {journey.activeStepCount} active / {journey.stepCount} total step
                        {journey.stepCount === 1 ? "" : "s"}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                  No journeys yet.
                </div>
              )}
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {selectedJourney ? "Editing Journey" : "New Journey"}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    {selectedJourney ? selectedJourney.name : "Create a journey"}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Journey keys stay stable once created because enrollments and
                    delivery history reference them directly.
                  </p>
                </div>

                {selectedJourney ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div>Status: {statusLabelMap[selectedJourney.status]}</div>
                    <div className="mt-1">
                      Active steps: {selectedJourney.activeStepCount}
                    </div>
                    <div className="mt-1">Total steps: {selectedJourney.stepCount}</div>
                  </div>
                ) : null}
              </div>

              <form action={saveJourneyAction} className="mt-8 space-y-6">
                <input type="hidden" name="existingKey" value={selectedJourney?.key ?? ""} />

                <div className="grid gap-6 lg:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Journey Key</span>
                    <input
                      type="text"
                      name="key"
                      defaultValue={editorValues.key}
                      readOnly={Boolean(selectedJourney)}
                      placeholder="example_journey"
                      className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition ${
                        selectedJourney
                          ? "border-slate-200 bg-slate-100 text-slate-500"
                          : "border-slate-300 bg-white focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                      }`}
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Journey Name</span>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editorValues.name}
                      placeholder="Example: Lead Follow-up Journey"
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                    />
                  </label>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Objective Key</span>
                    <input
                      type="text"
                      name="objectiveKey"
                      defaultValue={editorValues.objectiveKey}
                      placeholder="education"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Badge Key</span>
                    <input
                      type="text"
                      name="badgeKey"
                      defaultValue={editorValues.badgeKey}
                      placeholder="lead_journey"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Badge Name</span>
                    <input
                      type="text"
                      name="badgeName"
                      defaultValue={editorValues.badgeName}
                      placeholder="Lead Journey"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                    />
                  </label>
                </div>

                <label className="block max-w-sm">
                  <span className="text-sm font-semibold text-slate-700">Status</span>
                  <select
                    name="status"
                    defaultValue={editorValues.status}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>

                <button
                  type="submit"
                  className="rounded-full bg-[#0E79B2] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#0B5E8B]"
                >
                  {selectedJourney ? "Save Journey" : "Create Journey"}
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Journey Steps</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Delay days are relative to when the subscriber enters the
                    journey. Active steps are processed in ascending step order.
                  </p>
                </div>
              </div>

              {selectedJourney ? (
                <div className="mt-6 space-y-6">
                  {selectedJourney.steps.length > 0 ? (
                    selectedJourney.steps.map((step) => (
                      <div
                        key={step.stepKey}
                        className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5"
                      >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              {step.stepKey}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {step.blogPostTitle} ({step.blogPostSlug})
                            </p>
                          </div>

                          <form action={deleteJourneyStepAction}>
                            <input type="hidden" name="journeyKey" value={selectedJourney.key} />
                            <input type="hidden" name="stepKey" value={step.stepKey} />
                            <button
                              type="submit"
                              className="rounded-full border border-rose-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
                            >
                              Delete Step
                            </button>
                          </form>
                        </div>

                        <form action={saveJourneyStepAction} className="space-y-5">
                          <input type="hidden" name="journeyKey" value={selectedJourney.key} />
                          <input type="hidden" name="existingStepKey" value={step.stepKey} />

                          <div className="grid gap-4 lg:grid-cols-4">
                            <label className="block">
                              <span className="text-sm font-semibold text-slate-700">
                                Step Key
                              </span>
                              <input
                                type="text"
                                name="stepKey"
                                defaultValue={step.stepKey}
                                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                              />
                            </label>

                            <label className="block">
                              <span className="text-sm font-semibold text-slate-700">
                                Step Order
                              </span>
                              <input
                                type="number"
                                name="stepOrder"
                                min={1}
                                defaultValue={step.stepOrder}
                                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                              />
                            </label>

                            <label className="block">
                              <span className="text-sm font-semibold text-slate-700">
                                Delay Days
                              </span>
                              <input
                                type="number"
                                name="delayDays"
                                min={0}
                                defaultValue={step.delayDays}
                                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                              />
                            </label>

                            <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4">
                              <input
                                type="checkbox"
                                name="isActive"
                                defaultChecked={step.isActive}
                                className="h-4 w-4 rounded border-slate-300 text-[#0E79B2] focus:ring-[#0E79B2]"
                              />
                              <span className="text-sm font-semibold text-slate-700">
                                Step active
                              </span>
                            </label>
                          </div>

                          <label className="block">
                            <span className="text-sm font-semibold text-slate-700">
                              Blog Post
                            </span>
                            <select
                              name="blogPostId"
                              defaultValue={step.blogPostId}
                              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                            >
                              {blogPostOptions.map((post) => (
                                <option key={post.id} value={post.id}>
                                  {post.title} ({post.slug})
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="text-sm font-semibold text-slate-700">
                              CTA Override HTML
                            </span>
                            <textarea
                              name="ctaOverrideHtml"
                              defaultValue={step.ctaOverrideHtml}
                              rows={4}
                              className="mt-2 w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                            />
                          </label>

                          <button
                            type="submit"
                            className="rounded-full bg-[#0E79B2] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#0B5E8B]"
                          >
                            Save Step
                          </button>
                        </form>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
                      This journey has no steps yet.
                    </div>
                  )}

                  <div className="rounded-[1.75rem] border border-[#BEE9E8]/70 bg-[#E8F5FB] p-5">
                    <h3 className="text-xl font-bold text-slate-900">Add Step</h3>
                    <form action={saveJourneyStepAction} className="mt-5 space-y-5">
                      <input type="hidden" name="journeyKey" value={selectedJourney.key} />

                      <div className="grid gap-4 lg:grid-cols-4">
                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700">Step Key</span>
                          <input
                            type="text"
                            name="stepKey"
                            placeholder="smart_home_intro"
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700">
                            Step Order
                          </span>
                          <input
                            type="number"
                            name="stepOrder"
                            min={1}
                            defaultValue={selectedJourney.steps.length + 1}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                          />
                        </label>

                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700">
                            Delay Days
                          </span>
                          <input
                            type="number"
                            name="delayDays"
                            min={0}
                            defaultValue={0}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                          />
                        </label>

                        <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4">
                          <input
                            type="checkbox"
                            name="isActive"
                            defaultChecked
                            className="h-4 w-4 rounded border-slate-300 text-[#0E79B2] focus:ring-[#0E79B2]"
                          />
                          <span className="text-sm font-semibold text-slate-700">
                            Step active
                          </span>
                        </label>
                      </div>

                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">Blog Post</span>
                        <select
                          name="blogPostId"
                          defaultValue={blogPostOptions[0]?.id ?? ""}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                        >
                          {blogPostOptions.map((post) => (
                            <option key={post.id} value={post.id}>
                              {post.title} ({post.slug})
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">
                          CTA Override HTML
                        </span>
                        <textarea
                          name="ctaOverrideHtml"
                          rows={4}
                          placeholder="<div>...</div>"
                          className="mt-2 w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                        />
                      </label>

                      <button
                        type="submit"
                        className="rounded-full bg-[#0E79B2] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#0B5E8B]"
                      >
                        Add Step
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
                  Save the journey first, then add steps.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
