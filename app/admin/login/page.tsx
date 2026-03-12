import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAdminAction } from "../actions";
import {
  getAdminAuthConfigurationError,
  isAdminAuthenticated,
} from "../../lib/adminAuth";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const readSearchParam = (
  value: string | string[] | undefined,
): string => {
  if (Array.isArray(value)) {
    return value[0]?.trim() || "";
  }

  return typeof value === "string" ? value.trim() : "";
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await isAdminAuthenticated()) {
    redirect("/admin/blog");
  }

  const resolvedSearchParams = await searchParams;
  const configurationError = getAdminAuthConfigurationError();
  const errorMessage =
    readSearchParam(resolvedSearchParams.error) || configurationError;
  const flashMessage = readSearchParam(resolvedSearchParams.flash);

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-6 py-10 text-[#1F2937]">
      <div className="mx-auto max-w-md rounded-4xl border border-[#BEE9E8]/70 bg-white/95 p-8 shadow-xl shadow-[#0E79B2]/10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0E79B2]">
            Safely Secured Homes
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight">
            Admin Login
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Enter the admin password to manage draft posts, publish updates, and
            trigger newsletter sends.
          </p>
        </div>

        {flashMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {flashMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <form action={loginAdminAction} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
              required
              disabled={Boolean(configurationError)}
            />
          </label>

          <button
            type="submit"
            disabled={Boolean(configurationError)}
            className="w-full rounded-full bg-[#0E79B2] px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#0B5E8B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}
