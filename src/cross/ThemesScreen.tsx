import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Theme, THEMES } from './themes';
import { updateGame, useGame } from './store';
import { F } from '../ui';

// A fixed little crossword shape used for every preview card.
const SHAPE = ['#####.', '#..#..', '######', '..#..#', '.#####', '.#..#.'];

function Preview({ t }: { t: Theme }) {
  return (
    <View style={{ gap: 3 }}>
      {SHAPE.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 3 }}>
          {[...row].map((ch, c) => (
            <View key={c} style={{ width: 18, height: 18, borderRadius: 3,
              backgroundColor: ch === '#' ? (r === 2 && c === 2 ? t.selected : t.cell) : 'transparent' }} />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function ThemesScreen({ onBack }: { onBack: () => void }) {
  const g = useGame();
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#4F6BFF', '#2F3FD6']} style={StyleSheet.absoluteFill} />
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={12}><Icon name="arrow-left" size={26} color="#fff" /></Pressable>
        <Text style={s.title}>Themes</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={s.wrap}>
        <Text style={s.head}>Beautiful Themes</Text>
        <Text style={s.sub}>Play with styles you love!</Text>
        <View style={s.grid}>
          {THEMES.map((t) => {
            const on = g.theme === t.id;
            return (
              <Pressable key={t.id} onPress={() => updateGame({ theme: t.id })}
                style={[s.card, on && s.cardOn]} accessibilityLabel={`${t.name} theme`} accessibilityState={{ selected: on }}>
                <LinearGradient colors={[t.board, t.bg[1]]} style={s.preview}><Preview t={t} /></LinearGradient>
                <View style={s.nameRow}>
                  <Text style={[s.name, { color: t.label }]}>{t.name}</Text>
                  {on && <Icon name="check-circle" size={20} color="#22C55E" />}
                </View>
              </Pressable>
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
  head: { fontFamily: F.heavy, fontSize: 34, color: '#fff', textAlign: 'center' },
  sub: { fontFamily: F.bold, fontSize: 16, color: '#DDE3FF', marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', maxWidth: 440 },
  card: { width: 160, backgroundColor: '#fff', borderRadius: 20, padding: 6, borderWidth: 3, borderColor: 'transparent',
    shadowColor: '#10136B', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  cardOn: { borderColor: '#FFD94A' },
  preview: { borderRadius: 15, height: 150, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  name: { fontFamily: F.heavy, fontSize: 18 },
});
