export const FORM_STEPS = [
  { id: "first_name", label: "First name" },
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
  { id: "safety_check", label: "Safety check" },
  { id: "household_stage", label: "Household stage" },
  { id: "desired_outcome", label: "Desired outcome" },
  { id: "goal_obstacle", label: "Goal obstacle" },
  { id: "contact_details", label: "Contact details" },
] as const;

export type FormStepId = (typeof FORM_STEPS)[number]["id"];
