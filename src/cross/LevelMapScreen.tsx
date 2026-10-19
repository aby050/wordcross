import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { chestReward, getGame, updateGame, useGame } from './store';
import { F } from '../ui';
import { fmt, glass, ScreenHeader, Stat } from './chrome';
import { FadeIn, Float } from './motion';
import { ChestArt, ChestReveal, SoftGlow } from './Chest';

const PER = 10;
const STEP = 104; // vertical distance between stops on the path
const HEAD = 56; // stage label at the top of each group
const GROUP_H = HEAD + PER * STEP + 200;
const nd = Platform.OS !== 'web';

/** Smooth curve through points (Catmull-Rom as cubic Béziers). */
function curve(p: [number, number][]) {
  if (p.length < 2) return '';
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0] = p[i - 1] ?? p[i], [x1, y1] = p[i], [x2, y2] = p[i + 1], [x3, y3] = p[i + 2] ?? p[i + 1];
    d += ` C${x1 + (x2 - x0) / 6} ${y1 + (y2 - y0) / 6} ${x2 - (x3 - x1) / 6} ${y2 - (y3 - y1) / 6} ${x2} ${y2}`;
  }
  return d;
}

export default function LevelMapScreen({ onBack, onPlay }: { onBack: () => void; onPlay: (level: number) => void }) {
  const g = useGame();
  const { width, height } = useWindowDimensions();
  const W = Math.min(width, 480);
  const amp = W * 0.27;
  const done = g.level - 1; // levels finished
  const total = Object.values(g.stars).reduce((a, b) => a + b, 0);
  const groups = Math.max(3, Math.ceil(g.level / PER) + 1);
  const [opening, setOpening] = useState<number | null>(null);
  const scroll = useRef<ScrollView>(null);

  // Stop j of a group (0-9 levels, 10 = chest). One S-bend per group, mirrored on alternate groups.
  const xAt = (gi: number, j: number) => W / 2 + (gi % 2 ? -1 : 1) * amp * Math.sin((Math.PI * (j + 1)) / 5.5);
  const yAt = (j: number) => HEAD + j * STEP + STEP / 2 + (j === PER ? 30 : 0);

  useEffect(() => {
    const gi = Math.floor((g.level - 1) / PER), j = (g.level - 1) % PER;
    const id = setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, gi * GROUP_H + yAt(j) - height * 0.42), animated: false }), 30);
    return () => clearTimeout(id);
  }, []);

  const open = (k: number) => {
    if (getGame().chests.includes(k)) return;
    const r = chestReward(k);
    updateGame((s) => ({ coins: s.coins + r.coins, ink: s.ink + r.ink, chests: [...s.chests, k] }));
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Level Map" onBack={onBack} right={<Stat art="star" value={fmt(total)} label={`${total} stars`} />} />
      <ScrollView ref={scroll} contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {Array.from({ length: groups }, (_, gi) => {
          const k = gi + 1, first = gi * PER + 1, last = k * PER;
          const ready = done >= last, taken = g.chests.includes(k);
          const pts: [number, number][] = [[W / 2, 0], ...Array.from({ length: PER + 1 }, (_, j) => [xAt(gi, j), yAt(j)] as [number, number]), [W / 2, GROUP_H]];
          // Gold up to the furthest level reached in this group.
          const reached = Math.min(PER, Math.max(0, g.level - first));
          const lit = done >= first - 1 ? pts.slice(0, ready ? pts.length : reached + 2) : [];
          return (
            <View key={k} style={{ width: W, height: GROUP_H }}>
              <Svg width={W} height={GROUP_H} style={StyleSheet.absoluteFill}>
                <Path d={curve(pts)} stroke="rgba(255,255,255,0.22)" strokeWidth={10} strokeLinecap="round" fill="none" />
                <Path d={curve(pts)} stroke="rgba(255,255,255,0.45)" strokeWidth={3} strokeDasharray="1 14" strokeLinecap="round" fill="none" />
                {lit.length > 1 && <Path d={curve(lit)} stroke="#FFC933" strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.95} />}
              </Svg>

              <View style={[s.stage, { top: 12 }]}><Text style={s.stageText}>Levels {first}–{last}</Text></View>

              {Array.from({ length: PER }, (_, j) => {
                const lv = first + j, st = g.stars[lv] ?? 0;
                const state = lv < g.level ? 'done' : lv === g.level ? 'current' : 'locked';
                return (
                  <Node key={lv} x={xAt(gi, j)} y={yAt(j)} lv={lv} stars={st} state={state} onPress={() => onPlay(lv)} delay={gi === Math.floor((g.level - 1) / PER) ? j * 40 : 0} />
                );
              })}

              <ChestStop x={xAt(gi, PER)} y={yAt(PER)} last={last} ready={ready} taken={taken} onPress={() => setOpening(k)} />
            </View>
          );
        })}
      </ScrollView>

      {opening !== null && (
        <ChestReveal chest={opening} {...rewardOf(opening)} onOpen={() => open(opening)} onClose={() => setOpening(null)} />
      )}
    </View>
  );
}

