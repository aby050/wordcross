import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { VALUES } from '../scrabble';

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
  book: Record<string, BookWord>; // every word solved: Word Book
  ink: number; // letter points earned from solved words; spend on hints
  awards: string[]; // unlocked award ids
  noHint: number; // levels finished without a hint
  themeWins: number; // level themes guessed right
  bestStreak: number; // longest run of consecutive play days
  dailyDone: string[]; // days the Daily Challenge was finished
};

/** One solved word: how often it came up and how often recall failed in the quiz. */
export type BookWord = { clue: string; n: number; miss: number; last: string };

const DEFAULT: GameState = {
  level: 1, coins: 250, solved: 0, playSeconds: 0, typed: 0, correct: 0, theme: 'classic', days: [], muted: false, input: 'letters',
  haptics: true, seenTutorial: false, bonusDay: '', book: {}, ink: 0, awards: [], noHint: 0, themeWins: 0, bestStreak: 0, dailyDone: [],
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

export const DAILY_REWARD = 150;
export const COMBO_BONUS = 5; // per chained word, when words land within COMBO_MS of each other
export const COMBO_MS = 25000;

/** Same hard puzzle for everyone on a given day: a level number from the calendar. */
export function dailyLevel(d = new Date()) {
  const day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  return 101 + (day * 7919) % 899;
}

export const HINT_COST = 100;
export const LEVEL_REWARD = 50;
export const NO_HINT_BONUS = 25; // extra for finishing a level without hints
export const DAILY_BONUS = 100;
export const THEME_BONUS = 30; // for guessing a level's hidden theme
export const INK_HINT = 12; // letter points one hint costs


/** Solved words pay out letter points: rare letters (Q, Z, X, J) are worth the most. */
export function earnInk(words: { answer: string }[]) {
  const gain = words.reduce((n, w) => n + [...w.answer].reduce((m, ch) => m + (VALUES[ch] ?? 1), 0), 0);
  updateGame((s) => ({ ink: s.ink + gain }));
  return gain;
}

/** Grants the daily bonus once per calendar day; returns true if it was granted now. */
export function claimDailyBonus() {
  if (state.bonusDay === dayKey()) return false;
  // A brand-new player already starts with coins; the bonus begins tomorrow.
  if (!state.bonusDay) { updateGame({ bonusDay: dayKey() }); return false; }
  updateGame((s) => ({ coins: s.coins + DAILY_BONUS, bonusDay: dayKey() }));
  return true;
}

/** Adds solved words to the Word Book (clue kept from the first time it was seen). */
export function recordWords(words: { answer: string; clue: string }[]) {
  updateGame((s) => {
    const book = { ...s.book };
    for (const w of words) {
      const old = book[w.answer];
      book[w.answer] = { clue: old?.clue ?? w.clue, n: (old?.n ?? 0) + 1, miss: old?.miss ?? 0, last: dayKey() };
    }
    return { book };
  });
}

/** Quiz result: a miss makes the word come up sooner next time. */
export function recordRecall(word: string, ok: boolean) {
  updateGame((s) => {
    const w = s.book[word];
    if (!w) return {};
    return { book: { ...s.book, [word]: { ...w, miss: ok ? Math.max(0, w.miss - 1) : w.miss + 1 } } };
  });
}

/** Wipes crossword progress, stats and coins; keeps preferences. */
export function resetProgress() {
  updateGame((s) => ({ ...DEFAULT, theme: s.theme, muted: s.muted, input: s.input, haptics: s.haptics, seenTutorial: true, bonusDay: dayKey() }));
}
