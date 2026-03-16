import type { Metadata } from "next";
import AdminSectionNav from "../../components/admin/AdminSectionNav";
import { requireAdminSession } from "../../lib/adminAuth";
import { getPublicSiteSettings } from "../../lib/siteAdminSettingsServer";
import { logoutAdminAction, saveSiteSettingsAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Admin Settings",
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

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminSession();

  const resolvedSearchParams = await searchParams;
  const flashMessage = readSearchParam(resolvedSearchParams.flash);
  const errorMessage = readSearchParam(resolvedSearchParams.error);
  const siteSettings = await getPublicSiteSettings();

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-4 py-6 text-[#1F2937] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0E79B2]">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
              Launch Controls
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Control launch behavior and outbound email delivery without editing
              code or changing environment variables.
            </p>
            <AdminSectionNav current="settings" />
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

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-[2rem] border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Site Settings
              </p>
              <h2 className="mt-2 text-2xl font-bold">Edit launch behavior</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                These settings affect the homepage, form flow, results CTA, cycle
                limit, outbound email behavior, and lead day-0 follow-up behavior
                immediately after save.
              </p>
            </div>

            <form action={saveSiteSettingsAction} className="mt-8 space-y-8">
              <label className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
                <input
                  type="checkbox"
                  name="bonusEnabled"
                  defaultChecked={siteSettings.bonusEnabled}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-[#0E79B2] focus:ring-[#0E79B2]"
                />
                <span className="block">
                  <span className="text-sm font-semibold text-slate-900">
                    Bonus enabled
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-600">
                    When off, public pages stop promising the bonus, new leads are
                    stored with <code>has_bonus=false</code>, and the lead day-0
                    email uses the non-bonus CTA.
                  </span>
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Panatag cycle limit
                </span>
                <input
                  type="number"
                  name="panatagCycleLimit"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  defaultValue={siteSettings.panatagCycleLimit}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                />
                <p className="mt-2 text-sm text-slate-500">
                  This controls how many free Panatag ratings are available per
                  cycle. The cycle length stays at 72 hours and still uses{" "}
                  <code>REPORT_CYCLE_ANCHOR_ISO</code>.
                </p>
              </label>

              <label className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
                <input
                  type="checkbox"
                  name="resultsReviewCtaEnabled"
                  defaultChecked={siteSettings.resultsReviewCtaEnabled}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-[#0E79B2] focus:ring-[#0E79B2]"
                />
                <span className="block">
                  <span className="text-sm font-semibold text-slate-900">
                    Results review CTA enabled
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-600">
                    When on, Step 2 on the results page is replaced with a single{" "}
                    <code>Leave a Review</code> CTA that opens <code>/rate</code>.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
                <input
                  type="checkbox"
                  name="emailSendingEnabled"
                  defaultChecked={siteSettings.emailSendingEnabled}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-[#0E79B2] focus:ring-[#0E79B2]"
                />
                <span className="block">
                  <span className="text-sm font-semibold text-slate-900">
                    Email sending enabled
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-600">
                    When off, admin test sends and newsletter broadcasts are blocked,
                    public checklist signups still complete without delivery, and
                    automated journeys skip their due email steps.
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-[#0E79B2] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#095F8E]"
                >
                  Save settings
                </button>
                <span className="text-sm text-slate-500">
                  Changes apply immediately.
                </span>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Current State
              </p>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-semibold text-slate-700">Bonus</dt>
                  <dd className="mt-1 text-slate-600">
                    {siteSettings.bonusEnabled ? "Enabled" : "Disabled"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Cycle Limit</dt>
                  <dd className="mt-1 text-slate-600">
                    {siteSettings.panatagCycleLimit} free ratings per cycle
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Results CTA</dt>
                  <dd className="mt-1 text-slate-600">
                    {siteSettings.resultsReviewCtaEnabled
                      ? "Review page CTA"
                      : "Default DIY / call / book CTA"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Email Sending</dt>
                  <dd className="mt-1 text-slate-600">
                    {siteSettings.emailSendingEnabled ? "Enabled" : "Disabled"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Test Client Mode
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                The seeded defaults are bonus off, cycle limit 15, results review
                CTA on, and email sending on so test clients review the lead
                magnet before you promise other offers while outbound delivery
                still works.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