const rewardOf = (k: number) => { const r = chestReward(k); return { coins: r.coins, ink: r.ink }; };

function Node({ x, y, lv, stars, state, onPress, delay }: {
  x: number; y: number; lv: number; stars: number; state: 'done' | 'current' | 'locked'; onPress: () => void; delay: number;
}) {
  const size = state === 'current' ? 74 : 60;
  const body = state === 'locked' ? (
    <View style={[s.node, s.locked, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={s.lockedNum}>{lv}</Text>
      <Icon name="lock" size={11} color="rgba(255,255,255,0.45)" />
    </View>
  ) : (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Level ${lv}`}
      style={({ pressed }) => [s.node, state === 'current' ? s.current : s.done, { width: size, height: size, borderRadius: size / 2 }, pressed && { transform: [{ scale: 0.94 }] }]}>
      {state === 'current' && <LinearGradient colors={['#FFE066', '#FFC61A', '#F7A600']} style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]} />}
      <Text style={[s.num, state === 'current' && { color: '#4A2A00', fontSize: 26, lineHeight: 36, marginTop: 4 }]}>{lv}</Text>
      {state === 'current' && <Text style={s.playText}>PLAY</Text>}
    </Pressable>
  );
  return (
    <FadeIn delay={delay} y={10} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, alignItems: 'center' }}>
      {state === 'current' && <Pulse size={size} />}
      {body}
      {state === 'done' && (
        <View style={s.stars}>
          {[1, 2, 3].map((n) => <Icon key={n} name="star" size={n === 2 ? 17 : 14} color={n <= stars ? '#FFC933' : 'rgba(255,255,255,0.3)'}
            style={{ marginTop: n === 2 ? 0 : 4 }} />)}
        </View>
      )}
    </FadeIn>
  );
}

/** Soft ring that keeps expanding out of the current level. */
function Pulse({ size }: { size: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(a, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: nd }));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, width: size, height: size, borderRadius: size / 2,
      borderWidth: 3, borderColor: '#FFD54A',
      opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
      transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }] }} />
  );
}

function ChestStop({ x, y, last, ready, taken, onPress }: { x: number; y: number; last: number; ready: boolean; taken: boolean; onPress: () => void }) {
  const size = 104;
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!ready || taken) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: nd }),
      Animated.timing(glow, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: nd }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [ready, taken]);
  const art = <ChestArt size={size} open={taken} />;
  return (
    <View style={{ position: 'absolute', left: x - 90, top: y - size * 0.55, width: 180, alignItems: 'center' }}>
      {ready && !taken ? (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Open chest" style={{ alignItems: 'center' }}>
          <Animated.View style={[s.chestGlow, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }] }]}><SoftGlow size={190} /></Animated.View>
          <Float range={5} period={1400}>{art}</Float>
          <View style={s.openTag}><Text style={s.openText}>Tap to open</Text></View>
        </Pressable>
      ) : (
        <>
          <View style={{ opacity: taken ? 0.75 : 0.55 }}>{art}</View>
          <View style={[s.chestTag, taken && { backgroundColor: 'rgba(34,197,94,0.25)' }]}>
            {taken && <Icon name="check-bold" size={13} color="#86EFAC" />}
            <Text style={s.chestTagText}>{taken ? 'Opened' : `Finish level ${last}`}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  stage: { ...glass, position: 'absolute', alignSelf: 'center', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5 },
  stageText: { fontFamily: F.heavy, fontSize: 12.5, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' },
  node: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  done: { backgroundColor: '#fff', borderBottomWidth: 4, borderBottomColor: '#C3CAE6',
    shadowColor: '#06082A', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  current: { borderBottomWidth: 5, borderBottomColor: '#B97700',
    shadowColor: '#FFC933', shadowOpacity: 0.7, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  locked: { ...glass, gap: 0 },
  num: { fontFamily: F.black, fontSize: 21, color: '#1E2766' },
  lockedNum: { fontFamily: F.black, fontSize: 18, color: 'rgba(255,255,255,0.55)', marginBottom: -2 },
  stars: { position: 'absolute', top: -14, flexDirection: 'row', gap: 1 },
  playText: { fontFamily: F.black, fontSize: 10.5, letterSpacing: 1.4, color: 'rgba(74,42,0,0.8)' },
  chestGlow: { position: 'absolute', top: -50 },
  openTag: { marginTop: 6, backgroundColor: '#FFC933', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5, borderBottomWidth: 3, borderBottomColor: '#B97700' },
  openText: { fontFamily: F.black, fontSize: 14, color: '#4A2A00' },
  chestTag: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  chestTagText: { fontFamily: F.heavy, fontSize: 12.5, color: 'rgba(255,255,255,0.85)' },
});
