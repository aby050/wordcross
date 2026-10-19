// Shared screen chrome so every screen looks like part of one app.
import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Image, ImageStyle, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { F } from '../ui';
import { EASE } from './motion';

/** 3D art from Microsoft Fluent Emoji (MIT, see assets/icons/LICENSE-fluentui-emoji.txt). */
const ART = {
  arrows: require('../../assets/icons/arrows.png'),
  battle: require('../../assets/icons/battle.png'),
  book: require('../../assets/icons/book.png'),
  calendar: require('../../assets/icons/calendar.png'),
  check: require('../../assets/icons/check.png'),
  coin: require('../../assets/icons/coin.png'),
  fire: require('../../assets/icons/fire.png'),
  gift: require('../../assets/icons/gift.png'),
  glow: require('../../assets/icons/glow.png'),
  map: require('../../assets/icons/map.png'),
  palette: require('../../assets/icons/palette.png'),
  star: require('../../assets/icons/star.png'),
  trophy: require('../../assets/icons/trophy.png'),
};
export type ArtName = keyof typeof ART;

export function Art({ name, size, style }: { name: ArtName; size: number; style?: ImageStyle }) {
  return <Image source={ART[name]} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}

/** Deep brand backdrop behind the secondary screens; BG[0] also tints the status-bar strip. */
export const BG = ['#2C38B0', '#1B2070', '#10133F'] as const;
export function ScreenBg() {
  return <LinearGradient colors={[...BG]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />;
}

/** 1,234 — Hermes has no guaranteed Intl, so group by hand. */
export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Round glass button holding a line icon. */
export function IconButton({ icon, onPress, label, size = 40 }: { icon: any; onPress: () => void; label: string; size?: number }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [s.glass, { width: size, height: size, borderRadius: size / 2 }, pressed && s.pressed]}>
      <Icon name={icon} size={size * 0.55} color="#fff" />
    </Pressable>
  );
}

/** Round glass back button, same size and position on every screen. */
export function BackButton({ onPress }: { onPress: () => void }) {
  return <IconButton icon="chevron-left" onPress={onPress} label="Back" />;
}

/** Glass counter pill: 3D art plus a number (coins, streak). */
export function Stat({ art, value, label }: { art: ArtName; value: string; label: string }) {
  return (
    <View style={[s.glass, s.stat]} accessibilityLabel={label}>
      <Art name={art} size={22} />
      <Text style={s.statText}>{value}</Text>
    </View>
  );
}

export function ScreenHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <View style={s.header}>
      <BackButton onPress={onBack} />
      <Text style={s.title} numberOfLines={1}>{title}</Text>
      <View style={s.right}>{right}</View>
    </View>
  );
}

/** Small uppercase label above a group of rows. */
export function SectionLabel({ children }: { children: string }) {
  return <Text style={s.section}>{children}</Text>;
}

/** iOS-style switch drawn by hand so it looks the same on iOS, Android and web. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const a = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: value ? 1 : 0, duration: 200, easing: EASE, useNativeDriver: false }).start();
  }, [value]);
  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={8} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }}>
      <Animated.View style={[s.track, { backgroundColor: a.interpolate({ inputRange: [0, 1], outputRange: ['#DCE1EA', '#34C759'] }) }]}>
        <Animated.View style={[s.knob, { transform: [{ translateX: a.interpolate({ inputRange: [0, 1], outputRange: [2, 22] }) }] }]} />
      </Animated.View>
    </Pressable>
  );
}

export const glass: ViewStyle = { backgroundColor: 'rgba(10,12,48,0.38)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.22)' };

const s = StyleSheet.create({
  glass: { ...glass, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.95 }] },
  stat: { flexDirection: 'row', gap: 6, height: 38, borderRadius: 19, paddingLeft: 8, paddingRight: 13 },
  statText: { fontFamily: F.heavy, fontSize: 16, color: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10, minHeight: 56 },
  title: { flex: 1, textAlign: 'center', fontFamily: F.black, fontSize: 21, color: '#fff' },
  right: { minWidth: 40, alignItems: 'flex-end' },
  section: { alignSelf: 'flex-start', fontFamily: F.heavy, fontSize: 12.5, letterSpacing: 1.2, color: 'rgba(255,255,255,0.62)', textTransform: 'uppercase', marginLeft: 6, marginBottom: 8 },
  track: { width: 51, height: 31, borderRadius: 16, justifyContent: 'center' },
  knob: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
});
