import {
  DESIRED_OUTCOME_OPTIONS,
  GOAL_OBSTACLE_OPTIONS,
  HOUSEHOLD_STAGE_OPTIONS,
  PROPERTY_TYPES,
  SOLUTION_OPTIONS,
} from "./formOptions.js";
import type { FormData } from "./types";

export const LEAD_SCORING_MODEL_VERSION = "section-weight-v2";

export const TODO_POINT = "__TODO_POINT__" as const;

export type LeadScorePointValue = number | typeof TODO_POINT;

type SafetyHabitField =
  | "has_spare_key"
  | "changed_wifi_default_password"
  | "sleeps_with_earphones"
  | "locks_windows_gate_at_night"
  | "has_security_cameras"
  | "has_smoke_alarm_or_fire_extinguisher"
  | "has_first_aid_or_medicine_ready"
  | "knows_local_emergency_contacts";

type SingleSelectField =
  | "property_type"
  | "household_stage"
  | "desired_outcome"
  | "goal_obstacle"
  | "solution";

type SafetySliderField =
  | "safety_gate_entry"
  | "safety_driveway_garage"
  | "safety_blindspots"
  | "safety_emergency_readiness";

type TextPresenceField = "goal_obstacle_other" | "mobile";

type AnswerPointsMap = Readonly<Record<string, LeadScorePointValue>>;

export type LeadScoreBooleanQuestionConfig = {
  id: string;
  label: string;
  type: "boolean";
  field: SafetyHabitField;
  points: Readonly<{
    yes: LeadScorePointValue;
    no: LeadScorePointValue;
  }>;
};

export type LeadScoreSingleSelectQuestionConfig = {
  id: string;
  label: string;
  type: "single_select";
  field: SingleSelectField;
  points: AnswerPointsMap;
};

export type LeadScoreSafetySliderInverseQuestionConfig = {
  id: string;
  label: string;
  type: "safety_slider_inverse";
  fields: readonly SafetySliderField[];
};

export type LeadScoreTextPresenceQuestionConfig = {
  id: string;
  label: string;
  type: "text_presence";
  field: TextPresenceField;
  points: Readonly<{
    filled: LeadScorePointValue;
    empty: LeadScorePointValue;
  }>;
};

export type LeadScoreQuestionConfig =
  | LeadScoreBooleanQuestionConfig
  | LeadScoreSingleSelectQuestionConfig
  | LeadScoreSafetySliderInverseQuestionConfig
  | LeadScoreTextPresenceQuestionConfig;

export type LeadScoreSectionConfig = {
  id: string;
  label: string;
  weightPercent: number;
  maxPointsOverride?: number;
  questions: readonly LeadScoreQuestionConfig[];
};

const toTodoPointMap = <T extends readonly string[]>(
  options: T,
  overrides: Partial<Record<T[number], LeadScorePointValue>> = {}
): Record<T[number], LeadScorePointValue> => {
  const entries = options.map((option) => {
    const typedOption = option as T[number];
    const hasOverride = Object.prototype.hasOwnProperty.call(overrides, typedOption);
    const resolvedValue = hasOverride
      ? (overrides[typedOption] as LeadScorePointValue)
      : TODO_POINT;

    return [typedOption, resolvedValue] as const;
  });

  return Object.fromEntries(entries) as Record<T[number], LeadScorePointValue>;
};

const PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map((item) => item.value) as readonly string[];
const SOLUTION_VALUES = [
  SOLUTION_OPTIONS.DIY_HOME_SAFETY_PLAN,
  SOLUTION_OPTIONS.DONE_FOR_YOU_SETUP,
  SOLUTION_OPTIONS.ONE_ON_ONE_HOME_SECURITY_CONSULTATION,
] as const;

