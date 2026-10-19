// Level-complete celebration: ribbon, stars that pop one by one, an itemised reward that rolls up, and what comes next.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Confetti, CountUp, F } from '../ui';
import { play } from '../sound';
import { EASE, Rays, Shimmer } from './motion';
import { Art } from './chrome';
import { ChestArt, SoftGlow } from './Chest';
import type { Award } from './awards';

const nd = Platform.OS !== 'web';
export type RewardLine = { label: string; amount: number };

const PRAISE = ['Solved!', 'Great job!', 'Brilliant!'];

export function WinCard({ level, daily, stars, lines, awards, onNext, onReplay, onHome, onMap }: {
  level: number; daily?: boolean; stars: number; lines: RewardLine[]; awards: Award[];
  onNext: () => void; onReplay: () => void; onHome: () => void; onMap: () => void;
}) {
  const { width } = useWindowDimensions();
  const W = Math.min(352, width - 32);
  const total = lines.reduce((n, l) => n + l.amount, 0) + awards.reduce((n, a) => n + a.reward, 0);
  const scrim = useRef(new Animated.Value(0)).current;
  const card = useRef(new Animated.Value(0)).current;
  const [rolled, setRolled] = useState(0);
  const chestDone = !daily && level % 10 === 0;
  const toChest = 10 - (level % 10);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scrim, { toValue: 1, duration: 300, useNativeDriver: nd }),
      Animated.sequence([Animated.delay(120), Animated.spring(card, { toValue: 1, tension: 80, friction: 8, useNativeDriver: nd })]),
    ]).start();
    const id = setTimeout(() => setRolled(total), 1500);
    return () => clearTimeout(id);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,10,40,0.72)', opacity: scrim }]} />
      <View style={s.center}>
        <Animated.View style={{ width: W, opacity: card, transform: [
          { translateY: card.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
          { scale: card.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
        ] }}>
          {/* Stars sit above the card, the middle one biggest. */}
          <View style={s.starsRow}>
            <View style={{ position: 'absolute', top: -W * 0.3, left: (W - W * 1.1) / 2, width: W * 1.1, height: W * 1.1, alignItems: 'center', justifyContent: 'center' }}>
              <Rays size={W * 1.1} color="rgba(255,214,90,0.12)" />
            </View>
            {[1, 2, 3].map((n) => <Star key={n} n={n} on={n <= stars} />)}
          </View>

          <View style={s.card}>
            <View style={s.ribbonWrap}>
              <View style={[s.ribbonEnd, { left: -10 }]} />
              <View style={[s.ribbonEnd, { right: -10 }]} />
              <LinearGradient colors={['#FFE066', '#FFC61A', '#F2A100']} style={s.ribbon}>
                <Text style={s.ribbonText}>{daily ? 'Daily Challenge' : `Level ${level}`}</Text>
              </LinearGradient>
            </View>

            <Text style={s.praise}>{PRAISE[stars - 1] ?? 'Solved!'}</Text>

            <View style={s.lines}>
              {lines.map((l, i) => <Line key={l.label} i={i} label={l.label} amount={l.amount} />)}
              {awards.map((a, i) => (
                <Line key={a.id} i={lines.length + i} label={`Award: ${a.title}`} amount={a.reward}
                  icon={<Icon name={a.icon as any} size={16} color={a.color} />} />
              ))}
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Total</Text>
                <View style={s.totalAmt}>
                  <Art name="coin" size={28} />
                  <CountUp value={rolled} style={s.totalNum} />
                </View>
              </View>
            </View>

            {!daily && (chestDone ? (
              <Pressable onPress={onMap} style={({ pressed }) => [s.chestCard, pressed && { opacity: 0.85 }]} accessibilityRole="button">
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ position: 'absolute' }}><SoftGlow size={90} /></View>
                  <ChestArt size={56} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.chestTitle}>Chest unlocked!</Text>
                  <Text style={s.chestSub}>Open it on the Level Map</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#B97700" />
              </Pressable>
            ) : (
              <View style={s.progress}>
                <ChestArt size={30} />
                <View style={s.track}><Bar to={(10 - toChest) / 10} /></View>
                <Text style={s.progressText}>{toChest} to chest</Text>
              </View>
            ))}

            <View style={s.buttons}>
              <Round icon="home" label="Home" onPress={onHome} />
              <Pressable onPress={onNext} accessibilityRole="button"
                style={({ pressed }) => [s.next, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 3 }]}>
                <LinearGradient colors={['#FFE066', '#FFC61A', '#F7A600']} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
                <Text style={s.nextText}>{daily ? 'Done' : 'Next level'}</Text>
                <Shimmer width={240} />
              </Pressable>
              {!daily && stars < 3 ? <Round icon="replay" label="Replay for 3 stars" onPress={onReplay} /> : <Round icon="map-marker-path" label="Level Map" onPress={onMap} />}
            </View>
          </View>
        </Animated.View>
      </View>
      <Confetti count={60} />
    </View>
  );
}

