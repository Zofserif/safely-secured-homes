import type { ReactNode } from "react";
import type { LeadTier } from "../../lib/types";

export type BlueprintCard = {
  id: string;
  title: string;
  summary: string;
  featured?: boolean;
  content: ReactNode;
};

export type BlueprintModalState = BlueprintCard["id"] | null;

export type ResultActionKey =
  | "primary_book"
  | "common_call"
  | "primary_call"
  | "common_diy";

export type ResultActionPolicy = Record<LeadTier, ResultActionKey[]>;
