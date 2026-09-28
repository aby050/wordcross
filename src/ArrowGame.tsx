import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View, Pressable } from 'react-native';
import { ArrowPuzzle } from './arrowPuzzles';
import { C, MainButton, RoundButton, ScoreBar, Toast } from './ui';
import { DragTile, hitCell } from './drag';

type Cell = { letter: string | null; locked: boolean; owner?: 'you' | 'opp' };
const TRAY = 5;

function shuffle<T>(a: T[]) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

export default function ArrowGame({ puzzle, onExit }: { puzzle: ArrowPuzzle; onExit: () => void }) {
  const n = puzzle.answers.length;
  const { width } = useWindowDimensions();
  const cell = Math.floor(Math.min(width - 32, 460) / (n + 1));

  const [grid, setGrid] = useState<Cell[][]>(() =>
    puzzle.answers.map((row, r) => [...row].map((_, c) => {
      const g = puzzle.given.some(([a, b]) => a === r && b === c);
      return { letter: g ? row[c] : null, locked: g };
    })));
  const [tray, setTray] = useState<string[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [you, setYou] = useState(0);
  const [opp, setOpp] = useState(0);
  const [hints, setHints] = useState(3);
  const [turn, setTurn] = useState<'you' | 'opp'>('you');
  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState<string[]>([]);

  const pending = useMemo(() => grid.flat().filter((c) => c.letter && !c.locked).length, [grid]);
  const remaining = useMemo(() => {
    const out: string[] = [];
    grid.forEach((row, r) => row.forEach((c, k) => { if (!c.locked) out.push(puzzle.answers[r][k]); }));
    return out;
  }, [grid, puzzle]);
  const done = remaining.length === 0;

  // Refill the tray with letters the board still needs (always solvable).
  useEffect(() => {
    if (tray.length || pending) return;
    setTray(shuffle(remaining).slice(0, TRAY));
  }, [tray.length, pending, remaining]);

  const say = (t: string) => { setToast(t); setTimeout(() => setToast(null), 1400); };

  const boardRef = useRef<View>(null);
  const open = (r: number, c: number) => !grid[r][c].locked && !grid[r][c].letter;

  const placeFromTray = (i: number, r: number, c: number) => {
    if (turn !== 'you' || !open(r, c)) return;
    const next = grid.map((row) => row.map((x) => ({ ...x })));
    next[r][c].letter = tray[i];
    setTray(tray.filter((_, k) => k !== i));
    setSel(null);
    setGrid(next);
  };

  const tapCell = (r: number, c: number) => {
    const cur = grid[r][c];
    if (cur.locked || turn !== 'you') return;
    if (cur.letter) {
      const next = grid.map((row) => row.map((x) => ({ ...x })));
      setTray([...tray, cur.letter]); next[r][c].letter = null; setGrid(next); return;
    }
    if (sel !== null) placeFromTray(sel, r, c);
  };

  // Board edge = 2px border, then one clue row / column.
  const hit = (x: number, y: number, cb: (rc: [number, number] | null) => void) =>
    hitCell(boardRef, x, y, 2 + cell, cell, n, cb);

  const dropTray = (i: number, x: number, y: number) =>
    hit(x, y, (rc) => { if (rc) placeFromTray(i, rc[0], rc[1]); });

  // A pending board tile: move to another open square, or back to the tray if dropped off the grid.
  const dropCell = (r: number, c: number, x: number, y: number) => hit(x, y, (rc) => {
    if (rc && rc[0] === r && rc[1] === c) return;
    if (rc && !open(rc[0], rc[1])) return;
    const next = grid.map((row) => row.map((v) => ({ ...v })));
    const l = next[r][c].letter!;
    next[r][c].letter = null;
    if (rc) next[rc[0]][rc[1]].letter = l; else setTray([...tray, l]);
    setGrid(next);
  });

  const wordCells = () => {
    const words: { key: string; cells: [number, number][] }[] = [];
    for (let i = 0; i < n; i++) {
      words.push({ key: `a${i}`, cells: Array.from({ length: n }, (_, k) => [i, k] as [number, number]) });
      words.push({ key: `d${i}`, cells: Array.from({ length: n }, (_, k) => [k, i] as [number, number]) });
    }
    return words;
  };

  const lockCompleted = (g: Cell[][], who: 'you' | 'opp') => {
    let pts = 0;
    const hit: string[] = [];
    for (const w of wordCells()) {
      const full = w.cells.every(([r, c]) => g[r][c].locked);
      const hadNew = w.cells.some(([r, c]) => g[r][c].owner === who && !(g[r][c] as any).counted);
      if (full && hadNew) { pts += w.cells.length * 2; hit.push(w.key); }
    }
    g.flat().forEach((c) => { if (c.owner) (c as any).counted = true; });
    return { pts, hit };
  };

  const submit = () => {
    if (!pending) { endTurn(); return; }
    const next = grid.map((row) => row.map((x) => ({ ...x })));
    let right = 0, back: string[] = [];
    next.forEach((row, r) => row.forEach((c, k) => {
      if (!c.letter || c.locked) return;
      if (c.letter === puzzle.answers[r][k]) { c.locked = true; c.owner = 'you'; right++; }
      else { back.push(c.letter); c.letter = null; }
    }));
    const { pts, hit } = lockCompleted(next, 'you');
    const gained = right + pts;
    setGrid(next);
    setTray([...tray, ...back]);
    setYou((v) => v + gained);
    setFlash(hit);
    setTimeout(() => setFlash([]), 900);
    say(gained ? `+${gained}${back.length ? `  (${back.length} wrong)` : ''}` : 'Not quite!');
    endTurn(next);
  };

  const endTurn = (g = grid) => {
    if (g.flat().every((c) => c.locked)) return;
    setTurn('opp');
    setTimeout(() => botMove(g), 900);
  };

  const botMove = (g: Cell[][]) => {
    const next = g.map((row) => row.map((x) => ({ ...x })));
    const open: [number, number][] = [];
    next.forEach((row, r) => row.forEach((c, k) => { if (!c.locked && !c.letter) open.push([r, k]); }));
    const count = Math.min(open.length, 1 + Math.floor(Math.random() * 2));
    for (const [r, c] of shuffle(open).slice(0, count)) {
      next[r][c] = { letter: puzzle.answers[r][c], locked: true, owner: 'opp' };
    }
    const { pts } = lockCompleted(next, 'opp');
    setOpp((v) => v + count + pts);
    setGrid(next);
    // Drop tray letters the bot just used up.
    setTray((t) => {
      const need = [] as string[];
      next.forEach((row, r) => row.forEach((c, k) => { if (!c.locked && !c.letter) need.push(puzzle.answers[r][k]); }));
      return t.filter((l) => { const i = need.indexOf(l); if (i < 0) return false; need.splice(i, 1); return true; });
    });
    setTurn('you');
  };

  const hint = () => {
    if (!hints || turn !== 'you') return;
    const open: [number, number][] = [];
    grid.forEach((row, r) => row.forEach((c, k) => { if (!c.locked && !c.letter) open.push([r, k]); }));
    if (!open.length) return;
    const [r, c] = open[Math.floor(Math.random() * open.length)];
    const next = grid.map((row) => row.map((x) => ({ ...x })));
    next[r][c] = { letter: puzzle.answers[r][c], locked: true };
    const i = tray.indexOf(puzzle.answers[r][c]);
    if (i >= 0) setTray(tray.filter((_, k) => k !== i));
    setGrid(next);
    setHints(hints - 1);
  };

  const clueBox = (text: string, arrow: 'right' | 'down', key: string) => (
    <View key={key} style={[st.clue, { width: cell, height: cell }]}>
      <Text numberOfLines={3} adjustsFontSizeToFit style={[st.clueText, { fontSize: Math.max(8, cell * 0.14) }]}>{text}</Text>
      <Text style={[st.arrow, arrow === 'right' ? { right: 1, top: cell / 2 - 7 } : { bottom: -2, alignSelf: 'center' }]}>
        {arrow === 'right' ? '▸' : '▾'}
      </Text>
    </View>
  );

  const winner = you === opp ? "It's a tie!" : you > opp ? 'You win! 🎉' : 'Bot wins';

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <ScoreBar you={you} opp={opp} turn={turn} />
      <View ref={boardRef} collapsable={false} style={st.board}>
        <View style={{ flexDirection: 'row' }}>
          <View style={[st.clue, { width: cell, height: cell }]} />
          {puzzle.down.map((d, i) => clueBox(d, 'down', `d${i}`))}
        </View>
        {grid.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {clueBox(puzzle.across[r], 'right', `a${r}`)}
            {row.map((c, k) => {
              const lit = flash.includes(`a${r}`) || flash.includes(`d${k}`);
              const bg = c.owner === 'you' ? C.blueSoft : c.owner === 'opp' ? C.green : c.locked ? C.grey : '#fff';
              return (
                <Pressable key={k} onPress={() => tapCell(r, k)}
                  style={[st.cell, { width: cell, height: cell, backgroundColor: lit ? '#FFE9A8' : bg }]}>
                  {c.letter && (c.locked
                    ? <Text style={[st.big, { fontSize: cell * 0.5 }]}>{c.letter}</Text>
                    : <DragTile letter={c.letter} size={cell - 6} disabled={turn !== 'you'}
                      onTap={() => tapCell(r, k)} onDrop={(x, y) => dropCell(r, k, x, y)} />)}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={st.tray}>
        {tray.map((l, i) => (
          <DragTile key={i} letter={l} size={54} selected={sel === i} faded={turn !== 'you'} disabled={turn !== 'you'}
            onTap={() => setSel(sel === i ? null : i)} onDrop={(x, y) => dropTray(i, x, y)} />
        ))}
      </View>
      <Text style={st.help}>{done ? winner : turn === 'you' ? 'Drag a tile onto a square (or tap tile, then square)' : 'Bot is thinking…'}</Text>

      <View style={st.bar}>
        <RoundButton icon="🔀" label="Shuffle" onPress={() => setTray(shuffle(tray))} />
        {done
          ? <MainButton label="Back to menu" onPress={onExit} />
          : <MainButton label={pending ? 'Submit' : 'Pass'} onPress={submit} disabled={turn !== 'you'} />}
        <RoundButton icon="💡" label="Hint" badge={hints} onPress={hint} disabled={!hints || turn !== 'you'} />
      </View>
      <Toast text={toast} />
    </View>
  );
}

const st = StyleSheet.create({
  board: { borderWidth: 2, borderColor: '#7F8EA6', backgroundColor: '#fff' },
  clue: { backgroundColor: C.clue, borderWidth: 0.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center', padding: 2 },
  clueText: { color: '#2F3A4F', textAlign: 'center', fontWeight: '600' },
  arrow: { position: 'absolute', color: '#5B6F8F', fontSize: 12 },
  cell: { borderWidth: 0.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  big: { fontWeight: '800', color: '#2B2F3A' },
  tray: { flexDirection: 'row', gap: 12, marginTop: 22, minHeight: 64, alignItems: 'center' },
  help: { color: '#8A94A8', marginTop: 8 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, marginTop: 'auto', marginBottom: 16, width: '100%', maxWidth: 520 },
});
