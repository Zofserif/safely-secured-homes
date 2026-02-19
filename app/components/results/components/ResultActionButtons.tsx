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
  const actionMap: Record<ResultActionKey, ReactElement | null> = {
    primary_book: (
      <button
        key="primary_book"
        onClick={onBookVisit}
        className="flex-1 bg-[#0E79B2] text-white py-3 rounded-xl font-bold hover:bg-[#0b5e8b] transition-colors flex items-center justify-center gap-2"
      >
        <Calendar className="w-5 h-5" /> Book Site Visit (Free)
      </button>
    ),
    common_call: (
      <button
        key="common_call"
        onClick={onCallUs}
        className="flex-1 bg-white text-[#0E79B2] border border-[#0E79B2]/30 py-3 rounded-xl font-bold hover:bg-[#F7FAFC] transition-colors flex items-center justify-center gap-2"
      >
        <Phone className="w-5 h-5" /> Call Us Now
      </button>
    ),
    primary_call: (
      <button
        key="primary_call"
        onClick={onCallUs}
        className="flex-1 bg-[#0E79B2] text-white py-3 rounded-xl font-bold hover:bg-[#0b5e8b] transition-colors flex items-center justify-center gap-2"
      >
        <Phone className="w-5 h-5" /> Call Us Now
      </button>
    ),
    common_diy: showDIYPlan ? (
      <button
        key="common_diy"
        onClick={onShowDIY}
        className="flex-1 bg-white text-[#0E79B2] border border-[#0E79B2]/30 py-3 rounded-xl font-bold hover:bg-[#F7FAFC] transition-colors flex items-center justify-center gap-2"
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
