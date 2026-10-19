import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Theme, THEMES } from './themes';
import { updateGame, useGame } from './store';
import { F } from '../ui';
import { ScreenHeader } from './chrome';
import { Scenery } from './Scenery';
import { FadeIn } from './motion';

// A fixed little crossword shape used for every preview card.
const SHAPE = ['#####.', '#..#..', '######', '..#..#', '.#####', '.#..#.'];

function Preview({ t }: { t: Theme }) {
  return (
    <View style={{ gap: 3 }}>
      {SHAPE.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 3 }}>
          {[...row].map((ch, c) => (
            <View key={c} style={{ width: 15, height: 15, borderRadius: 3,
              backgroundColor: ch === '#' ? (r === 2 && c === 2 ? t.selected : t.cell) : 'transparent' }} />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function ThemesScreen({ onBack }: { onBack: () => void }) {
  const g = useGame();
  const { width } = useWindowDimensions();
  const cw = Math.floor((Math.min(width - 32, 440) - 14) / 2);
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Themes" onBack={onBack} />
      <ScrollView contentContainerStyle={s.wrap}>
        <Text style={s.sub}>Tap a theme to try it. The board and the scenery change together.</Text>
        <View style={s.grid}>
          {THEMES.map((t, i) => {
            const on = g.theme === t.id;
            return (
              <FadeIn key={t.id} delay={120 + i * 70} y={24}>
              <Pressable onPress={() => updateGame({ theme: t.id })}
                style={({ pressed }) => [s.card, { width: cw }, on && s.cardOn, pressed && { transform: [{ scale: 0.96 }] }]} accessibilityLabel={`${t.name} theme`} accessibilityState={{ selected: on }}>
                <View style={s.preview}>
                  <Scenery theme={t.id} particles={6} />
                  <View style={{ backgroundColor: t.board, padding: 5, borderRadius: 8 }}><Preview t={t} /></View>
                  {on && <View style={s.inUse}><Icon name="check-bold" size={12} color="#fff" /><Text style={s.inUseText}>In use</Text></View>}
                </View>
                <View style={s.nameRow}>
                  <Text style={[s.name, { color: t.label }]}>{t.name}</Text>
                </View>
              </Pressable>
              </FadeIn>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10 },
  title: { fontFamily: F.heavy, fontSize: 22, color: '#fff' },
  wrap: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 40 },
  sub: { fontFamily: F.bold, fontSize: 14, textAlign: 'center', color: 'rgba(255,255,255,0.8)', marginBottom: 14, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', maxWidth: 440 },
  inUse: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#22C55E', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  inUseText: { fontFamily: F.black, fontSize: 11.5, color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 6, borderWidth: 3, borderColor: 'transparent',
    shadowColor: '#10136B', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  cardOn: { borderColor: '#FFD94A', transform: [{ translateY: -4 }], shadowOpacity: 0.45 },
  preview: { borderRadius: 15, height: 150, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  name: { fontFamily: F.black, fontSize: 17 },
});
