import { ReactNode } from "react";

export interface WaterOption {
  id: string;
  name: string;
  ppm: number;
}

export interface GrinderRange {
  min: number;
  max: number;
}

export interface GrinderOption {
  id: string;
  name: string;
  unit: string;
  kasar: GrinderRange;
  sedang: GrinderRange;
  halus: GrinderRange;
}

export interface ProfileOption {
  id: string;
  label: string;
  icon: ReactNode;
}

export interface Step {
  time: string;
  action: string;
  amount: number;
  note: string;
}

export interface RecipeResult {
  temp: number;
  time: string;
  grind: string;
  totalWater: number;
  brewingWater: number;
  iceAmount: number;
  steps: Step[];
  ratio: string;
  effectivePPM: number;
}

export interface FormData {
  origin: string;
  process: string;
  customProcess: string;
  variety: string;
  customVariety: string;
  waterBrand: string;
  customPPM: string;
  grinder: string;
  brewer: string;
  profile: string;
  dose: number | string;
  temperature: 'hot' | 'iced';
}