/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import posthog from "./posthog";
import { sendLeadEmail } from "./lib/email";
import { supabase } from "./lib/supabaseClient";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./components/home/HomePage";
import WizardForm from "./components/form/WizardForm";
import ResultsPage from "./components/results/ResultsPage";
import { FormData, CalculationResult } from "./lib/types";
import { estimateCameraPlan } from "./lib/calculations";
import { send } from "@emailjs/browser";

// --- COLORS CONSTANTS (For Reference) ---
// Primary: #0E79B2
// Secondary: #BEE9E8
// Success: #2E8B57
// Info: #63B3ED
// Warning: #FFB300
// Danger: #E53E3E
// Light: #F7FAFC
// Dark: #2D3748

const FORMSPREE_ENDPOINT = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;

// --- API Interactions ---
// Submit lead data to EmailJS
const submitToEmail = async (data: FormData, result: CalculationResult) => {
  try {
    const templateParams = {
      to_email: data.email,
      firstname: data.first_name,
      last_name: data.last_name,
      mobile: data.mobile,
      lead_tier: result.leadTier,
      camera_count: result.cameraCount,
      property_type: data.property_type,
      recommendations: result.recommendations.join(", "),
    };

    await sendLeadEmail(templateParams);
    console.log("Email sent successfully via EmailJS");
  } catch (error) {
    console.error("Email submission failed:", error);
  }
};

// Submit lead data to Formspree
const submitToFormspree = async (data: FormData, result: CalculationResult) => {
  // Construct the payload with all form data and calculated results
  const payload = {
    ...data,
    // Add special Formspree subject field
    _subject: `New Lead: ${data.first_name} ${data.last_name} [${result.leadTier}]`,
    // Include calculated insights
    summary_camera_count: result.cameraCount,
    summary_nvr_channel: result.nvrChannel,
    summary_lead_score: result.leadScore,
    summary_lead_tier: result.leadTier,
    summary_recommendations: result.recommendations.join(", "),
  };

  console.log("Attempting to send data to Formspree...", payload);

  if (!FORMSPREE_ENDPOINT) {
    console.warn(
      "⚠️ FORMSPREE_ENDPOINT is not configured. Please set NEXT_PUBLIC_FORMSPREE_ENDPOINT in your environment variables."
    );
    return;
  }

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("✅ Formspree submission successful!");
    } else {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error("❌ Formspree submission failed:", errorData);

      // If using the placeholder URL, warn the user
      if (FORMSPREE_ENDPOINT.includes("YOUR_FORMSPREE_ID")) {
        console.warn(
          "⚠️ It looks like you're using the placeholder Formspree URL. Please update FORMSPREE_ENDPOINT in the configuration."
        );
      }
    }
  } catch (error) {
    console.error("❌ Network error during Formspree submission:", error);
  }
};

// Submit lead data to Supabase
const submitLeadToSupabase = async (
  data: FormData,
  result: CalculationResult
) => {
  const { error } = await supabase.from("leads").insert([
    {
      email: data.email,
      name: `${data.first_name} ${data.last_name}`,
      tier: result.leadTier,
      score: result.leadScore,
      camera_count: result.cameraCount,
      payload: data,
    },
  ]);

  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Lead saved to Supabase");
  }
  return new Promise((resolve) => setTimeout(resolve, 800));
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<"home" | "form" | "results" | "thankyou">(
    "home"
  );
  const [formData, setFormData] = useState<FormData | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Track page view changes manually since this is a single-page simulation
  useEffect(() => {
    if (typeof window !== "undefined") {
      posthog.capture("$pageview", { path: `/${view}` });
    }
  }, [view]);

  const handleFormComplete = async (data: FormData) => {
    // 1. Calculate locally
    const calcResult = estimateCameraPlan(data);
    setFormData(data);
    setResult(calcResult);

    // Track the generated lead
    posthog.identify(data.email, { name: data.first_name, phone: data.mobile }); // Using first_name here as a simple identifier for now
    posthog.capture("lead_generated", {
      tier: calcResult.leadTier,
      score: calcResult.leadScore,
      camera_count: calcResult.cameraCount,
      property_type: data.property_type,
    });

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
    setView(page as "home" | "form" | "results" | "thankyou");
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
