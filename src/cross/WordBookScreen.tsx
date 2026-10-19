import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { recordRecall, useGame } from './store';
import { F } from '../ui';
import { Art, ScreenHeader } from './chrome';
import { SoftGlow } from './Chest';
import { FadeIn } from './motion';

type Mode = 'list' | 'quiz';

export default function WordBookScreen({ onBack }: { onBack: () => void }) {
  const g = useGame();
  const [mode, setMode] = useState<Mode>('list');
  const words = useMemo(
    () => Object.entries(g.book).map(([word, w]) => ({ word, ...w })).sort((a, b) => b.miss - a.miss || a.word.localeCompare(b.word)),
    [g.book],
  );
  const tricky = words.filter((w) => w.miss > 0).length;

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Word Book" onBack={onBack} />

      {words.length === 0 ? (
        <FadeIn y={20} style={s.empty}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}><View style={{ position: 'absolute' }}><SoftGlow size={220} color="#7DB4FF" /></View><Art name="book" size={110} /></View>
          <Text style={s.emptyTitle}>Your Word Book is empty</Text>
          <Text style={s.emptyText}>Every word you solve is saved here, so you can quiz yourself later.</Text>
        </FadeIn>
      ) : (
        <>
          <View style={s.tabs}>
            <Tab on={mode === 'list'} label={`Words ${words.length}`} onPress={() => setMode('list')} />
            <Tab on={mode === 'quiz'} label="Quiz me" onPress={() => setMode('quiz')} />
          </View>
          {mode === 'list' ? (
            <ScrollView contentContainerStyle={s.wrap}>
              {tricky > 0 && <Text style={s.note}>{tricky} tricky word{tricky === 1 ? '' : 's'} first</Text>}
              <View style={s.sheet}>
                {words.map((w) => (
                  <View key={w.word} style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Tiles word={w.word} />
                      <Text style={s.clue}>{w.clue}</Text>
                    </View>
                    {w.miss > 0 && <View style={s.tricky}><Text style={s.trickyText}>Tricky</Text></View>}
                    <Text style={s.count}>×{w.n}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <Quiz words={words} />
          )}
        </>
      )}
    </View>
  );
}

/** A word as a row of little crossword squares; hidden shows empty squares. */
function Tiles({ word, hidden, size = 24 }: { word: string; hidden?: boolean; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3, marginBottom: 3 }}>
      {word.split('').map((ch, i) => (
        <View key={i} style={[s.tile, { width: size, height: size, borderRadius: size * 0.22 }, hidden && s.tileHidden]}>
          {!hidden && <Text style={[s.tileText, { fontSize: size * 0.58, lineHeight: size * 0.8 }]}>{ch}</Text>}
        </View>
      ))}
    </View>
  );
}

const Tab = ({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={[s.tab, on && s.tabOn]}>
    <Text style={[s.tabText, on && { color: '#2F3FD6' }]}>{label}</Text>
  </Pressable>
);

/** Flashcards: words you missed before come up more often. */
function Quiz({ words }: { words: { word: string; clue: string; miss: number }[] }) {
  const [round, setRound] = useState(0);
  const [shown, setShown] = useState(false);
  const card = useMemo(() => {
    const pool = words.flatMap((w) => Array(1 + w.miss * 2).fill(w));
    return pool[Math.floor(Math.random() * pool.length)] as (typeof words)[number];
    // A fresh card only when the round changes, not when a result updates the miss count.
  }, [round]);

  const answer = (ok: boolean) => { recordRecall(card.word, ok); setShown(false); setRound((n) => n + 1); };

  return (
    <FadeIn key={round} y={20} duration={400} style={s.card}>
      <Text style={s.cardHead}>What is the word?</Text>
      <Text style={s.cardClue}>{card.clue}</Text>
      <Tiles word={card.word} hidden={!shown} size={Math.min(40, 280 / card.word.length)} />
      <Text style={s.len}>{card.word.length} letters</Text>
      {!shown ? (
        <Pressable onPress={() => setShown(true)} style={[s.btn, { backgroundColor: '#2563EB' }]}><Text style={s.btnText}>Show answer</Text></Pressable>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
          <Pressable onPress={() => answer(false)} style={[s.btn, { flex: 1, backgroundColor: '#E0564B' }]}><Text style={s.btnText}>Missed it</Text></Pressable>
          <Pressable onPress={() => answer(true)} style={[s.btn, { flex: 1, backgroundColor: '#16A34A' }]}><Text style={s.btnText}>Knew it</Text></Pressable>
        </View>
      )}
    </FadeIn>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10 },
  title: { fontFamily: F.heavy, fontSize: 22, color: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 30 },
  emptyTitle: { fontFamily: F.black, fontSize: 22, color: '#fff', textAlign: 'center' },
  emptyText: { fontFamily: F.bold, fontSize: 15, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  tile: { backgroundColor: '#EEF1FA', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: '#C9D0E6' },
  tileHidden: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#C9D0E6' },
  tileText: { fontFamily: F.black, color: '#1E2766' },
  tricky: { backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  trickyText: { fontFamily: F.heavy, fontSize: 11, color: '#DC2626' },
  tabs: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 8 },
  tab: { paddingHorizontal: 22, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(10,12,48,0.38)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.22)' },
  tabOn: { backgroundColor: '#fff' },
  tabText: { fontFamily: F.heavy, fontSize: 15, color: '#fff' },
  wrap: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  note: { fontFamily: F.bold, color: '#FFE14D', fontSize: 14 },
  sheet: { backgroundColor: '#fff', borderRadius: 22, paddingVertical: 6, paddingHorizontal: 14, width: '100%', maxWidth: 440 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E3E8F2' },
  word: { fontFamily: F.heavy, fontSize: 18, color: '#1F2640', letterSpacing: 1 },
  clue: { fontFamily: F.regular, fontSize: 13, color: '#6B7280' },
  count: { fontFamily: F.bold, fontSize: 13, color: '#6B7280' },
  card: { backgroundColor: '#fff', borderRadius: 26, margin: 20, padding: 24, alignItems: 'center', gap: 12, alignSelf: 'center', width: '90%', maxWidth: 420 },
  cardHead: { fontFamily: F.bold, fontSize: 14, color: '#6B7280' },
  cardClue: { fontFamily: F.heavy, fontSize: 22, color: '#1F2640', textAlign: 'center' },
  blanks: { fontFamily: F.heavy, fontSize: 30, color: '#2F3FD6', letterSpacing: 2, marginTop: 6 },
  len: { fontFamily: F.regular, fontSize: 13, color: '#6B7280' },
  btn: { borderRadius: 24, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center', alignSelf: 'stretch' },
  btnText: { fontFamily: F.heavy, fontSize: 17, color: '#fff' },
});
