// Treasure chest art (body and lid are separate layers so the lid can pop) and the full-screen opening sequence.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient as LG, Path, RadialGradient, Rect, Stop, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Confetti, CountUp, F } from '../ui';
import { play } from '../sound';
import { EASE, Float, Rays, Shimmer } from './motion';
import { Art } from './chrome';

const nd = Platform.OS !== 'web';
const RATIO = 0.9; // height / width of the art box

function Gold({ id }: { id: string }) {
  return (
    <LG id={id} x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0" stopColor="#FFF1A8" />
      <Stop offset="0.45" stopColor="#FFC933" />
      <Stop offset="1" stopColor="#D98E00" />
    </LG>
  );
}

function Body({ glow }: { glow?: boolean }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 200 180">
      <Defs>
        <LG id="cw" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#B8642A" />
          <Stop offset="1" stopColor="#6E3510" />
        </LG>
        <Gold id="cg" />
        <RadialGradient id="cl" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#FFFBE0" stopOpacity="1" />
          <Stop offset="0.5" stopColor="#FFD54A" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#FFB300" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="100" cy="170" rx="82" ry="8" fill="#000" opacity={0.25} />
      <Rect x="22" y="82" width="156" height="82" rx="12" fill="url(#cw)" stroke="#4A2208" strokeWidth="3" />
      <Path d="M25 110 H175 M25 137 H175" stroke="#5A2A0C" strokeWidth="2.5" opacity={0.45} />
      <Path d="M30 92 H170" stroke="#FFFFFF" strokeWidth="2" opacity={0.12} />
      <Rect x="44" y="82" width="20" height="82" fill="url(#cg)" stroke="#8A5200" strokeWidth="2" />
      <Rect x="136" y="82" width="20" height="82" fill="url(#cg)" stroke="#8A5200" strokeWidth="2" />
      <Rect x="18" y="154" width="164" height="13" rx="6" fill="url(#cg)" stroke="#8A5200" strokeWidth="2" />
      <Rect x="16" y="77" width="168" height="11" rx="5" fill="url(#cg)" stroke="#8A5200" strokeWidth="2" />
      <Rect x="85" y="86" width="30" height="34" rx="7" fill="url(#cg)" stroke="#8A5200" strokeWidth="2" />
      <Circle cx="100" cy="99" r="4.5" fill="#4A2400" />
      <Rect x="98" y="101" width="4" height="10" rx="2" fill="#4A2400" />
      <Rect x="48" y="86" width="4" height="70" rx="2" fill="#fff" opacity={0.35} />
      <Rect x="140" y="86" width="4" height="70" rx="2" fill="#fff" opacity={0.35} />
      {glow && <Ellipse cx="100" cy="80" rx="78" ry="16" fill="url(#cl)" />}
    </Svg>
  );
}

function Lid() {
  const dome = 'M20 86 L20 60 Q20 22 100 22 Q180 22 180 60 L180 86 Z';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 200 180">
      <Defs>
        <LG id="lw" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#D27A3A" />
          <Stop offset="1" stopColor="#8A4316" />
        </LG>
        <Gold id="lg" />
        <ClipPath id="lc"><Path d={dome} /></ClipPath>
      </Defs>
      <Path d={dome} fill="url(#lw)" stroke="#4A2208" strokeWidth="3" />
      <G clipPath="url(#lc)">
        <Rect x="44" y="0" width="20" height="90" fill="url(#lg)" stroke="#8A5200" strokeWidth="2" />
        <Rect x="136" y="0" width="20" height="90" fill="url(#lg)" stroke="#8A5200" strokeWidth="2" />
        <Path d="M30 44 Q100 24 170 44" stroke="#fff" strokeWidth="5" opacity={0.18} fill="none" strokeLinecap="round" />
      </G>
      <Rect x="16" y="76" width="168" height="12" rx="5" fill="url(#lg)" stroke="#8A5200" strokeWidth="2" />
      <Rect x="87" y="66" width="26" height="20" rx="6" fill="url(#lg)" stroke="#8A5200" strokeWidth="2" />
    </Svg>
  );
}

/** A soft round light with no hard edge. */
export function SoftGlow({ size, color = '#FFC933' }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <RadialGradient id="sg" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor={color} stopOpacity="0.65" />
          <Stop offset="0.45" stopColor={color} stopOpacity="0.25" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#sg)" />
    </Svg>
  );
}

/** Static chest. `open` tilts the lid back and lights the inside. */
export function ChestArt({ size, open }: { size: number; open?: boolean }) {
  return (
    <View style={{ width: size, height: size * RATIO }}>
      <View style={StyleSheet.absoluteFill}><Body glow={open} /></View>
      <View style={[StyleSheet.absoluteFill, open && { transform: [{ translateY: -size * 0.2 }, { translateX: -size * 0.07 }, { rotate: '-16deg' }] }]}><Lid /></View>
    </View>
  );
}

type Stage = 'ready' | 'shaking' | 'open';

