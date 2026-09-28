import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { F } from '../ui';
import { FadeIn } from './motion';
import { DAILY_BONUS, HINT_COST } from './store';

const STEPS = [
  { icon: 'gesture-tap', color: '#2563EB', title: 'Pick a square',
    body: 'Tap a square to choose a word. Tap it again to switch between Across and Down. The clue shows below the grid.' },
  { icon: 'alphabetical-variant', color: '#8B5CF6', title: 'Tap the letters',
    body: 'Build the word from the letter tiles. Some are decoys! Use Mix to shuffle and Delete to undo. Prefer typing? Switch to the full keyboard in Settings.' },
  { icon: 'lightbulb-on', color: '#F59E0B', title: 'Stuck? Use power-ups',
    body: `Hint reveals a letter for ${HINT_COST} coins. Erase clears wrong letters. Shuffle jumps to another clue.` },
  { icon: 'trophy', color: '#16A34A', title: 'Earn coins every day',
    body: `Solve levels for coins, with a bonus when you use no hints. Come back daily for ${DAILY_BONUS} free coins and keep your streak going.` },
];

/** First-launch walkthrough, also reachable from Settings. */
export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <View style={s.overlay}>
      <FadeIn y={30} scale={0.96} style={s.card}>
        <FadeIn key={i} y={10} duration={380} style={{ alignItems: 'center', gap: 10 }}>
          <View style={[s.badge, { backgroundColor: step.color }]}><Icon name={step.icon as any} size={40} color="#fff" /></View>
          <Text style={s.title}>{step.title}</Text>
          <Text style={s.body}>{step.body}</Text>
        </FadeIn>
        <View style={s.dots}>
          {STEPS.map((_, k) => <View key={k} style={[s.dot, k === i && s.dotOn]} />)}
        </View>
        <Pressable onPress={() => (last ? onDone() : setI(i + 1))} style={s.btn} accessibilityRole="button">
          <Text style={s.btnText}>{last ? "Let's play" : 'Next'}</Text>
        </Pressable>
        {!last && <Pressable onPress={onDone} hitSlop={8}><Text style={s.skip}>Skip</Text></Pressable>}
      </FadeIn>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,14,40,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 28, padding: 24, alignItems: 'center', gap: 16, width: '100%', maxWidth: 360 },
  badge: { width: 80, height: 80, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F.heavy, fontSize: 24, color: '#1F2640', textAlign: 'center' },
  body: { fontFamily: F.regular, fontSize: 16, color: '#3A4257', textAlign: 'center', lineHeight: 22, minHeight: 88 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DDE3F0' },
  dotOn: { width: 22, backgroundColor: '#2563EB' },
  btn: { backgroundColor: '#2563EB', borderRadius: 24, paddingVertical: 13, alignSelf: 'stretch', alignItems: 'center', borderBottomWidth: 4, borderBottomColor: '#1B4DB8' },
  btnText: { color: '#fff', fontFamily: F.heavy, fontSize: 18 },
  skip: { fontFamily: F.bold, color: '#6B7280', fontSize: 14 },
});
