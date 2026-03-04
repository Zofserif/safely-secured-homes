import { FORM_STEPS } from "../../lib/formSteps";
import WizardFrame from "./components/WizardFrame";
import { useWizardController } from "./hooks/useWizardController";
import type { StepRenderMap, WizardFormProps } from "./types";
import BudgetDiyStep from "./steps/BudgetDiyStep";
import ContactStep from "./steps/ContactStep";
import CurrentSetupStep from "./steps/CurrentSetupStep";
import HomeDetailsStep from "./steps/HomeDetailsStep";
import IntroStep from "./steps/IntroStep";
import PriorityAreasStep from "./steps/PriorityAreasStep";
import PropertyTypeStep from "./steps/PropertyTypeStep";
import SafetyCheckStep from "./steps/SafetyCheckStep";
import SmartHomeStep from "./steps/SmartHomeStep";
import TimelineStep from "./steps/TimelineStep";

export default function WizardForm({
  onComplete,
  mode = "default",
  analyticsContext,
  submitLabel,
  submittingLabel,
}: WizardFormProps) {
  const isNewsletterFlow = mode === "newsletter";

  const {
    step,
    isSubmitting,
    formData,
    errors,
    safetySliderDrafts,
    ratedSafetyCount,
    safetyCompletionPct,
    isSafetyComplete,
    getArrayFieldValues,
    toggleArrayField,
    updateField,
    nextStep,
    prevStep,
    submitFinal,
    commitSafetyCategorySliderValue,
  } = useWizardController({
    mode,
    onComplete,
    analyticsContext,
  });

  const stepContentById: StepRenderMap = {
    first_name: (
      <IntroStep
        formData={formData}
        onNext={nextStep}
        onUpdateField={updateField}
      />
    ),
    property_type: (
      <PropertyTypeStep
        formData={formData}
        onNext={nextStep}
        onUpdateField={updateField}
      />
    ),
    current_setup: (
      <CurrentSetupStep
        formData={formData}
        onNext={nextStep}
        onUpdateField={updateField}
      />
    ),
    home_details: (
      <HomeDetailsStep
        formData={formData}
        onNext={nextStep}
        onUpdateField={updateField}
      />
    ),
    safety_check: (
      <SafetyCheckStep
        formData={formData}
        safetySliderDrafts={safetySliderDrafts}
        onCommitSafetyCategorySliderValue={commitSafetyCategorySliderValue}
        isSafetyComplete={isSafetyComplete}
        ratedSafetyCount={ratedSafetyCount}
        safetyCompletionPct={safetyCompletionPct}
        onNext={nextStep}
      />
    ),
    priority_areas: (
      <PriorityAreasStep
        getArrayFieldValues={getArrayFieldValues}
        onNext={nextStep}
        onToggleArrayField={toggleArrayField}
      />
    ),
    smart_home_implementation: (
      <SmartHomeStep
        formData={formData}
        getArrayFieldValues={getArrayFieldValues}
        onNext={nextStep}
        onToggleArrayField={toggleArrayField}
        onUpdateField={updateField}
      />
    ),
    budget_diy: (
      <BudgetDiyStep
        formData={formData}
        onNext={nextStep}
        onUpdateField={updateField}
      />
    ),
    timeline: (
      <TimelineStep
        formData={formData}
        onNext={nextStep}
        onUpdateField={updateField}
      />
    ),
    contact_details: (
      <ContactStep
        formData={formData}
        errors={errors}
        isSubmitting={isSubmitting}
        isNewsletterFlow={isNewsletterFlow}
        submitLabel={submitLabel}
        submittingLabel={submittingLabel}
        onSubmit={submitFinal}
        onUpdateField={updateField}
      />
    ),
  };

  const activeStepId = FORM_STEPS[step]?.id;

  return (
    <WizardFrame step={step} stepCount={FORM_STEPS.length} onBack={prevStep}>
      {activeStepId ? stepContentById[activeStepId] : null}
    </WizardFrame>
  );
}
