import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getResultsSummary } from "../../lib/calculations";
import { getPanatagDisplayFromSafetyCategories } from "../../lib/resultsScoring";
import { getSafetyCategoryScoresPrecise } from "../../lib/safetyScores";
import type { CalculationResult, FormData } from "../../lib/types";
import { BLUEPRINT_CARDS } from "./blueprints";
import { RESULTS_BOOK_VISIT_URL, RESULTS_CALL_HREF } from "./constants";
import BlueprintCardsGrid from "./components/BlueprintCardsGrid";
import BlueprintModal from "./components/BlueprintModal";
import NextStepPanel from "./components/NextStepPanel";
import ResultActionButtons from "./components/ResultActionButtons";
import ResultsStatsGrid from "./components/ResultsStatsGrid";
import type { BlueprintModalState } from "./types";
import DIYView from "./DIYView";

export default function ResultsPage({
  result,
  data,
}: {
  result: CalculationResult;
  data: FormData;
}) {
  const [showDIY, setShowDIY] = useState(false);
  const showDIYPlan = Boolean(data.diy_security_plan);
  const [activeBlueprintId, setActiveBlueprintId] =
    useState<BlueprintModalState>(null);
  const firstName = data.first_name.trim();

  const { safetyLevel, priority, emergency } = getResultsSummary(
    data,
    result,
  );
  const panatagRating100 = getPanatagDisplayFromSafetyCategories(
    getSafetyCategoryScoresPrecise(data),
  ).panatag100;

  const activeBlueprint =
    BLUEPRINT_CARDS.find((card) => card.id === activeBlueprintId) ?? null;

  useEffect(() => {
    if (!activeBlueprintId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveBlueprintId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeBlueprintId]);

  const handleCallUs = () => {
    window.location.href = RESULTS_CALL_HREF;
  };

  const handleBookVisit = () => {
    window.open(RESULTS_BOOK_VISIT_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] py-20 px-4">
      {showDIY && showDIYPlan && (
        <DIYView
          onBack={() => setShowDIY(false)}
          onCall={handleCallUs}
          result={result}
          data={data}
        />
      )}

      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="bg-[#0E79B2] p-4 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">
              {firstName ? `Hi ${firstName}!` : "Hi there!"}
            </h1>
            <p className="opacity-90">
              We Have Finished Your Home Safety Assessment
            </p>
          </div>

          <div className="p-6 space-y-6">
            <ResultsStatsGrid
              safetyLevel={safetyLevel}
              priority={priority}
              emergency={emergency}
              panatagRating100={panatagRating100}
              cameraCount={result.cameraCount}
            />

            <div>
              <h3 className="font-bold text-2xl mb-2 flex items-center justify-center gap-2">
                How to Improve Your Panatag Home Rating
              </h3>
              <p className="text-center text-sm text-slate-600 mb-6">
                Tap a card to see your Home Safety Blueprint
              </p>

              <BlueprintCardsGrid
                cards={BLUEPRINT_CARDS}
                onSelect={setActiveBlueprintId}
              />

              <BlueprintModal
                activeBlueprint={activeBlueprint}
                onClose={() => setActiveBlueprintId(null)}
              />
            </div>

            <NextStepPanel cameraCount={result.cameraCount}>
              <ResultActionButtons
                leadTier={result.leadTier}
                showDIYPlan={showDIYPlan}
                onShowDIY={() => setShowDIY(true)}
                onCallUs={handleCallUs}
                onBookVisit={handleBookVisit}
              />
            </NextStepPanel>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
