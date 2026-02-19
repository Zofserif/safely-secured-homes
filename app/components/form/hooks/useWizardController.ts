import { useState } from "react";
import {
  trackFormStepCompleted,
  trackFormSubmissionStarted,
} from "../../../lib/analytics";
import {
  createInitialFormData,
  SAFETY_SECTIONS,
} from "../constants";
import type {
  FieldErrors,
  SafetyField,
  WizardController,
  WizardControllerArgs,
} from "../types";

export const useWizardController = ({
  mode,
  onComplete,
  analyticsContext,
}: WizardControllerArgs): WizardController => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(() => createInitialFormData(mode));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [safetySliderDrafts, setSafetySliderDrafts] = useState<
    Partial<Record<SafetyField, number>>
  >({});
  const [naSafetySelections, setNaSafetySelections] = useState<
    Partial<Record<SafetyField, boolean>>
  >({});

  const updateField = (field: keyof typeof formData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  };

  const getArrayFieldValues = (field: keyof typeof formData): string[] => {
    const value = formData[field];
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string");
  };

  const toggleArrayField = (field: keyof typeof formData, value: string) => {
    const current = getArrayFieldValues(field);
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    setFormData((prev) => ({ ...prev, [field]: updated }));
  };

  const nextStep = () => {
    trackFormStepCompleted(step, analyticsContext);
    setStep((current) => current + 1);
  };

  const prevStep = () => setStep((current) => current - 1);

  const validateContactInfo = () => {
    const nextErrors: FieldErrors = {};
    const mobileRegex = /^09\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!mobileRegex.test(formData.mobile)) {
      nextErrors.mobile = "Please enter a valid PH mobile number (09xxxxxxxxx)";
    }

    if (!emailRegex.test(formData.email)) {
      nextErrors.email = "Please enter a valid email address";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitFinal = () => {
    if (!validateContactInfo()) return;

    setIsSubmitting(true);
    trackFormStepCompleted(step, analyticsContext, { legacy: false });
    trackFormSubmissionStarted(formData, analyticsContext);
    onComplete(formData);
  };

  const clearSafetySliderDraft = (field: SafetyField) => {
    setSafetySliderDrafts((prev) => {
      if (typeof prev[field] !== "number") return prev;
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const commitSafetySliderValue = (field: SafetyField, rawValue: number) => {
    if (!Number.isFinite(rawValue)) return;
    const clamped = Math.min(5, Math.max(0, rawValue));
    const snapped = Math.round(clamped);
    setSafetySliderDrafts((prev) => ({ ...prev, [field]: clamped }));
    updateField(field, 5 - snapped);
  };

  const toggleNaSafetySelection = (field: SafetyField) => {
    const nextSelected = !Boolean(naSafetySelections[field]);

    setNaSafetySelections((prev) => {
      if (nextSelected) {
        return { ...prev, [field]: true };
      }

      const updated = { ...prev };
      delete updated[field];
      return updated;
    });

    clearSafetySliderDraft(field);
    updateField(field, nextSelected ? 5 : null);
  };

  const safetyFields = SAFETY_SECTIONS.map((section) => section.id);
  const ratedSafetyCount = safetyFields.filter(
    (field) => typeof formData[field] === "number",
  ).length;
  const safetyCompletionPct = Math.round(
    (ratedSafetyCount / safetyFields.length) * 100,
  );
  const isSafetyComplete = safetyFields.every(
    (field) => typeof formData[field] === "number",
  );

  return {
    step,
    isSubmitting,
    formData,
    errors,
    safetySliderDrafts,
    naSafetySelections,
    safetyFields,
    ratedSafetyCount,
    safetyCompletionPct,
    isSafetyComplete,
    updateField,
    getArrayFieldValues,
    toggleArrayField,
    nextStep,
    prevStep,
    submitFinal,
    commitSafetySliderValue,
    toggleNaSafetySelection,
  };
};
