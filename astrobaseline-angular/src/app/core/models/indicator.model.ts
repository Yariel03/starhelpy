export type IndicatorKey =
  | 'heart_rate'
  | 'systolic_bp'
  | 'diastolic_bp'
  | 'glucose'
  | 'temperature'
  | 'sleep_hours'
  | 'mood';

export type BodyRegionKey = 'head' | 'chest' | 'abdomen' | 'arms' | 'legs';

export interface IndicatorConfig {
  label: string;
  unit: string;
  ref_low: number | null;
  ref_high: number | null;
  hard_low: number | null;
  hard_high: number | null;
  plaus_low: number;
  plaus_high: number;
  min_sigma: number;
  region: BodyRegionKey;
  hazard: string;
  why: string;
  how: string;
  attention: string;
  alert: string;
  synonyms: string[];
}

export interface RegionInfo {
  label: string;
  indicators: IndicatorKey[];
  note: string;
}

export interface EnvironmentInfo {
  delay: string;
  autonomy: string;
  routine: string;
  attention: string;
  alert: string;
}

export interface HealthRecord {
  date: string; // ISO date string YYYY-MM-DD
  astronaut_id: string;
  heart_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  glucose?: number | null;
  temperature?: number | null;
  sleep_hours?: number | null;
  mood?: number | null;
  [key: string]: any;
}

export interface DataQualityResult {
  score: number;
  completeness: number;
  days_since: number | null;
  flag: string;
}

export interface IndicatorEvaluation {
  level: number; // -1: No data, 0: Normal, 1: Attention, 2: Alert
  z: number | null;
  recent: number | null;
  reasons: string[];
  baseline: number | null;
  sigma: number | null;
  quality: DataQualityResult;
}

export type EvaluationResults = Record<IndicatorKey, IndicatorEvaluation>;

export interface MissionDestination {
  id: string;
  name: string;
  environmentKey: string;
  image: string;
  description: string;
}

export interface TrainingGoal {
  id: string; // 'A-01' | 'A-02'
  name: string;
  archetype: string;
  avatar: string;
  description: string;
  routineFocus: string;
}

export interface MissionConfig {
  daysInSpace: number;
  destination: MissionDestination;
  trainingGoal: TrainingGoal;
}

