import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getResultsSummary } from "../../lib/calculations";
import {
  trackBookConsultClick,
  trackChecklistDownloadClick,
} from "../../lib/analytics";
import { getPanatagDisplayFromSafetyCategories } from "../../lib/resultsScoring";
import { getSafetyCategoryScoresPrecise } from "../../lib/safetyScores";
import { panatagChecklistPath } from "../../lib/site";
import type { CalculationResult, FormData } from "../../lib/types";
import { RESULTS_BOOK_VISIT_URL, RESULTS_CALL_HREF } from "./constants";
import { BLUEPRINT_CARDS } from "./blueprints";
import BlueprintCardsGrid from "./components/BlueprintCardsGrid";
import BlueprintModal from "./components/BlueprintModal";
import NextStepPanel from "./components/NextStepPanel";
import ResultActionButtons from "./components/ResultActionButtons";
import ResultsStatsGrid from "./components/ResultsStatsGrid";
import type {
  BlueprintCardId,
  BlueprintCompletionState,
  BlueprintModalState,
} from "./types";
import DIYView from "./DIYView";

const BLUEPRINT_COMPLETION_STORAGE_PREFIX =
  "ssh_results_blueprint_completion_v1:";
const AWARENESS_PENDING_STORAGE_PREFIX = "ssh_results_awareness_pending_v1:";
const AWARENESS_PENDING_VALUE = "1";
const AUDIT_BOOKED_QUERY_PARAM = "auditBooked";
const AUDIT_BOOKED_QUERY_VALUE = "1";

const DEFAULT_BLUEPRINT_COMPLETION: BlueprintCompletionState = {
  prevention: false,
  emergency: false,
  awareness: false,
};

const createDefaultBlueprintCompletion = (): BlueprintCompletionState => ({
  ...DEFAULT_BLUEPRINT_COMPLETION,
});

const sanitizeBlueprintCompletionState = (
  value: unknown,
): BlueprintCompletionState => {
  const source =
    typeof value === "object" && value !== null
      ? (value as Partial<Record<keyof BlueprintCompletionState, unknown>>)
      : {};

  return {
    prevention: source.prevention === true,
    emergency: source.emergency === true,
    awareness: source.awareness === true,
  };
};

const readBlueprintCompletionState = (
  storageKey: string,
): BlueprintCompletionState => {
  if (typeof window === "undefined") {
    return createDefaultBlueprintCompletion();
  }

  const rawState = sessionStorage.getItem(storageKey);
  if (!rawState) {
    return createDefaultBlueprintCompletion();
  }

  try {
    return sanitizeBlueprintCompletionState(JSON.parse(rawState));
  } catch {
    return createDefaultBlueprintCompletion();
  }
};

const readAwarenessPendingState = (storageKey: string): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(storageKey) === AWARENESS_PENDING_VALUE;
};

const setAwarenessPendingState = (storageKey: string): void => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey, AWARENESS_PENDING_VALUE);
};

const clearAwarenessPendingState = (storageKey: string): void => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(storageKey);
};

const hasAuditBookedSignal = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const url = new URL(window.location.href);
  return url.searchParams.get(AUDIT_BOOKED_QUERY_PARAM) === AUDIT_BOOKED_QUERY_VALUE;
};

const createDefaultGainPointsByBlueprint = (): Record<BlueprintCardId, number> => ({
  prevention: 0,
  emergency: 0,
  awareness: 0,
});

const computeBlueprintGainPoints = (
  remainingGap: number,
): Record<BlueprintCardId, number> => {
  const safeRemainingGap = Math.max(0, Math.floor(remainingGap));
  const gainPointsByBlueprint = createDefaultGainPointsByBlueprint();

  if (safeRemainingGap === 0) {
    return gainPointsByBlueprint;
  }

  const weightedCards = BLUEPRINT_CARDS.map((card, index) => {
    const rawGain = safeRemainingGap * card.ratingGainShare;
    const basePoints = Math.floor(rawGain);
    const remainder = rawGain - basePoints;

    gainPointsByBlueprint[card.id] = basePoints;

    return {
      id: card.id,
      index,
      ratingGainShare: card.ratingGainShare,
      remainder,
    };
  });

  const basePointTotal = Object.values(gainPointsByBlueprint).reduce<number>(
    (sum, value) => sum + value,
    0,
  );
  let delta = safeRemainingGap - basePointTotal;

  const increasePriority = [...weightedCards].sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    if (b.ratingGainShare !== a.ratingGainShare) {
      return b.ratingGainShare - a.ratingGainShare;
    }
    return a.index - b.index;
  });

  const decreasePriority = [...weightedCards].sort((a, b) => {
    if (a.remainder !== b.remainder) return a.remainder - b.remainder;
    if (a.ratingGainShare !== b.ratingGainShare) {
      return a.ratingGainShare - b.ratingGainShare;
    }
    return a.index - b.index;
  });

  let cursor = 0;
  while (delta > 0 && increasePriority.length > 0) {
    const target = increasePriority[cursor % increasePriority.length];
    gainPointsByBlueprint[target.id] += 1;
    delta -= 1;
    cursor += 1;
  }

  cursor = 0;
  let stalledCount = 0;
  while (delta < 0 && decreasePriority.length > 0) {
    const target = decreasePriority[cursor % decreasePriority.length];
    if (gainPointsByBlueprint[target.id] > 0) {
      gainPointsByBlueprint[target.id] -= 1;
      delta += 1;
      stalledCount = 0;
    } else {
      stalledCount += 1;
      if (stalledCount >= decreasePriority.length) {
        break;
      }
    }
    cursor += 1;
  }

  return gainPointsByBlueprint;
};

