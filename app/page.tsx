/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import posthog from './posthog';
import { sendLeadEmail } from './lib/email';


import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './components/home/HomePage';
import WizardForm from './components/form/WizardForm';
import ResultsPage from './components/results/ResultsPage';
import { FormData, CalculationResult } from './lib/types';
import { estimateCameraPlan } from './lib/calculations';
import { send } from '@emailjs/browser';

// --- COLORS CONSTANTS (For Reference) ---
// Primary: #0E79B2
// Secondary: #BEE9E8
// Success: #2E8B57
// Info: #63B3ED
// Warning: #FFB300
// Danger: #E53E3E
// Light: #F7FAFC
// Dark: #2D3748

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

    await sendLeadEmail(templateParams);
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