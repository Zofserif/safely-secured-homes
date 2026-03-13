import type { Metadata } from "next";
import Link from "next/link";
import AdminSectionNav from "../../components/admin/AdminSectionNav";
import {
  assignSubscriberJourneyAction,
  cancelSubscriberJourneyAction,
  logoutAdminAction,
} from "../actions";
import { requireAdminSession } from "../../lib/adminAuth";
import {
  getAdminSubscriberDetail,
  searchAdminSubscribers,
} from "../../lib/adminSubscribers";
import { listAssignableJourneySummaries } from "../../lib/adminJourneys";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Admin Subscribers",
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

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminSession();

  const resolvedSearchParams = await searchParams;
  const query = readSearchParam(resolvedSearchParams.q);
  const selectedSubscriberIdParam = readSearchParam(resolvedSearchParams.subscriber);
  const flashMessage = readSearchParam(resolvedSearchParams.flash);
  const errorMessage = readSearchParam(resolvedSearchParams.error);

  const [subscribers, assignableJourneys] = await Promise.all([
    searchAdminSubscribers({ query }),
    listAssignableJourneySummaries(),
  ]);
  const resolvedSelectedSubscriberId =
    selectedSubscriberIdParam ||
    subscribers[0]?.subscriberId ||
    "";
  const selectedSubscriber = resolvedSelectedSubscriberId
    ? await getAdminSubscriberDetail(resolvedSelectedSubscriberId)
    : undefined;

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-4 py-6 text-[#1F2937] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0E79B2]">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
              Subscriber Manager
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Search subscribers, see who is currently suppressed from the weekly
              newsletter, and manually assign or cancel journeys.
            </p>
            <AdminSectionNav current="subscribers" />
          </div>

          <form action={logoutAdminAction}>
            <button
              type="submit"
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Log Out
            </button>
          </form>
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-[#BEE9E8]/70 bg-white/95 p-4 shadow-lg shadow-[#0E79B2]/10">
            <form className="px-2 pb-4" method="get">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Search</span>
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search by name or email"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                />
              </label>
            </form>

            <div className="flex items-center justify-between px-2 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                Subscribers
              </h2>
              <span className="text-xs text-slate-500">{subscribers.length}</span>
            </div>

            <div className="space-y-3">
              {subscribers.length > 0 ? (
                subscribers.map((subscriber) => {
                  const isActive =
                    selectedSubscriber?.subscriberId === subscriber.subscriberId;
                  const href = `/admin/subscribers?subscriber=${encodeURIComponent(
                    subscriber.subscriberId,
                  )}${query ? `&q=${encodeURIComponent(query)}` : ""}`;

                  return (
                    <Link
                      key={subscriber.subscriberId}
                      href={href}
                      className={`block rounded-3xl border px-4 py-4 transition ${
                        isActive
                          ? "border-[#0E79B2] bg-[#E8F5FB]"
                          : "border-slate-200 bg-white hover:border-[#BEE9E8]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                            subscriber.canReceiveWeeklyNewsletter
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {subscriber.canReceiveWeeklyNewsletter
                            ? "newsletter"
                            : "suppressed"}
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-bold leading-snug">
                        {subscriber.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">{subscriber.email}</p>
                      <p className="mt-3 text-xs text-slate-500">
                        {subscriber.activeJourney
                          ? `${subscriber.activeJourney.journeyName} • Step ${
                              subscriber.activeJourney.currentStepOrder ?? "?"
                            }`
                          : "No active journey"}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                  No subscribers matched this search.
                </div>
              )}
            </div>
          </aside>

          <section className="space-y-6">
            {selectedSubscriber ? (
              <>
                <div className="rounded-[2rem] border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Subscriber
                      </p>
                      <h2 className="mt-2 text-2xl font-bold">
                        {selectedSubscriber.name}
                      </h2>
                      <p className="mt-2 text-sm text-slate-600">
                        {selectedSubscriber.email}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div>
                        Weekly newsletter:{" "}
                        {selectedSubscriber.canReceiveWeeklyNewsletter
                          ? "Eligible"
                          : "Suppressed"}
                      </div>
                      <div className="mt-1">Status: {selectedSubscriber.status}</div>
                      <div className="mt-1">
                        Subscribed: {formatDateTime(selectedSubscriber.subscribedAt)}
                      </div>
                      <div className="mt-1">
                        Source: {selectedSubscriber.acquisitionSource || "Not set"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      <div>UTM Source: {selectedSubscriber.utmSource || "Not set"}</div>
                      <div className="mt-1">
                        UTM Medium: {selectedSubscriber.utmMedium || "Not set"}
                      </div>
                      <div className="mt-1">
                        UTM Campaign: {selectedSubscriber.utmCampaign || "Not set"}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      <div>
                        Active journey:{" "}
                        {selectedSubscriber.activeJourney?.journeyName || "None"}
                      </div>
                      <div className="mt-1">
                        Current step:{" "}
                        {selectedSubscriber.activeJourney?.currentStepKey || "Not set"}
                      </div>
                      <div className="mt-1">
                        Entered:{" "}
                        {formatDateTime(selectedSubscriber.activeJourney?.enteredAt || null)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">Journey Assignment</h2>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">
                        Assigning a journey immediately suppresses weekly newsletter
                        sends. If the new journey has a day-0 step, the first email
                        is sent right away.
                      </p>
                    </div>
                  </div>

                  {selectedSubscriber.status === "subscribed" ? (
                    <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                      <form action={assignSubscriberJourneyAction} className="space-y-4">
                        <input
                          type="hidden"
                          name="subscriberId"
                          value={selectedSubscriber.subscriberId}
                        />
                        <input type="hidden" name="query" value={query} />
                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700">
                            Assignable Journey
                          </span>
                          <select
                            name="journeyKey"
                            defaultValue={assignableJourneys[0]?.key ?? ""}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                          >
                            {assignableJourneys.map((journey) => (
                              <option key={journey.key} value={journey.key}>
                                {journey.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          type="submit"
                          disabled={assignableJourneys.length === 0}
                          className="rounded-full bg-[#0E79B2] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#0B5E8B] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Assign Journey
                        </button>
                      </form>

                      {selectedSubscriber.activeJourney ? (
                        <form action={cancelSubscriberJourneyAction}>
                          <input
                            type="hidden"
                            name="subscriberId"
                            value={selectedSubscriber.subscriberId}
                          />
                          <input type="hidden" name="query" value={query} />
                          <button
                            type="submit"
                            className="rounded-full border border-rose-300 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
                          >
                            Cancel Active Journey
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
                      This subscriber is not currently subscribed, so journey
                      assignment is disabled.
                    </div>
                  )}
                </div>

                <div className="rounded-[2rem] border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
                  <h2 className="text-2xl font-bold">Journey History</h2>
                  {selectedSubscriber.history.length > 0 ? (
                    <div className="mt-6 overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          <tr>
                            <th className="pb-3 pr-4">Journey</th>
                            <th className="pb-3 pr-4">Status</th>
                            <th className="pb-3 pr-4">Entered</th>
                            <th className="pb-3 pr-4">Exited</th>
                            <th className="pb-3 pr-4">Current Step</th>
                            <th className="pb-3 pr-4">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSubscriber.history.map((journey) => (
                            <tr key={journey.enrollmentId} className="border-t border-slate-200">
                              <td className="py-3 pr-4 font-medium text-slate-700">
                                {journey.journeyName}
                              </td>
                              <td className="py-3 pr-4 text-slate-600">{journey.status}</td>
                              <td className="py-3 pr-4 text-slate-600">
                                {formatDateTime(journey.enteredAt)}
                              </td>
                              <td className="py-3 pr-4 text-slate-600">
                                {formatDateTime(journey.exitedAt)}
                              </td>
                              <td className="py-3 pr-4 text-slate-600">
                                {journey.currentStepKey || "Not set"}
                              </td>
                              <td className="py-3 pr-4 text-slate-600">
                                {journey.exitReason || journey.assignmentReason || "Not set"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-3xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
                      No journey history yet for this subscriber.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/95 px-6 py-8 text-sm text-slate-500 shadow-lg shadow-[#0E79B2]/10 sm:px-8">
                Select a subscriber from the list to view details and manage
                journeys.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
