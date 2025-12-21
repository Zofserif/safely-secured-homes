export type FormData = {
  property_type: string;
  home_size: string;
  floors: string;
  main_goal: string;
  priority_areas: string[];
  current_setup: string;
  safety_level: number;
  features_must: string[];
  smart_home_interest: string;
  budget_band: string;
  timeline: string;
  first_name: string; 
  last_name: string; 
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
