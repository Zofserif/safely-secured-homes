"use client";

import { useEffect, useState } from "react";
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
  identifyLead,
  trackLeadGenerated,
  trackPageView,
  type AppView,
} from "../lib/analytics";

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
}: {
  initialView?: AppView;
}) {
  const router = useRouter();
  const [storedLead, setStoredLead] = useState<StoredLead | null>(null);
  const [storedLeadLoaded, setStoredLeadLoaded] = useState(false);
  const [view, setView] = useState<AppView>(() =>
    initialView === "results" ? "form" : initialView
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

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    trackPageView(view);
  }, [view]);

  useEffect(() => {
    const lead = readStoredLead();
    setStoredLead(lead);
    setStoredLeadLoaded(true);
  }, []);

  useEffect(() => {
    if (!storedLeadLoaded) return;

    if (storedLead) {
      setFormData(storedLead.formData);
      setResult(storedLead.result);
      if (initialView === "results") {
        setView("results");
      }
      return;
    }

    if (initialView === "results") {
      setView("form");
      router.replace("/form");
    }
  }, [initialView, router, storedLead, storedLeadLoaded]);

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

  const handleFormComplete = async (data: FormData) => {
    const calcResult = estimateCameraPlan(data);
    setFormData(data);
    setResult(calcResult);
    writeStoredLead(data, calcResult);

    identifyLead(data);
    trackLeadGenerated(data, calcResult);

    await Promise.all([
      submitToEmail(data, calcResult),
      submitToFormspree(data, calcResult),
      submitLeadToSupabase(data, calcResult),
    ]);

    setView("results");
    router.push("/results");
  };

  const handleNavigation = (page: string) => {
    if (page === "newsletter") {
      router.push("/newsletter");
      return;
    }

    const nextView = page as AppView;
    setView(nextView);

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

      {view === "form" && <WizardForm onComplete={handleFormComplete} />}

      {view === "results" && formData && result && (
        <ResultsPage result={result} data={formData} />
      )}

      {view !== "form" && <Footer />}
    </div>
  );
}
