import { FORM_STEPS } from "../../lib/formSteps";
import { SAFETY_HABIT_QUESTIONS } from "./constants";
import WizardFrame from "./components/WizardFrame";
import { useWizardController } from "./hooks/useWizardController";
import type { StepRenderMap, WizardFormProps } from "./types";
import ContactStep from "./steps/ContactStep";
import CurrentSituationStep from "./steps/CurrentSituationStep";
import DesiredOutcomeStep from "./steps/DesiredOutcomeStep";
import IntroStep from "./steps/IntroStep";
import ObstacleStep from "./steps/ObstacleStep";
import PropertyTypeStep from "./steps/PropertyTypeStep";
import SafetyCheckStep from "./steps/SafetyCheckStep";
import SolutionStep from "./steps/SolutionStep";
import YesNoQuestionStep from "./steps/YesNoQuestionStep";

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
    isSafetyComplete,
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

  const safetyHabitQuestionsById = new Map(
    SAFETY_HABIT_QUESTIONS.map((question) => [question.id, question] as const),
  );

  const renderSafetyHabitStep = (stepId: (typeof SAFETY_HABIT_QUESTIONS)[number]["id"]) => {
    const question = safetyHabitQuestionsById.get(stepId);
    if (!question) return null;

    return (
      <YesNoQuestionStep
        formData={formData}
        field={question.field}
        question={question.question}
        subtitle={question.subtitle}
        badgeLabel={question.badgeLabel}
        onNext={nextStep}
        onUpdateField={updateField}
      />
    );
  };

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
    safety_habit_spare_key: renderSafetyHabitStep("safety_habit_spare_key"),
    safety_habit_wifi_password: renderSafetyHabitStep("safety_habit_wifi_password"),
    safety_habit_earphones_sleep: renderSafetyHabitStep("safety_habit_earphones_sleep"),
    safety_habit_lock_windows_gate: renderSafetyHabitStep(
      "safety_habit_lock_windows_gate",
    ),
    safety_habit_security_cameras: renderSafetyHabitStep(
      "safety_habit_security_cameras",
    ),
    safety_habit_smoke_alarm_extinguisher: renderSafetyHabitStep(
      "safety_habit_smoke_alarm_extinguisher",
    ),
    safety_habit_first_aid: renderSafetyHabitStep("safety_habit_first_aid"),
    safety_habit_emergency_contacts: renderSafetyHabitStep(
      "safety_habit_emergency_contacts",
    ),
    safety_check: (
      <SafetyCheckStep
        formData={formData}
        safetySliderDrafts={safetySliderDrafts}
        onCommitSafetyCategorySliderValue={commitSafetyCategorySliderValue}
        isSafetyComplete={isSafetyComplete}
        onNext={nextStep}
      />
    ),
    household_stage: (
      <CurrentSituationStep
        formData={formData}
        onNext={nextStep}
        onUpdateField={updateField}
      />
    ),
    desired_outcome: (
      <DesiredOutcomeStep
        formData={formData}
        onNext={nextStep}
        onUpdateField={updateField}
      />
    ),
    goal_obstacle: (
      <ObstacleStep
        formData={formData}
        onNext={nextStep}
        onUpdateField={updateField}
      />
    ),
    solution: (
      <SolutionStep
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
