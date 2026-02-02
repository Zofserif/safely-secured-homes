export type FormData = {
  property_type: string;
  home_size: string;
  floors: string;
  main_goal: string;
  priority_areas: string[];
  current_setup: string;
  safety_gate_entry: number | null;
  safety_blindspots: number | null;
  safety_side_back_entry: number | null;
  safety_windows_terrace: number | null;
  safety_driveway_garage: number | null;
  safety_indoor_choke_points: number | null;
  safety_emergency_readiness: number | null;
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
