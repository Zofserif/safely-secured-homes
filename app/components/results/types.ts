import type { ReactNode } from "react";
import type { LeadTier } from "../../lib/types";

export type BlueprintCardId = "prevention" | "emergency" | "awareness";

export type BlueprintCard = {
  id: BlueprintCardId;
  title: string;
  goal: string;
  summary: string;
  ratingGainShare: number;
  featured?: boolean;
  content: ReactNode;
};

export type BlueprintModalState = BlueprintCard["id"] | null;
export type BlueprintCompletionState = Record<BlueprintCardId, boolean>;

export type ResultActionKey =
  | "primary_book"
  | "common_call"
  | "primary_call"
  | "common_diy";

export type ResultActionPolicy = Record<LeadTier, ResultActionKey[]>;
