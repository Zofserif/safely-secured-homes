"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendLeadEmail } from './lib/email';

// import posthog from 'posthog-js'; // Commented out for preview environment
// import emailjs from '@emailjs/browser'; // Uncomment this in your local project

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './components/home/HomePage';
import WizardForm from './components/form/WizardForm';
import ResultsPage from './components/results/ResultsPage';
import { FormData, CalculationResult } from './lib/types';
import { estimateCameraPlan } from './lib/calculations';

// --- CONFIGURATION ---
// REPLACE THESE with your EmailJS credentials
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";


const POSTHOG_KEY = "phc_REPLACE_WITH_YOUR_ACTUAL_KEY"; 
const POSTHOG_HOST = "https://us.i.posthog.com"; 

// --- COLORS CONSTANTS (For Reference) ---
// Primary: #0E79B2
// Secondary: #BEE9E8
// Success: #2E8B57
// Info: #63B3ED
// Warning: #FFB300
// Danger: #E53E3E
// Light: #F7FAFC
// Dark: #2D3748

// --- MOCK POSTHOG (For Preview Only) ---
const posthog = {
  init: (key: string, config: any) => console.log("[PostHog Mock] Initialized", key),
  capture: (event: string, props?: any) => console.log(`[PostHog Mock] Captured: ${event}`, props),
  identify: (id: string, props?: any) => console.log(`[PostHog Mock] Identified: ${id}`, props),
  debug: () => console.log("[PostHog Mock] Debug mode enabled")
};

// --- MOCK EMAILJS (For Preview Only) ---
// This mimics the structure of the real emailjs library
const emailjs = {
  send: async (serviceId: string, templateId: string, templateParams: any, publicKey: string) => {
    console.log("[EmailJS Mock] Sending email:", { serviceId, templateId, templateParams });
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }
};


// --- API Interactions ---

const submitToEmail = async (data: FormData, result: CalculationResult) => {
  if (EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID") {
    console.warn("EmailJS submission skipped: No credentials configured. Please set EMAILJS_SERVICE_ID, TEMPLATE_ID, and PUBLIC_KEY.");
    console.log("Mock Email Data:", {
      to_email: data.email,
      firstname: data.first_name,
      // ... other data
    });
    return;
  }

  try {
    const templateParams = {
      to_email: data.email,
      firstname: data.first_name,
      last_name: data.last_name,
      mobile: data.mobile,
      lead_tier: result.leadTier,
      camera_count: result.cameraCount,
      property_type: data.property_type,
      recommendations: result.recommendations.join(", ")
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );
    console.log("Email sent successfully via EmailJS");
  } catch (error) {
    console.error("Email submission failed:", error);
  }
};

const submitLeadToSupabase = async (data: FormData, result: CalculationResult) => {
  return new Promise(resolve => setTimeout(resolve, 800)); 
};


// --- Main App ---

export default function App() {
  const [view, setView] = useState<'home' | 'form' | 'results' | 'thankyou'>('home');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Initialize PostHog
  useEffect(() => {
    // Only init if window is available (client-side)
    if (typeof window !== 'undefined') {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        // person_profiles: 'identified_only', // Removed for mock compatibility
        // loaded: (posthog) => {
        //   if (process.env.NODE_ENV === 'development') posthog.debug();
        // }
      });
      // Call debug manually for mock
      posthog.debug();
    }
  }, []);

  // Track page view changes manually since this is a single-page simulation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      posthog.capture('$pageview', { path: `/${view}` });
    }
  }, [view]);

  const handleFormComplete = async (data: FormData) => {
    // 1. Calculate locally
    const calcResult = estimateCameraPlan(data);
    setFormData(data);
    setResult(calcResult);

    // Track the generated lead
    posthog.identify(data.email, { name: data.first_name, phone: data.mobile }); // Using first_name here as a simple identifier for now
    posthog.capture('lead_generated', {
        tier: calcResult.leadTier,
        score: calcResult.leadScore,
        camera_count: calcResult.cameraCount,
        property_type: data.property_type
    });

    // 2. Submit to email (Formspree) AND Supabase (if configured)
    await Promise.all([
      submitToEmail(data, calcResult),
      submitLeadToSupabase(data, calcResult)
    ]);

    // 3. Navigate
    setView('results');
  };

  const handleNavigation = (page: string) => {
    setView(page as 'home' | 'form' | 'results' | 'thankyou');
  };

  return (
    <div className="font-sans text-[#2D3748]">
      {view !== 'form' && <Navbar onNavigate={handleNavigation} />}
      
      {view === 'home' && <HomePage onNavigate={handleNavigation} />}
      
      {view === 'form' && <WizardForm onComplete={handleFormComplete} />}
      
      {view === 'results' && formData && result && (
        <ResultsPage result={result} data={formData} />
      )}

      {view !== 'form' && <Footer />}
    </div>
  );
}