function Star({ n, on }: { n: number; on: boolean }) {
  const a = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const big = n === 2;
  useEffect(() => {
    const delay = 450 + n * 260;
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(a, { toValue: 1, tension: 160, friction: 6, useNativeDriver: nd }),
    ]).start();
    if (!on) return;
    const id = setTimeout(() => play('word'), delay + 60);
    Animated.sequence([
      Animated.delay(delay + 80),
      Animated.timing(glow, { toValue: 1, duration: 160, useNativeDriver: nd }),
      Animated.timing(glow, { toValue: 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: nd }),
    ]).start();
    return () => clearTimeout(id);
  }, []);
  const size = big ? 78 : 60;
  return (
    <View style={{ width: size, height: size, marginTop: big ? 0 : 22, marginHorizontal: big ? 2 : -4, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', opacity: glow, transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.4] }) }] }}>
        <SoftGlow size={size * 2} color="#FFE066" />
      </Animated.View>
      <Animated.View style={{ opacity: a, transform: [
        { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
        { rotate: a.interpolate({ inputRange: [0, 1], outputRange: [`${n === 1 ? -60 : n === 3 ? 60 : -30}deg`, `${n === 1 ? -14 : n === 3 ? 14 : 0}deg`] }) },
      ] }}>
        <Art name="star" size={size} style={on ? undefined : { tintColor: '#3A3F75', opacity: 0.9 }} />
      </Animated.View>
    </View>
  );
}

function Line({ i, label, amount, icon }: { i: number; label: string; amount: number; icon?: React.ReactNode }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([Animated.delay(900 + i * 120), Animated.timing(a, { toValue: 1, duration: 320, easing: EASE, useNativeDriver: nd })]).start();
  }, []);
  return (
    <Animated.View style={[s.line, { opacity: a, transform: [{ translateX: a.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }]}>
      {icon ?? <View style={s.dot} />}
      <Text style={s.lineLabel} numberOfLines={1}>{label}</Text>
      <Text style={s.lineAmt}>+{amount}</Text>
    </Animated.View>
  );
}

function Bar({ to }: { to: number }) {
  const a = useRef(new Animated.Value(Math.max(0, to - 0.1))).current;
  useEffect(() => {
    Animated.sequence([Animated.delay(1300), Animated.timing(a, { toValue: to, duration: 700, easing: EASE, useNativeDriver: false })]).start();
  }, []);
  return <Animated.View style={[s.fill, { width: a.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />;
}

function Round({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}
      style={({ pressed }) => [s.round, pressed && { transform: [{ scale: 0.94 }] }]}>
      <Icon name={icon} size={24} color="#2C38B0" />
    </Pressable>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 12 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 28, paddingTop: 34, paddingHorizontal: 18, paddingBottom: 18,
    shadowColor: '#06082A', shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  ribbonWrap: { position: 'absolute', top: -18, alignSelf: 'center' },
  ribbon: { borderRadius: 10, paddingHorizontal: 22, paddingVertical: 6, borderBottomWidth: 3, borderBottomColor: '#B97700' },
  ribbonEnd: { position: 'absolute', top: 8, width: 22, height: 26, borderRadius: 4, backgroundColor: '#D98E00' },
  ribbonText: { fontFamily: F.black, fontSize: 17, color: '#4A2A00', letterSpacing: 0.3 },
  praise: { fontFamily: F.black, fontSize: 28, color: '#1F2640', textAlign: 'center', marginTop: 6 },
  lines: { marginTop: 12, backgroundColor: '#F5F7FC', borderRadius: 18, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C3CAE6', marginHorizontal: 5 },
  lineLabel: { flex: 1, fontFamily: F.bold, fontSize: 14.5, color: '#4B5470' },
  lineAmt: { fontFamily: F.black, fontSize: 15, color: '#B97700' },
  totalRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#D5DBE8', marginTop: 6, paddingTop: 8 },
  totalLabel: { flex: 1, fontFamily: F.black, fontSize: 16, color: '#1F2640' },
  totalAmt: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  totalNum: { fontFamily: F.black, fontSize: 26, color: '#1F2640' },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingHorizontal: 4 },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#E8EBF5', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: '#FFC933' },
  progressText: { fontFamily: F.heavy, fontSize: 13, color: '#6B7280' },
  chestCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, backgroundColor: '#FFF6D9', borderRadius: 18, padding: 10,
    borderWidth: 1.5, borderColor: '#FFD966' },
  chestTitle: { fontFamily: F.black, fontSize: 16, color: '#7A4300' },
  chestSub: { fontFamily: F.bold, fontSize: 13, color: '#9A6A1A' },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  next: { flex: 1, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderBottomWidth: 5, borderBottomColor: '#B97700' },
  nextText: { fontFamily: F.black, fontSize: 21, color: '#4A2A00' },
  round: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEF1FA', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 3, borderBottomColor: '#D3D9EA' },
});