const PROPERTY_TYPE_POINTS = toTodoPointMap(PROPERTY_TYPE_VALUES, {
  "Single-family house": 1,
  "Condo / Apartment": 0,
  "Townhouse / Pre-built House": 1,
  "Vacation Home / Beach House": 2,
});
const HOUSEHOLD_STAGE_POINTS = toTodoPointMap(HOUSEHOLD_STAGE_OPTIONS, {
  "Just me": 0,
  "Couple (no kids yet)": 1,
  "Expecting a baby": 1,
  "Family with kids at home": 2,
  "Older adults/retirees": 2,
});
const DESIRED_OUTCOME_POINTS = toTodoPointMap(DESIRED_OUTCOME_OPTIONS, {
  "Check on family/pets while I'm away": 1,
  "See who's at the gate/door before opening": 1,
  "Monitor outside areas around the home": 2,
  "Protect my home and valuables from break-ins/theft": 2,
  "Get emergency alerts for hazards": 2,
  "Make my home more convenient with smart control/automation": 2,
});
const GOAL_OBSTACLE_POINTS = toTodoPointMap(GOAL_OBSTACLE_OPTIONS, {
  "I'm not sure what's right for my home": 1,
  "I'm worried it will be complicated or won't work properly": 1,
  "I tried something before and it's not applicable to me": 2,
  "I don't want solutions that feel uninviting": 2,
});
const SOLUTION_POINTS = toTodoPointMap(SOLUTION_VALUES, {
  [SOLUTION_OPTIONS.DIY_HOME_SAFETY_PLAN]: 0,
  [SOLUTION_OPTIONS.DONE_FOR_YOU_SETUP]: 1,
  [SOLUTION_OPTIONS.ONE_ON_ONE_HOME_SECURITY_CONSULTATION]: 2,
});

