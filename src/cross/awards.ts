import { GameState, getGame, streak, updateGame } from './store';

export type Award = {
  id: string; title: string; desc: string; icon: string; color: string;
  goal: number; reward: number; value: (s: GameState) => number;
};

const rareWords = (s: GameState) => Object.keys(s.book).filter((w) => /[QZXJ]/.test(w)).length;
const accuracy = (s: GameState) => (s.typed >= 200 ? Math.round((s.correct / s.typed) * 100) : 0);

export const AWARDS: Award[] = [
  { id: 'first', title: 'First Word', desc: 'Solve your first word', icon: 'seed', color: '#22C55E', goal: 1, reward: 10, value: (s) => Object.keys(s.book).length },
  { id: 'lv5', title: 'Warming Up', desc: 'Complete 5 levels', icon: 'fire', color: '#F97316', goal: 5, reward: 40, value: (s) => s.solved },
  { id: 'lv25', title: 'On a Roll', desc: 'Complete 25 levels', icon: 'run-fast', color: '#3B82F6', goal: 25, reward: 100, value: (s) => s.solved },
  { id: 'lv100', title: 'Centurion', desc: 'Complete 100 levels', icon: 'shield-star', color: '#8B5CF6', goal: 100, reward: 250, value: (s) => s.solved },
  { id: 'lv300', title: 'Crossword Legend', desc: 'Complete 300 levels', icon: 'crown', color: '#F5B301', goal: 300, reward: 600, value: (s) => s.solved },
  { id: 'words25', title: 'Word Collector', desc: 'Save 25 words in your Word Book', icon: 'book-open-variant', color: '#0EA5E9', goal: 25, reward: 50, value: (s) => Object.keys(s.book).length },
  { id: 'words150', title: 'Walking Dictionary', desc: 'Save 150 words', icon: 'book-multiple', color: '#6366F1', goal: 150, reward: 200, value: (s) => Object.keys(s.book).length },
  { id: 'streak3', title: 'Habit Forming', desc: 'Play 3 days in a row', icon: 'calendar-check', color: '#EF4444', goal: 3, reward: 30, value: (s) => s.bestStreak },
  { id: 'streak7', title: 'Week Warrior', desc: 'Play 7 days in a row', icon: 'calendar-week', color: '#EC4899', goal: 7, reward: 100, value: (s) => s.bestStreak },
  { id: 'streak30', title: 'Unbreakable', desc: 'Play 30 days in a row', icon: 'trophy', color: '#F59E0B', goal: 30, reward: 400, value: (s) => s.bestStreak },
  { id: 'clean5', title: 'No Help Needed', desc: 'Finish 5 levels without a hint', icon: 'brain', color: '#14B8A6', goal: 5, reward: 60, value: (s) => s.noHint },
  { id: 'clean25', title: 'Pure Mind', desc: 'Finish 25 levels without a hint', icon: 'meditation', color: '#10B981', goal: 25, reward: 200, value: (s) => s.noHint },
  { id: 'theme5', title: 'Theme Spotter', desc: 'Guess 5 level themes', icon: 'tag-search', color: '#A855F7', goal: 5, reward: 50, value: (s) => s.themeWins },
  { id: 'theme25', title: 'Mind Reader', desc: 'Guess 25 level themes', icon: 'eye', color: '#D946EF', goal: 25, reward: 200, value: (s) => s.themeWins },
  { id: 'rare', title: 'Rare Find', desc: 'Solve 3 words with Q, Z, X or J', icon: 'diamond-stone', color: '#06B6D4', goal: 3, reward: 80, value: rareWords },
  { id: 'sharp', title: 'Sharpshooter', desc: '90% accuracy over 200+ letters', icon: 'bullseye-arrow', color: '#84CC16', goal: 90, reward: 100, value: accuracy },
  { id: 'time5', title: 'Dedicated', desc: 'Play for 5 hours in total', icon: 'clock-outline', color: '#64748B', goal: 5 * 3600, reward: 120, value: (s) => s.playSeconds },
];

export const RANKS = [
  { name: 'Rookie', at: 0, color: '#94A3B8', icon: 'seed-outline' },
  { name: 'Wordsmith', at: 5, color: '#22C55E', icon: 'pencil' },
  { name: 'Scholar', at: 20, color: '#3B82F6', icon: 'school' },
  { name: 'Master', at: 60, color: '#8B5CF6', icon: 'medal' },
  { name: 'Grandmaster', at: 150, color: '#F59E0B', icon: 'trophy-award' },
  { name: 'Legend', at: 400, color: '#EF4444', icon: 'crown' },
];

/** Rank comes from levels solved and awards earned (each award counts as 3 levels). */
export const rankScore = (s: GameState) => s.solved + s.awards.length * 3;

export function rankOf(s: GameState) {
  const score = rankScore(s);
  let i = 0;
  while (i + 1 < RANKS.length && score >= RANKS[i + 1].at) i++;
  const next = RANKS[i + 1] ?? null;
  return { rank: RANKS[i], next, score, progress: next ? (score - RANKS[i].at) / (next.at - RANKS[i].at) : 1 };
}

export const progressOf = (a: Award, s: GameState) => Math.min(a.value(s), a.goal);

/** Unlocks every award whose goal is met, pays its coins once and returns the new ones. */
export function checkAwards(): Award[] {
  const s = getGame();
  const fresh = AWARDS.filter((a) => !s.awards.includes(a.id) && a.value(s) >= a.goal);
  if (!fresh.length) return [];
  updateGame((g) => ({ awards: [...g.awards, ...fresh.map((a) => a.id)], coins: g.coins + fresh.reduce((n, a) => n + a.reward, 0) }));
  return fresh;
}

/** Keeps the best-ever streak up to date. Call after a day is added to `days`. */
export function trackStreak() {
  const cur = streak(getGame().days);
  if (cur > getGame().bestStreak) updateGame({ bestStreak: cur });
}
