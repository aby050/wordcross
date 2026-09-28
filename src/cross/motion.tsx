import { ReactNode, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ThemeId } from './store';

// Motion language: smooth ease-out curves, no overshoot or bounce.
export const EASE = Easing.bezier(0.22, 1, 0.36, 1); // "easeOutQuint"-like
const native = Platform.OS !== 'web';

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { reduceMotion = v; }).catch(() => {});

/** Fades and slides children in after `delay` ms. */
export function FadeIn({ children, delay = 0, y = 16, x = 0, scale = 1, duration = 520, style }: {
  children: ReactNode; delay?: number; y?: number; x?: number; scale?: number; duration?: number; style?: ViewStyle | ViewStyle[];
}) {
  const a = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration, delay, easing: EASE, useNativeDriver: native }).start();
  }, []);
  return (
    <Animated.View style={[style, {
      opacity: a,
      transform: [
        { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) },
        { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [x, 0] }) },
        { scale: a.interpolate({ inputRange: [0, 1], outputRange: [scale, 1] }) },
      ],
    }]}>{children}</Animated.View>
  );
}

/** Slow, endless hover — for hero elements. */
export function Float({ children, range = 6, period = 3200, style }: { children: ReactNode; range?: number; period?: number; style?: ViewStyle }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      Animated.timing(a, { toValue: 0, duration: period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={[style, { transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-range, range] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Sparkle that glints: brightens, grows a touch and turns, then rests. */
export function Twinkle({ children, delay = 0, period = 2600, style }: { children: ReactNode; delay?: number; period?: number; style?: ViewStyle }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: period * 0.35, easing: Easing.out(Easing.quad), useNativeDriver: native }),
      Animated.timing(a, { toValue: 0, duration: period * 0.45, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
      Animated.delay(period * 0.2),
    ]));
    const id = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(id); loop.stop(); };
  }, []);
  return (
    <Animated.View pointerEvents="none" style={[style, {
      opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
      transform: [
        { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] }) },
        { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) },
      ],
    }]}>{children}</Animated.View>
  );
}

/** A soft band of light that sweeps across its parent every few seconds. Parent needs overflow: hidden. */
export function Shimmer({ width = 360, every = 3200 }: { width?: number; every?: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
      Animated.delay(every),
      Animated.timing(a, { toValue: 0, duration: 0, useNativeDriver: native }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
      transform: [{ translateX: a.interpolate({ inputRange: [0, 1], outputRange: [-width, width] }) }, { skewX: '-20deg' }],
    }]}>
      <LinearGradient start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
        style={{ width: 90, height: '100%' }} />
    </Animated.View>
  );
}

/** Slowly turning sunburst, used behind the trophy on the win card. */
export function Rays({ size = 220, color = 'rgba(255,196,40,0.13)' }: { size?: number; color?: string }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(a, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: native }));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center',
      transform: [{ rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
      {Array.from({ length: 12 }, (_, i) => (
        <View key={i} style={{ position: 'absolute', width: 12, height: size / 2, top: 0, left: size / 2 - 6,
          borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: color,
          transform: [{ translateY: size / 4 }, { rotate: `${i * 30}deg` }, { translateY: -size / 4 }] }} />
      ))}
    </Animated.View>
  );
}

// ---------- Ambient particles per theme ----------

type Kind = 'petal' | 'leaf' | 'bubble' | 'firefly' | 'star' | 'mote' | 'sparkle';
const AMBIENT: Record<ThemeId, { kind: Kind; colors: string[]; dir: 1 | -1 }> = {
  classic: { kind: 'sparkle', colors: ['#FFE7B0', '#FFFFFF', '#FFD39A'], dir: -1 },
  forest: { kind: 'firefly', colors: ['#EFFF9A', '#D9FF7A'], dir: -1 },
  blossom: { kind: 'petal', colors: ['#FF9CBC', '#FFB7CE', '#FFD1E0'], dir: 1 },
  ocean: { kind: 'bubble', colors: ['rgba(223,246,255,0.9)'], dir: -1 },
  night: { kind: 'star', colors: ['#FFFFFF', '#FFF3C4', '#C9C4FF'], dir: -1 },
  autumn: { kind: 'leaf', colors: ['#FFB347', '#E0602C', '#FFD166', '#C8452A'], dir: 1 },
  paper: { kind: 'mote', colors: ['rgba(255,240,210,0.8)'], dir: -1 },
};

