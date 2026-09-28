import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY = 'wordcross.stars.v1';

/** Best star count per crossword level (index → 0..3). */
export type Stars = Record<number, number>;

let cache: Stars = {};
const listeners = new Set<(s: Stars) => void>();

const loaded = AsyncStorage.getItem(KEY)
  .then((raw) => { if (raw) cache = JSON.parse(raw); })
  .catch(() => {})
  .finally(() => listeners.forEach((l) => l(cache)));

/**
 * 1★ finish the puzzle · 2★ also beat the bot · 3★ beat the bot without hints.
 */
export function starsFor(won: boolean, hintsUsed: number) {
  if (!won) return 1;
  return hintsUsed === 0 ? 3 : 2;
}

/** Records a result, keeping the best score for the level. */
export function saveStars(level: number, stars: number) {
  if ((cache[level] ?? 0) >= stars) return;
  cache = { ...cache, [level]: stars };
  listeners.forEach((l) => l(cache));
  AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});
}

/** A level opens once the previous one has at least one star. */
export const isUnlocked = (stars: Stars, level: number) => level === 0 || (stars[level - 1] ?? 0) > 0;

export function useStars(): Stars {
  const [s, set] = useState(cache);
  useEffect(() => {
    listeners.add(set);
    loaded.then(() => set(cache));
    return () => { listeners.delete(set); };
  }, []);
  return s;
}
