import { useState, useEffect, useCallback } from 'react';

export interface FoundEntry {
  speciesId: string;
  foundAt: number; // timestamp
  points: number;
}

export interface GameState {
  foundSpecies: Record<string, FoundEntry>;
  totalPoints: number;
}

const STORAGE_KEY = 'sommerfuglfanger_v1';

const DEFAULT_STATE: GameState = {
  foundSpecies: {},
  totalPoints: 0,
};

const BASE_POINTS = 10;

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as GameState;
  } catch {
    // ignore corrupt data
  }
  return DEFAULT_STATE;
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
    (speciesId: string): { isNew: boolean; points: number } => {
      if (state.foundSpecies[speciesId]) {
        return { isNew: false, points: 0 };
      }
      const points = BASE_POINTS;
      setState(prev => ({
        foundSpecies: {
          ...prev.foundSpecies,
          [speciesId]: { speciesId, foundAt: Date.now(), points },
        },
        totalPoints: prev.totalPoints + points,
      }));
      return { isNew: true, points };
    },
    [state.foundSpecies]
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
