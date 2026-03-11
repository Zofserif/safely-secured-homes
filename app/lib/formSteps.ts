export const FORM_STEPS = [
  { id: "name", label: "Name" },
  { id: "property_type", label: "Property type" },
  { id: "safety_habit_spare_key", label: "Safety habit: spare key" },
  {
    id: "safety_habit_wifi_password",
    label: "Safety habit: Wi-Fi password",
  },
  { id: "safety_habit_earphones_sleep", label: "Safety habit: earphones" },
  {
    id: "safety_habit_lock_windows_gate",
    label: "Safety habit: lock windows/gate",
  },
  {
    id: "safety_habit_security_cameras",
    label: "Safety habit: security cameras",
  },
  {
    id: "safety_habit_smoke_alarm_extinguisher",
    label: "Safety habit: smoke/fire safety",
  },
  {
    id: "safety_habit_first_aid",
    label: "Safety habit: first aid",
  },
  {
    id: "safety_habit_emergency_contacts",
    label: "Safety habit: emergency contacts",
  },
  {
    id: "safety_check_home_entrance",
    label: "Safety check: Home entrance",
  },
  {
    id: "safety_check_neighborhood",
    label: "Safety check: Neighborhood",
  },
  {
    id: "safety_check_blindspots",
    label: "Safety check: Windows + Terrace",
  },
  {
    id: "safety_check_emergency_readiness",
    label: "Safety check: Emergency readiness",
  },
  { id: "household_stage", label: "Household stage" },
  { id: "desired_outcome", label: "Desired outcome" },
  { id: "goal_obstacle", label: "Goal obstacle" },
  { id: "solution", label: "Solution" },
  { id: "goal_obstacle_other", label: "Anything else (optional)" },
  { id: "contact_details", label: "Contact details" },
] as const;

export type FormStepId = (typeof FORM_STEPS)[number]["id"];
