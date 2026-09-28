import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { dayKey, streak, useGame } from './store';
import { F } from '../ui';

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function playTime(sec: number) {
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  return `${Math.floor(sec / 3600)}h`;
}

export default function StatsScreen({ onBack }: { onBack: () => void }) {
  const g = useGame();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const played = new Set(g.days);
  const today = dayKey();
  const accuracy = g.typed ? Math.round((g.correct / g.typed) * 100) : 0;

  const first = month.getDay();
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#4F6BFF', '#2F3FD6']} style={StyleSheet.absoluteFill} />
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={12}><Icon name="arrow-left" size={26} color="#fff" /></Pressable>
        <Text style={s.title}>Statistics</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={s.wrap}>
        <View style={s.sheet}>
          <View style={s.tiles}>
            <Tile bg="#FFF1DC" fg="#E07A00" icon="trophy" value={`${g.solved}`} label="Puzzles Solved" />
            <Tile bg="#EFE9FF" fg="#7C4DFF" icon="clock-outline" value={playTime(g.playSeconds)} label="Play Time" />
            <Tile bg="#E3F8EA" fg="#16A34A" icon="chart-bar" value={`${accuracy}%`} label="Accuracy" />
          </View>

          <View style={s.calHead}>
            <Pressable onPress={() => shift(-1)} hitSlop={10}><Icon name="chevron-left" size={24} color="#6B7280" /></Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.calTitle}>Daily Progress</Text>
              <Text style={s.calMonth}>{month.toLocaleString('en', { month: 'long', year: 'numeric' })}</Text>
            </View>
            <Pressable onPress={() => shift(1)} hitSlop={10}><Icon name="chevron-right" size={24} color="#6B7280" /></Pressable>
          </View>

          <View style={s.week}>{WEEK.map((w) => <Text key={w} style={s.weekDay}>{w}</Text>)}</View>
          <View style={s.days}>
            {cells.map((d, i) => {
              if (!d) return <View key={i} style={s.day} />;
              const key = dayKey(new Date(month.getFullYear(), month.getMonth(), d));
              const done = played.has(key), isToday = key === today;
              return (
                <View key={i} style={s.day}>
                  <View style={[s.dot, done && s.dotDone, isToday && !done && s.dotToday]}>
                    <Text style={[s.dayText, (done || isToday) && { color: '#fff' }]}>{d}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <Text style={s.streak}>🔥 Current streak: {streak(g.days)} day{streak(g.days) === 1 ? '' : 's'}</Text>
        </View>

        <LinearGradient colors={['#7C4DFF', '#5B3BE8']} style={s.banner}>
          <Icon name="bullseye-arrow" size={40} color="#fff" />
          <Text style={s.bannerText}>Build a daily habit{'\n'}one puzzle at a time!</Text>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

function Tile({ bg, fg, icon, value, label }: { bg: string; fg: string; icon: any; value: string; label: string }) {
  return (
    <View style={[s.tile, { backgroundColor: bg }]}>
      <Icon name={icon} size={30} color={fg} />
      <Text style={[s.tileValue, { color: fg }]}>{value}</Text>
      <Text style={[s.tileLabel, { color: fg }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10 },
  title: { fontFamily: F.heavy, fontSize: 22, color: '#fff' },
  wrap: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 40, gap: 16 },
  sheet: { backgroundColor: '#fff', borderRadius: 26, padding: 14, width: '100%', maxWidth: 440 },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, borderRadius: 18, alignItems: 'center', paddingVertical: 12 },
  tileValue: { fontFamily: F.heavy, fontSize: 26, lineHeight: 32, marginTop: 2 },
  tileLabel: { fontFamily: F.bold, fontSize: 11 },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingHorizontal: 6 },
  calTitle: { fontFamily: F.heavy, fontSize: 18, color: '#1F2640' },
  calMonth: { fontFamily: F.regular, fontSize: 14, color: '#6B7280', marginTop: -2 },
  week: { flexDirection: 'row', marginTop: 10 },
  weekDay: { flex: 1, textAlign: 'center', fontFamily: F.bold, fontSize: 12, color: '#6B7280' },
  days: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  day: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: '#22C55E' },
  dotToday: { backgroundColor: '#2563EB' },
  dayText: { fontFamily: F.bold, fontSize: 13, color: '#3A4257' },
  streak: { fontFamily: F.bold, fontSize: 14, color: '#3A4257', textAlign: 'center', marginTop: 8 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 18, width: '100%', maxWidth: 440 },
  bannerText: { fontFamily: F.heavy, fontSize: 18, color: '#fff', lineHeight: 23 },
});
