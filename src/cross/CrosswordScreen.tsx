import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { cellsOf, Dir, Entry, generate, difficulty } from './generate';
import { dayKey, getGame, HINT_COST, LEVEL_REWARD, updateGame, useGame } from './store';
import { themeById } from './themes';
import { Confetti, F, Toast } from '../ui';
import { play } from '../sound';

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const ERASERS = 3;

export default function CrosswordScreen({ level, onBack, onNext }: { level: number; onBack: () => void; onNext: () => void }) {
  const game = useGame();
  const t = themeById(game.theme);
  const { width } = useWindowDimensions();
  const puzzle = useMemo(() => generate(level), [level]);
  const { size, solution, entries } = puzzle;

  const [fill, setFill] = useState<string[][]>(() => solution.map((row) => row.map(() => '')));
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<[number, number]>([entries[0].row, entries[0].col]);
  const [dir, setDir] = useState<Dir>(entries[0].dir);
  const [erasers, setErasers] = useState(ERASERS);
  const [flash, setFlash] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [won, setWon] = useState(false);

  // Stats are buffered and written once, so typing doesn't hammer storage.
  const pending = useRef({ typed: 0, correct: 0, seconds: 0 });
  useEffect(() => {
    const id = setInterval(() => { if (!won) pending.current.seconds++; }, 1000);
    return () => { clearInterval(id); flushStats(); };
  }, [won]);
  const flushStats = () => {
    const p = pending.current;
    if (!p.typed && !p.seconds) return;
    updateGame((s) => ({ typed: s.typed + p.typed, correct: s.correct + p.correct, playSeconds: s.playSeconds + p.seconds }));
    pending.current = { typed: 0, correct: 0, seconds: 0 };
  };

  const k = (r: number, c: number) => `${r},${c}`;
  const say = (m: string) => { setToast(m); setTimeout(() => setToast(null), 1400); };
  const entryAt = (r: number, c: number, d: Dir) => entries.find((e) => e.dir === d && cellsOf(e).some(([y, x]) => y === r && x === c));
  const current: Entry = entryAt(sel[0], sel[1], dir) ?? entryAt(sel[0], sel[1], dir === 'across' ? 'down' : 'across')!;
  const curCells = cellsOf(current);
  const inCur = (r: number, c: number) => curCells.some(([y, x]) => y === r && x === c);
  const solvedEntry = (e: Entry, f = fill) => cellsOf(e).every(([y, x]) => f[y][x] === solution[y][x]);
  const fullEntry = (e: Entry, f = fill) => cellsOf(e).every(([y, x]) => f[y][x]);

  const select = (r: number, c: number) => {
    if (!solution[r][c]) return;
    if (r === sel[0] && c === sel[1]) {
      const other = dir === 'across' ? 'down' : 'across';
      if (entryAt(r, c, other)) setDir(other);
      return;
    }
    setSel([r, c]);
    if (!entryAt(r, c, dir)) setDir(dir === 'across' ? 'down' : 'across');
  };

  const goEntry = (e: Entry) => {
    const cells = cellsOf(e);
    const empty = cells.find(([y, x]) => !fill[y][x]) ?? cells[0];
    setDir(e.dir); setSel(empty);
  };
  const step = (delta: number) => goEntry(entries[(entries.indexOf(current) + delta + entries.length) % entries.length]);

  const afterChange = (next: string[][], touched: Entry[]) => {
    setFill(next);
    const newly = touched.filter((e) => solvedEntry(e, next) && !solvedEntry(e, fill));
    if (newly.length) {
      const keys = new Set(newly.flatMap((e) => cellsOf(e).map(([y, x]) => k(y, x))));
      setLocked((l) => new Set([...l, ...keys]));
      setFlash(keys); setTimeout(() => setFlash(new Set()), 700);
      play('word');
    }
    if (entries.every((e) => solvedEntry(e, next))) win();
  };

  const type = (letter: string) => {
    if (won) return;
    // Solved squares can't change: type into the next open square of this word instead.
    const i0 = curCells.findIndex(([y, x]) => y === sel[0] && x === sel[1]);
    const target = curCells.slice(i0).find(([y, x]) => !locked.has(k(y, x)));
    if (!target) return;
    const [r, c] = target;
    const next = fill.map((row) => row.slice());
    next[r][c] = letter;
    pending.current.typed++;
    if (letter === solution[r][c]) pending.current.correct++;
    play('place');
    afterChange(next, entries.filter((e) => cellsOf(e).some(([y, x]) => y === r && x === c)));
    advance(r, c, next);
  };

  // Next empty square in this word, else the next unsolved word.
  const advance = (r: number, c: number, f = fill) => {
    const i = curCells.findIndex(([y, x]) => y === r && x === c);
    const after = curCells.slice(i + 1).find(([y, x]) => !f[y][x]) ?? curCells.find(([y, x]) => !f[y][x]);
    if (after) return setSel(after);
    const open = curCells.slice(i + 1).find(([y, x]) => !locked.has(k(y, x)) && f[y][x] !== solution[y][x]);
    if (open) return setSel(open);
    const nextE = [...entries.slice(entries.indexOf(current) + 1), ...entries].find((e) => !fullEntry(e, f));
    if (nextE) { const cells = cellsOf(nextE); setDir(nextE.dir); setSel(cells.find(([y, x]) => !f[y][x]) ?? cells[0]); }
  };

  const backspace = () => {
    const [r, c] = sel;
    const next = fill.map((row) => row.slice());
    if (fill[r][c] && !locked.has(k(r, c))) { next[r][c] = ''; setFill(next); return; }
    const i = curCells.findIndex(([y, x]) => y === r && x === c);
    if (i > 0) {
      const [y, x] = curCells[i - 1];
      setSel([y, x]);
      if (!locked.has(k(y, x))) { next[y][x] = ''; setFill(next); }
    }
  };

  const hint = () => {
    if (won) return;
    if (getGame().coins < HINT_COST) { say(`Hints cost ${HINT_COST} coins`); play('wrong'); return; }
    const target = [sel, ...curCells].find(([y, x]) => fill[y][x] !== solution[y][x] && !locked.has(k(y, x)))
      ?? entries.flatMap(cellsOf).find(([y, x]) => fill[y][x] !== solution[y][x]);
    if (!target) return;
    const [r, c] = target;
    updateGame((s) => ({ coins: s.coins - HINT_COST }));
    const next = fill.map((row) => row.slice());
    next[r][c] = solution[r][c]!;
    setLocked((l) => new Set([...l, k(r, c)]));
    play('place');
    afterChange(next, entries.filter((e) => cellsOf(e).some(([y, x]) => y === r && x === c)));
  };

  const erase = () => {
    if (!erasers || won) return;
    const wrong = entries.flatMap(cellsOf).filter(([y, x]) => fill[y][x] && fill[y][x] !== solution[y][x]);
    if (!wrong.length) { say('No wrong letters'); return; }
    const next = fill.map((row) => row.slice());
    wrong.forEach(([y, x]) => { next[y][x] = ''; });
    setFill(next); setErasers(erasers - 1);
    say(`Removed ${new Set(wrong.map(([y, x]) => k(y, x))).size} wrong letters`);
    play('pickup');
  };

  const shuffleClue = () => {
    const open = entries.filter((e) => e !== current && !solvedEntry(e));
    if (open.length) goEntry(open[Math.floor(Math.random() * open.length)]);
  };

  const win = () => {
    setWon(true);
    play('win');
    flushStats();
    updateGame((s) => ({
      coins: s.coins + LEVEL_REWARD,
      solved: s.solved + 1,
      level: Math.max(s.level, level + 1),
      days: s.days.includes(dayKey()) ? s.days : [...s.days, dayKey()],
    }));
  };

  // Hardware keyboards (web, tablets with keyboards) type straight into the grid.
  const keys = useRef({ type, backspace });
  keys.current = { type, backspace };
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (/^[a-z]$/i.test(e.key)) keys.current.type(e.key.toUpperCase());
      else if (e.key === 'Backspace') keys.current.backspace();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const gridW = Math.min(width - 32, 440);
  const gap = 3;
  const cell = Math.floor((gridW - 8 - gap * (size - 1)) / size);
  const numbers = new Map(entries.map((e) => [k(e.row, e.col), e.num]));
  const keyW = Math.min(40, (Math.min(width, 520) - 16 - 9 * 5) / 10);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={t.bg} style={StyleSheet.absoluteFill} />
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={12}><Icon name="arrow-left" size={26} color={t.headerText} /></Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={[s.level, { color: t.headerText }]}>Level {level}</Text>
          <Text style={[s.diff, { color: t.headerText }]}>{difficulty(level).label}</Text>
        </View>
        <View style={s.coins}>
          <View style={s.coinDot}><Text style={s.coinGlyph}>$</Text></View>
          <Text style={s.coinText}>{game.coins}</Text>
        </View>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={[s.board, { width: gridW, backgroundColor: t.board, padding: 4, gap }]}>
          {solution.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row', gap }}>
              {row.map((sol, c) => {
                if (!sol) return <View key={c} style={{ width: cell, height: cell }} />;
                const isSel = sel[0] === r && sel[1] === c;
                const letter = fill[r][c];
                const bad = letter && letter !== sol && entries.some((e) => inEntry(e, r, c) && fullEntry(e));
                const bg = isSel ? t.selected : flash.has(k(r, c)) ? t.selected : inCur(r, c) ? t.word : t.cell;
                return (
                  <Pressable key={c} testID={`cell-${r}-${c}`} onPress={() => select(r, c)}
                    style={[s.cell, { width: cell, height: cell, backgroundColor: bg }]}>
                    {numbers.has(k(r, c)) && <Text style={[s.num, { color: t.number, fontSize: cell * 0.22 }]}>{numbers.get(k(r, c))}</Text>}
                    <Text style={[s.letter, { fontSize: cell * 0.56, lineHeight: cell * 0.8, color: bad ? t.wrong : t.cellText }]}>{letter}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <View style={s.panel}>
        <View style={s.clueRow}>
          <Pressable onPress={() => step(-1)} hitSlop={10} style={s.arrow}><Icon name="chevron-left" size={26} color="#3A4257" /></Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.clueHead}>{current.dir === 'across' ? 'Across' : 'Down'} {current.num}</Text>
            <Text style={s.clue} numberOfLines={2}>{current.clue} ({current.answer.length})</Text>
          </View>
          <Pressable onPress={() => step(1)} hitSlop={10} style={s.arrow}><Icon name="chevron-right" size={26} color="#3A4257" /></Pressable>
        </View>

        <View style={{ gap: 7, alignItems: 'center' }}>
          {ROWS.map((row, i) => (
            <View key={row} style={{ flexDirection: 'row', gap: 5 }}>
              {[...row].map((l) => (
                <Pressable key={l} onPress={() => type(l)} style={({ pressed }) => [s.key, { width: keyW }, pressed && s.keyDown]}>
                  <Text style={s.keyText}>{l}</Text>
                </Pressable>
              ))}
              {i === 2 && (
                <Pressable onPress={backspace} style={({ pressed }) => [s.key, s.back, { width: keyW * 1.5 }, pressed && s.keyDown]}>
                  <Icon name="backspace-outline" size={20} color="#fff" />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        <View style={s.powers}>
          <Power color="#8B5CF6" icon="lightbulb-on" cost={`${HINT_COST}`} coin onPress={hint} label="Hint" />
          <Power color="#EF4B5F" icon="eraser" cost={`${erasers}`} onPress={erase} label="Erase wrong" disabled={!erasers} />
          <Power color="#22C55E" icon="shuffle-variant" cost="∞" onPress={shuffleClue} label="Other clue" />
        </View>
      </View>

      {won && (
        <View style={s.overlay}>
          <View style={s.winCard}>
            <Icon name="trophy" size={64} color="#F5B301" />
            <Text style={s.winTitle}>Level {level} complete!</Text>
            <View style={[s.coins, { alignSelf: 'center', backgroundColor: '#FFF4D6' }]}>
              <View style={s.coinDot}><Text style={s.coinGlyph}>$</Text></View>
              <Text style={[s.coinText, { color: '#8A5A00' }]}>+{LEVEL_REWARD}</Text>
            </View>
            <Pressable onPress={onNext} style={s.nextBtn}>
              <Text style={s.nextText}>Next Level</Text>
            </Pressable>
            <Pressable onPress={onBack}><Text style={s.homeLink}>Home</Text></Pressable>
          </View>
          <Confetti />
        </View>
      )}
      <Toast text={toast} />
    </View>
  );
}

const inEntry = (e: Entry, r: number, c: number) => cellsOf(e).some(([y, x]) => y === r && x === c);

function Power({ color, icon, cost, coin, onPress, label, disabled }: {
  color: string; icon: any; cost: string; coin?: boolean; onPress: () => void; label: string; disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} style={{ alignItems: 'center', opacity: disabled ? 0.45 : 1 }}>
      <View style={[s.power, { backgroundColor: color, shadowColor: color }]}>
        <Icon name={icon} size={30} color="#fff" />
      </View>
      <View style={s.powerCost}>
        {coin && <View style={[s.coinDot, { width: 14, height: 14 }]}><Text style={[s.coinGlyph, { fontSize: 9 }]}>$</Text></View>}
        <Text style={s.powerCostText}>{cost}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 },
  level: { fontFamily: F.heavy, fontSize: 22 },
  diff: { fontFamily: F.regular, fontSize: 12, opacity: 0.75, marginTop: -4 },
  coins: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18, paddingLeft: 4, paddingRight: 12, paddingVertical: 3 },
  coinDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F5B301', borderWidth: 2, borderColor: '#FFD54A', alignItems: 'center', justifyContent: 'center' },
  coinGlyph: { color: '#fff', fontFamily: F.heavy, fontSize: 12, lineHeight: 16 },
  coinText: { fontFamily: F.heavy, fontSize: 16, color: '#3A4257' },
  board: { borderRadius: 14 },
  cell: { borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  num: { position: 'absolute', top: 1, left: 3, fontFamily: F.bold },
  letter: { fontFamily: F.heavy },
  panel: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 12, paddingBottom: 18, paddingHorizontal: 8, gap: 12 },
  clueRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F4FA', borderRadius: 16, marginHorizontal: 6, paddingVertical: 6 },
  arrow: { paddingHorizontal: 8 },
  clueHead: { fontFamily: F.heavy, fontSize: 16, color: '#1F2640' },
  clue: { fontFamily: F.regular, fontSize: 15, color: '#3A4257', textAlign: 'center', marginTop: -2 },
  key: { height: 46, borderRadius: 8, backgroundColor: '#F4F6FB', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 2, borderBottomColor: '#D5DBE7' },
  keyDown: { backgroundColor: '#DDE5F5', transform: [{ translateY: 1 }] },
  keyText: { fontFamily: F.heavy, fontSize: 19, color: '#1F2640' },
  back: { backgroundColor: '#2563EB', borderBottomColor: '#1B4DB8' },
  powers: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 2 },
  power: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  powerCost: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: -10, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 },
  powerCostText: { fontFamily: F.heavy, fontSize: 12, color: '#3A4257' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,14,40,0.55)', alignItems: 'center', justifyContent: 'center' },
  winCard: { backgroundColor: '#fff', borderRadius: 28, padding: 28, alignItems: 'center', gap: 12, width: 300 },
  winTitle: { fontFamily: F.heavy, fontSize: 26, color: '#1F2640', textAlign: 'center' },
  nextBtn: { backgroundColor: '#2563EB', borderRadius: 26, paddingVertical: 14, alignSelf: 'stretch', alignItems: 'center', borderBottomWidth: 4, borderBottomColor: '#1B4DB8' },
  nextText: { color: '#fff', fontFamily: F.heavy, fontSize: 20 },
  homeLink: { fontFamily: F.bold, color: '#6B7280', fontSize: 15 },
});
