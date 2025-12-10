export type FormData = {
  property_type: string;
  home_size: string;
  floors: string;
  neighborhood_context: string[];
  home_stage: string;
  goals: string[]; 
  main_goal: string; 
  risk_window: string;
  priority_areas: string[];
  night_lighting: string;
  current_setup: string;
  safety_level: number;
  features_must: string[];
  notifications: string;
  smart_home_interest: string;
  budget_band: string;
  timeline: string;
  decision_makers: string;
  incident_notes: string;
  first_name: string; 
  last_name: string; 
  full_name: string; 
  email: string;
  mobile: string;
};

export type LeadTier = 'Hot' | 'Warm' | 'Nurture';

export type CalculationResult = {
  cameraCount: number;
  nvrChannel: number;
  storage1TB: boolean;
  leadScore: number;
  leadTier: LeadTier;
  recommendations: string[];
};