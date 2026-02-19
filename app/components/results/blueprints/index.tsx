import type { BlueprintCard } from "../types";
import AwarenessBlueprint from "./AwarenessBlueprint";
import EmergencyBlueprint from "./EmergencyBlueprint";
import PreventionBlueprint from "./PreventionBlueprint";

export const BLUEPRINT_CARDS: BlueprintCard[] = [
  {
    id: "prevention",
    title: "Prevention & Preparation",
    summary: "Goal: Stop problems before they start.",
    content: <PreventionBlueprint />,
  },
  {
    id: "awareness",
    title: "For Your Complete Peace of Mind",
    summary:
      "Goal: Detect threats early and respond faster without feeling watched.",
    featured: true,
    content: <AwarenessBlueprint />,
  },
  {
    id: "emergency",
    title: "Emergency Readiness",
    summary: "Goal: Make sure everyone knows what to do under stress.",
    content: <EmergencyBlueprint />,
  },
];
