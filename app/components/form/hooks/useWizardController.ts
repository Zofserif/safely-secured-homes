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

const clampStepIndex = (value: number) =>
  Math.min(FORM_STEPS.length - 1, Math.max(0, value));

const findStepIndex = (stepId: (typeof FORM_STEPS)[number]["id"]) =>
  FORM_STEPS.findIndex((step) => step.id === stepId);

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

  const nextStep = () => {
    trackFormStepCompleted(step, analyticsContext);
    setStep((current) => clampStepIndex(current + 1));
  };

  const prevStep = () =>
    setStep((current) => {
      const currentStepId = FORM_STEPS[current]?.id;
      if (currentStepId === "squeeze" || currentStepId === "contact_details") {
        const goalObstacleOtherStepIndex = findStepIndex("goal_obstacle_other");
        if (goalObstacleOtherStepIndex !== -1) {
          return goalObstacleOtherStepIndex;
        }
      }

      return clampStepIndex(current - 1);
    });

  const goToStep = (stepIndex: number) => {
    const roundedStep = Math.round(stepIndex);
    setStep(clampStepIndex(roundedStep));
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
    const normalizedName = normalizeFirstName(formData.name).slice(0, 50);
    const derivedName = deriveFirstNameFromEmail(normalizedEmail).slice(0, 50);
    const normalizedData = {
      ...formData,
      email: normalizedEmail,
      mobile: normalizedMobile,
      name: normalizedName || derivedName,
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
      updated[category.field] = clamped;
      return updated;
    });
  };

  const ratedSafetyCount = SAFETY_CATEGORIES.filter((category) =>
    typeof formData[category.field] === "number"
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
    nextStep,
    prevStep,
    goToStep,
    submitFinal,
    commitSafetyCategorySliderValue,
  };
};
