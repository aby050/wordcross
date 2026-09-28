import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { streak, updateGame, useGame } from './store';
import { F } from '../ui';
import { Scenery } from './Scenery';
import { FadeIn, Shimmer, Twinkle } from './motion';
import { THEMES } from './themes';

export type Nav = 'play' | 'themes' | 'stats' | 'arrow' | 'battle';

/** The crossed WORD / CROSS tile logo; the shared O is the gold tile. */
function Logo() {
  const T = 46, G = 5;
  let order = 0;
  const tile = (l: string, x: number, y: number, gold = false) => (
    <FadeIn key={`${l}${x}${y}`} delay={350 + order++ * 70} y={-26} duration={600}
      style={{ position: 'absolute', left: x * (T + G), top: y * (T + G) }}>
      <View style={[s.tile, { position: 'relative', width: T, height: T }, gold && s.goldTile]}>
        <Text style={[s.tileText, gold && { color: '#8A4B00' }]}>{l}</Text>
      </View>
    </FadeIn>
  );
  return (
    <View style={{ width: 5 * (T + G), height: 4 * (T + G), transform: [{ rotate: '-8deg' }] }}>
      {[...'CROSS'].map((l, i) => tile(l, i, 1, i === 2))}
      {[...'WRD'].map((l, i) => tile(l, 2, i === 0 ? 0 : i + 1))}
      {/* The tiles stay put; only the sparkles twinkle, each on its own rhythm. */}
      <Twinkle delay={0} period={2400} style={{ position: 'absolute', left: -18, top: 6 }}><Text style={s.spark}>✦</Text></Twinkle>
      <Twinkle delay={900} period={3100} style={{ position: 'absolute', right: 10, top: -8 }}><Text style={[s.spark, { fontSize: 22 }]}>✦</Text></Twinkle>
      <Twinkle delay={1600} period={2700} style={{ position: 'absolute', right: -16, bottom: 10 }}><Text style={s.spark}>✦</Text></Twinkle>
    </View>
  );
}

