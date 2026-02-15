"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PopupStatus = "success" | "invalid" | "error";

export default function UnsubscribeStatusPopup({
  status,
}: {
  status: PopupStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (status !== "success") return;
    const timer = window.setTimeout(() => {
      router.replace("/");
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [router, status]);

  if (!open) return null;

  const isSuccess = status === "success";
  const title = isSuccess ? "Unsubscribed" : "Unable to Unsubscribe";
  const message = isSuccess
    ? "You have been removed from newsletter emails. Redirecting you to the homepage."
    : "We could not complete the unsubscribe request yet. Please use the form below to try again.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-[#1F2937]">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{message}</p>

        <div className="mt-6 flex justify-end">
          {isSuccess ? (
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="inline-flex items-center justify-center rounded-full bg-[#0E79B2] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0b5e8b]"
            >
              Go To Home
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
