"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initPostHog } from "../posthog";

import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
import HomePage from "./home/HomePage";
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
  const [reportsWindowEndsAt, setReportsWindowEndsAt] = useState<number | null>(null);

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

    const getThreeDayWindowEnd = () =>
      Date.now() + 3 * 24 * 60 * 60 * 1000;

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
        const parsedWindowEndsAt =
          typeof data?.windowEndsAt === "string"
            ? Date.parse(data.windowEndsAt)
            : Number.NaN;
        const safeWindowEndsAt = Number.isNaN(parsedWindowEndsAt)
          ? getThreeDayWindowEnd()
          : parsedWindowEndsAt;
        if (isMounted) {
          setReportsRemaining(remaining);
          setReportsWindowEndsAt(safeWindowEndsAt);
          setReportsError(false);
        }
      } catch (error) {
        if (isMounted) {
          setReportsRemaining(null);
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

  const reportsSoldOut = reportsRemaining !== null && reportsRemaining <= 0;

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
          hideCta={reportsSoldOut || view === "results"}
        />
      )}

      {view === "home" && (
        <HomePage
          onNavigate={handleNavigation}
          reportsRemaining={reportsRemaining}
          reportsLoading={reportsLoading}
          reportsError={reportsError}
          windowEndsAt={reportsWindowEndsAt}
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
