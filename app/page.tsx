"use client";
import React, { useState, useEffect } from "react";
import { initPostHog } from "./posthog";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./components/home/HomePage";
import WizardForm from "./components/form/WizardForm";
import ResultsPage from "./components/results/ResultsPage";
import { FormData, CalculationResult } from "./lib/types";
import { estimateCameraPlan } from "./lib/calculations";
import {
  submitLeadToSupabase,
  submitToEmail,
  submitToFormspree,
} from "./lib/leads";
import {
  identifyLead,
  trackLeadGenerated,
  trackPageView,
  type AppView,
} from "./lib/analytics";

// --- Main App ---

export default function App() {
  const [view, setView] = useState<AppView>("home");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Init analytics once
  useEffect(() => {
    initPostHog();
  }, []);

  // Track page view changes manually since this is a single-page simulation
  useEffect(() => {
    trackPageView(view);
  }, [view]);

  const handleFormComplete = async (data: FormData) => {
    // 1. Calculate locally
    const calcResult = estimateCameraPlan(data);
    setFormData(data);
    setResult(calcResult);

    // Track the generated lead
    identifyLead(data);
    trackLeadGenerated(data, calcResult);

    // 2. Submit to email (Formspree) AND Supabase (if configured)
    await Promise.all([
      submitToEmail(data, calcResult),
      submitToFormspree(data, calcResult),
      submitLeadToSupabase(data, calcResult),
    ]);

    // 3. Navigate
    setView("results");
  };

  const handleNavigation = (page: string) => {
    setView(page as AppView);
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
