import { FORM_STEPS } from "../../lib/formSteps";
import { SAFETY_HABIT_QUESTIONS } from "./constants";
import WizardFrame from "./components/WizardFrame";
import { useWizardController } from "./hooks/useWizardController";
import type { SafetyCategoryId, StepRenderMap, WizardFormProps } from "./types";
import ContactStep from "./steps/ContactStep";
import CurrentSituationStep from "./steps/CurrentSituationStep";
import DesiredOutcomeStep from "./steps/DesiredOutcomeStep";
import GoalObstacleOtherStep from "./steps/GoalObstacleOtherStep";
import IntroStep from "./steps/IntroStep";
import ObstacleStep from "./steps/ObstacleStep";
import PropertyTypeStep from "./steps/PropertyTypeStep";
import SafetyCheckStep from "./steps/SafetyCheckStep";
import SolutionStep from "./steps/SolutionStep";
import SqueezeStep from "./steps/SqueezeStep";
import YesNoQuestionStep from "./steps/YesNoQuestionStep";

export default function WizardForm({
  onComplete,
  mode = "default",
  analyticsContext,
  submitLabel,
  submittingLabel,
}: WizardFormProps) {
  const finalStageStepIds = new Set<string>([
    "goal_obstacle_other",
    "squeeze",
    "contact_details",
  ]);

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
    goToStep,
    submitFinal,
    commitSafetyCategorySliderValue,
  } = useWizardController({
    mode,
    onComplete,
    analyticsContext,
  });

  const safetyStepIdByCategory: Record<
    SafetyCategoryId,
    (typeof FORM_STEPS)[number]["id"]
  > = {
    home_entrance: "safety_check_home_entrance",
    neighborhood_safety_check: "safety_check_neighborhood",
    windows_terrace: "safety_check_blindspots",
    emergency_readiness_home: "safety_check_emergency_readiness",
  };

  const navigateToSafetyArea = (targetCategoryId: SafetyCategoryId) => {
    const targetStepId = safetyStepIdByCategory[targetCategoryId];
    const targetStepIndex = FORM_STEPS.findIndex((item) => item.id === targetStepId);
    if (targetStepIndex === -1) return;
    goToStep(targetStepIndex);
  };

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
        badgeLabel={question.badgeLabel}
        onNext={nextStep}
        onUpdateField={updateField}
      />
    );
  };

  const stepContentById: StepRenderMap = {
    name: (
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
    safety_check_home_entrance: (
      <SafetyCheckStep
        categoryId="home_entrance"
        isLastSafetyAreaStep={false}
        formData={formData}
        safetySliderDrafts={safetySliderDrafts}
        onCommitSafetyCategorySliderValue={commitSafetyCategorySliderValue}
        onNavigateToSafetyArea={navigateToSafetyArea}
        isSafetyComplete={isSafetyComplete}
        onNext={nextStep}
      />
    ),
    safety_check_neighborhood: (
      <SafetyCheckStep
        categoryId="neighborhood_safety_check"
        isLastSafetyAreaStep={false}
        formData={formData}
        safetySliderDrafts={safetySliderDrafts}
        onCommitSafetyCategorySliderValue={commitSafetyCategorySliderValue}
        onNavigateToSafetyArea={navigateToSafetyArea}
        isSafetyComplete={isSafetyComplete}
        onNext={nextStep}
      />
    ),
    safety_check_blindspots: (
      <SafetyCheckStep
        categoryId="windows_terrace"
        isLastSafetyAreaStep={false}
        formData={formData}
        safetySliderDrafts={safetySliderDrafts}
        onCommitSafetyCategorySliderValue={commitSafetyCategorySliderValue}
        onNavigateToSafetyArea={navigateToSafetyArea}
        isSafetyComplete={isSafetyComplete}
        onNext={nextStep}
      />
    ),
    safety_check_emergency_readiness: (
      <SafetyCheckStep
        categoryId="emergency_readiness_home"
        isLastSafetyAreaStep
        formData={formData}
        safetySliderDrafts={safetySliderDrafts}
        onCommitSafetyCategorySliderValue={commitSafetyCategorySliderValue}
        onNavigateToSafetyArea={navigateToSafetyArea}
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
    goal_obstacle_other: (
      <GoalObstacleOtherStep
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
        submitLabel={submitLabel}
        submittingLabel={submittingLabel}
        onSubmit={submitFinal}
        onUpdateField={updateField}
      />
    ),
    squeeze: <SqueezeStep formData={formData} onNext={nextStep} />,
  };

  const activeStepId = FORM_STEPS[step]?.id;
  const isLastStepStage =
    activeStepId !== undefined && finalStageStepIds.has(activeStepId);

  return (
    <WizardFrame
      step={step}
      stepCount={FORM_STEPS.length}
      onBack={prevStep}
      progressLabelOverride={isLastStepStage ? "Last step" : undefined}
      progressPercentOverride={isLastStepStage ? 100 : undefined}
    >
      {activeStepId ? stepContentById[activeStepId] : null}
    </WizardFrame>
  );
}
