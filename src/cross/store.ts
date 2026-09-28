import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY = 'wordcross.game.v1';

export type ThemeId = 'classic' | 'blossom' | 'forest' | 'ocean' | 'night' | 'paper' | 'autumn';

export type GameState = {
  level: number; // next level to play
  coins: number;
  solved: number;
  playSeconds: number;
  typed: number; // letters typed
  correct: number; // letters typed that were right
  theme: ThemeId;
  days: string[]; // YYYY-MM-DD days a puzzle was solved
  muted: boolean;
  input: 'letters' | 'keyboard'; // letter bank (default) or full QWERTY
  haptics: boolean;
  seenTutorial: boolean;
  bonusDay: string; // last day the daily coin bonus was claimed
};

const DEFAULT: GameState = {
  level: 1, coins: 250, solved: 0, playSeconds: 0, typed: 0, correct: 0, theme: 'classic', days: [], muted: false, input: 'letters',
  haptics: true, seenTutorial: false, bonusDay: '',
};

let state: GameState = DEFAULT;
const listeners = new Set<(s: GameState) => void>();

export const ready = AsyncStorage.getItem(KEY)
  .then((raw) => { if (raw) state = { ...DEFAULT, ...JSON.parse(raw) }; })
  .catch(() => {})
  .finally(() => listeners.forEach((l) => l(state)));

export const getGame = () => state;

export function updateGame(patch: Partial<GameState> | ((s: GameState) => Partial<GameState>)) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  listeners.forEach((l) => l(state));
  AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
}

export function useGame(): GameState {
  const [s, set] = useState(state);
  useEffect(() => {
    listeners.add(set);
    ready.then(() => set(state));
    return () => { listeners.delete(set); };
  }, []);
  return s;
}

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Consecutive days up to today (or yesterday, if today isn't played yet). */
export function streak(days: string[]) {
  const set = new Set(days);
  const d = new Date();
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export const HINT_COST = 100;
export const LEVEL_REWARD = 50;
export const NO_HINT_BONUS = 25; // extra for finishing a level without hints
export const DAILY_BONUS = 100;

/** Grants the daily bonus once per calendar day; returns true if it was granted now. */
export function claimDailyBonus() {
  if (state.bonusDay === dayKey()) return false;
  // A brand-new player already starts with coins; the bonus begins tomorrow.
  if (!state.bonusDay) { updateGame({ bonusDay: dayKey() }); return false; }
  updateGame((s) => ({ coins: s.coins + DAILY_BONUS, bonusDay: dayKey() }));
  return true;
}

/** Wipes crossword progress, stats and coins; keeps preferences. */
export function resetProgress() {
  updateGame((s) => ({ ...DEFAULT, theme: s.theme, muted: s.muted, input: s.input, haptics: s.haptics, seenTutorial: true, bonusDay: dayKey() }));
}