export const LEAD_SCORING_SECTIONS: readonly LeadScoreSectionConfig[] = [
  {
    id: "property_type",
    label: "Property type",
    weightPercent: 5,
    questions: [
      {
        id: "property_type",
        label: "Property type",
        type: "single_select",
        field: "property_type",
        points: PROPERTY_TYPE_POINTS,
      },
    ],
  },
  {
    id: "safety_habits_yes_no",
    label: "Safety habits (yes/no)",
    weightPercent: 30,
    questions: [
      {
        id: "has_spare_key",
        label: "Do you have a spare key for your home?",
        type: "boolean",
        field: "has_spare_key",
        points: {
          yes: 0,
          no:  0,
        },
      },
      {
        id: "changed_wifi_default_password",
        label: "Have you changed your Wi-Fi default password?",
        type: "boolean",
        field: "changed_wifi_default_password",
        points: {
          yes: 0,
          no: 1,
        },
      },
      {
        id: "sleeps_with_earphones",
        label: "Do you sleep with earphones on?",
        type: "boolean",
        field: "sleeps_with_earphones",
        points: {
          yes: 0,
          no: 0,
        },
      },
      {
        id: "locks_windows_gate_at_night",
        label: "Do you lock your windows and gate at night?",
        type: "boolean",
        field: "locks_windows_gate_at_night",
        points: {
          yes: 0,
          no: 2,
        },
      },
      {
        id: "has_security_cameras",
        label: "Do you have security cameras at home?",
        type: "boolean",
        field: "has_security_cameras",
        points: {
          yes: 0,
          no: 3,
        },
      },
      {
        id: "has_smoke_alarm_or_fire_extinguisher",
        label: "Do you have a smoke alarm or fire extinguisher at home?",
        type: "boolean",
        field: "has_smoke_alarm_or_fire_extinguisher",
        points: {
          yes: 0,
          no: 0,
        },
      },
      {
        id: "has_first_aid_or_medicine_ready",
        label: "Do you have first-aid supplies or medicine ready at home?",
        type: "boolean",
        field: "has_first_aid_or_medicine_ready",
        points: {
          yes: 0,
          no: 0,
        },
      },
      {
        id: "knows_local_emergency_contacts",
        label: "Do you know local emergency contacts?",
        type: "boolean",
        field: "knows_local_emergency_contacts",
        points: {
          yes: 0,
          no: 1,
        },
      },
    ],
  },
  {
    id: "safety_home_entrance",
    label: "Safety slider: home entrance",
    weightPercent: 15,
    questions: [
      {
        id: "safety_home_entrance",
        label: "Home entrance safety",
        type: "safety_slider_inverse",
        fields: ["safety_gate_entry"],
      },
    ],
  },
  {
    id: "safety_neighborhood",
    label: "Safety slider: neighborhood",
    weightPercent: 15,
    questions: [
      {
        id: "safety_neighborhood",
        label: "Neighborhood safety",
        type: "safety_slider_inverse",
        fields: ["safety_driveway_garage"],
      },
    ],
  },
  {
    id: "safety_windows_terrace",
    label: "Safety slider: windows and terrace",
    weightPercent: 5,
    questions: [
      {
        id: "safety_windows_terrace",
        label: "Windows and terrace safety",
        type: "safety_slider_inverse",
        fields: ["safety_blindspots"],
      },
    ],
  },
  {
    id: "safety_emergency_readiness",
    label: "Safety slider: emergency readiness",
    weightPercent: 0,
    questions: [
      {
        id: "safety_emergency_readiness",
        label: "Emergency readiness safety",
        type: "safety_slider_inverse",
        fields: ["safety_emergency_readiness"],
      },
    ],
  },
  {
    id: "household_stage_current_situation",
    label: "Current situation",
    weightPercent: 5,
    questions: [
      {
        id: "household_stage",
        label: "Household stage",
        type: "single_select",
        field: "household_stage",
        points: HOUSEHOLD_STAGE_POINTS,
      },
    ],
  },
  {
    id: "desired_outcome",
    label: "Desired outcome",
    weightPercent: 5,
    questions: [
      {
        id: "desired_outcome",
        label: "Desired outcome",
        type: "single_select",
        field: "desired_outcome",
        points: DESIRED_OUTCOME_POINTS,
      },
    ],
  },
  {
    id: "goal_obstacle",
    label: "Goal obstacle",
    weightPercent: 5,
    questions: [
      {
        id: "goal_obstacle",
        label: "Goal obstacle",
        type: "single_select",
        field: "goal_obstacle",
        points: GOAL_OBSTACLE_POINTS,
      },
    ],
  },
  {
    id: "solution",
    label: "Preferred solution",
    weightPercent: 10,
    questions: [
      {
        id: "solution",
        label: "Preferred solution",
        type: "single_select",
        field: "solution",
        points: SOLUTION_POINTS,
      },
    ],
  },
  {
    id: "additional_notes_comment",
    label: "Additional notes comment",
    weightPercent: 3,
    questions: [
      {
        id: "goal_obstacle_other",
        label: "Anything else comment",
        type: "text_presence",
        field: "goal_obstacle_other",
        points: {
          filled: 1,
          empty: 0,
        },
      },
    ],
  },
  {
    id: "mobile_contact",
    label: "Mobile contact",
    weightPercent: 2,
    questions: [
      {
        id: "mobile",
        label: "Phone number",
        type: "text_presence",
        field: "mobile",
        points: {
          filled: 1,
          empty: 0,
        },
      },
    ],
  },
] as const;

export const LEAD_SCORING_WEIGHT_TOTAL = LEAD_SCORING_SECTIONS.reduce<number>(
  (sum, section) => sum + section.weightPercent,
  0
);

export type LeadScoringFormData = Pick<
  FormData,
  | "property_type"
  | "has_spare_key"
  | "changed_wifi_default_password"
  | "sleeps_with_earphones"
  | "locks_windows_gate_at_night"
  | "has_security_cameras"
  | "has_smoke_alarm_or_fire_extinguisher"
  | "has_first_aid_or_medicine_ready"
  | "knows_local_emergency_contacts"
  | "safety_gate_entry"
  | "safety_driveway_garage"
  | "safety_blindspots"
  | "safety_emergency_readiness"
  | "household_stage"
  | "desired_outcome"
  | "goal_obstacle"
  | "solution"
  | "goal_obstacle_other"
  | "mobile"
>;
