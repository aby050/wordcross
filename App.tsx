import { useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ArrowGame from './src/ArrowGame';
import WordGame from './src/WordGame';
import { PUZZLES } from './src/arrowPuzzles';
import { C } from './src/ui';
import { isMuted, setMuted } from './src/sound';
import { isUnlocked, useStars } from './src/progress';

type Screen = { kind: 'menu' } | { kind: 'arrow'; level: number } | { kind: 'word'; id: number };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'menu' });
  const [muted, setMutedState] = useState(isMuted());
  const toggleMute = () => { setMuted(!muted); setMutedState(!muted); };
  const menu = () => setScreen({ kind: 'menu' });
  const stars = useStars();
  const total = Object.values(stars).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="dark" />
      {screen.kind !== 'menu' && (
        <View style={s.header}>
          <Pressable onPress={menu} hitSlop={12}><Text style={s.back}>←</Text></Pressable>
          <Text style={s.title}>{screen.kind === 'arrow' ? `Crossword ${screen.level + 1}` : 'Word Board'}</Text>
          <Pressable onPress={toggleMute} hitSlop={12}><Text style={{ fontSize: 22 }}>{muted ? '🔇' : '🔊'}</Text></Pressable>
        </View>
      )}
      {screen.kind === 'menu' && (
        <ScrollView contentContainerStyle={s.menu}>
          <Text style={s.logo}>Word{'\n'}Cross</Text>
          <Text style={s.tag}>Crosswords & word battles vs a bot</Text>
          <Text style={s.section}>Word Board</Text>
          <Pressable style={s.big} onPress={() => setScreen({ kind: 'word', id: Date.now() })}>
            <Text style={s.bigText}>Play vs Bot</Text>
            <Text style={s.bigSub}>Make words · hit 2W / 3W · maximize your score</Text>
          </Pressable>
          <Text style={s.section}>Arrow Crossword · ★ {total}/{PUZZLES.length * 3}</Text>
          <View style={s.levels}>
            {PUZZLES.map((p, i) => (
              isUnlocked(stars, i) ? (
                <Pressable key={i} style={s.level} onPress={() => setScreen({ kind: 'arrow', level: i })}>
                  <Text style={s.levelNum}>{i + 1}</Text>
                  <Text style={s.levelStars}>
                    {stars[i] ? [1, 2, 3].map((k) => (k <= stars[i] ? '★' : '☆')).join('') : `${p.answers.length}×${p.answers.length}`}
                  </Text>
                </Pressable>
              ) : (
                <View key={i} style={[s.level, s.locked]}>
                  <Text style={{ fontSize: 20 }}>🔒</Text>
                  <Text style={s.levelSub}>{i + 1}</Text>
                </View>
              )
            ))}
          </View>
        </ScrollView>
      )}
      {screen.kind === 'arrow' && <ArrowGame key={screen.level} level={screen.level} puzzle={PUZZLES[screen.level]} onExit={menu}
        onNext={screen.level + 1 < PUZZLES.length ? () => setScreen({ kind: 'arrow', level: screen.level + 1 }) : undefined} />}
      {screen.kind === 'word' && <WordGame key={screen.id} onExit={menu} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, userSelect: 'none', backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? 32 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  back: { fontSize: 28, color: C.ink },
  title: { fontSize: 22, fontWeight: '800', color: C.ink },
  menu: { alignItems: 'center', padding: 24, paddingBottom: 48, gap: 12 },
  logo: { fontSize: 56, fontWeight: '900', color: C.ink, textAlign: 'center', lineHeight: 58, marginTop: 24 },
  tag: { color: '#8A94A8', fontSize: 15, marginBottom: 16 },
  section: { alignSelf: 'stretch', maxWidth: 420, fontSize: 18, fontWeight: '800', color: C.ink, marginTop: 12 },
  levels: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', maxWidth: 420, alignSelf: 'stretch' },
  level: { width: 64, height: 64, borderRadius: 18, backgroundColor: C.tile, borderWidth: 1.5, borderColor: C.tileEdge, alignItems: 'center', justifyContent: 'center' },
  levelNum: { fontSize: 28, fontWeight: '900', color: '#2B2F3A' },
  levelStars: { fontSize: 12, color: '#E0A10E', letterSpacing: 1 },
  locked: { backgroundColor: '#EEF1F6', borderColor: '#DDE2EA' },
  levelSub: { fontSize: 11, color: '#7A6440' },
  big: { alignSelf: 'stretch', maxWidth: 420, backgroundColor: C.blue, borderRadius: 24, padding: 20 },
  bigText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  bigSub: { color: '#DCEBFB', marginTop: 4 },
});
