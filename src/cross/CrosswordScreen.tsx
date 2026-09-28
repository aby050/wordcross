import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { cellsOf, Dir, Entry, generate, difficulty } from './generate';
import { dayKey, getGame, HINT_COST, LEVEL_REWARD, NO_HINT_BONUS, updateGame, useGame } from './store';
import { themeById } from './themes';
import { Scenery } from './Scenery';
import { Confetti, CountUp, F, Toast } from '../ui';
import { EASE, FadeIn, Rays } from './motion';
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
  // Solved-word light sweep: cell key → its position along the word.
  const [flash, setFlash] = useState<Map<string, number>>(new Map());
  const [sweepId, setSweepId] = useState(0);
  // Grid cascades in from the top-left on each level.
  const intro = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(intro, { toValue: 1, duration: 900, easing: EASE, useNativeDriver: Platform.OS !== 'web' }).start();
  }, []);
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
      setFlash(new Map(newly.flatMap((e) => cellsOf(e).map(([y, x], i) => [k(y, x), i] as [string, number]))));
      setSweepId((n) => n + 1);
      setTimeout(() => setFlash(new Map()), 1400);
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
    hintsUsed.current++;
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

  const hintsUsed = useRef(0);
  const [reward, setReward] = useState(LEVEL_REWARD);
  const win = () => {
    const reward = LEVEL_REWARD + (hintsUsed.current ? 0 : NO_HINT_BONUS);
    setReward(reward);
    setWon(true);
    play('win');
    flushStats();
    updateGame((s) => ({
      coins: s.coins + reward,
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

  const decoys = level <= 20 ? 2 : level <= 100 ? 3 : 4;
  const bank = useMemo(() => {
    const need = curCells.filter(([y, x]) => !locked.has(k(y, x))).map(([y, x]) => solution[y][x]!);
    let seed = level * 31 + current.num * 7 + (current.dir === 'down' ? 3 : 0);
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pool = 'EEAAIIOOUTNRSLDCMPBGHKWY';
    const extra = Array.from({ length: need.length ? decoys : 0 }, () => pool[Math.floor(rnd() * pool.length)]);
    const all = [...need, ...extra];
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    return all;
    // Recompute only when the word or its solved squares change.
  }, [current, locked.size]);
  // A bank tile counts as used while a matching letter sits in one of this word's open squares.
  const used = useMemo(() => {
    const typed = curCells.filter(([y, x]) => !locked.has(k(y, x)) && fill[y][x]).map(([y, x]) => fill[y][x]);
    return bank.map((l) => { const i = typed.indexOf(l); if (i < 0) return false; typed.splice(i, 1); return true; });
  }, [bank, fill]);
  const [bankOrder, setBankOrder] = useState(0);
  const shown = useMemo(() => {
    const idx = bank.map((_, i) => i);
    if (bankOrder) for (let i = idx.length - 1; i > 0; i--) { const j = (i * 7 + bankOrder * 3) % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx;
  }, [bank, bankOrder]);

  // Fit the grid to both the screen width and the space left between header and panel.
  const [areaH, setAreaH] = useState(0);
  const gridW = Math.min(width - 32, 440, areaH ? areaH - 16 : 440);
  const gap = 3;
  const cell = Math.floor((gridW - 8 - gap * (size - 1)) / size);
  const numbers = new Map(entries.map((e) => [k(e.row, e.col), e.num]));
  const keyW = Math.min(40, (Math.min(width, 520) - 16 - 9 * 5) / 10);
  const bankTile = Math.min(50, (Math.min(width, 520) - 40 - 6 * 8) / Math.max(7, Math.ceil(bank.length / (bank.length > 9 ? 2 : 1))));

  return (
    <View style={{ flex: 1 }}>
      <Scenery theme={t.id} />
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={12}><Icon name="arrow-left" size={26} color={t.headerText} /></Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={[s.level, { color: t.headerText }]}>Level {level}</Text>
          <Text style={[s.diff, { color: t.headerText }]}>{difficulty(level).label}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable onPress={() => updateGame({ input: game.input === 'keyboard' ? 'letters' : 'keyboard' })} hitSlop={8}
            style={s.modeBtn} accessibilityLabel={game.input === 'keyboard' ? 'Use letter tiles' : 'Use full keyboard'}>
            <Icon name={game.input === 'keyboard' ? 'view-grid-outline' : 'keyboard-outline'} size={20} color="#fff" />
          </Pressable>
          <View style={s.coins}>
            <View style={s.coinDot}><Text style={s.coinGlyph}>$</Text></View>
            <Text style={s.coinText}>{game.coins}</Text>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onLayout={(e) => setAreaH(e.nativeEvent.layout.height)}>
        <View style={[s.board, { width: gridW, backgroundColor: t.board, padding: 4, gap }]}>
          {solution.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row', gap }}>
              {row.map((sol, c) => {
                if (!sol) return <View key={c} style={{ width: cell, height: cell }} />;
                const isSel = sel[0] === r && sel[1] === c;
                const letter = fill[r][c];
                const bad = letter && letter !== sol && entries.some((e) => inEntry(e, r, c) && fullEntry(e));
                const bg = isSel ? t.selected : inCur(r, c) ? t.word : t.cell;
                const d = ((r + c) / (2 * size - 2)) * 0.6;
                return (
                  <Animated.View key={c} style={{
                    opacity: intro.interpolate({ inputRange: [d, d + 0.4], outputRange: [0, 1], extrapolate: 'clamp' }),
                    transform: [{ scale: intro.interpolate({ inputRange: [d, d + 0.4], outputRange: [0.4, 1], extrapolate: 'clamp' }) }],
                  }}>
                  <Pressable testID={`cell-${r}-${c}`} onPress={() => select(r, c)}
                    style={[s.cell, { width: cell, height: cell, backgroundColor: bg }]}>
                    {flash.has(k(r, c)) && <Sweep key={sweepId} index={flash.get(k(r, c))!} color={t.selected} />}
                    {numbers.has(k(r, c)) && <Text style={[s.num, { color: t.number, fontSize: cell * 0.22 }]}>{numbers.get(k(r, c))}</Text>}
                    {letter ? <Letter key={letter} ch={letter} size={cell} color={bad ? t.wrong : t.cellText} pulse={flash.has(k(r, c)) ? flash.get(k(r, c))! : -1} sweepId={sweepId} /> : null}
                  </Pressable>
                  </Animated.View>
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

        {game.input === 'keyboard' ? (
        <FadeIn y={10} duration={300} style={{ gap: 7, alignItems: 'center' }}>
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
        </FadeIn>

        ) : (
          <View style={s.bankWrap}>
            <View key={`${current.dir}${current.num}`} style={s.bank}>
              {shown.map((i, n) => (
                <FadeIn key={i} delay={n * 35} y={14} duration={380}>
                  <Pressable testID={`bank-${n}`} onPress={() => !used[i] && type(bank[i])} disabled={used[i]}
                    style={({ pressed }) => [s.bankTile, { width: bankTile, height: bankTile }, used[i] && s.bankUsed, pressed && { transform: [{ scale: 0.94 }] }]}>
                    <Text style={[s.bankText, { fontSize: bankTile * 0.5, lineHeight: bankTile * 0.66 }]}>{bank[i]}</Text>
                  </Pressable>
                </FadeIn>
              ))}
            </View>
            <View style={s.bankTools}>
              <Pressable onPress={() => setBankOrder((n) => n + 1)} style={s.bankTool} accessibilityLabel="Shuffle letters">
                <Icon name="rotate-3d-variant" size={20} color="#3A4257" /><Text style={s.bankToolText}>Mix</Text>
              </Pressable>
              <Pressable onPress={backspace} style={[s.bankTool, { backgroundColor: '#2563EB' }]} accessibilityLabel="Delete letter">
                <Icon name="backspace-outline" size={20} color="#fff" /><Text style={[s.bankToolText, { color: '#fff' }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={s.powers}>
          <Power color="#8B5CF6" icon="lightbulb-on" cost={`${HINT_COST}`} coin onPress={hint} label="Hint" />
          <Power color="#EF4B5F" icon="eraser" cost={`${erasers}`} onPress={erase} label="Erase wrong" disabled={!erasers} />
          <Power color="#22C55E" icon="shuffle-variant" cost="∞" onPress={shuffleClue} label="Other clue" />
        </View>
      </View>

      {won && (
        <FadeIn y={0} duration={400} style={s.overlay}>
          <FadeIn delay={250} y={40} scale={0.92} duration={700} style={s.winCard}>
            <View style={{ width: 140, height: 110, alignItems: 'center', justifyContent: 'center' }}>
              <Rays size={230} />
              <FadeIn delay={600} scale={0.5} y={0} duration={650}><Icon name="trophy" size={72} color="#F5B301" /></FadeIn>
            </View>
            <Text style={s.winTitle}>Level {level} complete!</Text>
            {reward > LEVEL_REWARD && <Text style={s.noHint}>No-hint bonus +{NO_HINT_BONUS}</Text>}
            <FadeIn delay={900} y={10} style={[s.coins, { alignSelf: 'center', backgroundColor: '#FFF4D6' }]}>
              <View style={s.coinDot}><Text style={s.coinGlyph}>$</Text></View>
              <Text style={[s.coinText, { color: '#8A5A00' }]}>+</Text>
              <WinCoins amount={reward} />
            </FadeIn>
            <Pressable onPress={onNext} style={s.nextBtn}>
              <Text style={s.nextText}>Next Level</Text>
            </Pressable>
            <Pressable onPress={onBack}><Text style={s.homeLink}>Home</Text></Pressable>
          </FadeIn>
          <Confetti />
        </FadeIn>
      )}
      <Toast text={toast} />
    </View>
  );
}

/** Coin reward rolling up from 0 once the card is in. */
function WinCoins({ amount }: { amount: number }) {
  const [v, setV] = useState(0);
  useEffect(() => { const id = setTimeout(() => setV(amount), 950); return () => clearTimeout(id); }, []);
  return <CountUp value={v} style={[s.coinText, { color: '#8A5A00' }]} />;
}

/** Letters ease in when typed, and lift gently as the solve sweep passes over them. */
function Letter({ ch, size, color, pulse, sweepId }: { ch: string; size: number; color: string; pulse: number; sweepId: number }) {
  const a = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const nd = Platform.OS !== 'web';
  useEffect(() => { Animated.timing(a, { toValue: 1, duration: 180, easing: EASE, useNativeDriver: nd }).start(); }, []);
  useEffect(() => {
    if (pulse < 0) return;
    Animated.sequence([
      Animated.delay(pulse * 70),
      Animated.timing(lift, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: nd }),
      Animated.timing(lift, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: nd }),
    ]).start();
  }, [sweepId]);
  return (
    <Animated.Text style={[s.letter, { fontSize: size * 0.56, lineHeight: size * 0.8, color, opacity: a,
      transform: [
        { scale: Animated.add(a.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }), lift.interpolate({ inputRange: [0, 1], outputRange: [0, 0.12] })) },
        { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
      ] }]}>{ch}</Animated.Text>
  );
}

/** A wash of the theme's highlight that travels along a newly solved word. */
function Sweep({ index, color }: { index: number; color: string }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const nd = Platform.OS !== 'web';
    Animated.sequence([
      Animated.delay(index * 70),
      Animated.timing(a, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: nd }),
      Animated.timing(a, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: nd }),
    ]).start();
  }, []);
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 5, backgroundColor: color, opacity: a }]} />;
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
  level: { fontFamily: F.heavy, fontSize: 22, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  diff: { fontFamily: F.regular, fontSize: 12, opacity: 0.75, marginTop: -4 },
  coins: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18, paddingLeft: 4, paddingRight: 12, paddingVertical: 3 },
  coinDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F5B301', borderWidth: 2, borderColor: '#FFD54A', alignItems: 'center', justifyContent: 'center' },
  coinGlyph: { color: '#fff', fontFamily: F.heavy, fontSize: 12, lineHeight: 16 },
  coinText: { fontFamily: F.heavy, fontSize: 16, color: '#3A4257' },
  board: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  cell: { borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  num: { position: 'absolute', top: 1, left: 3, fontFamily: F.bold },
  letter: { fontFamily: F.heavy },
  panel: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 12, paddingBottom: 18, paddingHorizontal: 8, gap: 12 },
  clueRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F4FA', borderRadius: 16, marginHorizontal: 6, paddingVertical: 6, alignSelf: 'center', width: '96%', maxWidth: 560 },
  arrow: { paddingHorizontal: 8 },
  clueHead: { fontFamily: F.heavy, fontSize: 16, color: '#1F2640' },
  clue: { fontFamily: F.regular, fontSize: 15, color: '#3A4257', textAlign: 'center', marginTop: -2 },
  modeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  bankWrap: { alignItems: 'center', gap: 12, minHeight: 170, justifyContent: 'center' },
  bank: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  bankTile: { borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#E3E8F2', borderBottomWidth: 4, borderBottomColor: '#C9D2E3',
    shadowColor: '#1F2A6B', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  bankUsed: { opacity: 0.25, transform: [{ scale: 0.9 }] },
  bankText: { fontFamily: F.heavy, color: '#1F2A6B' },
  bankTools: { flexDirection: 'row', gap: 12 },
  bankTool: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F4FA', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  bankToolText: { fontFamily: F.bold, fontSize: 14, color: '#3A4257' },
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
  winCard: { backgroundColor: '#fff', borderRadius: 28, padding: 28, alignItems: 'center', gap: 12, width: 300, overflow: 'hidden' },
  winTitle: { fontFamily: F.heavy, fontSize: 26, color: '#1F2640', textAlign: 'center' },
  nextBtn: { backgroundColor: '#2563EB', borderRadius: 26, paddingVertical: 14, alignSelf: 'stretch', alignItems: 'center', borderBottomWidth: 4, borderBottomColor: '#1B4DB8' },
  nextText: { color: '#fff', fontFamily: F.heavy, fontSize: 20 },
  noHint: { fontFamily: F.bold, fontSize: 13, color: '#16A34A', marginTop: -6 },
  homeLink: { fontFamily: F.bold, color: '#6B7280', fontSize: 15 },
});
