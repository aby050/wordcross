import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { dayKey, streak, useGame } from './store';
import { CountUp, F } from '../ui';
import { Art, ArtName, ScreenHeader } from './chrome';
import { SoftGlow } from './Chest';
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
      <ScreenHeader title="Rank & Awards" onBack={onBack} />
      <ScrollView contentContainerStyle={s.wrap}>
        <FadeIn delay={300} y={20} style={s.rankCard}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}><View style={{ position: 'absolute' }}><SoftGlow size={120} color={rk.rank.color} /></View><View style={[s.rankBadge, { backgroundColor: rk.rank.color }]}><Icon name={rk.rank.icon as any} size={34} color="#fff" /></View></View>
          <View style={{ flex: 1 }}>
            <Text style={s.rankLabel}>YOUR RANK</Text>
            <Text style={s.rankName}>{rk.rank.name}</Text>
            <View style={s.bar}><View style={[s.barFill, { width: `${Math.round(rk.progress * 100)}%`, backgroundColor: rk.rank.color }]} /></View>
            <Text style={s.rankSub}>{rk.next ? `${rk.next.at - rk.score} points to ${rk.next.name}` : 'Top rank reached'}</Text>
          </View>
        </FadeIn>
        <Text style={s.rankHint}>Points: 1 per level + 3 per award</Text>

        <FadeIn delay={380} y={16} style={s.bests}>
          <Best art="fire" label="Best streak" value={`${g.bestStreak}d`} />
          <Best art="glow" label="No-hint levels" value={`${g.noHint}`} />
          <Best art="book" label="Words saved" value={`${Object.keys(g.book).length}`} />
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
          <View style={s.streakRow}><Art name="fire" size={20} /><Text style={s.streak}>Current streak: {streak(g.days)} day{streak(g.days) === 1 ? '' : 's'}</Text></View>
        </FadeIn>

        <View style={s.sectionRow}><Art name="trophy" size={28} /><Text style={s.section}>Awards</Text><Text style={s.count}>{g.awards.length}/{AWARDS.length}</Text></View>
        <View style={s.awardGrid}>
          {AWARDS.map((a, i) => {
            const done = g.awards.includes(a.id);
            const v = progressOf(a, g);
            return (
              <FadeIn key={a.id} delay={420 + i * 40} y={14} style={done ? { ...s.award, borderColor: a.color } : { ...s.award, ...s.awardLocked }}>
                <View style={[s.awardIcon, { backgroundColor: done ? a.color : 'rgba(255,255,255,0.12)' }]}>
                  <Icon name={a.icon as any} size={22} color={done ? '#fff' : 'rgba(255,255,255,0.45)'} />
                </View>
                <Text style={[s.awardTitle, !done && { color: '#fff' }]} numberOfLines={1}>{a.title}</Text>
                <Text style={[s.awardDesc, !done && { color: 'rgba(255,255,255,0.65)' }]} numberOfLines={2}>{a.desc}</Text>
                {done ? <View style={s.earned}><Icon name="check-decagram" size={14} color="#16A34A" /><Text style={[s.awardState, { color: '#16A34A', marginTop: 0 }]}>Earned · +{a.reward}</Text></View> : (
                  <>
                    <View style={[s.bar, { backgroundColor: 'rgba(255,255,255,0.14)' }]}><View style={[s.barFill, { width: `${Math.round((v / a.goal) * 100)}%`, backgroundColor: a.color }]} /></View>
                    <Text style={[s.awardState, { color: 'rgba(255,255,255,0.7)' }]}>{a.id === 'time5' ? `${Math.floor(v / 3600)}/${a.goal / 3600}h` : a.id === 'sharp' ? `${v}%/${a.goal}%` : `${v}/${a.goal}`} · +{a.reward}</Text>
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

function Best({ art, label, value }: { art: ArtName; label: string; value: string }) {
  return (
    <View style={s.best}>
      <Art name={art} size={30} />
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
  tileValue: { fontFamily: F.heavy, fontSize: 26, lineHeight: 36, marginTop: 2 },
  tileLabel: { fontFamily: F.bold, fontSize: 11 },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingHorizontal: 6 },
  calTitle: { fontFamily: F.heavy, fontSize: 18, color: '#1F2640' },
  calMonth: { fontFamily: F.regular, fontSize: 14, color: '#6B7280' },
  week: { flexDirection: 'row', marginTop: 10 },
  weekDay: { flex: 1, textAlign: 'center', fontFamily: F.bold, fontSize: 12, color: '#6B7280' },
  days: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  day: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: '#22C55E' },
  dotToday: { backgroundColor: '#2563EB' },
  dayText: { fontFamily: F.bold, fontSize: 13, color: '#3A4257' },
  streak: { fontFamily: F.bold, fontSize: 14, color: '#3A4257' },
  rankCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 22, padding: 16, width: '100%', maxWidth: 440 },
  rankBadge: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  rankLabel: { fontFamily: F.heavy, fontSize: 11, letterSpacing: 1.2, color: '#8A92A6' },
  rankName: { fontFamily: F.black, fontSize: 26, color: '#1F2640', lineHeight: 36 },
  rankSub: { fontFamily: F.regular, fontSize: 12.5, color: '#6B7280', marginTop: 3 },
  rankHint: { fontFamily: F.regular, fontSize: 12, color: '#DDE3FF', marginTop: 0 },
  bar: { height: 7, borderRadius: 4, backgroundColor: '#E8ECF5', overflow: 'hidden', marginTop: 4 },
  barFill: { height: 7, borderRadius: 4 },
  bests: { flexDirection: 'row', gap: 10, width: '100%', maxWidth: 440 },
  best: { flex: 1, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', paddingVertical: 10 },
  bestValue: { fontFamily: F.heavy, fontSize: 20, color: '#1F2640', lineHeight: 28 },
  bestLabel: { fontFamily: F.bold, fontSize: 11, color: '#6B7280' },
  section: { flex: 1, fontFamily: F.black, fontSize: 20, color: '#fff' },
  awardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', maxWidth: 440 },
  award: { width: '48%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 18, padding: 12, borderWidth: 2, borderColor: 'transparent', gap: 2 },
  awardLocked: { backgroundColor: 'rgba(10,12,48,0.38)', borderColor: 'rgba(255,255,255,0.14)', borderWidth: 1 },
  earned: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', maxWidth: 440 },
  count: { fontFamily: F.heavy, fontSize: 14, color: '#FFD966', backgroundColor: 'rgba(255,201,51,0.16)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  awardIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  awardTitle: { fontFamily: F.heavy, fontSize: 15, color: '#1F2640' },
  awardDesc: { fontFamily: F.regular, fontSize: 12, color: '#6B7280', minHeight: 30 },
  awardState: { fontFamily: F.bold, fontSize: 11.5, color: '#6B7280', marginTop: 3 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 18, width: '100%', maxWidth: 440 },
  bannerText: { fontFamily: F.heavy, fontSize: 18, color: '#fff', lineHeight: 25 },
});
