import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getSubscriptionUnsubscribeLookup,
  normalizeSubscriptionUnsubscribeToken,
  submitSubscriptionUnsubscribe,
  type SubscriptionAudience,
  type SubscriptionUnsubscribeSubmitStatus,
} from "../../lib/subscriptionUnsubscribe";
import { ogImageUrl, siteName, siteUrl } from "../../lib/site";
import UnsubscribeShell from "../UnsubscribeShell";

type SearchParams = Record<string, string | string[] | undefined>;
type FlashStatus = "success" | "invalid" | "error" | null;
type UiStatus = "confirm" | "success" | "invalid" | "error";

const readSearchParam = (
  searchParams: SearchParams | undefined,
  key: string,
) => {
  const value = searchParams?.[key];
  return typeof value === "string" ? value : "";
};

const toFlashStatus = (value: string): FlashStatus => {
  if (value === "success") return "success";
  if (value === "invalid") return "invalid";
  if (value === "error") return "error";
  return null;
};

const buildTokenPath = (rawToken: string) =>
  `/unsubscribe/${encodeURIComponent(
    normalizeSubscriptionUnsubscribeToken(rawToken),
  )}`;

const redirectByUnsubscribeStatus = (
  rawToken: string,
  status: SubscriptionUnsubscribeSubmitStatus,
) => {
  const path = buildTokenPath(rawToken);
  if (status === "success") {
    redirect(`${path}?status=success`);
  }
  if (status === "invalid_token") {
    redirect(`${path}?status=invalid`);
  }
  redirect(`${path}?status=error`);
};

const handleUnsubscribeSubmit = async (formData: FormData) => {
  "use server";

  const rawToken = String(formData.get("token") ?? "");
  const result = await submitSubscriptionUnsubscribe(rawToken);
  redirectByUnsubscribeStatus(rawToken, result.status);
};

const resolveUiStatus = ({
  lookupStatus,
  isActive,
  flashStatus,
}: {
  lookupStatus: Awaited<
    ReturnType<typeof getSubscriptionUnsubscribeLookup>
  >["status"];
  isActive?: boolean;
  flashStatus: FlashStatus;
}): UiStatus => {
  if (lookupStatus === "invalid_token") return "invalid";
  if (lookupStatus === "not_configured" || lookupStatus === "error") {
    return "error";
  }
  if (isActive === false) {
    return "success";
  }
  if (flashStatus === "success") return "success";
  if (flashStatus === "error") return "error";
  return "confirm";
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const normalizedToken = encodeURIComponent(
    normalizeSubscriptionUnsubscribeToken(token),
  );

  return {
    title: "Unsubscribe",
    description: "Manage your Safely Secured Homes email subscription.",
    alternates: {
      canonical: `/unsubscribe/${normalizedToken}`,
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: `Unsubscribe | ${siteName}`,
      description: "Manage your Safely Secured Homes email subscription.",
      url: new URL(`/unsubscribe/${normalizedToken}`, siteUrl),
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
      description: "Manage your Safely Secured Homes email subscription.",
      images: [ogImageUrl],
    },
  };
}

const getSubscriptionCopy = (audience?: SubscriptionAudience) => {
  if (audience === "waitlist") {
    return {
      confirm:
        "Confirm that you want to unsubscribe from Safely Secured Homes waitlist emails.",
      success: "You have been unsubscribed from waitlist emails.",
      invalid:
        "Use the latest unsubscribe link from one of your waitlist emails.",
    };
  }

  return {
    confirm:
      "Confirm that you want to unsubscribe from Safely Secured Homes newsletter emails.",
    success: "You have been unsubscribed from newsletter emails.",
    invalid:
      "Use the latest unsubscribe link from one of our newsletter emails.",
  };
};

export default async function UnsubscribeTokenPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const { token: rawToken } = await params;
  const normalizedToken = normalizeSubscriptionUnsubscribeToken(rawToken);
  const resolvedSearchParams = (await searchParams) ?? {};
  const lookup = await getSubscriptionUnsubscribeLookup(normalizedToken);
  const flashStatus = toFlashStatus(readSearchParam(resolvedSearchParams, "status"));
  const uiStatus = resolveUiStatus({
    lookupStatus: lookup.status,
    isActive: lookup.isActive,
    flashStatus,
  });
  const subscriptionCopy = getSubscriptionCopy(lookup.audience);

  return (
    <UnsubscribeShell title="Unsubscribe">
      {uiStatus === "confirm" && (
        <>
          <p className="text-base leading-relaxed text-slate-700">
            {subscriptionCopy.confirm}
          </p>
          <form action={handleUnsubscribeSubmit}>
            <input type="hidden" name="token" value={normalizedToken} />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[#0E79B2] px-6 py-2 font-semibold text-white shadow-md shadow-[#0E79B2]/20 transition-colors hover:bg-[#0b5e8b]"
            >
              Unsubscribe
            </button>
          </form>
        </>
      )}

      {uiStatus === "success" && (
        <>
          <p className="text-base leading-relaxed text-slate-700">
            {subscriptionCopy.success}
          </p>
          <div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-[#0E79B2] px-6 py-2 font-semibold text-white shadow-md shadow-[#0E79B2]/20 transition-colors hover:bg-[#0b5e8b]"
            >
              Go to Home
            </Link>
          </div>
        </>
      )}

      {uiStatus === "invalid" && (
        <>
          <p className="text-base leading-relaxed text-slate-700">
            This unsubscribe link is invalid or no longer available.
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            {subscriptionCopy.invalid}
          </p>
        </>
      )}

      {uiStatus === "error" && (
        <>
          <p className="text-base leading-relaxed text-slate-700">
            We could not process your unsubscribe request right now.
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            Please try the link again later.
          </p>
        </>
      )}
    </UnsubscribeShell>
  );
}
