import { Calendar, FileText, Phone } from "lucide-react";
import Image from "next/image";
import type { Step2CtaDecision } from "../step2CtaDecision";

type ResultActionButtonsProps = {
  decision: Step2CtaDecision;
  onShowDIY: () => void;
  onCallUs: () => void;
  onBookVisit: () => void;
};

export default function ResultActionButtons({
  decision,
  onShowDIY,
  onCallUs,
  onBookVisit,
}: ResultActionButtonsProps) {
  const primaryButtonClass =
    "flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#0E79B2] to-[#095F8E] px-4 py-4 font-extrabold text-white shadow-lg shadow-[#0E79B2]/30 transition-all hover:-translate-y-0.5 hover:from-[#0B6C9F] hover:to-[#074E74] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/40";
  const bookButtonClass =
    "w-full max-w-[760px] min-h-[108px] items-center justify-center px-4 py-5 text-left sm:px-5";

  const actionConfigByDecision = {
    diy: {
      label: "Open DIY Plan",
      icon: FileText,
      onClick: onShowDIY,
    },
    call: {
      label: "Call Us Now",
      icon: Phone,
      onClick: onCallUs,
    },
    book: {
      label: "Book a Free Site Visit with Troy",
      icon: Calendar,
      onClick: onBookVisit,
    },
  } as const;

  const actionConfig = actionConfigByDecision[decision.action];
  const ActionIcon = actionConfig.icon;
  const isBookAction = decision.action === "book";
  const followupMessage =
    decision.followupChannel === "call"
      ? "A professional will call you shortly."
      : "A professional will email you shortly.";

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <button
        onClick={actionConfig.onClick}
        className={`${primaryButtonClass} ${isBookAction ? bookButtonClass : ""}`}
      >
        {isBookAction ? (
          <span className="flex w-full items-center justify-between gap-4">
            <span className="flex min-w-0 items-center gap-4">
              <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/45 bg-white/20">
                <Image
                  src="/assets/img/Book%20A%20Call/troy-book-a-call.png"
                  alt="Troy, home security specialist"
                  fill
                  sizes="80px"
                  className="object-cover object-[50%_18%]"
                />
              </span>
              <span className="min-w-0 space-y-1">
                <span className="block text-xl font-extrabold leading-tight text-white sm:text-2xl">
                  {actionConfig.label}
                </span>
                <span className="block text-sm font-medium leading-snug text-white/90 sm:text-base">
                  Friendly visit, no sales pressure.
                </span>
              </span>
            </span>
            <Calendar className="h-6 w-6 shrink-0 text-white/95" />
          </span>
        ) : (
          <>
            <ActionIcon className="w-5 h-5" /> {actionConfig.label}
          </>
        )}
      </button>
      {decision.showFollowup && (
        <p className="w-full text-center text-xs font-medium text-slate-600">
          {followupMessage}
        </p>
      )}
    </div>
  );
}
