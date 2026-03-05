import { useState } from "react";
import {
  trackFormStepCompleted,
  trackFormSubmissionStarted,
} from "../../../lib/analytics";
import {
  deriveFirstNameFromEmail,
  normalizeFirstName,
} from "../../../lib/contactName";
import {
  createInitialFormData,
  SAFETY_CATEGORIES,
} from "../constants";
import { FORM_STEPS } from "../../../lib/formSteps";
import { clampSafetyScore } from "../../../lib/safetyScale.js";
import type {
  FieldErrors,
  SafetyCategoryId,
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
    Partial<Record<SafetyCategoryId, number>>
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
  const goToStep = (stepIndex: number) => {
    const roundedStep = Math.round(stepIndex);
    const minStep = 0;
    const maxStep = FORM_STEPS.length - 1;
    const clampedStep = Math.min(maxStep, Math.max(minStep, roundedStep));
    setStep(clampedStep);
  };

  const validateContactInfo = () => {
    const nextErrors: FieldErrors = {};
    const mobileRegex = /^09\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = formData.email.trim();
    const normalizedMobile = formData.mobile.trim();

    if (normalizedMobile && !mobileRegex.test(normalizedMobile)) {
      nextErrors.mobile = "Please enter a valid PH mobile number (09xxxxxxxxx)";
    }

    if (!emailRegex.test(normalizedEmail)) {
      nextErrors.email = "Please enter a valid email address";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitFinal = () => {
    if (!validateContactInfo()) return;

    const normalizedEmail = formData.email.trim();
    const normalizedMobile = formData.mobile.trim();
    const normalizedFirstName = normalizeFirstName(formData.first_name).slice(0, 50);
    const derivedFirstName = deriveFirstNameFromEmail(normalizedEmail).slice(0, 50);
    const normalizedData = {
      ...formData,
      email: normalizedEmail,
      mobile: normalizedMobile,
      first_name: normalizedFirstName || derivedFirstName,
    };

    setIsSubmitting(true);
    trackFormStepCompleted(step, analyticsContext, { legacy: false });
    trackFormSubmissionStarted(normalizedData, analyticsContext);
    onComplete(normalizedData);
  };

  const commitSafetyCategorySliderValue = (
    categoryId: SafetyCategoryId,
    rawValue: number
  ) => {
    if (!Number.isFinite(rawValue)) return;

    const category = SAFETY_CATEGORIES.find((item) => item.id === categoryId);
    if (!category) return;

    const clamped = clampSafetyScore(rawValue);

    setSafetySliderDrafts((prev) => ({
      ...prev,
      [categoryId]: clamped,
    }));

    setFormData((prev) => {
      const updated = { ...prev };
      for (const field of category.legacyFields) {
        updated[field] = clamped;
      }
      return updated;
    });
  };

  const ratedSafetyCount = SAFETY_CATEGORIES.filter((category) =>
    category.legacyFields.every((field) => typeof formData[field] === "number")
  ).length;
  const isSafetyComplete = ratedSafetyCount === SAFETY_CATEGORIES.length;

  return {
    step,
    isSubmitting,
    formData,
    errors,
    safetySliderDrafts,
    isSafetyComplete,
    updateField,
    getArrayFieldValues,
    toggleArrayField,
    nextStep,
    prevStep,
    goToStep,
    submitFinal,
    commitSafetyCategorySliderValue,
  };
};
