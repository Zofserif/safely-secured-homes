import type { CSSProperties, ReactNode } from "react";
import type { FunnelContext } from "../../lib/analytics";
import type { FormStepId } from "../../lib/formSteps";
import type { FormData } from "../../lib/types";

export type WizardMode = "default" | "newsletter";

export type WizardFormProps = {
  onComplete: (data: FormData) => void;
  mode?: WizardMode;
  analyticsContext?: FunnelContext;
  submitLabel?: string;
  submittingLabel?: string;
};

export type FieldErrors = Record<string, string>;

export type SafetyField =
  | "safety_gate_entry"
  | "safety_blindspots"
  | "safety_side_back_entry"
  | "safety_windows_terrace"
  | "safety_driveway_garage"
  | "safety_indoor_choke_points"
  | "safety_emergency_readiness";

export type SafetyCategoryId =
  | "home_entrance"
  | "neighborhood_safety_check"
  | "indoor_outdoor_blindspots"
  | "emergency_readiness_home";

export type SafetyHabitField =
  | "has_spare_key"
  | "changed_wifi_default_password"
  | "sleeps_with_earphones"
  | "locks_windows_gate_at_night"
  | "has_security_cameras"
  | "has_smoke_alarm_or_fire_extinguisher"
  | "has_first_aid_or_medicine_ready"
  | "knows_local_emergency_contacts";

export type SafetyCategory = {
  id: SafetyCategoryId;
  title: string;
  subtitle: string;
  legacyFields: SafetyField[];
};

export type SafetyHabitQuestion = {
  id: FormStepId;
  field: SafetyHabitField;
  question: string;
  subtitle?: string;
  badgeLabel?: string;
};

export type UpdateField = (field: keyof FormData, value: unknown) => void;
export type ToggleArrayField = (field: keyof FormData, value: string) => void;
export type GetArrayFieldValues = (field: keyof FormData) => string[];

export type WizardFrameProps = {
  step: number;
  stepCount: number;
  onBack: () => void;
  children: ReactNode;
};

export type IntroStepProps = {
  formData: FormData;
  onNext: () => void;
  onUpdateField: UpdateField;
};

export type PropertyTypeStepProps = {
  formData: FormData;
  onNext: () => void;
  onUpdateField: UpdateField;
};

export type CurrentSetupStepProps = {
  formData: FormData;
  onNext: () => void;
  onUpdateField: UpdateField;
};

export type YesNoQuestionStepProps = {
  formData: FormData;
  field: SafetyHabitField;
  question: string;
  subtitle?: string;
  badgeLabel?: string;
  onNext: () => void;
  onUpdateField: UpdateField;
};

export type HomeDetailsStepProps = {
  formData: FormData;
  onNext: () => void;
  onUpdateField: UpdateField;
};

export type SafetyCheckStepProps = {
  formData: FormData;
  safetySliderDrafts: Partial<Record<SafetyCategoryId, number>>;
  onCommitSafetyCategorySliderValue: (
    categoryId: SafetyCategoryId,
    rawValue: number
  ) => void;
  isSafetyComplete: boolean;
  ratedSafetyCount: number;
  safetyCompletionPct: number;
  onNext: () => void;
};

export type CurrentSituationStepProps = {
  formData: FormData;
  onNext: () => void;
  onUpdateField: UpdateField;
};

export type DesiredOutcomeStepProps = {
  formData: FormData;
  onNext: () => void;
  onUpdateField: UpdateField;
};

export type ObstacleStepProps = {
  formData: FormData;
  onNext: () => void;
  onUpdateField: UpdateField;
};

export type SolutionStepProps = {
  formData: FormData;
  onNext: () => void;
  onUpdateField: UpdateField;
};

export type PriorityAreasStepProps = {
  getArrayFieldValues: GetArrayFieldValues;
  onNext: () => void;
  onToggleArrayField: ToggleArrayField;
};

export type SmartHomeStepProps = {
  formData: FormData;
  getArrayFieldValues: GetArrayFieldValues;
  onNext: () => void;
  onToggleArrayField: ToggleArrayField;
  onUpdateField: UpdateField;
};

export type BudgetDiyStepProps = {
  formData: FormData;
  onNext: () => void;
  onUpdateField: UpdateField;
};

export type TimelineStepProps = {
  formData: FormData;
  onNext: () => void;
  onUpdateField: UpdateField;
};

export type ContactStepProps = {
  formData: FormData;
  errors: FieldErrors;
  isSubmitting: boolean;
  isNewsletterFlow: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  onSubmit: () => void;
  onUpdateField: UpdateField;
};

export type SafetyRangeStyle = CSSProperties;

export type WizardControllerArgs = {
  mode: WizardMode;
  onComplete: (data: FormData) => void;
  analyticsContext?: FunnelContext;
};

export type WizardControllerState = {
  step: number;
  isSubmitting: boolean;
  formData: FormData;
  errors: FieldErrors;
  safetySliderDrafts: Partial<Record<SafetyCategoryId, number>>;
  ratedSafetyCount: number;
  safetyCompletionPct: number;
  isSafetyComplete: boolean;
};

export type WizardControllerActions = {
  getArrayFieldValues: GetArrayFieldValues;
  toggleArrayField: ToggleArrayField;
  updateField: UpdateField;
  nextStep: () => void;
  prevStep: () => void;
  submitFinal: () => void;
  commitSafetyCategorySliderValue: (
    categoryId: SafetyCategoryId,
    rawValue: number
  ) => void;
};

export type WizardController = WizardControllerState & WizardControllerActions;

export type StepRenderMap = Record<FormStepId, ReactNode>;