function Particle({ kind, color, dir, W, H, seed }: { kind: Kind; color: string; dir: 1 | -1; W: number; H: number; seed: number }) {
  const t = useRef(new Animated.Value(0)).current;
  const r = (n: number) => { const v = Math.sin(seed * 9301 + n * 49297) * 233280; return v - Math.floor(v); };
  const x0 = r(1) * W, size = kind === 'star' ? 1.5 + r(2) * 2.5 : kind === 'bubble' ? 5 + r(2) * 9 : 5 + r(2) * 7;
  const duration = (kind === 'star' ? 2600 : 9000) + r(3) * 7000;
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: native }));
    const id = setTimeout(() => loop.start(), r(4) * duration);
    return () => { clearTimeout(id); loop.stop(); };
  }, []);

  if (kind === 'star') {
    // Stars stay put and twinkle.
    return <Animated.View style={{ position: 'absolute', left: x0, top: r(5) * H * 0.7, width: size, height: size, borderRadius: size,
      backgroundColor: color, opacity: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1, 0.2] }) }} />;
  }
  const sway = 14 + r(6) * 26;
  const shape: ViewStyle =
    kind === 'petal' ? { width: size * 1.6, height: size, borderRadius: size, borderTopLeftRadius: 0 } :
    kind === 'leaf' ? { width: size * 1.5, height: size * 1.5, borderRadius: 2, borderTopRightRadius: size, borderBottomLeftRadius: size } :
    kind === 'bubble' ? { width: size, height: size, borderRadius: size, borderWidth: 1.5, borderColor: color, backgroundColor: 'transparent' } :
    { width: size * 0.6, height: size * 0.6, borderRadius: size };
  const glow = kind === 'firefly' || kind === 'sparkle' ? { shadowColor: color, shadowOpacity: 1, shadowRadius: 6 } : {};
  return (
    <Animated.View style={[{ position: 'absolute', left: x0, top: 0, backgroundColor: color }, shape, glow, {
      opacity: t.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, kind === 'mote' ? 0.5 : 0.9, kind === 'mote' ? 0.5 : 0.9, 0] }),
      transform: [
        { translateY: t.interpolate({ inputRange: [0, 1], outputRange: dir === 1 ? [-30, H + 30] : [H + 30, -30] }) },
        { translateX: t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, sway, 0, -sway, 0] }) },
        { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(r(7) > 0.5 ? 1 : -1) * (kind === 'petal' || kind === 'leaf' ? 540 : 0)}deg`] }) },
      ],
    }]} />
  );
}

/** Drifting petals, leaves, bubbles, fireflies or twinkling stars for a theme. */
export function Ambient({ theme, count = 18, width, height }: { theme: ThemeId; count?: number; width: number; height: number }) {
  const cfg = AMBIENT[theme] ?? AMBIENT.classic;
  const n = cfg.kind === 'star' ? count * 2 : count;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {Array.from({ length: n }, (_, i) => (
        <Particle key={`${theme}${i}`} kind={cfg.kind} color={cfg.colors[i % cfg.colors.length]} dir={cfg.dir} W={width} H={height} seed={i + 1} />
      ))}
    </View>
  );
}

/** Wraps a whole screen: fades and lifts it in on mount. */
export function ScreenIn({ children }: { children: ReactNode }) {
  return <FadeIn y={10} duration={380} style={{ flex: 1 }}>{children}</FadeIn>;
}
