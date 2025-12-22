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
  const [view, setView] = useState<AppView>(initialView);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    trackPageView(view);
  }, [view]);

  useEffect(() => {
    const stored = readStoredLead();
    if (stored?.formData && stored?.result) {
      setFormData(stored.formData);
      setResult(stored.result);
    }

    if (initialView === "results" && !stored) {
      setView("form");
      router.replace("/form");
    }
  }, [initialView, router]);

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
      {view !== "form" && <Navbar onNavigate={handleNavigation} />}

      {view === "home" && <HomePage onNavigate={handleNavigation} />}

      {view === "form" && <WizardForm onComplete={handleFormComplete} />}

      {view === "results" && formData && result && (
        <ResultsPage result={result} data={formData} />
      )}

      {view !== "form" && <Footer />}
    </div>
  );
}
