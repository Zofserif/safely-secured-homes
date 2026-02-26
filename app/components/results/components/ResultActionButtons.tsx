import { Calendar, FileText, Phone } from "lucide-react";
import type { ReactElement } from "react";
import type { LeadTier } from "../../../lib/types";
import { RESULT_ACTION_POLICY } from "../constants";
import type { ResultActionKey } from "../types";

type ResultActionButtonsProps = {
  leadTier: LeadTier;
  showDIYPlan: boolean;
  onShowDIY: () => void;
  onCallUs: () => void;
  onBookVisit: () => void;
};

export default function ResultActionButtons({
  leadTier,
  showDIYPlan,
  onShowDIY,
  onCallUs,
  onBookVisit,
}: ResultActionButtonsProps) {
  const primaryButtonClass =
    "flex-1 rounded-xl bg-linear-to-r from-[#0E79B2] to-[#0b5e8b] px-4 py-3 text-white font-extrabold shadow-lg shadow-[#0E79B2]/30 transition-all hover:-translate-y-0.5 hover:from-[#0b5e8b] hover:to-[#09527b] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/40 flex items-center justify-center gap-2";
  const secondaryButtonClass =
    "flex-1 rounded-xl border border-[#0E79B2]/25 bg-white px-4 py-3 font-bold text-[#0E79B2] shadow-sm transition-colors hover:bg-[#F3F9FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/30 flex items-center justify-center gap-2";

  const actionMap: Record<ResultActionKey, ReactElement | null> = {
    primary_book: (
      <button
        key="primary_book"
        onClick={onBookVisit}
        className={primaryButtonClass}
      >
        <Calendar className="w-5 h-5" /> Book Site Visit (Free)
      </button>
    ),
    common_call: (
      <button
        key="common_call"
        onClick={onCallUs}
        className={secondaryButtonClass}
      >
        <Phone className="w-5 h-5" /> Call Us Now
      </button>
    ),
    primary_call: (
      <button
        key="primary_call"
        onClick={onCallUs}
        className={primaryButtonClass}
      >
        <Phone className="w-5 h-5" /> Call Us Now
      </button>
    ),
    common_diy: showDIYPlan ? (
      <button
        key="common_diy"
        onClick={onShowDIY}
        className={secondaryButtonClass}
      >
        <FileText className="w-5 h-5" /> DIY Security Plan
      </button>
    ) : null,
  };

  return (
    <>
      {RESULT_ACTION_POLICY[leadTier]
        .map((action) => actionMap[action])
        .filter((action): action is ReactElement => Boolean(action))}
    </>
  );
}
