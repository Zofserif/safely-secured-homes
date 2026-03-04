export type FormData = {
  property_type: string;
  home_size: string;
  floors: string;
  priority_areas: string[];
  current_setup: string;
  has_spare_key: boolean | null;
  changed_wifi_default_password: boolean | null;
  sleeps_with_earphones: boolean | null;
  locks_windows_gate_at_night: boolean | null;
  has_security_cameras: boolean | null;
  has_smoke_alarm_or_fire_extinguisher: boolean | null;
  has_first_aid_or_medicine_ready: boolean | null;
  knows_local_emergency_contacts: boolean | null;
  safety_gate_entry: number | null;
  safety_blindspots: number | null;
  safety_side_back_entry: number | null;
  safety_windows_terrace: number | null;
  safety_driveway_garage: number | null;
  safety_indoor_choke_points: number | null;
  safety_emergency_readiness: number | null;
  features_must: string[];
  smart_home_features: string[];
  smart_home_interest: string;
  diy_security_plan: boolean;
  budget_band: string;
  timeline: string;
  household_stage: string;
  desired_outcome: string;
  goal_obstacle: string;
  goal_obstacle_other: string;
  first_name: string;
  email: string;
  mobile: string;
};

export type LeadTier = "Hot" | "Warm" | "Nurture";

export type SeverityLevel = "low" | "medium" | "high";

export type LeadScoreBreakdownAnswer = {
  answer: string;
  points: number;
};

export type LeadScoreBreakdownItem = {
  id: string;
  label: string;
  questionKey: string;
  selectedAnswers: string[];
  matchedAnswers: LeadScoreBreakdownAnswer[];
  matchedPoints: number;
  bonusPoints: number;
  maxPoints: number;
  points: number;
};

export type ResultsSummary = {
  safetyTotal: number;
  safetyMax: number;
  safetyLevel: {
    label: string;
    range: string;
    severity: SeverityLevel;
  };
  priority: {
    label: string;
    severity: SeverityLevel;
  };
  emergency: {
    label: string;
    severity: SeverityLevel;
  };
  emergencyReadinessScore: number;
  panatagRating: number;
};

export type CalculationResult = {
  cameraCount: number;
  nvrChannel: number;
  storage1TB: boolean;
  leadScore: number;
  leadTier: LeadTier;
  leadScoringModelVersion: string;
  recommendations: string[];
  leadScoreBreakdown?: LeadScoreBreakdownItem[];
};
