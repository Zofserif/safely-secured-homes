export type FormData = {
  property_type: string;
  has_spare_key: boolean | null;
  changed_wifi_default_password: boolean | null;
  sleeps_with_earphones: boolean | null;
  locks_windows_gate_at_night: boolean | null;
  has_security_cameras: boolean | null;
  has_smoke_alarm_or_fire_extinguisher: boolean | null;
  has_first_aid_or_medicine_ready: boolean | null;
  knows_local_emergency_contacts: boolean | null;
  // Stored on a safety-oriented 0..100 scale: 0 = riskiest, 100 = safest.
  home_entrance: number | null;
  windows_terrace: number | null;
  neighborhood_safety_check: number | null;
  emergency_readiness_home: number | null;
  household_stage: string;
  desired_outcome: string;
  goal_obstacle: string;
  has_additional_notes: boolean | null;
  additional_notes: string;
  solution: string;
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
  // All numeric breakdown fields are normalized to a 0..100 lead scale.
  matchedPoints: number;
  bonusPoints: number;
  maxPoints: number;
  points: number;
};

export type ResultsSummary = {
  // Canonical safety score: 0..100.
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
  // Emergency readiness score on a canonical 0..100 scale.
  emergencyReadinessScore: number;
  // Panatag rating on a canonical 0..100 scale.
  panatagRating: number;
};

export type CalculationResult = {
  cameraCount: number;
  nvrChannel: number;
  storage1TB: boolean;
  // Lead score normalized to 0..100.
  leadScore: number;
  leadTier: LeadTier;
  leadScoringModelVersion: string;
  recommendations: string[];
  leadScoreBreakdown?: LeadScoreBreakdownItem[];
};
