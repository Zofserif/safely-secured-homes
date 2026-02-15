import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { unsubscribeNewsletterSubscriber } from "../lib/newsletterSubscribers";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";
import UnsubscribeStatusPopup from "./UnsubscribeStatusPopup";

type SearchParams = Record<string, string | string[] | undefined>;

type UiStatus = "idle" | "success" | "invalid" | "error";

const readSearchParam = (
  searchParams: SearchParams | undefined,
  key: string,
) => {
  const value = searchParams?.[key];
  return typeof value === "string" ? value : "";
};

const toUiStatus = (value: string): UiStatus => {
  if (value === "success") return "success";
  if (value === "invalid") return "invalid";
  if (value === "error") return "error";
  return "idle";
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Manage your Safely Secured Homes newsletter subscription.",
  alternates: {
    canonical: "/unsubscribe",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `Unsubscribe | ${siteName}`,
    description: "Manage your Safely Secured Homes newsletter subscription.",
    url: new URL("/unsubscribe", siteUrl),
    siteName,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1260,
        height: 750,
        alt: "Safely Secured Homes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Unsubscribe | ${siteName}`,
    description: "Manage your Safely Secured Homes newsletter subscription.",
    images: [ogImageUrl],
  },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const rawEmail = readSearchParam(resolvedSearchParams, "email");
  if (rawEmail.trim()) {
    const result = await unsubscribeNewsletterSubscriber(rawEmail);
    if (result.status === "success") {
      redirect("/unsubscribe?status=success");
    }
    if (result.status === "invalid_email") {
      redirect("/unsubscribe?status=invalid");
    }
    redirect("/unsubscribe?status=error");
  }

  const status = toUiStatus(readSearchParam(resolvedSearchParams, "status"));
  const showForm = status !== "success";
  const popupStatus =
    status === "success" || status === "invalid" || status === "error"
      ? status
      : null;

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#2D3748]">
      {popupStatus && <UnsubscribeStatusPopup status={popupStatus} />}

      <header className="container mx-auto px-6 pb-6 pt-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/img/Logo/navbar banner.png"
            alt="Safely Secured Homes"
            width={210}
            height={48}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest text-slate-500 hover:text-[#0E79B2] transition-colors"
        >
          Back to Home
        </Link>
      </header>

      <main className="container mx-auto px-6 pb-16 pt-8">
        <section className="mx-auto max-w-xl rounded-3xl border border-[#BEE9E8]/70 bg-white p-8 shadow-lg shadow-[#0E79B2]/10">
          <h1 className="text-3xl font-bold text-[#1F2937]">Unsubscribe</h1>

          {status === "success" && (
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              You have been unsubscribed from newsletter emails.
            </p>
          )}

          {status === "invalid" && (
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              Please enter a valid email address to unsubscribe.
            </p>
          )}

          {status === "error" && (
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              We could not process your request right now. Please try again.
            </p>
          )}

          {status === "idle" && (
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              Enter your email below to unsubscribe from newsletter emails.
            </p>
          )}

          {showForm && (
            <form method="GET" action="/unsubscribe" className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="unsubscribe-email"
                  className="mb-2 block text-sm font-semibold text-[#2D3748]"
                >
                  Email address
                </label>
                <input
                  id="unsubscribe-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0E79B2] focus:ring-2 focus:ring-[#0E79B2]/20"
                  placeholder="you@email.com"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[#0E79B2] px-6 py-2 font-semibold text-white shadow-md shadow-[#0E79B2]/20 transition-colors hover:bg-[#0b5e8b]"
              >
                Unsubscribe
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
