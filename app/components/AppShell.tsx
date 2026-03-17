"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPostHogDebugStatus,
  initPostHog,
  setPostHogEnabledForDebug,
} from "../posthog";

import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
import HomePage from "./home/HomePage";
import WizardForm from "./form/WizardForm";
import ResultsPage from "./results/ResultsPage";
import type { HomeCtaLocation, HomeCtaTarget } from "./home/types";
import { FormData, CalculationResult } from "../lib/types";
import { estimateCameraPlan } from "../lib/calculations";
import { normalizeSafetyHabitAnswers } from "../lib/safetyHabits";
import { submitLeadToSupabase } from "../lib/leads";
import {
  registerSshDebugMethods,
  type LeadSendsStatus,
  type NtfyTestMode,
  type NtfyTestResult,
  type PostHogDebugStatus,
} from "../lib/sshDebug";
import {
  buildFunnelContext,
  trackLeadGenerated,
  trackFunnelCtaClicked,
  trackFunnelOutcomeViewed,
  trackPageView,
  type AppView,
  type FunnelContext,
} from "../lib/analytics";
import {
  formatHasBonusQueryValue,
  HAS_BONUS_QUERY_PARAM,
  parseHasBonusQueryValue,
} from "../lib/bonusFlag";
import { readMarketingAttribution } from "../lib/marketingAttribution";
import { createShareableResultsPayload } from "../lib/resultsShare";
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  type PublicSiteSettings,
} from "../lib/siteAdminSettings";
import { useBonusEndsAt } from "./home/hooks/useBonusTimer";
import { useHomeCtaAndScarcity } from "./home/hooks/useHomeCtaAndScarcity";
import { useHomeDebugControls } from "./home/hooks/useHomeDebugControls";
import { useSharedClockNowMs } from "./home/hooks/useSharedClock";

declare global {
  interface Window {
    clearLogs?: () => Promise<void> | void;
    "clear logs"?: () => Promise<void> | void;
  }
}

type StoredLead = {
  formData: FormData;
  result: CalculationResult;
};

type NtfyTestRequestBody = {
  mode: NtfyTestMode;
  payload?: {
    name: string;
    email: string;
    mobile: string;
    tier: CalculationResult["leadTier"];
    score: CalculationResult["leadScore"];
    source: string;
  };
};

const STORAGE_KEY = "ssh_lead_state";
const LEAD_SENDS_DEBUG_STORAGE_KEY = "ssh_debug_lead_sends_enabled";
const IS_LOCAL_DEV = process.env.NODE_ENV !== "production";
const HOME_CTA_TARGET_PATH: Record<HomeCtaTarget, string> = {
  form: "/form",
  results: "/results",
  newsletter: "/newsletter",
};
const HOME_CTA_ID_BY_LOCATION: Record<HomeCtaLocation, string> = {
  hero_primary: "home_hero_primary_cta",
  midpage_primary: "home_mid_primary_cta",
  cta_banner_primary: "home_banner_primary_cta",
  navbar_primary: "home_navbar_primary_cta",
};
const HOME_CTA_VARIANT = "trust_urgency_v1";

const resolveHomeCtaScarcityState = ({
  hasExistingPlan,
  reportsLoading,
  reportsError,
  reportsRemaining,
}: {
  hasExistingPlan: boolean;
  reportsLoading: boolean;
  reportsError: boolean;
  reportsRemaining: number | null;
}) => {
  if (hasExistingPlan) return "existing_plan";
  if (reportsLoading) return "loading";
  if (reportsError) return "error";
  if (reportsRemaining === null) return "unknown";
  if (reportsRemaining <= 0) return "sold_out";
  if (reportsRemaining <= 3) return "critical";
  if (reportsRemaining <= 6) return "low";
  return "normal";
};

