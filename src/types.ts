export type ActiveModule = 
  | 'station-1'
  | 'station-2'
  | 'station-3'
  | 'station-summary'
  | 'atmospheric-conditions' 
  | 'data-visualization' 
  | 'atmosphere';

export interface StationProgress {
  setupComplete: boolean;
  dataRecorded: boolean;
  recordedData: Record<number, number>; // minute -> temp
  timerSeconds?: number;
  lampOn?: boolean;
  lampSegments?: { startMin: number; lampOn: boolean }[];
}

export type LabInvestigationProgress = Record<1 | 2 | 3, StationProgress>;

export interface StationEquipmentSetup {
  stationMode: '3-stations' | '3-bottles-one-station';
  selectedStation: 1 | 2 | 3;
  lampClamped: boolean;
  lampPluggedIn: boolean;
  lampHeightInches: number; // 2 to 14 inches (recommended 6-8)
  lampDistanceInches: number; // 4 to 14 inches (recommended 6-8)
  waterAddedMl: number; // 0 to 100 mL (recommended 50 mL)
  cylinderFilledMl: number;
  tabletsAdded: number; // 0, 2, or 4
  probeInserted: boolean;
  probePosition: 'headspace' | 'submerged' | 'outside';
  plasticWrapApplied: boolean;
  claySealed: boolean;
  fastenedWithBand: boolean;
  timerPositioned: boolean;
  isComplete: boolean;
}

export interface StationDataPoint {
  timeMinute: number;
  temp0Tabs: number; // Station 1: 0 tablets (control)
  temp2Tabs: number; // Station 2: 2 tablets
  temp4Tabs: number; // Station 3: 4 tablets
}

export interface CustomDataSeries {
  id: string;
  name: string;
  co2LevelPpm: number;
  tabletCount: number;
  color: string;
  conditionNotes: string;
  visible: boolean;
}

export interface StudentGraphPoint {
  timeMinute: number;
  values: Record<string, number>; // seriesId -> temperature in °C
}

export type DiffuserType = 'none' | 'thin-cirrus' | 'overcast-stratus' | 'condensation-film';

export type GasType = 
  | 'air-control' 
  | 'co2-2tabs' 
  | 'co2-4tabs' 
  | 'methane-ch4' 
  | 'water-vapor' 
  | 'nitrous-oxide-n2o' 
  | 'cfc-12';

export interface AtmosphericExperimentState {
  lampDistanceInches: number;
  lampAngleDegrees: number; // 90 = direct, 60 = moderate, 30 = low grazing
  diffuserMaterial: DiffuserType;
  selectedGas: GasType;
  activeComparison: 'compare-gases' | 'compare-clouds-diffusers' | 'compare-angles';
}

export interface MaterialItem {
  id: string;
  name: string;
  quantity: string;
  purpose: string;
  checked: boolean;
  reusable: boolean;
  iconName: string;
}

export interface SafetyRule {
  id: string;
  title: string;
  description: string;
  critical: boolean;
  category: 'electrical' | 'heat' | 'ppe' | 'spills' | 'hygiene';
  verified: boolean;
}

export interface StudentRole {
  title: string;
  responsibilities: string[];
  safetyFocus: string;
}

export interface PlanetaryAtmosphere {
  id: string;
  name: string;
  distanceFromSunAU: number;
  solarIrradiance: number; // W/m2
  co2LevelPpm: number;
  surfacePressureAtm: number;
  actualSurfaceTempC: number;
  noGreenhouseTempC: number;
  greenhouseWarmingC: number;
  description: string;
  atmosphereComposition: { gas: string; percentage: number; color: string }[];
}
