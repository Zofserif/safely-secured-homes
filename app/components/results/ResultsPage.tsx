import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getResultsSummary } from "../../lib/calculations";
import { buildResultsScoringBreakdown } from "../../lib/resultsScoring";
import {
  trackBookConsultClick,
  trackFunnelCtaClicked,
} from "../../lib/analytics";
import { deriveFirstNameFromEmail } from "../../lib/contactName";
import type { CalculationResult, FormData, SeverityLevel } from "../../lib/types";
import {
  RESULTS_BOOK_VISIT_URL,
  RESULTS_CALL_HREF,
  RESULTS_REVIEW_CTA_LABEL,
  RESULTS_REVIEW_PATH,
} from "./constants";
import { createBlueprintCards } from "./blueprints";
import BlueprintCardsGrid from "./components/BlueprintCardsGrid";
import BlueprintModal from "./components/BlueprintModal";
import NextStepPanel from "./components/NextStepPanel";
import PanatagResultsHero, {
  type PanatagHeroSlice,
} from "./components/PanatagResultsHero";
import ResultActionButtons from "./components/ResultActionButtons";
import type {
  BlueprintCard,
  BlueprintCardId,
  BlueprintCompletionState,
  BlueprintModalState,
} from "./types";
import DIYView from "./DIYView";
import { resolveStep2CtaDecision } from "./step2CtaDecision";

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
  blueprintCards: readonly Pick<BlueprintCard, "id" | "ratingGainShare">[],
): Record<BlueprintCardId, number> => {
  const safeRemainingGap = Math.max(0, Math.floor(remainingGap));
  const gainPointsByBlueprint = createDefaultGainPointsByBlueprint();

  if (safeRemainingGap === 0) {
    return gainPointsByBlueprint;
  }

  const weightedCards = blueprintCards.map((card, index) => {
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

const PANATAG_FALLBACK_SLICE_SHARES = {
  homeReadiness: 0.1,
  safety: 0.6,
  emergency: 0.3,
} as const;

const toSafeNonNegativeNumber = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

const buildPanatagHeroSlices = ({
  homeReadinessScore100,
  safetyScore100,
  emergencyScore100,
  homeReadinessContribution,
  safetyContribution,
  emergencyContribution,
  homeReadinessStatusLabel,
  safetyStatusLabel,
  emergencyStatusLabel,
  homeReadinessSeverity,
  safetySeverity,
  emergencySeverity,
}: {
  homeReadinessScore100: number;
  safetyScore100: number;
  emergencyScore100: number;
  homeReadinessContribution: number;
  safetyContribution: number;
  emergencyContribution: number;
  homeReadinessStatusLabel: string;
  safetyStatusLabel: string;
  emergencyStatusLabel: string;
  homeReadinessSeverity: SeverityLevel;
  safetySeverity: SeverityLevel;
  emergencySeverity: SeverityLevel;
}): PanatagHeroSlice[] => {
  const sanitizedHomeReadinessContribution = toSafeNonNegativeNumber(
    homeReadinessContribution,
  );
  const sanitizedSafetyContribution = toSafeNonNegativeNumber(safetyContribution);
  const sanitizedEmergencyContribution =
    toSafeNonNegativeNumber(emergencyContribution);
  const totalContribution =
    sanitizedHomeReadinessContribution +
    sanitizedSafetyContribution +
    sanitizedEmergencyContribution;
  const hasPositiveContribution = totalContribution > 0;
  const homeReadinessShare = hasPositiveContribution
    ? sanitizedHomeReadinessContribution / totalContribution
    : PANATAG_FALLBACK_SLICE_SHARES.homeReadiness;
  const safetyShare = hasPositiveContribution
    ? sanitizedSafetyContribution / totalContribution
    : PANATAG_FALLBACK_SLICE_SHARES.safety;
  const emergencyShare = hasPositiveContribution
    ? sanitizedEmergencyContribution / totalContribution
    : PANATAG_FALLBACK_SLICE_SHARES.emergency;

  return [
    {
      id: "safety",
      label: "Safety",
      rawScore100: safetyScore100,
      baseContribution: sanitizedSafetyContribution,
      shareRatio: safetyShare,
      weightedValue: sanitizedSafetyContribution,
      weightedMax: 60,
      statusLabel: safetyStatusLabel,
      severity: safetySeverity,
      color: "#2E8B57",
      trackColor: "#E9F7EF",
    },
    {
      id: "emergency",
      label: "Emergency",
      rawScore100: emergencyScore100,
      baseContribution: sanitizedEmergencyContribution,
      shareRatio: emergencyShare,
      weightedValue: sanitizedEmergencyContribution,
      weightedMax: 30,
      statusLabel: emergencyStatusLabel,
      severity: emergencySeverity,
      color: "#E4572E",
      trackColor: "#FFF1EC",
    },
    {
      id: "home_readiness",
      label: "Home Action",
      rawScore100: homeReadinessScore100,
      baseContribution: sanitizedHomeReadinessContribution,
      shareRatio: homeReadinessShare,
      weightedValue: sanitizedHomeReadinessContribution,
      weightedMax: 10,
      statusLabel: homeReadinessStatusLabel,
      severity: homeReadinessSeverity,
      color: "#0E79B2",
      trackColor: "#EAF4FB",
    },
  ];
};

export default function ResultsPage({
  result,
  data,
  resultsReviewCtaEnabled = false,
}: {
  result: CalculationResult;
  data: FormData;
  resultsReviewCtaEnabled?: boolean;
}) {
  const [showDIY, setShowDIY] = useState(false);
  const isResultsReviewMode = resultsReviewCtaEnabled === true;
  const step2CtaDecision = resolveStep2CtaDecision({
    leadTier: result.leadTier,
    solution: data.solution,
    mobile: data.mobile,
  });
  const isEligibleForDIYView = step2CtaDecision.action === "diy";
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
  const firstName =
    data.name?.trim() || deriveFirstNameFromEmail(data.email);
  const heroGreeting = firstName ? `Hi ${firstName}!` : "Hi there!";
  const blueprintCards = createBlueprintCards(result);

  const { safetyTotal, emergencyReadinessScore, panatagRating } = getResultsSummary(
    data,
    result,
  );
  const panatagScoringBreakdown = buildResultsScoringBreakdown({
    totalRiskScore: safetyTotal,
    leadTier: result.leadTier,
    emergencyRiskScore: emergencyReadinessScore,
    panatagScoreInputs: {
      leadScore: result.leadScore,
      safetyTotal,
      emergencyReadinessScore,
    },
  });
  const panatagHeroSlices = buildPanatagHeroSlices({
    homeReadinessScore100: panatagScoringBreakdown.panatag.leadScore,
    safetyScore100: panatagScoringBreakdown.panatag.safetyTotal,
    emergencyScore100: panatagScoringBreakdown.panatag.emergencyReadinessScore,
    homeReadinessContribution: panatagScoringBreakdown.panatag.leadContribution,
    safetyContribution: panatagScoringBreakdown.panatag.safetyContribution,
    emergencyContribution: panatagScoringBreakdown.panatag.emergencyContribution,
    homeReadinessStatusLabel: panatagScoringBreakdown.outputs.priority.label,
    homeReadinessSeverity: panatagScoringBreakdown.outputs.priority.severity,
    safetyStatusLabel: panatagScoringBreakdown.outputs.safetyLevel.label,
    safetySeverity: panatagScoringBreakdown.outputs.safetyLevel.severity,
    emergencyStatusLabel: panatagScoringBreakdown.outputs.emergency.label,
    emergencySeverity: panatagScoringBreakdown.outputs.emergency.severity,
  });
  const basePanatagRating100 = panatagRating;
  const remainingPanatagGap = Math.max(0, 100 - basePanatagRating100);
  const gainPointsByBlueprint = computeBlueprintGainPoints(
    remainingPanatagGap,
    blueprintCards,
  );
  const appliedGain = blueprintCards.reduce<number>(
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
  const displayBlueprintCards = blueprintCards.map((card) => {
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
    blueprintCards.find((card) => card.id === activeBlueprintId) ?? null;
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

  const handleReviewCtaClick = () => {
    trackFunnelCtaClicked("results", {
      cta_id: "results_review_cta",
      cta_location: "next_step_panel",
      target_path: RESULTS_REVIEW_PATH,
    });
    window.location.assign(RESULTS_REVIEW_PATH);
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

  const handleAwarenessCallNow = () => {
    setAwarenessPendingState(awarenessPendingStorageKey);
    setActiveBlueprintId(null);
  };

  const handleAwarenessReviewCtaClick = () => {
    setAwarenessPendingState(awarenessPendingStorageKey);
    setActiveBlueprintId(null);
    trackFunnelCtaClicked("results", {
      cta_id: "results_awareness_review_cta",
      cta_location: "blueprint_modal_footer",
      target_path: RESULTS_REVIEW_PATH,
    });
    window.location.assign(RESULTS_REVIEW_PATH);
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

  useEffect(() => {
    if (isEligibleForDIYView || !showDIY) return;
    const timeoutId = window.setTimeout(() => {
      setShowDIY(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isEligibleForDIYView, showDIY]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E8F3FB_0%,#F7FAFC_50%,#ECF6FF_100%)] px-4 py-14 sm:py-16">
      {showDIY && isEligibleForDIYView && (
        <DIYView
          onBack={() => setShowDIY(false)}
          onCall={handleCallUs}
          result={result}
          data={data}
        />
      )}

      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-4xl border border-[#D1E4F2] bg-white/95 shadow-[0_35px_90px_-50px_rgba(4,48,79,0.6)]"
        >
          <div className="space-y-6 p-5 sm:p-6 lg:p-8">
            <PanatagResultsHero
              greeting={heroGreeting}
              baselinePanatagRating100={basePanatagRating100}
              projectedPanatagRating100={projectedPanatagRating100}
              slices={panatagHeroSlices}
            />

            <section className="rounded-[1.75rem] border border-[#D1E4F2] bg-linear-to-br from-[#FBFDFF] via-white to-[#F1F8FF] p-5 sm:p-6">
              <div className="mb-5 text-center">
                <span className="inline-flex items-center rounded-full border border-[#0E79B2]/30 bg-[#EAF4FB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0E79B2]">
                  Step 1 of 2
                </span>
                <h3 className="mt-2.5 text-xl font-bold text-slate-900 sm:text-2xl">
                  Open Your 3 Safety Insights
                </h3>
                <p className="mt-1.5 text-sm font-medium text-slate-700">
                  Tap each card to unlock actions that can raise your Panatag score.
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
                isResultsReviewMode={isResultsReviewMode}
                onAwarenessCallNow={handleAwarenessCallNow}
                onAwarenessReviewCtaClick={handleAwarenessReviewCtaClick}
              />
            </section>

            <NextStepPanel
              cameraCount={result.cameraCount}
              badgeLabel={isResultsReviewMode ? "Feedback Request" : undefined}
              title={
                isResultsReviewMode
                  ? "Can You Review Your Panatag Rating Experience?"
                  : undefined
              }
              description={
                isResultsReviewMode
                  ? "Before we go live, please leave a quick review of the Panatag Rating experience."
                  : undefined
              }
            >
              {isResultsReviewMode ? (
                <button
                  onClick={handleReviewCtaClick}
                  className="flex w-full max-w-[760px] items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#0E79B2] to-[#095F8E] px-4 py-4 font-extrabold text-white shadow-lg shadow-[#0E79B2]/30 transition-all hover:-translate-y-0.5 hover:from-[#0B6C9F] hover:to-[#074E74] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/40"
                >
                  {RESULTS_REVIEW_CTA_LABEL}
                </button>
              ) : (
                <ResultActionButtons
                  decision={step2CtaDecision}
                  onShowDIY={() => {
                    if (!isEligibleForDIYView) return;
                    setShowDIY(true);
                  }}
                  onCallUs={handleCallUs}
                  onBookVisit={handleBookVisit}
                />
              )}
            </NextStepPanel>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
