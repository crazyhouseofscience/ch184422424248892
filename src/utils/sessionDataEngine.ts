// Session-based jitter provider that yields slight realistic variances on each browser refresh
// Allows each classroom lab group / session to have unique experimental data while preserving
// rigorous thermodynamic principles (4 tabs > 2 tabs > 0 tabs, starting at ~21.0°C).

import { safeSessionStorage } from './storage';

export type GraphIncrement = 2 | 3;

const SESSION_VARIANCE_KEY = 'lab_session_variance_seed_v1';
const GRAPH_INCREMENT_KEY = 'lab_graph_increment_setting';

export interface StationVariance {
  ambient: number;
  deltaNoise: number;
  tauOffset: number;
}

export interface SessionRunVariances {
  station1: StationVariance;
  station2: StationVariance;
  station3: StationVariance;
}

// Generate new slight variances on fresh page load or manual re-roll
export const generateSessionVariances = (): SessionRunVariances => {
  // Slight ambient room temp between 20.8 and 21.2°C
  const baseAmbient = Number((20.9 + Math.random() * 0.3).toFixed(1));
  
  return {
    station1: {
      ambient: baseAmbient,
      deltaNoise: Number((-0.15 + Math.random() * 0.3).toFixed(2)),
      tauOffset: Number((-0.3 + Math.random() * 0.6).toFixed(2)),
    },
    station2: {
      ambient: baseAmbient,
      deltaNoise: Number((-0.2 + Math.random() * 0.4).toFixed(2)),
      tauOffset: Number((-0.4 + Math.random() * 0.8).toFixed(2)),
    },
    station3: {
      ambient: baseAmbient,
      deltaNoise: Number((-0.25 + Math.random() * 0.5).toFixed(2)),
      tauOffset: Number((-0.5 + Math.random() * 1.0).toFixed(2)),
    },
  };
};

export const getSessionVariances = (): SessionRunVariances => {
  if (typeof window === 'undefined') return generateSessionVariances();
  const stored = safeSessionStorage.getItem(SESSION_VARIANCE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  const created = generateSessionVariances();
  safeSessionStorage.setItem(SESSION_VARIANCE_KEY, JSON.stringify(created));
  return created;
};

export const refreshSessionVariances = (): SessionRunVariances => {
  const created = generateSessionVariances();
  safeSessionStorage.setItem(SESSION_VARIANCE_KEY, JSON.stringify(created));
  return created;
};

// Graph interval setting (2m vs 3m)
export const getStoredGraphIncrement = (): GraphIncrement => {
  if (typeof window === 'undefined') return 3;
  const stored = safeSessionStorage.getItem(GRAPH_INCREMENT_KEY);
  if (stored === '2' || stored === '3') {
    return parseInt(stored, 10) as GraphIncrement;
  }
  return 3; // Default 3m intervals (0, 3, 6, 9, 12, 15)
};

export const setStoredGraphIncrement = (inc: GraphIncrement): void => {
  safeSessionStorage.setItem(GRAPH_INCREMENT_KEY, String(inc));
};

export const getIntervalMilestones = (inc: GraphIncrement): number[] => {
  if (inc === 2) {
    return [0, 2, 4, 6, 8, 10, 12, 14, 16]; // 2-minute increments up to 16 min
  }
  return [0, 3, 6, 9, 12, 15]; // standard 3-minute increments up to 15 min
};
