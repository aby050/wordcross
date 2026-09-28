import { CLUES } from './clues';

export type Dir = 'across' | 'down';
export type Entry = { num: number; dir: Dir; row: number; col: number; answer: string; clue: string };
export type Crossword = { size: number; solution: (string | null)[][]; entries: Entry[] };

/** Small deterministic RNG so level N is always the same puzzle. */
function rng(seed: number) {
  let a = seed * 2654435761 >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Grid size and word count grow with the level: easy → hard. */
export function difficulty(level: number) {
  if (level <= 20) return { size: 6, words: 5, maxLen: 5, label: 'Easy' };
  if (level <= 100) return { size: 7, words: 8, maxLen: 7, label: 'Medium' };
  return { size: 8, words: 11, maxLen: 8, label: 'Hard' };
}

type Placed = { word: string; clue: string; row: number; col: number; dir: Dir };

export function generate(level: number): Crossword {
  const d = difficulty(level);
  // Retry with derived seeds until a dense enough grid comes out.
  for (let attempt = 0; attempt < 40; attempt++) {
    const r = rng(level * 97 + attempt);
    const got = build(d.size, d.words, d.maxLen, r);
    if (got && got.length >= Math.min(d.words, 5)) return finish(d.size, got);
  }
  throw new Error(`Could not generate level ${level}`);
}

function build(size: number, target: number, maxLen: number, r: () => number): Placed[] | null {
  const pool = CLUES.filter((c) => c.word.length <= Math.min(maxLen, size) && c.word.length >= 3);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const placed: Placed[] = [];
  const at = (y: number, x: number) => (y < 0 || x < 0 || y >= size || x >= size ? null : grid[y][x]);

  const fits = (w: string, row: number, col: number, dir: Dir) => {
    const dy = dir === 'down' ? 1 : 0, dx = dir === 'across' ? 1 : 0;
    const endY = row + dy * (w.length - 1), endX = col + dx * (w.length - 1);
    if (row < 0 || col < 0 || endY >= size || endX >= size) return -1;
    if (at(row - dy, col - dx) || at(endY + dy, endX + dx)) return -1;
    let crossings = 0;
    for (let i = 0; i < w.length; i++) {
      const y = row + dy * i, x = col + dx * i, cur = grid[y][x];
      if (cur) { if (cur !== w[i]) return -1; crossings++; continue; }
      // A new letter must not touch other letters sideways (no accidental words).
      if (at(y + dx, x + dy) || at(y - dx, x - dy)) return -1;
    }
    return crossings === w.length ? -1 : crossings;
  };
  const put = (c: { word: string; clue: string }, row: number, col: number, dir: Dir) => {
    for (let i = 0; i < c.word.length; i++) grid[row + (dir === 'down' ? i : 0)][col + (dir === 'across' ? i : 0)] = c.word[i];
    placed.push({ ...c, row, col, dir });
  };

  const first = pool.shift()!;
  put(first, Math.floor(size / 2) - 1 + Math.floor(r() * 2), Math.floor(r() * (size - first.word.length + 1)), 'across');

  for (const c of pool) {
    if (placed.length >= target) break;
    if (placed.some((p) => p.word === c.word)) continue;
    let best: { row: number; col: number; dir: Dir; score: number } | null = null;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const ch = grid[y][x];
      if (!ch) continue;
      for (let i = 0; i < c.word.length; i++) {
        if (c.word[i] !== ch) continue;
        for (const dir of ['across', 'down'] as Dir[]) {
          const row = dir === 'down' ? y - i : y, col = dir === 'across' ? x - i : x;
          const s = fits(c.word, row, col, dir);
          if (s > 0 && (!best || s + r() > best.score)) best = { row, col, dir, score: s + r() };
        }
      }
    }
    if (best) put(c, best.row, best.col, best.dir);
  }
  return placed;
}

function finish(size: number, placed: Placed[]): Crossword {
  const solution: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  for (const p of placed) for (let i = 0; i < p.word.length; i++)
    solution[p.row + (p.dir === 'down' ? i : 0)][p.col + (p.dir === 'across' ? i : 0)] = p.word[i];
  // Standard numbering: row-major order over cells where a word starts.
  const starts = [...new Set(placed.map((p) => p.row * size + p.col))].sort((a, b) => a - b);
  const entries = placed
    .map((p) => ({ num: starts.indexOf(p.row * size + p.col) + 1, dir: p.dir, row: p.row, col: p.col, answer: p.word, clue: p.clue }))
    .sort((a, b) => (a.dir === b.dir ? a.num - b.num : a.dir === 'across' ? -1 : 1));
  return { size, solution, entries };
}

export const cellsOf = (e: Entry) =>
  Array.from({ length: e.answer.length }, (_, i) => [e.row + (e.dir === 'down' ? i : 0), e.col + (e.dir === 'across' ? i : 0)] as [number, number]);