export default function HomeScreen({ go }: { go: (n: Nav) => void }) {
  const g = useGame();
  const days = streak(g.days);
  return (
    <View style={{ flex: 1 }}>
      <Scenery theme={g.theme} />
      <LinearGradient colors={['rgba(47,63,214,0.92)', 'rgba(47,63,214,0.55)', 'rgba(20,24,90,0.25)', 'rgba(20,24,90,0.6)']}
        locations={[0, 0.35, 0.65, 1]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={s.wrap}>
        <FadeIn delay={0} y={-10} style={s.topRow}>
          <View style={s.chip}><Icon name="fire" size={18} color="#FF8A3D" /><Text style={s.chipText}>{days} day{days === 1 ? '' : 's'}</Text></View>
          <Pressable onPress={() => updateGame({ muted: !g.muted })} hitSlop={10} style={s.chip}>
            <Icon name={g.muted ? 'volume-off' : 'volume-high'} size={18} color="#fff" />
          </Pressable>
          <View style={s.chip}>
            <View style={s.coinDot}><Text style={s.coinGlyph}>$</Text></View>
            <Text style={s.chipText}>{g.coins}</Text>
          </View>
        </FadeIn>

        <FadeIn delay={80} y={20} style={{ alignItems: 'center' }}>
          <Text style={s.title1}>Crossword</Text>
        </FadeIn>
        <FadeIn delay={160} y={20} style={{ alignItems: 'center' }}>
          <Text style={s.title2}>Puzzle Fun</Text>
        </FadeIn>
        <FadeIn delay={240} y={12}><Text style={s.tag}>Train your brain anytime, anywhere!</Text></FadeIn>

        <View style={{ marginVertical: 26 }}><Logo /></View>

        <FadeIn delay={700} y={24} style={{ width: '100%', maxWidth: 360 }}>
        <Pressable onPress={() => go('play')} style={({ pressed }) => [s.play, pressed && { transform: [{ scale: 0.98 }] }]}>
          <LinearGradient colors={['#FFE45C', '#FFC928', '#F5A900']} style={[StyleSheet.absoluteFill, { borderRadius: 30 }]} />
          <Icon name="play" size={30} color="#5A3500" />
          <View>
            <Text style={s.playText}>Play</Text>
            <Text style={s.playSub}>Level {g.level}</Text>
          </View>
          <Shimmer width={380} />
        </Pressable>
        </FadeIn>

        <View style={s.grid}>
          <CardIn i={0}><Card icon="palette" color="#EC4899" title="Themes" sub={`${THEMES.length} styles`} onPress={() => go('themes')} /></CardIn>
          <CardIn i={1}><Card icon="chart-bar" color="#22C55E" title="Statistics" sub={`${g.solved} solved`} onPress={() => go('stats')} /></CardIn>
          <CardIn i={2}><Card icon="arrow-decision" color="#F59E0B" title="Arrow Puzzles" sub="Picture clues" onPress={() => go('arrow')} /></CardIn>
          <CardIn i={3}><Card icon="sword-cross" color="#8B5CF6" title="Word Battle" sub="vs Bot" onPress={() => go('battle')} /></CardIn>
        </View>

        <FadeIn delay={1150} y={16}><View style={s.trophy}>
          <Icon name="trophy" size={34} color="#F5B301" />
          <Text style={s.trophyText}>1000+ Puzzles · 2,000+ words</Text>
        </View></FadeIn>
      </ScrollView>
    </View>
  );
}

const CardIn = ({ i, children }: { i: number; children: React.ReactNode }) => (
  <FadeIn delay={850 + i * 80} y={18} style={{ flexBasis: '47%', flexGrow: 1 }}>{children}</FadeIn>
);

function Card({ icon, color, title, sub, onPress }: { icon: any; color: string; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}>
      <View style={[s.cardIcon, { backgroundColor: color }]}><Icon name={icon} size={24} color="#fff" /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.cardTitle}>{title}</Text>
        <Text style={s.cardSub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', maxWidth: 440, width: '100%', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: '#fff', fontFamily: F.heavy, fontSize: 15 },
  coinDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F5B301', borderWidth: 2, borderColor: '#FFD54A', alignItems: 'center', justifyContent: 'center' },
  coinGlyph: { color: '#fff', fontFamily: F.heavy, fontSize: 11, lineHeight: 15 },
  title1: { fontFamily: F.heavy, fontSize: 50, color: '#FFE14D', marginTop: 18, lineHeight: 58, transform: [{ rotate: '-4deg' }],
    textShadowColor: 'rgba(20,20,90,0.45)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 0 },
  title2: { fontFamily: F.heavy, fontSize: 42, color: '#fff', lineHeight: 50, marginTop: -6, transform: [{ rotate: '-4deg' }],
    textShadowColor: 'rgba(20,20,90,0.45)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 0 },
  tag: { fontFamily: F.bold, color: '#DDE3FF', fontSize: 16, marginTop: 6 },
  tile: { position: 'absolute', backgroundColor: '#FFFFFF', borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 4, borderBottomColor: '#C9CFEA', shadowColor: '#0B1060', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  goldTile: { backgroundColor: '#FFCB2E', borderBottomColor: '#D99A00' },
  tileText: { fontFamily: F.heavy, fontSize: 28, color: '#1F2A6B', lineHeight: 36 },
  spark: { color: '#FFE14D', fontSize: 28 },
  play: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 72, width: '100%', maxWidth: 360, borderRadius: 30,
    overflow: 'hidden', borderBottomWidth: 5, borderBottomColor: '#C98300', shadowColor: '#10136B', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  playText: { fontFamily: F.heavy, fontSize: 28, color: '#5A3500', lineHeight: 32 },
  playSub: { fontFamily: F.bold, fontSize: 14, color: '#7A4B00', marginTop: -4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 22, maxWidth: 440, width: '100%' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 20, padding: 12,
    shadowColor: '#10136B', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: F.heavy, fontSize: 15, color: '#1F2640', lineHeight: 19 },
  cardSub: { fontFamily: F.regular, fontSize: 12, color: '#6B7280' },
  trophy: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22, backgroundColor: '#FFD94A', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10,
    transform: [{ rotate: '-3deg' }] },
  trophyText: { fontFamily: F.heavy, fontSize: 17, color: '#3B2A00' },
});
