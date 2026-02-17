"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { initPostHog } from "../posthog";

import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
import HomePage, { resetBonusTimerForDebug } from "./home/HomePage";
import WizardForm from "./form/WizardForm";
import ResultsPage from "./results/ResultsPage";
import { FormData, CalculationResult } from "../lib/types";
import { estimateCameraPlan } from "../lib/calculations";
import {
  submitLeadToSupabase,
  submitToEmail,
  submitToFormspree,
} from "../lib/leads";
import {
  buildFunnelContext,
  trackLeadGenerated,
  trackFunnelOutcomeViewed,
  trackPageView,
  type AppView,
  type FunnelContext,
} from "../lib/analytics";
import { parseResultsToken } from "../lib/resultsLink";
import { createShareableResultsPayload } from "../lib/resultsShare";

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

const STORAGE_KEY = "ssh_lead_state";

const readSearchParam = (key: string) => {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key)?.trim() ?? "";
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

export default function AppShell({
  initialView = "home",
  formMode = "default",
  source,
  resultsKey,
}: {
  initialView?: AppView;
  formMode?: "default" | "newsletter";
  source?: string;
  resultsKey?: string;
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
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState(false);
  const [debugReportsRemaining, setDebugReportsRemaining] = useState<
    number | null | undefined
  >(undefined);
  const [debugReportsLoading, setDebugReportsLoading] = useState<
    boolean | undefined
  >(undefined);
  const [debugReportsError, setDebugReportsError] = useState<
    boolean | undefined
  >(undefined);
  const [sourceParam, setSourceParam] = useState(() => source?.trim() ?? "");
  const [resolvedResultsKey, setResolvedResultsKey] = useState(
    () => resultsKey?.trim() ?? ""
  );
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

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    const sourceFromUrl = readSearchParam("source");
    const resultsKeyFromUrl = readSearchParam("r");

    setSourceParam(sourceFromUrl || source?.trim() || "");
    setResolvedResultsKey(resultsKeyFromUrl || resultsKey?.trim() || "");
  }, [resultsKey, source]);

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
        setFormData(storedLead.formData);
        setResult(storedLead.result);
      }
      return;
    }

    let isMounted = true;
    const showResults = (data: FormData, calculated?: CalculationResult) => {
      if (!isMounted) return;
      setFormData(data);
      setResult(calculated ?? estimateCameraPlan(data));
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

      // Backward compatibility for already-issued URL payload links.
      const legacyTokenData = parseResultsToken(key);
      if (legacyTokenData) {
        showResults(legacyTokenData);
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
        if (typeof remaining !== "number") {
          throw new Error("Invalid reports remaining response");
        }
        if (isMounted) {
          setReportsRemaining(remaining);
          setReportsError(false);
        }
    } catch {
        if (isMounted) {
          setReportsRemaining(null);
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleDebugReports = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | {
            remaining?: number | null;
            loading?: boolean;
            error?: boolean;
            reset?: boolean;
          }
        | undefined;

      if (!detail) return;

      if (detail.reset) {
        setDebugReportsRemaining(undefined);
        setDebugReportsLoading(undefined);
        setDebugReportsError(undefined);
        return;
      }

      if ("remaining" in detail) {
        setDebugReportsRemaining(detail.remaining);
      }
      if ("loading" in detail) {
        setDebugReportsLoading(detail.loading);
      }
      if ("error" in detail) {
        setDebugReportsError(detail.error);
      }
    };

    window.addEventListener("ssh-debug-reports", handleDebugReports);
    return () => {
      window.removeEventListener("ssh-debug-reports", handleDebugReports);
    };
  }, []);

  const effectiveReportsRemaining =
    debugReportsRemaining !== undefined
      ? debugReportsRemaining
      : reportsRemaining;
  const effectiveReportsLoading =
    debugReportsLoading !== undefined ? debugReportsLoading : reportsLoading;
  const effectiveReportsError =
    debugReportsError !== undefined ? debugReportsError : reportsError;
  const reportsSoldOut =
    effectiveReportsRemaining !== null && effectiveReportsRemaining <= 0;
  const hasExistingPlan = Boolean(storedLead);

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
      localStorage.removeItem("ssh_bonus_started_at");
      resetBonusTimerForDebug();

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
            first_name: data.first_name,
            last_name: data.last_name,
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
    const calcResult = estimateCameraPlan(data);
    setFormData(data);
    setResult(calcResult);
    writeStoredLead(data, calcResult);

    trackLeadGenerated(data, calcResult, analyticsContext);

    const submissionSource =
      formSource ??
      (effectiveFormMode === "newsletter" ? "newsletter" : undefined);

    const submissions = [
      submitToFormspree(data, calcResult, submissionSource),
      submitLeadToSupabase(data, calcResult, submissionSource),
    ];

    if (effectiveFormMode !== "newsletter") {
      submissions.push(submitToEmail(data, calcResult, submissionSource));
    }

    await Promise.all(submissions);

    if (formSource === "apply") {
      router.push("/apply-success");
      return;
    }

    if (effectiveFormMode === "newsletter") {
      router.push("/schedule-call");
      return;
    }

    const resultsParams = new URLSearchParams();
    const shareKey = await createDbResultsShareKey(data);
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

  return (
    <div className="font-sans text-[#2D3748]">
      {view !== "form" && (
        <Navbar
          onNavigate={handleNavigation}
          hideCta={view === "results" || (reportsSoldOut && !hasExistingPlan)}
          hasExistingPlan={hasExistingPlan}
        />
      )}

      {view === "home" && (
        <HomePage
          onNavigate={handleNavigation}
          reportsRemaining={effectiveReportsRemaining}
          reportsLoading={effectiveReportsLoading}
          reportsError={effectiveReportsError}
          hasExistingPlan={hasExistingPlan}
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
        <ResultsPage result={result} data={formData} />
      )}

      {view !== "form" && <Footer />}
    </div>
  );
}
