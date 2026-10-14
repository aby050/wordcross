import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { dayKey, streak, useGame } from './store';
import { CountUp, F } from '../ui';
import { FadeIn } from './motion';
import { AWARDS, progressOf, rankOf } from './awards';

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
  const rk = rankOf(g);
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
        <Text style={s.title}>Rank & Awards</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={s.wrap}>
        <FadeIn delay={300} y={20} style={s.rankCard}>
          <View style={[s.rankBadge, { backgroundColor: rk.rank.color }]}><Icon name={rk.rank.icon as any} size={34} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.rankLabel}>Your rank</Text>
            <Text style={s.rankName}>{rk.rank.name}</Text>
            <View style={s.bar}><View style={[s.barFill, { width: `${Math.round(rk.progress * 100)}%`, backgroundColor: rk.rank.color }]} /></View>
            <Text style={s.rankSub}>{rk.next ? `${rk.next.at - rk.score} points to ${rk.next.name}` : 'Top rank reached'}</Text>
          </View>
        </FadeIn>
        <Text style={s.rankHint}>Points: 1 per level + 3 per award</Text>

        <FadeIn delay={380} y={16} style={s.bests}>
          <Best icon="fire" label="Best streak" value={`${g.bestStreak}d`} />
          <Best icon="brain" label="No-hint levels" value={`${g.noHint}`} />
          <Best icon="book-open-variant" label="Words saved" value={`${Object.keys(g.book).length}`} />
        </FadeIn>

        <FadeIn y={30} duration={600} style={s.sheet}>
          <View style={s.tiles}>
            <Tile i={0} bg="#FFF1DC" fg="#E07A00" icon="trophy" num={g.solved} label="Puzzles Solved" />
            <Tile i={1} bg="#EFE9FF" fg="#7C4DFF" icon="clock-outline" value={playTime(g.playSeconds)} label="Play Time" />
            <Tile i={2} bg="#E3F8EA" fg="#16A34A" icon="chart-bar" num={accuracy} suffix="%" label="Accuracy" />
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
                <FadeIn key={`${month.getMonth()}-${i}`} delay={350 + i * 12} y={6} duration={420} style={s.day}>
                  <View style={[s.dot, done && s.dotDone, isToday && !done && s.dotToday]}>
                    <Text style={[s.dayText, (done || isToday) && { color: '#fff' }]}>{d}</Text>
                  </View>
                </FadeIn>
              );
            })}
          </View>
          <Text style={s.streak}>🔥 Current streak: {streak(g.days)} day{streak(g.days) === 1 ? '' : 's'}</Text>
        </FadeIn>

        <Text style={s.section}>Awards {g.awards.length}/{AWARDS.length}</Text>
        <View style={s.awardGrid}>
          {AWARDS.map((a, i) => {
            const done = g.awards.includes(a.id);
            const v = progressOf(a, g);
            return (
              <FadeIn key={a.id} delay={420 + i * 40} y={14} style={done ? { ...s.award, borderColor: a.color } : s.award}>
                <View style={[s.awardIcon, { backgroundColor: done ? a.color : '#E3E8F2' }]}>
                  <Icon name={(done ? a.icon : 'lock-outline') as any} size={22} color={done ? '#fff' : '#9AA3B5'} />
                </View>
                <Text style={s.awardTitle} numberOfLines={1}>{a.title}</Text>
                <Text style={s.awardDesc} numberOfLines={2}>{a.desc}</Text>
                {done ? <Text style={[s.awardState, { color: '#16A34A' }]}>Earned · +{a.reward}</Text> : (
                  <>
                    <View style={s.bar}><View style={[s.barFill, { width: `${Math.round((v / a.goal) * 100)}%`, backgroundColor: a.color }]} /></View>
                    <Text style={s.awardState}>{a.id === 'time5' ? `${Math.floor(v / 3600)}/${a.goal / 3600}h` : a.id === 'sharp' ? `${v}%/${a.goal}%` : `${v}/${a.goal}`} · +{a.reward}</Text>
                  </>
                )}
              </FadeIn>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function Best({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={s.best}>
      <Icon name={icon} size={20} color="#2F3FD6" />
      <Text style={s.bestValue}>{value}</Text>
      <Text style={s.bestLabel}>{label}</Text>
    </View>
  );
}

function Tile({ i, bg, fg, icon, value, num, suffix = '', label }: {
  i: number; bg: string; fg: string; icon: any; value?: string; num?: number; suffix?: string; label: string;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => { const id = setTimeout(() => setShown(num ?? 0), 300 + i * 120); return () => clearTimeout(id); }, [num]);
  return (
    <FadeIn delay={200 + i * 120} y={16} style={[s.tile, { backgroundColor: bg }]}>
      <Icon name={icon} size={30} color={fg} />
      {num !== undefined
        ? <Text style={[s.tileValue, { color: fg }]}><CountUp value={shown} style={[s.tileValue, { color: fg }]} />{suffix}</Text>
        : <Text style={[s.tileValue, { color: fg }]}>{value}</Text>}
      <Text style={[s.tileLabel, { color: fg }]}>{label}</Text>
    </FadeIn>
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
  rankCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 22, padding: 16, width: '100%', maxWidth: 440 },
  rankBadge: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  rankLabel: { fontFamily: F.bold, fontSize: 12, color: '#6B7280' },
  rankName: { fontFamily: F.heavy, fontSize: 26, color: '#1F2640', lineHeight: 30 },
  rankSub: { fontFamily: F.regular, fontSize: 12.5, color: '#6B7280', marginTop: 3 },
  rankHint: { fontFamily: F.regular, fontSize: 12, color: '#DDE3FF', marginTop: -8 },
  bar: { height: 7, borderRadius: 4, backgroundColor: '#E8ECF5', overflow: 'hidden', marginTop: 4 },
  barFill: { height: 7, borderRadius: 4 },
  bests: { flexDirection: 'row', gap: 10, width: '100%', maxWidth: 440 },
  best: { flex: 1, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', paddingVertical: 10 },
  bestValue: { fontFamily: F.heavy, fontSize: 20, color: '#1F2640', lineHeight: 24 },
  bestLabel: { fontFamily: F.bold, fontSize: 11, color: '#6B7280' },
  section: { fontFamily: F.heavy, fontSize: 20, color: '#fff', alignSelf: 'flex-start', maxWidth: 440, width: '100%' },
  awardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', maxWidth: 440 },
  award: { width: '48%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 18, padding: 12, borderWidth: 2, borderColor: 'transparent', gap: 2 },
  awardIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  awardTitle: { fontFamily: F.heavy, fontSize: 15, color: '#1F2640' },
  awardDesc: { fontFamily: F.regular, fontSize: 12, color: '#6B7280', minHeight: 30 },
  awardState: { fontFamily: F.bold, fontSize: 11.5, color: '#6B7280', marginTop: 3 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 18, width: '100%', maxWidth: 440 },
  bannerText: { fontFamily: F.heavy, fontSize: 18, color: '#fff', lineHeight: 23 },
});