const readPersistedLeadSendsEnabled = (): boolean | null => {
  if (typeof window === "undefined") return null;
  if (!IS_LOCAL_DEV) return null;

  try {
    const raw = localStorage.getItem(LEAD_SENDS_DEBUG_STORAGE_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {
    // Ignore localStorage read errors.
  }

  return null;
};

const readSearchParam = (key: string) => {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key)?.trim() ?? "";
};

const buildHomeFormPath = (hasBonus: boolean) => {
  const params = new URLSearchParams();

  if (typeof window !== "undefined") {
    const attribution = readMarketingAttribution(
      new URLSearchParams(window.location.search)
    );

    if (attribution.source) params.set("source", attribution.source);
    if (attribution.utm_source) params.set("utm_source", attribution.utm_source);
    if (attribution.utm_medium) params.set("utm_medium", attribution.utm_medium);
    if (attribution.utm_campaign) {
      params.set("utm_campaign", attribution.utm_campaign);
    }
  }

  params.set(HAS_BONUS_QUERY_PARAM, formatHasBonusQueryValue(hasBonus));
  return `/form?${params.toString()}`;
};

const readStoredLead = () => {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredLead;
  } catch {
    return null;
  }
};

const writeStoredLead = (formData: FormData, result: CalculationResult) => {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ formData, result })
  );
};

const normalizeFormDataForApp = (data: FormData): FormData => {
  const legacyFirstName =
    typeof (data as { first_name?: unknown }).first_name === "string"
      ? (data as { first_name?: string }).first_name?.trim() ?? ""
      : "";

  return normalizeSafetyHabitAnswers({
    ...data,
    name: typeof data.name === "string" ? data.name : legacyFirstName,
  });
};

const normalizeError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasStorageRecommendationFields = (
  value: unknown
): value is Pick<CalculationResult, "storageEstimatedTB7d" | "storageRecommendedTB"> => {
  if (!isRecord(value)) return false;
  return (
    typeof value.storageEstimatedTB7d === "number" &&
    Number.isFinite(value.storageEstimatedTB7d) &&
    typeof value.storageRecommendedTB === "number" &&
    Number.isFinite(value.storageRecommendedTB)
  );
};

const isNtfyTestResult = (value: unknown): value is NtfyTestResult => {
  if (!isRecord(value) || typeof value.ok !== "boolean") return false;
  if (value.mode !== "stored_lead" && value.mode !== "synthetic") return false;

  if (value.ok) {
    if (value.ntfy_status !== "sent" && value.ntfy_status !== "skipped") {
      return false;
    }
    if (
      value.reason !== undefined &&
      value.reason !== "missing_config"
    ) {
      return false;
    }
    return true;
  }

  return typeof value.error === "string";
};

