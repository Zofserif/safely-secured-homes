import {
  AlarmSmoke,
  Baby,
  Camera,
  CircleHelp,
  DoorOpen,
  Fence,
  Heart,
  House,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  UserRound,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  DESIRED_OUTCOME_OPTIONS,
  GOAL_OBSTACLE_OPTIONS,
  HOUSEHOLD_STAGE_OPTIONS,
} from "../../lib/formOptions";
import { deriveFirstNameFromEmail, normalizeFirstName } from "../../lib/contactName";
import { readNewsletterLead } from "../../lib/newsletterLead";
import type { FormData } from "../../lib/types";
import type {
  SafetyCategory,
  SafetyHabitQuestion,
  WizardMode,
} from "./types";

type HouseholdStageOptionValue = (typeof HOUSEHOLD_STAGE_OPTIONS)[number];
type DesiredOutcomeOptionValue = (typeof DESIRED_OUTCOME_OPTIONS)[number];
type GoalObstacleOptionValue = (typeof GOAL_OBSTACLE_OPTIONS)[number];

type SingleSelectCardOption<TValue extends string> = {
  value: TValue;
  title: string;
  helper: string;
  Icon: LucideIcon;
};

export const HOUSEHOLD_STAGE_CARD_OPTIONS: readonly SingleSelectCardOption<HouseholdStageOptionValue>[] =
  [
    {
      value: HOUSEHOLD_STAGE_OPTIONS[0],
      title: "Living on your own",
      helper: "You're mainly securing the home for yourself.",
      Icon: UserRound,
    },
    {
      value: HOUSEHOLD_STAGE_OPTIONS[1],
      title: "Couple household",
      helper: "Two adults sharing home routines and entry points.",
      Icon: UsersRound,
    },
    {
      value: HOUSEHOLD_STAGE_OPTIONS[2],
      title: "Expecting a baby",
      helper: "Safety and quick alerts are becoming more urgent.",
      Icon: Baby,
    },
    {
      value: HOUSEHOLD_STAGE_OPTIONS[3],
      title: "Family with kids",
      helper: "Protect children, caregivers, and busy daily movement.",
      Icon: House,
    },
    {
      value: HOUSEHOLD_STAGE_OPTIONS[4],
      title: "Adults and seniors at home",
      helper: "Prioritize emergency response and easy daily use.",
      Icon: Heart,
    },
  ] as const;

export const DESIRED_OUTCOME_CARD_OPTIONS: readonly SingleSelectCardOption<DesiredOutcomeOptionValue>[] =
  [
    {
      value: DESIRED_OUTCOME_OPTIONS[0],
      title: "Check loved ones remotely",
      helper: "See family members or pets when you're not home.",
      Icon: Camera,
    },
    {
      value: DESIRED_OUTCOME_OPTIONS[1],
      title: "Screen visitors first",
      helper: "Know who is outside before opening the gate or door.",
      Icon: DoorOpen,
    },
    {
      value: DESIRED_OUTCOME_OPTIONS[2],
      title: "Watch outdoor perimeter",
      helper: "Track movement in driveway, gate, and street-facing areas.",
      Icon: Fence,
    },
    {
      value: DESIRED_OUTCOME_OPTIONS[3],
      title: "Prevent break-ins and theft",
      helper: "Prevent intruders and protect valuables.",
      Icon: ShieldAlert,
    },
    {
      value: DESIRED_OUTCOME_OPTIONS[4],
      title: "Get hazard alerts",
      helper: "Receive alerts for smoke, fire, and other urgent risks.",
      Icon: AlarmSmoke,
    },
    {
      value: DESIRED_OUTCOME_OPTIONS[5],
      title: "Improve convenience with automation",
      helper: "Control key devices remotely and simplify routines.",
      Icon: Sparkles,
    },
  ] as const;

export const GOAL_OBSTACLE_CARD_OPTIONS: readonly SingleSelectCardOption<GoalObstacleOptionValue>[] =
  [
    {
      value: GOAL_OBSTACLE_OPTIONS[0],
      title: "Not sure what fits",
      helper: "You need clear guidance for your specific home.",
      Icon: CircleHelp,
    },
    {
      value: GOAL_OBSTACLE_OPTIONS[1],
      title: "Worried it's too complicated",
      helper: "You want setup and daily use to stay simple.",
      Icon: Wrench,
    },
    {
      value: GOAL_OBSTACLE_OPTIONS[2],
      title: "Past solution didn't fit",
      helper: "You need a setup tailored to your actual situation.",
      Icon: TriangleAlert,
    },
    {
      value: GOAL_OBSTACLE_OPTIONS[3],
      title: "Don't want a harsh-looking setup",
      helper: "You prefer security that still feels welcoming.",
      Icon: House,
    },
  ] as const;

