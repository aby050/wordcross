import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { recordRecall, useGame } from './store';
import { F } from '../ui';
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
      <LinearGradient colors={['#4F6BFF', '#2F3FD6']} style={StyleSheet.absoluteFill} />
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={12}><Icon name="arrow-left" size={26} color="#fff" /></Pressable>
        <Text style={s.title}>Word Book</Text>
        <View style={{ width: 26 }} />
      </View>

      {words.length === 0 ? (
        <FadeIn y={20} style={s.empty}>
          <Icon name="book-open-page-variant" size={56} color="#fff" />
          <Text style={s.emptyText}>Every word you solve is saved here.{'\n'}Solve a puzzle to start your book!</Text>
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
                      <Text style={s.word}>{w.word}</Text>
                      <Text style={s.clue}>{w.clue}</Text>
                    </View>
                    {w.miss > 0 && <Icon name="alert-circle-outline" size={20} color="#E0564B" />}
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
      <Text style={s.blanks}>{shown ? card.word.split('').join(' ') : card.word.split('').map(() => '_').join(' ')}</Text>
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
  emptyText: { fontFamily: F.bold, fontSize: 17, color: '#fff', textAlign: 'center', lineHeight: 24 },
  tabs: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 8 },
  tab: { paddingHorizontal: 22, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)' },
  tabOn: { backgroundColor: '#fff' },
  tabText: { fontFamily: F.heavy, fontSize: 15, color: '#fff' },
  wrap: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  note: { fontFamily: F.bold, color: '#FFE14D', fontSize: 14 },
  sheet: { backgroundColor: '#fff', borderRadius: 22, paddingVertical: 6, paddingHorizontal: 14, width: '100%', maxWidth: 440 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E3E8F2' },
  word: { fontFamily: F.heavy, fontSize: 18, color: '#1F2640', letterSpacing: 1 },
  clue: { fontFamily: F.regular, fontSize: 13, color: '#6B7280', marginTop: -3 },
  count: { fontFamily: F.bold, fontSize: 13, color: '#6B7280' },
  card: { backgroundColor: '#fff', borderRadius: 26, margin: 20, padding: 24, alignItems: 'center', gap: 12, alignSelf: 'center', width: '90%', maxWidth: 420 },
  cardHead: { fontFamily: F.bold, fontSize: 14, color: '#6B7280' },
  cardClue: { fontFamily: F.heavy, fontSize: 22, color: '#1F2640', textAlign: 'center' },
  blanks: { fontFamily: F.heavy, fontSize: 30, color: '#2F3FD6', letterSpacing: 2, marginTop: 6 },
  len: { fontFamily: F.regular, fontSize: 13, color: '#6B7280' },
  btn: { borderRadius: 24, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center', alignSelf: 'stretch' },
  btnText: { fontFamily: F.heavy, fontSize: 17, color: '#fff' },
});
