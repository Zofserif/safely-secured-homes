import type { BlueprintCard } from "../types";
import type { CalculationResult } from "../../../lib/types";
import AwarenessBlueprint from "./AwarenessBlueprint";
import EmergencyBlueprint from "./EmergencyBlueprint";
import PreventionBlueprint from "./PreventionBlueprint";

type BlueprintCardInput = Pick<
  CalculationResult,
  "cameraCount" | "nvrChannel" | "storage1TB"
>;

export const createBlueprintCards = ({
  cameraCount,
  nvrChannel,
  storage1TB,
}: BlueprintCardInput): BlueprintCard[] => [
  {
    id: "prevention",
    title: "Entry Risks",
    goal: "Make your home harder to enter unnoticed.",
    summary: "Complete to get 10% of the remaining Panatag Home Rating.",
    ratingGainShare: 0.1,
    content: <PreventionBlueprint />,
  },
  {
    id: "awareness",
    title: "Daily Protection",
    goal: "Spot problems early, capture clear evidence, and respond faster.",
    summary: "Complete to get 80% of the remaining Panatag Home Rating.",
    ratingGainShare: 0.8,
    featured: true,
    content: (
      <AwarenessBlueprint
        cameraCount={cameraCount}
        nvrChannel={nvrChannel}
        storage1TB={storage1TB}
      />
    ),
  },
  {
    id: "emergency",
    title: "Emergency Readiness",
    goal: "Help your family respond calmly and quickly.",
    summary: "Complete to get 10% of the remaining Panatag Home Rating.",
    ratingGainShare: 0.1,
    content: <EmergencyBlueprint />,
  },
];
