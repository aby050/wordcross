import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

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
};

export function Tile({ letter, value, size, selected, faded, onPress, style }: {
  letter: string; value?: number; size: number; selected?: boolean; faded?: boolean;
  onPress?: () => void; style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.tile, {
        width: size, height: size, borderRadius: size * 0.14, opacity: faded ? 0.45 : 1,
        transform: [{ translateY: selected ? -8 : 0 }, { scale: selected ? 1.08 : 1 }],
        borderColor: selected ? C.blue : C.tileEdge,
      }, style]}
    >
      {value !== undefined && <Text style={[s.val, { fontSize: size * 0.22 }]}>{value}</Text>}
      <Text style={[s.letter, { fontSize: size * 0.55 }]}>{letter}</Text>
    </Pressable>
  );
}

export function ScoreBar({ you, opp, turn }: { you: number; opp: number; turn: 'you' | 'opp' }) {
  return (
    <View style={s.scoreRow}>
      <Text style={s.name}>You</Text>
      <View style={[s.pill, turn === 'you' && { backgroundColor: C.blue }]}>
        <Text style={[s.score, { color: turn === 'you' ? '#fff' : C.blue }]}>{you}</Text>
      </View>
      <Text style={s.vs}>vs</Text>
      <View style={[s.pill, turn === 'opp' && { backgroundColor: '#8A94A8' }]}>
        <Text style={[s.score, { color: turn === 'opp' ? '#fff' : '#A4ACBC' }]}>{opp}</Text>
      </View>
      <Text style={s.name}>Bot</Text>
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
      style={[s.main, disabled && { backgroundColor: '#E3E8F0', shadowOpacity: 0 }]}>
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
    backgroundColor: C.tile, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#9C7A3C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 3, elevation: 3,
  },
  letter: { fontWeight: '800', color: '#2B2F3A' },
  val: { position: 'absolute', top: 2, left: 4, fontWeight: '700', color: '#2B2F3A' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginVertical: 10 },
  name: { fontSize: 17, color: C.ink },
  vs: { fontSize: 15, color: '#8A94A8', marginHorizontal: 10 },
  pill: { backgroundColor: C.grey, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 4, minWidth: 64, alignItems: 'center' },
  score: { fontSize: 24, fontWeight: '800' },
  round: { width: 66, height: 66, borderRadius: 33, backgroundColor: C.grey, alignItems: 'center', justifyContent: 'center' },
  roundLabel: { fontSize: 10, color: C.ink, marginTop: 1 },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: C.blue, borderRadius: 11, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  main: {
    flex: 1, height: 60, borderRadius: 30, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  mainText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  toast: { position: 'absolute', top: '45%', alignSelf: 'center', backgroundColor: 'rgba(30,36,50,0.9)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  toastText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