export default function AppShell({
  initialView = "home",
  formMode = "default",
  source,
  resultsKey,
  hasBonus = false,
  publicSiteSettings = DEFAULT_PUBLIC_SITE_SETTINGS,
}: {
  initialView?: AppView;
  formMode?: "default" | "newsletter";
  source?: string;
  resultsKey?: string;
  hasBonus?: boolean;
  publicSiteSettings?: PublicSiteSettings;
}) {
  const router = useRouter();
  const [storedLead, setStoredLead] = useState<StoredLead | null>(null);
  const [storedLeadLoaded, setStoredLeadLoaded] = useState(false);
  const [view, setView] = useState<AppView>(initialView);
  const [hasResolvedResultsView, setHasResolvedResultsView] = useState(
    initialView !== "results"
  );
  const [formData, setFormData] = useState<FormData | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [reportsRemaining, setReportsRemaining] = useState<number | null>(null);
  const [reportsLimit, setReportsLimit] = useState<number | null>(null);
  const [reportsWindowEndsAt, setReportsWindowEndsAt] = useState<number | null>(
    null
  );
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState(false);
  const [leadSendsEnabled, setLeadSendsEnabled] = useState<boolean>(() => {
    if (!IS_LOCAL_DEV) return true;
    return readPersistedLeadSendsEnabled() ?? false;
  });
  const [sourceParam, setSourceParam] = useState(() => source?.trim() ?? "");
  const [resolvedResultsKey, setResolvedResultsKey] = useState(
    () => resultsKey?.trim() ?? ""
  );
  const [hasBonusParam, setHasBonusParam] = useState<boolean>(
    hasBonus && publicSiteSettings.bonusEnabled
  );
  const nowMs = useSharedClockNowMs();
  const bonusEndsAt = useBonusEndsAt();
  const sourceForSubmission =
    sourceParam.toLowerCase() === "apply" || sourceParam.toLowerCase() === "newsletter"
      ? sourceParam.toLowerCase()
      : sourceParam;
  const formSource = sourceForSubmission || null;
  const effectiveFormMode: "default" | "newsletter" =
    formMode === "newsletter" || sourceParam.toLowerCase() === "newsletter"
      ? "newsletter"
      : "default";
  const analyticsContext = useMemo<FunnelContext>(
    () => buildFunnelContext(formSource, effectiveFormMode),
    [effectiveFormMode, formSource]
  );
  const shouldTrackView = initialView !== "results" || hasResolvedResultsView;
  const {
    effectiveReportsRemaining,
    effectiveReportsLoading,
    effectiveReportsError,
  } = useHomeDebugControls({
    reportsRemaining,
    reportsLoading,
    reportsError,
  });

  const setLeadSendsEnabledForDebug = useCallback((enabled: boolean) => {
    if (!IS_LOCAL_DEV) {
      console.warn(
        "[sshDebug] lead send toggles are available only in local development."
      );
      return;
    }

    setLeadSendsEnabled(enabled);

    try {
      localStorage.setItem(LEAD_SENDS_DEBUG_STORAGE_KEY, String(enabled));
    } catch {
      console.warn(
        "[sshDebug] Unable to persist lead send debug state in localStorage."
      );
    }
  }, []);

  const getLeadSendsStatus = useCallback((): LeadSendsStatus => {
    const persisted = readPersistedLeadSendsEnabled() !== null;
    return {
      enabled: IS_LOCAL_DEV ? leadSendsEnabled : true,
      environment: IS_LOCAL_DEV ? "development" : "production",
      persisted,
    };
  }, [leadSendsEnabled]);

  const getPostHogStatus = useCallback(
    (): PostHogDebugStatus => getPostHogDebugStatus(),
    []
  );

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (!IS_LOCAL_DEV) return;
    const persisted = readPersistedLeadSendsEnabled();
    if (persisted !== null) {
      setLeadSendsEnabled(persisted);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unregister = registerSshDebugMethods({
      leadSendsOn: () => {
        setLeadSendsEnabledForDebug(true);
        if (IS_LOCAL_DEV) {
          console.info(
            "[sshDebug] External lead sends enabled (EmailJS)."
          );
        }
      },
      leadSendsOff: () => {
        setLeadSendsEnabledForDebug(false);
        if (IS_LOCAL_DEV) {
          console.info(
            "[sshDebug] External lead sends disabled (EmailJS)."
          );
        }
      },
      leadSendsStatus: () => {
        const status = getLeadSendsStatus();
        console.info("[sshDebug] Lead send status:", status);
        return status;
      },
      ntfyTest: async () => {
        const latestLead = readStoredLead();
        const hasStoredLead = Boolean(latestLead?.formData?.email?.trim());
        const mode: NtfyTestMode = hasStoredLead ? "stored_lead" : "synthetic";

        const requestBody: NtfyTestRequestBody = hasStoredLead
          ? {
              mode,
              payload: {
                name: latestLead?.formData.name ?? "",
                email: latestLead?.formData.email ?? "",
                mobile: latestLead?.formData.mobile ?? "",
                tier: latestLead?.result.leadTier ?? "Nurture",
                score: latestLead?.result.leadScore ?? 0,
                source: formSource ?? "ssh_debug_stored",
              },
            }
          : { mode };

        try {
          const response = await fetch("/api/leads/ntfy-test", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          const responseData: unknown = await response.json().catch(() => null);

          if (isNtfyTestResult(responseData)) {
            if (response.ok && responseData.ok) {
              if (responseData.ntfy_status === "sent") {
                console.info("[sshDebug] ntfy test succeeded:", responseData);
              } else {
                console.warn("[sshDebug] ntfy test skipped:", responseData);
              }
            } else {
              console.error("[sshDebug] ntfy test failed:", responseData);
            }

            return responseData;
          }

          const fallbackError = isRecord(responseData)
            ? normalizeError(responseData.error)
            : `Unexpected response from /api/leads/ntfy-test (status ${response.status})`;

          const fallbackResult: NtfyTestResult = {
            ok: false,
            mode,
            error: fallbackError,
          };
          console.error("[sshDebug] ntfy test failed:", fallbackResult);
          return fallbackResult;
        } catch (error) {
          const failedResult: NtfyTestResult = {
            ok: false,
            mode,
            error: normalizeError(error),
          };
          console.error("[sshDebug] ntfy test failed:", failedResult);
          return failedResult;
        }
      },
      posthogOn: () => {
        setPostHogEnabledForDebug(true);
        if (IS_LOCAL_DEV) {
          console.info(
            "[sshDebug] PostHog analytics enabled in local development.",
            getPostHogStatus()
          );
        }
      },
      posthogOff: () => {
        setPostHogEnabledForDebug(false);
        if (IS_LOCAL_DEV) {
          console.info(
            "[sshDebug] PostHog analytics disabled in local development.",
            getPostHogStatus()
          );
        }
      },
      posthogStatus: () => {
        const status = getPostHogStatus();
        console.info("[sshDebug] PostHog status:", status);
        return status;
      },
    });

    return () => {
      unregister();
    };
  }, [
    formSource,
    getLeadSendsStatus,
    getPostHogStatus,
    setLeadSendsEnabledForDebug,
  ]);

  useEffect(() => {
    const sourceFromUrl = readSearchParam("source");
    const resultsKeyFromUrl = readSearchParam("r");
    const hasBonusFromUrl = readSearchParam(HAS_BONUS_QUERY_PARAM);

    setSourceParam(sourceFromUrl || source?.trim() || "");
    setResolvedResultsKey(resultsKeyFromUrl || resultsKey?.trim() || "");
    setHasBonusParam(
      publicSiteSettings.bonusEnabled && hasBonusFromUrl
        ? parseHasBonusQueryValue(hasBonusFromUrl)
        : publicSiteSettings.bonusEnabled && hasBonus
    );
  }, [hasBonus, publicSiteSettings.bonusEnabled, resultsKey, source]);

  useEffect(() => {
    if (!shouldTrackView) return;

    trackPageView(view, analyticsContext);

    if (view === "results") {
      trackFunnelOutcomeViewed("results", "results", analyticsContext);
    }
  }, [analyticsContext, shouldTrackView, view]);

  useEffect(() => {
    const lead = readStoredLead();
    setStoredLead(lead);
    setStoredLeadLoaded(true);
  }, []);

  useEffect(() => {
    if (!storedLeadLoaded) return;

    if (initialView !== "results") {
      if (storedLead) {
        const normalizedData = normalizeFormDataForApp(storedLead.formData);
        const resolvedResult = hasStorageRecommendationFields(storedLead.result)
          ? storedLead.result
          : estimateCameraPlan(normalizedData);

        writeStoredLead(normalizedData, resolvedResult);
        setFormData(normalizedData);
        setResult(resolvedResult);
      }
      return;
    }

    let isMounted = true;
    const showResults = (data: FormData, calculated?: CalculationResult) => {
      if (!isMounted) return;
      const normalizedData = normalizeFormDataForApp(data);
      const resolvedResult =
        calculated && hasStorageRecommendationFields(calculated)
          ? calculated
          : estimateCameraPlan(normalizedData);
      writeStoredLead(normalizedData, resolvedResult);
      setFormData(normalizedData);
      setResult(resolvedResult);
      setView("results");
      setHasResolvedResultsView(true);
    };

    const redirectToForm = () => {
      if (!isMounted) return;
      setView("form");
      setHasResolvedResultsView(true);
      router.replace("/form");
    };

    const resolveResults = async () => {
      const key = resolvedResultsKey;
      if (!key) {
        if (storedLead) {
          showResults(storedLead.formData, storedLead.result);
          return;
        }
        redirectToForm();
        return;
      }

      try {
        const response = await fetch(
          `/api/results-links?key=${encodeURIComponent(key)}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          redirectToForm();
          return;
        }

        const data = (await response.json().catch(() => null)) as
          | { formData?: FormData }
          | null;
        if (!data?.formData) {
          redirectToForm();
          return;
        }

        showResults(data.formData);
      } catch {
        redirectToForm();
      }
    };

    void resolveResults();

    return () => {
      isMounted = false;
    };
  }, [initialView, resolvedResultsKey, router, storedLead, storedLeadLoaded]);

  useEffect(() => {
    let isMounted = true;

    const fetchReportsRemaining = async () => {
      try {
        const response = await fetch("/api/reports-remaining", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch reports remaining");
        }
        const data = await response.json();
        const remaining = data?.remaining;
        const limit = data?.limit;
        const windowEndsAtRaw = data?.windowEndsAt;
        const parsedWindowEndsAt =
          typeof windowEndsAtRaw === "string"
            ? Date.parse(windowEndsAtRaw)
            : Number.NaN;
        if (
          typeof remaining !== "number" ||
          typeof limit !== "number" ||
          Number.isNaN(parsedWindowEndsAt)
        ) {
          throw new Error("Invalid reports remaining response");
        }
        if (isMounted) {
          setReportsRemaining(remaining);
          setReportsLimit(limit);
          setReportsWindowEndsAt(parsedWindowEndsAt);
          setReportsError(false);
        }
      } catch {
        if (isMounted) {
          setReportsRemaining(null);
          setReportsLimit(null);
          setReportsWindowEndsAt(null);
          setReportsError(true);
        }
      } finally {
        if (isMounted) {
          setReportsLoading(false);
        }
      }
    };

    fetchReportsRemaining();

    return () => {
      isMounted = false;
    };
  }, []);

  const effectiveReportsLimit = reportsLimit;
  const effectiveReportsWindowEndsAt = reportsWindowEndsAt;
  const hasExistingPlan = Boolean(storedLead);
  const { cta: homeCta, scarcity: homeScarcity } = useHomeCtaAndScarcity({
    reportsRemaining: effectiveReportsRemaining,
    reportsLimit: effectiveReportsLimit,
    reportsWindowEndsAt: effectiveReportsWindowEndsAt,
    reportsLoading: effectiveReportsLoading,
    reportsError: effectiveReportsError,
    hasExistingPlan,
    nowMs,
    bonusEnabled: publicSiteSettings.bonusEnabled,
    bonusEndsAt,
  });
  const homeCtaScarcityState = resolveHomeCtaScarcityState({
    hasExistingPlan,
    reportsLoading: effectiveReportsLoading,
    reportsError: effectiveReportsError,
    reportsRemaining: effectiveReportsRemaining,
  });
  const isResultsLoading = view === "results" && (!formData || !result);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const clearLogs = async () => {
      const lead = readStoredLead();
      const email = lead?.formData?.email?.trim();

      if (email) {
        try {
          const response = await fetch("/api/leads/clear", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              error: "Unknown error",
            }));
            console.error("Failed to clear lead from Supabase:", errorData);
          }
        } catch (error) {
          console.error("Failed to clear lead from Supabase:", error);
        }
      }

      sessionStorage.removeItem(STORAGE_KEY);
      setStoredLead(null);
      setFormData(null);
      setResult(null);
      setView("home");
      router.push("/");
    };

    window.clearLogs = clearLogs;
    window["clear logs"] = clearLogs;

    return () => {
      delete window.clearLogs;
      delete window["clear logs"];
    };
  }, [router]);

  const createDbResultsShareKey = async (data: FormData): Promise<string | null> => {
    const payload = createShareableResultsPayload(data);
    if (!payload) return null;

    try {
      const response = await fetch("/api/results-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload,
          contact: {
            name: data.name,
            email: data.email,
            mobile: data.mobile,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Unknown error",
        }));
        console.error("Failed to create DB results link:", errorData);
        return null;
      }

      const responseData = (await response.json().catch(() => null)) as
        | { key?: string }
        | null;
      const key = typeof responseData?.key === "string" ? responseData.key : "";
      return key.trim() || null;
    } catch (error) {
      console.error("Failed to create DB results link:", error);
      return null;
    }
  };

  const handleFormComplete = async (data: FormData) => {
    const normalizedData = normalizeFormDataForApp(data);
    const calcResult = estimateCameraPlan(normalizedData);
    setFormData(normalizedData);
    setResult(calcResult);
    writeStoredLead(normalizedData, calcResult);

    trackLeadGenerated(normalizedData, calcResult, analyticsContext);

    const submissionSource =
      formSource ??
      (effectiveFormMode === "newsletter" ? "newsletter" : undefined);

    const shouldSendExternalLeads = !IS_LOCAL_DEV || leadSendsEnabled;
    if (!shouldSendExternalLeads) {
      console.info(
        "[sshDebug] Skipping lead-journey email sends in local dev. Run window.sshDebug.leadSendsOn() to enable."
      );
    }

    await Promise.all([
      submitLeadToSupabase(
        normalizedData,
        calcResult,
        {
          source: submissionSource,
          allowExternalEmails: shouldSendExternalLeads,
          hasBonus: hasBonusParam,
        },
      ),
    ]);

    if (formSource === "apply") {
      router.push("/apply-success");
      return;
    }

    if (effectiveFormMode === "newsletter") {
      router.push("/schedule-call");
      return;
    }

    const resultsParams = new URLSearchParams();
    const shareKey = await createDbResultsShareKey(normalizedData);
    if (shareKey) {
      resultsParams.set("r", shareKey);
    }
    if (formSource) {
      resultsParams.set("source", formSource);
    }
    const resultsPath = resultsParams.toString()
      ? `/results?${resultsParams.toString()}`
      : "/results";

    router.push(resultsPath);
  };

  const handleNavigation = (page: string) => {
    if (page === "newsletter") {
      router.push("/newsletter");
      return;
    }

    if (page === "blog") {
      router.push("/blog");
      return;
    }

    const nextView = page as AppView;

    if (nextView === "home") {
      router.push("/");
      return;
    }

    if (nextView === "form") {
      router.push("/form");
      return;
    }

    if (nextView === "results") {
      router.push("/results");
    }
  };

  const handleHomePrimaryCtaClick = (
    target: HomeCtaTarget,
    location: HomeCtaLocation
  ) => {
    const hasBonus =
      publicSiteSettings.bonusEnabled &&
      target === "form" &&
      !homeScarcity.bonusExpired;

    trackFunnelCtaClicked(
      "home",
      {
        cta_id: HOME_CTA_ID_BY_LOCATION[location],
        cta_location: location,
        target_path: HOME_CTA_TARGET_PATH[target],
        has_bonus: target === "form" ? hasBonus : undefined,
        scarcity_state: homeCtaScarcityState,
        reports_remaining: effectiveReportsRemaining ?? undefined,
        reports_limit: effectiveReportsLimit ?? undefined,
        cta_variant: HOME_CTA_VARIANT,
      },
      analyticsContext
    );

    if (target === "form") {
      router.push(buildHomeFormPath(hasBonus));
      return;
    }

    handleNavigation(target);
  };

  return (
    <div className="font-sans text-[#2D3748]">
      {view !== "form" && (
        <Navbar
          onNavigate={handleNavigation}
          onPrimaryCtaClick={handleHomePrimaryCtaClick}
          hideCta={view === "results" || (homeScarcity.soldOut && !hasExistingPlan)}
          hasExistingPlan={hasExistingPlan}
          centerLogo={view === "results"}
          visibilityMode={view === "home" ? "home_hero_reveal" : "default"}
          heroSectionId="home-hero"
        />
      )}

      {view === "home" && (
        <HomePage
          onPrimaryCtaClick={handleHomePrimaryCtaClick}
          cta={homeCta}
          scarcity={homeScarcity}
        />
      )}

      {view === "form" && (
        <WizardForm
          onComplete={handleFormComplete}
          mode={effectiveFormMode}
          analyticsContext={analyticsContext}
          submitLabel={
            formSource === "apply" ? "SUBMIT MY APPLICATION" : undefined
          }
          submittingLabel={
            formSource === "apply" ? "Submitting your application..." : undefined
          }
        />
      )}

      {view === "results" && formData && result && (
        <ResultsPage
          key={formData.email.trim().toLowerCase() || "unknown"}
          result={result}
          data={formData}
          testimonialJourneyEnabled={publicSiteSettings.testimonialJourneyEnabled}
        />
      )}

      {isResultsLoading && <div className="min-h-screen bg-white" />}

      {view !== "form" && view !== "results" && <Footer />}
    </div>
  );
}
