import type { BlueprintCard } from "../types";
import AwarenessBlueprint from "./AwarenessBlueprint";
import EmergencyBlueprint from "./EmergencyBlueprint";
import PreventionBlueprint from "./PreventionBlueprint";

export const BLUEPRINT_CARDS: BlueprintCard[] = [
  {
    id: "prevention",
    title: "Prevention & Preparation",
    goal: "Stop problems before they happen.",
    summary: "Complete to get 10% of the remaining Panatag Home Rating.",
    ratingGainShare: 0.1,
    content: <PreventionBlueprint />,
  },
  {
    id: "awareness",
    title: "For Your Complete Peace of Mind",
    goal: "Detect threats early, document what happened, and respond faster.",
    summary: "Complete to get 80% of the remaining Panatag Home Rating.",
    ratingGainShare: 0.8,
    featured: true,
    content: <AwarenessBlueprint />,
  },
  {
    id: "emergency",
    title: "Emergency Readiness",
    goal: "Make the family calm and ready under stress.",
    summary: "Complete to get 10% of the remaining Panatag Home Rating.",
    ratingGainShare: 0.1,
    content: <EmergencyBlueprint />,
  },
];