export const createInitialFormData = (mode: WizardMode): FormData => {
  const baseFormData: FormData = {
    property_type: "",
    has_spare_key: null,
    changed_wifi_default_password: null,
    sleeps_with_earphones: null,
    locks_windows_gate_at_night: null,
    has_security_cameras: null,
    has_smoke_alarm_or_fire_extinguisher: null,
    has_first_aid_or_medicine_ready: null,
    knows_local_emergency_contacts: null,
    home_entrance: null,
    windows_terrace: null,
    neighborhood_safety_check: null,
    emergency_readiness_home: null,
    household_stage: "",
    desired_outcome: "",
    goal_obstacle: "",
    has_additional_notes: null,
    additional_notes: "",
    solution: "",
    name: "",
    email: "",
    mobile: "",
  };

  if (mode !== "newsletter") return baseFormData;

  const lead = readNewsletterLead();
  if (!lead) return baseFormData;

  return {
    ...baseFormData,
    name: normalizeFirstName(
      lead.name || deriveFirstNameFromEmail(lead.email || "")
    ),
    email: lead.email || "",
    mobile: "",
  };
};

export const SAFETY_HABIT_QUESTIONS: readonly SafetyHabitQuestion[] = [
  {
    id: "safety_habit_spare_key",
    field: "has_spare_key",
    question: "Do you have a spare key for your home?",
    badgeLabel: "Safety Habit 1 of 8",
  },
  {
    id: "safety_habit_wifi_password",
    field: "changed_wifi_default_password",
    question: "Have you changed your Wi-Fi default password?",
    badgeLabel: "Safety Habit 2 of 8",
  },
  {
    id: "safety_habit_earphones_sleep",
    field: "sleeps_with_earphones",
    question: "Do you sleep with earphones on?",
    badgeLabel: "Safety Habit 3 of 8",
  },
  {
    id: "safety_habit_lock_windows_gate",
    field: "locks_windows_gate_at_night",
    question: "Do you lock your windows and gate at night?",
    badgeLabel: "Safety Habit 4 of 8",
  },
  {
    id: "safety_habit_security_cameras",
    field: "has_security_cameras",
    question: "Do you have security cameras at home?",
    badgeLabel: "Safety Habit 5 of 8",
  },
  {
    id: "safety_habit_smoke_alarm_extinguisher",
    field: "has_smoke_alarm_or_fire_extinguisher",
    question: "Do you have a smoke alarm or fire extinguisher at home?",
    badgeLabel: "Safety Habit 6 of 8",
  },
  {
    id: "safety_habit_first_aid",
    field: "has_first_aid_or_medicine_ready",
    question: "Do you have first-aid supplies or medicine ready at home?",
    badgeLabel: "Safety Habit 7 of 8",
  },
  {
    id: "safety_habit_emergency_contacts",
    field: "knows_local_emergency_contacts",
    question: "Do you know the emergency contacts in your town or city?",
    badgeLabel: "Safety Habit 8 of 8",
  },
];

export const SAFETY_CATEGORIES: SafetyCategory[] = [
  {
    id: "home_entrance",
    title: "Home entrance + Indoor home layout",
    subtitle: "Check if entry points are secure, visible, and hard to access.",
    field: "home_entrance",
  },
  {
    id: "neighborhood_safety_check",
    title: "Your Neighborhood + Outdoor surrounding",
    subtitle: "Rate outside lighting, visibility, and street-side exposure.",
    field: "neighborhood_safety_check",
  },
  {
    id: "windows_terrace",
    title: "Windows + Terrace",
    subtitle: "Rate how many hidden areas can be missed around your home.",
    field: "windows_terrace",
  },
  {
    id: "emergency_readiness_home",
    title: "Emergency preparedness",
    subtitle: "Rate your family’s emergency planning and response readiness.",
    field: "emergency_readiness_home",
  },
];
