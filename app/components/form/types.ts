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

export type SafetySection = {
  id: SafetyField;
  title: string;
  prompts: string[];
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
  onNext: () => void;
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

export type MainGoalStepProps = {
  formData: FormData;
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
  safetySliderDrafts: Partial<Record<SafetyField, number>>;
  naSafetySelections: Partial<Record<SafetyField, boolean>>;
  onToggleNaSafetySelection: (field: SafetyField) => void;
  onCommitSafetySliderValue: (field: SafetyField, rawValue: number) => void;
  isSafetyComplete: boolean;
  ratedSafetyCount: number;
  safetyCompletionPct: number;
  onNext: () => void;
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
  safetySliderDrafts: Partial<Record<SafetyField, number>>;
  naSafetySelections: Partial<Record<SafetyField, boolean>>;
  safetyFields: SafetyField[];
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
  commitSafetySliderValue: (field: SafetyField, rawValue: number) => void;
  toggleNaSafetySelection: (field: SafetyField) => void;
};

export type WizardController = WizardControllerState & WizardControllerActions;

export type StepRenderMap = Record<FormStepId, ReactNode>;
