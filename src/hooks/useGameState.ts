import { useState, useEffect, useCallback } from 'react';
import { SPECIES, SPECIES_BY_ID } from '../data/butterflies';
import type { Rarity, Species } from '../data/butterflies';

export interface GpsLocation {
  lat: number;
  lng: number;
}

export interface FoundEntry {
  speciesId: string;
  foundAt: number; // timestamp
  points: number;
  location?: GpsLocation;
}

export interface GameState {
  foundSpecies: Record<string, FoundEntry>;
  totalPoints: number;
  dailyBonusClaimed?: string; // date string YYYY-MM-DD
}

const STORAGE_KEY = 'sommerfuglfanger_v1';

const DEFAULT_STATE: GameState = {
  foundSpecies: {},
  totalPoints: 0,
};

const BASE_POINTS = 10;
const DAILY_POINTS = 10;

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDailyButterfly(): Species {
  const dateStr = todayString();
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return SPECIES[hash % SPECIES.length];
}

function getRarityMultiplier(rarity: Rarity): number {
  switch (rarity) {
    case 'Svaert sjelden':
      return 3;
    case 'Sjelden':
      return 2;
    case 'Uvanlig':
      return 1.5;
    case 'Vanlig':
    default:
      return 1;
  }
}

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      return migrateState(parsed);
    }
  } catch {
    // ignore corrupt data
  }
  return DEFAULT_STATE;
}

// Recompute totalPoints from known rarity values to fix legacy localStorage
// where daily bonus was 50 pts. Now: base rarity pts + 10 if daily was claimed.
function migrateState(state: GameState): GameState {
  const recomputed = Object.values(state.foundSpecies).reduce((sum, entry) => {
    const species = SPECIES_BY_ID[entry.speciesId];
    if (!species) return sum;
    return sum + Math.round(BASE_POINTS * getRarityMultiplier(species.rarity));
  }, 0);
  const dailyBonus = state.dailyBonusClaimed ? DAILY_POINTS : 0;
  const corrected = recomputed + dailyBonus;
  if (corrected === state.totalPoints) return state;
  return { ...state, totalPoints: corrected };
}

function saveState(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useGameState() {
  const [state, setState] = useState<GameState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const registerSpecies = useCallback(
    (speciesId: string, rarity: Rarity, location?: GpsLocation): { isNew: boolean; points: number; isDailyBonus: boolean; bonusPoints: number } => {
      const daily = getDailyButterfly();
      const today = todayString();
      const isDailyBonus = speciesId === daily.id && state.dailyBonusClaimed !== today;
      const alreadyFound = Boolean(state.foundSpecies[speciesId]);

      // Block repeat catches unless this is the unclaimed daily butterfly
      if (alreadyFound && !isDailyBonus) {
        return { isNew: false, points: 0, isDailyBonus: false, bonusPoints: 0 };
      }

      // Daily catch: always 10 pts shown as bonusPoints so the modal displays correctly
      // New regular species: rarity-based points
      const basePoints = isDailyBonus ? 0 : Math.round(BASE_POINTS * getRarityMultiplier(rarity));
      const bonusPoints = isDailyBonus ? DAILY_POINTS : 0;
      const totalNew = basePoints + bonusPoints;

      setState(prev => {
        const newFoundSpecies = alreadyFound
          ? prev.foundSpecies
          : {
              ...prev.foundSpecies,
              [speciesId]: { speciesId, foundAt: Date.now(), points: basePoints, location },
            };
        return {
          foundSpecies: newFoundSpecies,
          totalPoints: prev.totalPoints + totalNew,
          dailyBonusClaimed: isDailyBonus ? today : prev.dailyBonusClaimed,
        };
      });
      return { isNew: !alreadyFound, points: basePoints, isDailyBonus, bonusPoints };
    },
    [state.foundSpecies, state.dailyBonusClaimed]
  );

  const hasFound = useCallback(
    (speciesId: string) => Boolean(state.foundSpecies[speciesId]),
    [state.foundSpecies]
  );

  const resetProgress = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return { state, registerSpecies, hasFound, resetProgress };
}
