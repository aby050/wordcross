import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Board, emptyBoard, findMove, N, newBag, Placement, PREMIUM, validateMove, VALUES } from './scrabble';
import { C, MainButton, RoundButton, ScoreBar, Tile, Toast } from './ui';
import { DragTile, hitCell } from './drag';

const PREMIUM_COLOR: Record<string, string> = {
  '2L': '#F4B183', '3L': '#8E9BD1', '2W': '#EC8F80', '3W': '#6FBF83', '★': '#EC8F80',
};

export default function WordGame({ onExit }: { onExit: () => void }) {
  const { width } = useWindowDimensions();
  const cell = Math.floor(Math.min(width - 24, 520) / N);

  const bag = useRef(newBag());
  const draw = (rack: string[]) => { const r = rack.slice(); while (r.length < 7 && bag.current.length) r.push(bag.current.pop()!); return r; };

  const [board, setBoard] = useState<Board>(emptyBoard);
  const [rack, setRack] = useState<string[]>(() => draw([]));
  const [botRack, setBotRack] = useState<string[]>(() => draw([]));
  const [placed, setPlaced] = useState<Placement[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [you, setYou] = useState(0);
  const [opp, setOpp] = useState(0);
  const [turn, setTurn] = useState<'you' | 'opp'>('you');
  const [hints, setHints] = useState(3);
  const [passes, setPasses] = useState(0);
  const [lastWord, setLastWord] = useState<Placement[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const say = (t: string) => { setToast(t); setTimeout(() => setToast(null), 1600); };
  const preview = placed.length ? validateMove(board, placed) : null;
  const placedAt = (r: number, c: number) => placed.find((p) => p.r === r && p.c === c);

  const boardRef = useRef<View>(null);
  const free = (r: number, c: number) => !board[r][c] && !placedAt(r, c);

  const placeFromRack = (i: number, r: number, c: number) => {
    if (turn !== 'you' || over || !free(r, c)) return;
    setPlaced([...placed, { r, c, letter: rack[i] }]);
    setRack(rack.filter((_, k) => k !== i));
    setSel(null);
  };

  const tapCell = (r: number, c: number) => {
    if (turn !== 'you' || over) return;
    const p = placedAt(r, c);
    if (p) { setPlaced(placed.filter((x) => x !== p)); setRack([...rack, p.letter]); return; }
    if (sel !== null) placeFromRack(sel, r, c);
  };

  const hit = (x: number, y: number, cb: (rc: [number, number] | null) => void) =>
    hitCell(boardRef, x, y, 2, cell, N, cb);

  const dropRack = (i: number, x: number, y: number) =>
    hit(x, y, (rc) => { if (rc) placeFromRack(i, rc[0], rc[1]); });

  // A tile placed this turn: move it, or return it to the rack when dropped off the board.
  const dropPlaced = (p: Placement, x: number, y: number) => hit(x, y, (rc) => {
    if (rc && (rc[0] !== p.r || rc[1] !== p.c)) {
      if (free(rc[0], rc[1])) setPlaced(placed.map((q) => (q === p ? { ...q, r: rc[0], c: rc[1] } : q)));
    } else if (!rc) {
      setPlaced(placed.filter((q) => q !== p)); setRack([...rack, p.letter]);
    }
  });

  // Reorder the rack by dragging a tile along it.
  const rackRef = useRef<View>(null);
  const rackTile = Math.min(48, (width - 80) / 7);
  const dropOnRack = (i: number, x: number, y: number) => {
    rackRef.current?.measureInWindow((rx, ry, rw, rh) => {
      if (y < ry - 20 || y > ry + rh + 20) return dropRack(i, x, y);
      const to = Math.max(0, Math.min(rack.length - 1, Math.floor((x - rx) / (rackTile + 6))));
      const next = rack.slice(); const [l] = next.splice(i, 1); next.splice(to, 0, l);
      setRack(next); setSel(null);
    });
  };

  const recall = () => { setRack([...rack, ...placed.map((p) => p.letter)]); setPlaced([]); };

  const finish = (b: Board, yourRack: string[], oppRack: string[], passCount: number) => {
    const out = (!bag.current.length && (!yourRack.length || !oppRack.length)) || passCount >= 4;
    if (out) setOver(true);
    return out;
  };

  const submit = () => {
    if (!placed.length) { // pass
      const pc = passes + 1;
      setPasses(pc);
      say('You passed');
      if (!finish(board, rack, botRack, pc)) botTurn(board, botRack, rack, pc);
      return;
    }
    const res = validateMove(board, placed);
    if (!res.ok) { say(res.error); return; }
    const next = board.map((row) => row.slice());
    placed.forEach((p) => { next[p.r][p.c] = p.letter; });
    const newRack = draw(rack);
    setBoard(next); setRack(newRack); setLastWord(placed); setPlaced([]);
    setYou((v) => v + res.score); setPasses(0);
    say(`${res.words.join(', ')}  +${res.score}`);
    if (!finish(next, newRack, botRack, 0)) botTurn(next, botRack, newRack, 0);
  };

  const botTurn = (b: Board, br: string[], yr: string[], pc: number) => {
    setTurn('opp');
    setTimeout(() => {
      const move = findMove(b, br, 0.75);
      if (!move) {
        // Swap a few tiles when stuck.
        const keep = br.slice(3);
        bag.current.unshift(...br.slice(0, 3));
        const nr = draw(keep);
        setBotRack(nr);
        setPasses(pc + 1);
        say('Bot swapped tiles');
        setTurn('you');
        finish(b, yr, nr, pc + 1);
        return;
      }
      const next = b.map((row) => row.slice());
      const left = br.slice();
      move.placed.forEach((p) => { next[p.r][p.c] = p.letter; left.splice(left.indexOf(p.letter), 1); });
      const nr = draw(left);
      setBoard(next); setBotRack(nr); setLastWord(move.placed);
      setOpp((v) => v + move.score); setPasses(0);
      say(`Bot +${move.score}`);
      setTurn('you');
      finish(next, yr, nr, 0);
    }, 700);
  };

  const swap = () => {
    if (turn !== 'you' || !bag.current.length) return;
    const all = [...rack, ...placed.map((p) => p.letter)];
    bag.current.unshift(...all);
    for (let i = bag.current.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag.current[i], bag.current[j]] = [bag.current[j], bag.current[i]]; }
    const nr = draw([]);
    setPlaced([]); setRack(nr);
    const pc = passes + 1; setPasses(pc);
    say('Tiles swapped');
    if (!finish(board, nr, botRack, pc)) botTurn(board, botRack, nr, pc);
  };

  const hint = () => {
    if (!hints || turn !== 'you') return;
    const all = [...rack, ...placed.map((p) => p.letter)];
    const move = findMove(board, all, 1);
    if (!move) { say('No moves — try Swap'); return; }
    const left = all.slice();
    move.placed.forEach((p) => left.splice(left.indexOf(p.letter), 1));
    setPlaced(move.placed); setRack(left); setHints(hints - 1);
  };

  const winner = you === opp ? "It's a tie!" : you > opp ? 'You win! 🎉' : 'Bot wins';

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <ScoreBar you={you} opp={opp} turn={turn} />
      <View ref={boardRef} collapsable={false} style={st.board}>
        {board.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {row.map((l, c) => {
              const p = placedAt(r, c);
              const pr = PREMIUM[r][c];
              const recent = lastWord.some((x) => x.r === r && x.c === c);
              return (
                <Pressable key={c} onPress={() => tapCell(r, c)}
                  style={[st.cell, { width: cell, height: cell }, !l && !p && pr && { backgroundColor: PREMIUM_COLOR[pr] }]}>
                  {l ? <Tile letter={l} value={VALUES[l]} size={cell - 2} onPress={() => tapCell(r, c)}
                    style={recent ? { borderColor: '#F2B01E', borderWidth: 2 } : undefined} />
                    : p ? <DragTile letter={p.letter} value={VALUES[p.letter]} size={cell - 2} highlight={C.blue}
                      disabled={turn !== 'you' || over} onTap={() => tapCell(r, c)} onDrop={(x, y) => dropPlaced(p, x, y)} />
                      : pr ? <Text style={[st.prem, { fontSize: cell * 0.3 }]}>{pr}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <Text style={st.info}>
        {over ? winner : preview ? (preview.ok ? `${preview.words.join(', ')} · ${preview.score} pts` : preview.error)
          : `${bag.current.length} letters left`}
      </Text>

      <View ref={rackRef} collapsable={false} style={st.rack}>
        {rack.map((l, i) => (
          <DragTile key={`${i}${l}`} letter={l} value={VALUES[l]} size={rackTile} selected={sel === i}
            faded={turn !== 'you'} disabled={turn !== 'you' || over}
            onTap={() => setSel(sel === i ? null : i)} onDrop={(x, y) => dropOnRack(i, x, y)} />
        ))}
      </View>

      <View style={st.bar}>
        <RoundButton icon="🔄" label="Swap" onPress={swap} disabled={turn !== 'you' || over} />
        <RoundButton icon="↩️" label="Recall" onPress={recall} disabled={!placed.length} />
        {over ? <MainButton label="Menu" onPress={onExit} />
          : <MainButton label={placed.length ? '✓ Submit' : 'Pass'} onPress={submit}
            disabled={turn !== 'you' || (!!preview && !preview.ok)} />}
        <RoundButton icon="💡" label="Hint" badge={hints} onPress={hint} disabled={!hints || turn !== 'you' || over} />
      </View>
      <Toast text={toast} />
    </View>
  );
}

const st = StyleSheet.create({
  board: { backgroundColor: '#fff', padding: 2, borderRadius: 8 },
  cell: { margin: 0, borderWidth: 1, borderColor: '#fff', backgroundColor: '#EDF0F5', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  prem: { color: '#fff', fontWeight: '800' },
  info: { color: '#8A94A8', marginTop: 10, fontWeight: '600' },
  rack: { flexDirection: 'row', gap: 6, marginTop: 14, minHeight: 56, alignItems: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, marginTop: 'auto', marginBottom: 16, width: '100%', maxWidth: 520 },
});
