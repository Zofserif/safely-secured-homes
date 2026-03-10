import type { ReactNode } from "react";

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
