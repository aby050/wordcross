import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const C = {
  bg: '#F5F7FB',
  ink: '#3A4257',
  blue: '#1E88F5',
  blueSoft: '#DCEBFB',
  clue: '#D5E6F8',
  green: '#D3ECCB',
  tile: '#FBE8C8',
  tileEdge: '#E3C58F',
  grey: '#EEF1F6',
  line: '#AEB9C9',
  gold: '#F2B01E',
};

/** Baloo 2 — loaded in App.tsx. Falls back to the system font until ready. */
export const F = {
  regular: 'Baloo2_500Medium',
  bold: 'Baloo2_700Bold',
  heavy: 'Baloo2_800ExtraBold',
};

export function Tile({ letter, value, size, selected, faded, onPress, style }: {
  letter: string; value?: number; size: number; selected?: boolean; faded?: boolean;
  onPress?: () => void; style?: ViewStyle;
}) {
  const radius = size * 0.16;
  return (
    <Pressable
      onPress={onPress}
      style={[s.tile, {
        width: size, height: size, borderRadius: radius, opacity: faded ? 0.45 : 1,
        transform: [{ translateY: selected ? -8 : 0 }, { scale: selected ? 1.08 : 1 }],
        borderColor: selected ? C.blue : C.tileEdge,
        borderBottomWidth: Math.max(2, size * 0.07),
      }, style]}
    >
      {/* Cream-to-caramel face with a glossy top highlight. */}
      <LinearGradient colors={['#FFF7E6', '#FBE4BC', '#F1CD92']} locations={[0, 0.55, 1]}
        style={[StyleSheet.absoluteFill, { borderRadius: radius * 0.8 }]} />
      <View style={[s.gloss, { height: size * 0.34, borderTopLeftRadius: radius * 0.8, borderTopRightRadius: radius * 0.8 }]} />
      {value !== undefined && <Text style={[s.val, { fontSize: size * 0.22, lineHeight: size * 0.3 }]}>{value}</Text>}
      <Text style={[s.letter, { fontSize: size * 0.58, lineHeight: size * 0.8, marginTop: size * 0.06 }]}>{letter}</Text>
    </Pressable>
  );
}

/** A number that rolls up to its new value. */
export function CountUp({ value, style }: { value: number; style: any }) {
  const anim = useRef(new Animated.Value(value)).current;
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setShown(Math.round(v)));
    Animated.timing(anim, { toValue: value, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [value]);
  return <Text style={style}>{shown}</Text>;
}

export function ScoreBar({ you, opp, turn }: { you: number; opp: number; turn: 'you' | 'opp' }) {
  return (
    <View style={s.scoreRow}>
      <Text style={s.name}>You</Text>
      <View style={[s.pill, turn === 'you' && { backgroundColor: C.blue }]}>
        <CountUp value={you} style={[s.score, { color: turn === 'you' ? '#fff' : C.blue }]} />
      </View>
      <Text style={s.vs}>vs</Text>
      <View style={[s.pill, turn === 'opp' && { backgroundColor: '#8A94A8' }]}>
        <CountUp value={opp} style={[s.score, { color: turn === 'opp' ? '#fff' : '#A4ACBC' }]} />
      </View>
      <Text style={s.name}>Bot</Text>
    </View>
  );
}

/** A golden halo that fades in and out once when mounted — key it by the move so it re-fires. */
export function Glow({ size, radius = 6 }: { size: number; radius?: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(a, { toValue: 0, duration: 900, delay: 300, easing: Easing.out(Easing.quad), useNativeDriver: false }),
    ]).start();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', width: size + 6, height: size + 6, left: -3, top: -3, borderRadius: radius,
      borderWidth: 3, borderColor: C.gold, opacity: a,
      shadowColor: C.gold, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
    }} />
  );
}

const CONFETTI = ['#F2B01E', '#1E88F5', '#EC8F80', '#6FBF83', '#8E9BD1', '#F4B183'];

/** Falling confetti for a win. Renders over everything and ignores touches. */
export function Confetti({ count = 60 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = useRef(Array.from({ length: count }, (_, i) => ({
    x: Math.random() * width,
    drift: (Math.random() - 0.5) * 160,
    delay: Math.random() * 500,
    spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
    w: 6 + Math.random() * 6, h: 10 + Math.random() * 8,
    color: CONFETTI[i % CONFETTI.length],
    t: new Animated.Value(0),
  }))).current;
  useEffect(() => {
    Animated.parallel(pieces.map((p) => Animated.timing(p.t, {
      toValue: 1, duration: 2200 + Math.random() * 900, delay: p.delay, easing: Easing.in(Easing.quad), useNativeDriver: false,
    }))).start();
  }, []);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: p.x, top: -20, width: p.w, height: p.h, borderRadius: 2, backgroundColor: p.color,
          opacity: p.t.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
          transform: [
            { translateY: p.t.interpolate({ inputRange: [0, 1], outputRange: [0, height + 40] }) },
            { translateX: p.t.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
            { rotate: p.t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
          ],
        }} />
      ))}
    </View>
  );
}

export function RoundButton({ label, icon, onPress, badge, disabled }: {
  label: string; icon: string; onPress: () => void; badge?: number; disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[s.round, disabled && { opacity: 0.4 }]}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={s.roundLabel}>{label}</Text>
      {badge !== undefined && <View style={s.badge}><Text style={s.badgeText}>{badge}</Text></View>}
    </Pressable>
  );
}

export function MainButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={[s.main, disabled && { backgroundColor: '#E3E8F0', shadowOpacity: 0, borderBottomColor: '#D3D9E3' }]}>
      {!disabled && <LinearGradient colors={['#4AA3FF', '#1E88F5', '#1570D6']} style={[StyleSheet.absoluteFill, { borderRadius: 30 }]} />}
      <Text style={[s.mainText, disabled && { color: '#A9B2C2' }]}>{label}</Text>
    </Pressable>
  );
}

export function Toast({ text }: { text: string | null }) {
  if (!text) return null;
  return <View pointerEvents="none" style={s.toast}><Text style={s.toastText}>{text}</Text></View>;
}

const s = StyleSheet.create({
  tile: {
    backgroundColor: '#F1CD92', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: '#9C7A3C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 4, elevation: 4,
  },
  gloss: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.45)' },
  letter: { fontFamily: F.heavy, color: '#3B2A14' },
  val: { position: 'absolute', top: 1, left: 4, fontFamily: F.bold, color: '#5C4420' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginVertical: 10 },
  name: { fontSize: 18, color: C.ink, fontFamily: F.bold },
  vs: { fontSize: 15, color: '#8A94A8', marginHorizontal: 10, fontFamily: F.regular },
  pill: { backgroundColor: C.grey, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 2, minWidth: 68, alignItems: 'center' },
  score: { fontSize: 26, fontFamily: F.heavy },
  round: { width: 66, height: 66, borderRadius: 33, backgroundColor: C.grey, alignItems: 'center', justifyContent: 'center' },
  roundLabel: { fontSize: 11, color: C.ink, marginTop: -2, fontFamily: F.bold },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: C.blue, borderRadius: 11, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: F.heavy },
  main: {
    flex: 1, height: 60, borderRadius: 30, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderBottomWidth: 4, borderBottomColor: '#0F5DB5',
    shadowColor: C.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  mainText: { color: '#fff', fontSize: 22, fontFamily: F.heavy },
  toast: { position: 'absolute', top: '45%', alignSelf: 'center', backgroundColor: 'rgba(30,36,50,0.9)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  toastText: { color: '#fff', fontSize: 16, fontFamily: F.bold },
});
