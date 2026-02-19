export const FORM_STEPS = [
  { id: "intro", label: "Intro" },
  { id: "property_type", label: "Property type" },
  { id: "current_setup", label: "Current setup" },
  { id: "main_goal", label: "Main goal" },
  { id: "home_details", label: "Home details" },
  { id: "safety_check", label: "Safety check" },
  { id: "priority_areas", label: "Priority areas" },
  { id: "smart_home_implementation", label: "Smart home implementation" },
  { id: "budget_diy", label: "Budget + DIY" },
  { id: "timeline", label: "Timeline" },
  { id: "contact_details", label: "Contact details" },
] as const;

export type FormStepId = (typeof FORM_STEPS)[number]["id"];