export default function ResultsPage({
  result,
  data,
}: {
  result: CalculationResult;
  data: FormData;
}) {
  const [showDIY, setShowDIY] = useState(false);
  const showDIYPlan = Boolean(data.diy_security_plan);
  const normalizedEmail = data.email.trim().toLowerCase() || "unknown";
  const shouldAutoCompleteAwareness = hasAuditBookedSignal();
  const completionStorageKey = `${BLUEPRINT_COMPLETION_STORAGE_PREFIX}${normalizedEmail}`;
  const awarenessPendingStorageKey = `${AWARENESS_PENDING_STORAGE_PREFIX}${normalizedEmail}`;
  const [activeBlueprintId, setActiveBlueprintId] =
    useState<BlueprintModalState>(null);
  const [blueprintCompletion, setBlueprintCompletion] =
    useState<BlueprintCompletionState>(() => {
      const initialState = readBlueprintCompletionState(completionStorageKey);

      if (!shouldAutoCompleteAwareness || initialState.awareness) {
        return initialState;
      }

      return {
        ...initialState,
        awareness: true,
      };
    });
  const firstName = data.first_name.trim();
  const heroGreeting = firstName ? `Hi ${firstName}!` : "Hi there!";

  const { safetyLevel, priority, emergency } = getResultsSummary(
    data,
    result,
  );
  const basePanatagRating100 = getPanatagDisplayFromSafetyCategories(
    getSafetyCategoryScoresPrecise(data),
  ).panatag100;
  const remainingPanatagGap = Math.max(0, 100 - basePanatagRating100);
  const gainPointsByBlueprint = computeBlueprintGainPoints(remainingPanatagGap);
  const appliedGain = BLUEPRINT_CARDS.reduce<number>(
    (sum, card) =>
      sum + (blueprintCompletion[card.id] ? gainPointsByBlueprint[card.id] : 0),
    0,
  );
  const projectedPanatagRating100 = Math.max(
    0,
    Math.min(
      100,
      basePanatagRating100 + appliedGain,
    ),
  );
  const displayBlueprintCards = BLUEPRINT_CARDS.map((card) => {
    const gain = gainPointsByBlueprint[card.id];
    const isCompleted = blueprintCompletion[card.id];
    const summary = isCompleted
      ? `Unlocked: +${gain} Panatag Rating`
      : `+${gain} Panatag Rating`;

    return {
      ...card,
      summary,
    };
  });

  const activeBlueprint =
    BLUEPRINT_CARDS.find((card) => card.id === activeBlueprintId) ?? null;
  const isActiveBlueprintCompleted = activeBlueprint
    ? blueprintCompletion[activeBlueprint.id]
    : false;

  useEffect(() => {
    if (typeof window === "undefined") return;

    sessionStorage.setItem(
      completionStorageKey,
      JSON.stringify(blueprintCompletion),
    );
  }, [blueprintCompletion, completionStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !shouldAutoCompleteAwareness) return;

    const url = new URL(window.location.href);
    if (
      url.searchParams.get(AUDIT_BOOKED_QUERY_PARAM) !== AUDIT_BOOKED_QUERY_VALUE
    ) {
      return;
    }

    url.searchParams.delete(AUDIT_BOOKED_QUERY_PARAM);
    const nextPath = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", nextPath);
  }, [shouldAutoCompleteAwareness]);

  useEffect(() => {
    if (!blueprintCompletion.awareness) return;
    clearAwarenessPendingState(awarenessPendingStorageKey);
  }, [awarenessPendingStorageKey, blueprintCompletion.awareness]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyDeferredAwarenessCompletion = () => {
      if (!readAwarenessPendingState(awarenessPendingStorageKey)) {
        return;
      }

      if (blueprintCompletion.awareness) {
        clearAwarenessPendingState(awarenessPendingStorageKey);
        return;
      }

      clearAwarenessPendingState(awarenessPendingStorageKey);
      setBlueprintCompletion((current) =>
        current.awareness
          ? current
          : {
              ...current,
              awareness: true,
            },
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      applyDeferredAwarenessCompletion();
    };

    const handleWindowFocus = () => {
      applyDeferredAwarenessCompletion();
    };

    const handlePageShow = () => {
      applyDeferredAwarenessCompletion();
    };

    const frame = window.requestAnimationFrame(() => {
      applyDeferredAwarenessCompletion();
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [awarenessPendingStorageKey, blueprintCompletion.awareness]);

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
    trackBookConsultClick("results", undefined, {
      cta_location: "next_step_panel",
      target_url: RESULTS_CALL_HREF,
    });
    window.location.href = RESULTS_CALL_HREF;
  };

  const handleBookVisit = () => {
    trackBookConsultClick("results", undefined, {
      cta_location: "next_step_panel",
      target_url: RESULTS_BOOK_VISIT_URL,
    });
    window.open(RESULTS_BOOK_VISIT_URL, "_blank", "noopener,noreferrer");
  };

  const handleChecklistDownload = () => {
    trackChecklistDownloadClick("results", undefined, {
      cta_location: "next_step_panel",
      target_path: panatagChecklistPath,
    });
  };

  const handleToggleComplete = () => {
    if (!activeBlueprintId) return;
    const blueprintId = activeBlueprintId;
    const shouldMarkComplete = !blueprintCompletion[blueprintId];

    setBlueprintCompletion((current) => ({
      ...current,
      [blueprintId]: shouldMarkComplete,
    }));

    setActiveBlueprintId(null);
  };

  const handleAwarenessBookAudit = () => {
    setAwarenessPendingState(awarenessPendingStorageKey);
    setActiveBlueprintId(null);
  };

  const handleSelectBlueprint = (id: BlueprintCardId) => {
    if (id === "awareness") {
      setBlueprintCompletion((current) =>
        current.awareness
          ? {
              ...current,
              awareness: false,
            }
          : current,
      );
    }

    setActiveBlueprintId(id);
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] px-4 py-14 sm:py-16">
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
          <div className="bg-linear-to-r from-[#0E79B2] via-[#1B8CCB] to-[#0E79B2] px-5 py-5 text-center text-white sm:px-6">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
              <span className="block">{heroGreeting}</span>
              <span className="mt-1 block text-xl font-semibold leading-tight text-white/95 sm:text-2xl">
                Your panatag home plan is ready
              </span>
            </h1>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <section>
              <div className="mt-3">
                <ResultsStatsGrid
                  safetyLevel={safetyLevel}
                  priority={priority}
                  emergency={emergency}
                  panatagRating100={projectedPanatagRating100}
                  cameraCount={result.cameraCount}
                />
              </div>
            </section>

            <div>
              <div className="mb-5 text-center">
                <span className="inline-flex items-center rounded-full border border-[#0E79B2]/30 bg-[#EAF4FB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0E79B2]">
                  Step 1 of 2
                </span>
                <h3 className="mt-2.5 text-xl font-bold text-slate-900 sm:text-2xl">
                  Open Your 3 Safety Insights
                </h3>
                <p className="mt-1.5 text-sm font-medium text-slate-700">
                  Tap a card to see what to do next.
                </p>
              </div>

              <BlueprintCardsGrid
                cards={displayBlueprintCards}
                onSelect={handleSelectBlueprint}
              />

              <BlueprintModal
                key={activeBlueprint?.id ?? "none"}
                activeBlueprint={activeBlueprint}
                onClose={() => setActiveBlueprintId(null)}
                isCompleted={isActiveBlueprintCompleted}
                onToggleComplete={handleToggleComplete}
                onAwarenessBookAudit={handleAwarenessBookAudit}
              />
            </div>

            <NextStepPanel cameraCount={result.cameraCount}>
              <a
                href={panatagChecklistPath}
                download
                onClick={handleChecklistDownload}
                className="flex-1 rounded-xl border border-[#0E79B2]/25 bg-white px-4 py-3 font-bold text-[#0E79B2] shadow-sm transition-colors hover:bg-[#F3F9FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/30 flex items-center justify-center gap-2"
              >
                Download Panatag Home Checklist
              </a>
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