/** Full-screen chest opening: drop in, tap, wobble, lid pops, light and coins burst out, rewards count up. */
export function ChestReveal({ chest, coins, ink, onOpen, onClose }: {
  chest: number; coins: number; ink: number; onOpen: () => void; onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const size = Math.min(230, width * 0.58);
  const [stage, setStage] = useState<Stage>('ready');
  const [shown, setShown] = useState(false);
  const [landed, setLanded] = useState(false); // ignore the tap that opened this screen
  const scrim = useRef(new Animated.Value(0)).current;
  const drop = useRef(new Animated.Value(0)).current;
  const wob = useRef(new Animated.Value(0)).current;
  const squash = useRef(new Animated.Value(0)).current;
  const seam = useRef(new Animated.Value(0)).current;
  const lid = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  const coinsFly = useRef(Array.from({ length: 18 }, (_, i) => {
    const a = (-160 + (i / 17) * 140 + (Math.random() * 16 - 8)) * (Math.PI / 180);
    const d = size * (0.7 + Math.random() * 0.8);
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, fall: 60 + Math.random() * 120, spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360), s: 0.7 + Math.random() * 0.6, art: i % 6 === 0 ? 'glow' as const : 'coin' as const };
  })).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scrim, { toValue: 1, duration: 260, useNativeDriver: nd }),
      Animated.spring(drop, { toValue: 1, tension: 70, friction: 7, useNativeDriver: nd }),
    ]).start();
    const id = setTimeout(() => setLanded(true), 450);
    return () => clearTimeout(id);
  }, []);

  // Idle: a little hop every couple of seconds so it begs to be tapped.
  const hop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (stage !== 'ready') return;
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(900),
      Animated.timing(hop, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: nd }),
      Animated.timing(hop, { toValue: 0, duration: 380, easing: Easing.bounce, useNativeDriver: nd }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [stage]);

  const tap = () => {
    if (stage !== 'ready' || !landed) return;
    setStage('shaking');
    play('pickup');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    hop.stopAnimation(); hop.setValue(0);
    // Wobble with rising force while light leaks from the seam, then squash before the pop.
    Animated.parallel([
      Animated.sequence([-3, 3, -5, 5, -7, 7, -10, 10, 0].map((v, i) =>
        Animated.timing(wob, { toValue: v, duration: 55 + i * 4, useNativeDriver: nd }))),
      Animated.timing(seam, { toValue: 1, duration: 560, easing: Easing.in(Easing.quad), useNativeDriver: nd }),
      Animated.sequence([Animated.delay(420), Animated.timing(squash, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: nd })]),
    ]).start(() => {
      setStage('open');
      onOpen();
      play('win');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.parallel([
        Animated.spring(squash, { toValue: 0, tension: 180, friction: 5, useNativeDriver: nd }),
        Animated.spring(lid, { toValue: 1, tension: 90, friction: 6, useNativeDriver: nd }),
        Animated.sequence([
          Animated.timing(flash, { toValue: 1, duration: 120, useNativeDriver: nd }),
          Animated.timing(flash, { toValue: 0, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: nd }),
        ]),
        Animated.timing(burst, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: nd }),
      ]).start();
      setTimeout(() => setShown(true), 650);
    });
  };

  const close = () => {
    Animated.timing(out, { toValue: 0, duration: 220, easing: EASE, useNativeDriver: nd }).start(onClose);
  };

  const chestY = height * 0.08;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: out, zIndex: 50 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: scrim }]}>
        <LinearGradient colors={['rgba(10,12,46,0.97)', 'rgba(30,20,78,0.97)', 'rgba(8,10,40,0.98)']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Pressable style={s.center} onPress={tap} disabled={stage !== 'ready'} accessibilityRole="button" accessibilityLabel="Open chest">
        <Animated.Text style={[s.kicker, { opacity: scrim }]}>Milestone reward</Animated.Text>
        <Animated.Text style={[s.title, { opacity: scrim }]}>Chest {chest}</Animated.Text>

        <View style={{ width: size * 2, height: size * 1.5, alignItems: 'center', justifyContent: 'center', marginTop: chestY * 0.3 }}>
          {/* Light: slow rays and a beam once open; a faint halo before. */}
          <Animated.View style={{ position: 'absolute', width: size * 2.3, height: size * 2.3, alignItems: 'center', justifyContent: 'center',
            opacity: lid, transform: [{ scale: lid.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}>
            <Rays size={size * 2.3} color="rgba(255,214,90,0.14)" />
          </Animated.View>
          <Animated.View style={{ position: 'absolute', opacity: lid.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }}>
            <SoftGlow size={size * 1.9} />
          </Animated.View>
          <Animated.View style={{ position: 'absolute', bottom: size * 0.62, width: size * 0.62, height: size * 1.1, opacity: lid,
            transform: [{ scaleY: lid.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }] }}>
            <LinearGradient colors={['rgba(255,214,90,0)', 'rgba(255,214,110,0.32)', 'rgba(255,236,170,0.8)']} style={{ flex: 1, borderTopLeftRadius: size, borderTopRightRadius: size }} />
          </Animated.View>

          <Animated.View style={{
            width: size, height: size * RATIO,
            opacity: drop,
            transform: [
              { translateY: Animated.add(drop.interpolate({ inputRange: [0, 1], outputRange: [-height * 0.4, 0] }), hop.interpolate({ inputRange: [0, 1], outputRange: [0, -16] })) },
              { rotate: wob.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] }) },
              { scaleX: squash.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
              { scaleY: squash.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] }) },
            ],
          }}>
            <View style={StyleSheet.absoluteFill}><Body glow={stage === 'open'} /></View>
            {/* Light leaking out of the lid seam while it shakes. */}
            {stage !== 'open' && <Animated.View style={[s.seam, { top: size * RATIO * 0.42, opacity: seam }]} />}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [
              { translateY: lid.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.24] }) },
              { translateX: lid.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.08] }) },
              { rotate: lid.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-18deg'] }) },
            ] }]}><Lid /></Animated.View>
          </Animated.View>

          {/* Coins and stars burst out of the chest mouth, arc up and fall away. */}
          {coinsFly.map((c, i) => (
            <Animated.View key={i} pointerEvents="none" style={{
              position: 'absolute', top: size * 0.62,
              opacity: burst.interpolate({ inputRange: [0, 0.04, 0.7, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, c.dx] }) },
                { translateY: burst.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, c.dy, c.dy + c.fall] }) },
                { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${c.spin}deg`] }) },
                { scale: burst.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.3, c.s, c.s * 0.8] }) },
              ],
            }}><Art name={c.art} size={34} /></Animated.View>
          ))}
          <Animated.View pointerEvents="none" style={[s.flash, { width: size * 1.6, height: size * 1.6, borderRadius: size,
            opacity: flash, transform: [{ scale: flash.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.4] }) }] }]} />
        </View>

        {stage !== 'open' ? (
          <Float range={3} period={1600}><Text style={s.tapText}>{stage === 'ready' ? 'Tap to open' : ' '}</Text></Float>
        ) : (
          <View style={{ height: 34 }} />
        )}
        {shown && (
          <View style={s.rewards}>
            <RewardPill delay={0}><Art name="coin" size={34} /><CountUp value={coins} style={s.rewardNum} /><Text style={s.rewardLabel}>coins</Text></RewardPill>
            <RewardPill delay={160}><Art name="glow" size={34} /><CountUp value={ink} style={s.rewardNum} /><Text style={s.rewardLabel}>letter points</Text></RewardPill>
          </View>
        )}
      </Pressable>
      {shown && (
        <RewardPill delay={420} style={s.collectWrap}>
          <Pressable onPress={close} style={({ pressed }) => [s.collect, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 3 }]} accessibilityRole="button">
            <LinearGradient colors={['#FFE066', '#FFC61A', '#F7A600']} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
            <Text style={s.collectText}>Collect</Text>
            <Shimmer width={300} />
          </Pressable>
        </RewardPill>
      )}
      {stage === 'open' && <Confetti count={70} />}
    </Animated.View>
  );
}

/** Pops in from slightly small, with a soft overshoot. */
function RewardPill({ delay, children, style }: { delay: number; children: React.ReactNode; style?: any }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([Animated.delay(delay), Animated.spring(a, { toValue: 1, tension: 140, friction: 7, useNativeDriver: nd })]).start();
  }, []);
  return (
    <Animated.View style={[style ?? s.pill, { opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>
      {children}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 90 },
  kicker: { fontFamily: F.heavy, fontSize: 13, letterSpacing: 2.4, textTransform: 'uppercase', color: '#FFD966' },
  title: { fontFamily: F.black, fontSize: 34, color: '#fff', marginTop: 2 },
  seam: { position: 'absolute', left: '10%', right: '10%', height: 6, borderRadius: 3, backgroundColor: '#FFF3B0',
    shadowColor: '#FFD54A', shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  flash: { position: 'absolute', backgroundColor: 'rgba(255,248,214,0.85)' },
  tapText: { fontFamily: F.black, fontSize: 18, color: '#fff', letterSpacing: 0.5, height: 34 },
  rewards: { flexDirection: 'row', gap: 12, marginTop: 4 },
  pill: { alignItems: 'center', minWidth: 120, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,217,102,0.35)' },
  rewardNum: { fontFamily: F.black, fontSize: 30, color: '#FFD966', marginTop: 4 },
  rewardLabel: { fontFamily: F.bold, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  collectWrap: { position: 'absolute', left: 24, right: 24, bottom: 36, alignItems: 'center' },
  collect: { width: '100%', maxWidth: 360, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderBottomWidth: 5, borderBottomColor: '#B97700' },
  collectText: { fontFamily: F.black, fontSize: 24, color: '#4A2A00' },
});
