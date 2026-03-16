import { Star } from "lucide-react";
import {
  RESULTS_REVIEW_CTA_LABEL,
  RESULTS_REVIEW_CTA_SUPPORT_TEXT,
} from "../constants";

type LeaveReviewCtaProps = {
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  className?: string;
  supportText?: string;
};

const joinClasses = (...classNames: Array<string | undefined>): string =>
  classNames.filter(Boolean).join(" ");

export default function LeaveReviewCta({
  onClick,
  href,
  disabled = false,
  className,
  supportText = RESULTS_REVIEW_CTA_SUPPORT_TEXT,
}: LeaveReviewCtaProps) {
  const interactiveClassName =
    "inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-[#0E79B2]/25 bg-linear-to-r from-[#0E79B2] to-[#146E9E] px-4 py-3 text-left text-white shadow-lg shadow-[#0E79B2]/30 transition-all hover:-translate-y-0.5 hover:from-[#0B6C9F] hover:to-[#0B6C9F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/40";
  const disabledClassName =
    "inline-flex w-full cursor-not-allowed items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-left text-slate-400";
  const baseClassName = disabled ? disabledClassName : interactiveClassName;
  const textClassName = disabled ? "text-slate-500" : "text-white";
  const supportTextClassName = disabled ? "text-slate-400" : "text-white/90";
  const iconWrapClassName = disabled
    ? "border border-slate-300 bg-white text-slate-400"
    : "border border-white/40 bg-white/18 text-white";
  const iconClassName = disabled ? "text-slate-400" : "text-white";

  const content = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={joinClasses(
            "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            iconWrapClassName,
          )}
        >
          <Star
            aria-hidden="true"
            className={joinClasses("h-5 w-5", iconClassName)}
          />
        </span>
        <span className="min-w-0 space-y-0.5">
          <span
            className={joinClasses(
              "block text-base font-extrabold leading-tight",
              textClassName,
            )}
          >
            {RESULTS_REVIEW_CTA_LABEL}
          </span>
          {supportText ? (
            <span
              className={joinClasses(
                "block text-xs font-medium leading-snug md:text-sm",
                supportTextClassName,
              )}
            >
              {supportText}
            </span>
          ) : null}
        </span>
      </span>
      <Star
        aria-hidden="true"
        className={joinClasses("h-5 w-5 shrink-0", iconClassName)}
      />
    </>
  );

  if (href && !disabled) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={joinClasses(baseClassName, className)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={joinClasses(baseClassName, className)}
    >
      {content}
    </button>
  );
}
