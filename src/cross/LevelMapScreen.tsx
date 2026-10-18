import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { chestReward, getGame, updateGame, useGame } from './store';
import { F } from '../ui';
import { FadeIn } from './motion';
import { play } from '../sound';

const PER = 10;

export default function LevelMapScreen({ onBack, onPlay }: { onBack: () => void; onPlay: (level: number) => void }) {
  const g = useGame();
  const done = g.level - 1; // levels finished
  const total = Object.values(g.stars).reduce((a, b) => a + b, 0);
  const groups = Math.max(3, Math.ceil(g.level / PER) + 1);
  const claim = (k: number) => {
    if (getGame().chests.includes(k)) return;
    const r = chestReward(k);
    updateGame((s) => ({ coins: s.coins + r.coins, ink: s.ink + r.ink, chests: [...s.chests, k] }));
    play('win');
  };
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#4F6BFF', '#2F3FD6']} style={StyleSheet.absoluteFill} />
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={12}><Icon name="arrow-left" size={26} color="#fff" /></Pressable>
        <Text style={s.title}>Level Map</Text>
        <View style={s.chip}><Icon name="star" size={16} color="#FFE14D" /><Text style={s.chipText}>{total}</Text></View>
      </View>
      <ScrollView contentContainerStyle={s.wrap}>
        {Array.from({ length: groups }, (_, gi) => {
          const k = gi + 1, last = k * PER;
          const ready = done >= last, taken = g.chests.includes(k), r = chestReward(k);
          return (
            <FadeIn key={k} delay={Math.min(gi, 4) * 60} y={16} style={{ width: '100%' }}>
              <View style={s.row}>
                {Array.from({ length: PER }, (_, i) => {
                  const lv = gi * PER + i + 1, open = lv <= g.level, st = g.stars[lv] ?? 0, cur = lv === g.level;
                  return open ? (
                    <Pressable key={lv} onPress={() => onPlay(lv)} style={({ pressed }) => [s.node, lv < g.level && s.nodeDone, cur && s.nodeCur, pressed && { transform: [{ scale: 0.95 }] }]}>
                      <Text style={[s.num, cur && { color: '#5A3500' }]}>{lv}</Text>
                      <View style={{ flexDirection: 'row' }}>
                        {[1, 2, 3].map((n) => <Icon key={n} name={n <= st ? 'star' : 'star-outline'} size={10} color={cur ? '#8A5A00' : n <= st ? '#F5B301' : '#C9CFDD'} />)}
                      </View>
                    </Pressable>
                  ) : (
                    <View key={lv} style={[s.node, s.locked]}><Icon name="lock" size={16} color="#A4ACBC" /><Text style={s.lockNum}>{lv}</Text></View>
                  );
                })}
              </View>
              <Pressable disabled={!ready || taken} onPress={() => claim(k)} style={[s.chest, ready && !taken && s.chestReady, taken && { opacity: 0.55 }]}>
                <Icon name={taken ? 'treasure-chest-outline' : 'treasure-chest'} size={30} color={ready && !taken ? '#5A3500' : '#fff'} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.chestTitle, ready && !taken && { color: '#5A3500' }]}>{taken ? 'Chest opened' : ready ? 'Tap to open chest!' : `Finish level ${last} to unlock`}</Text>
                  <Text style={[s.chestSub, ready && !taken && { color: '#7A4B00' }]}>{r.coins} coins + {r.ink} letter points</Text>
                </View>
              </Pressable>
            </FadeIn>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10 },
  title: { fontFamily: F.heavy, fontSize: 22, color: '#fff' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, paddingHorizontal: 11, paddingVertical: 5 },
  chipText: { fontFamily: F.heavy, color: '#fff', fontSize: 15 },
  wrap: { alignItems: 'center', paddingHorizontal: 12, paddingBottom: 40, maxWidth: 480, alignSelf: 'center', width: '100%' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  node: { width: '17.5%', aspectRatio: 1, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: '#C9CFEA' },
  nodeDone: { backgroundColor: '#F3F6FF' },
  nodeCur: { backgroundColor: '#FFCB2E', borderBottomColor: '#D99A00' },
  num: { fontFamily: F.heavy, fontSize: 18, color: '#1F2A6B', lineHeight: 22 },
  locked: { backgroundColor: 'rgba(255,255,255,0.35)', borderBottomColor: 'transparent' },
  lockNum: { fontFamily: F.bold, fontSize: 11, color: '#A4ACBC' },
  chest: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 18, padding: 12, marginTop: 10, marginBottom: 18 },
  chestReady: { backgroundColor: '#FFCB2E', borderBottomWidth: 4, borderBottomColor: '#D99A00' },
  chestTitle: { fontFamily: F.heavy, fontSize: 16, color: '#fff' },
  chestSub: { fontFamily: F.bold, fontSize: 12.5, color: '#DDE3FF' },
});
