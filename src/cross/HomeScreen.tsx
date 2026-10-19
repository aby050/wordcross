import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { dayKey, DAILY_REWARD, streak, updateGame, useGame } from './store';
import { F } from '../ui';
import { Art, fmt } from './chrome';
import { FadeIn, Float, Shimmer, Twinkle } from './motion';
import { THEMES } from './themes';
import { rankOf } from './awards';

export type Nav = 'play' | 'daily' | 'map' | 'themes' | 'stats' | 'arrow' | 'battle' | 'settings' | 'book';

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
      <Twinkle delay={0} period={2400} style={{ position: 'absolute', left: -18, top: 6 }}><Art name="glow" size={26} /></Twinkle>
      <Twinkle delay={900} period={3100} style={{ position: 'absolute', right: 10, top: -8 }}><Art name="glow" size={20} /></Twinkle>
      <Twinkle delay={1600} period={2700} style={{ position: 'absolute', right: -16, bottom: 10 }}><Art name="glow" size={26} /></Twinkle>
    </View>
  );
}

export default function HomeScreen({ go }: { go: (n: Nav) => void }) {
  const g = useGame();
  const days = streak(g.days);
  const { height } = useWindowDimensions();
  // The first screen is the hero (Play + Daily); the other modes sit below the fold.
  const hero = Math.max(600, height - 110);
  // Big logo on tall phones; shrink it on short ones so it never runs into the top chips.
  const logo = Math.min(1.18, Math.max(0.74, (height - 470) / 290));
  const dailyDone = g.dailyDone.includes(dayKey());
  const stars = Object.values(g.stars).reduce((a, b) => a + b, 0);
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <View style={{ minHeight: hero, width: '100%', alignItems: 'center', justifyContent: 'space-between', maxWidth: 440 }}>
        <FadeIn delay={0} y={-10} style={s.topRow}>
          <View style={s.chip}><Art name="fire" size={18} /><Text style={s.chipText}>{days} day{days === 1 ? '' : 's'}</Text></View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => go('themes')} hitSlop={10} style={s.chip} accessibilityLabel="Themes">
              <Icon name="palette" size={18} color="#fff" />
            </Pressable>
            <Pressable onPress={() => go('settings')} hitSlop={10} style={s.chip} accessibilityLabel="Settings">
              <Icon name="cog" size={18} color="#fff" />
            </Pressable>
          </View>
          <View style={s.chip}>
            <Art name="coin" size={20} />
            <Text style={s.chipText}>{fmt(g.coins)}</Text>
          </View>
        </FadeIn>

        {/* Hero: logo + title in the middle, the two big calls to action pinned low. */}
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', gap: 6 }}>
          <View style={{ transform: [{ scale: logo }], height: 4 * 51 * logo + 6, marginTop: 6 + 18 * logo }}><Logo /></View>
          <FadeIn delay={500} y={14} style={{ alignItems: 'center', marginTop: 10 }}>
            <Text style={s.title1}>Crossword</Text>
            <Text style={s.title2}>Puzzle Fun</Text>
          </FadeIn>
        </View>

        <FadeIn delay={700} y={24} style={{ width: '100%', maxWidth: 400 }}>
          <Pressable onPress={() => go('play')} style={({ pressed }) => [s.play, pressed && { transform: [{ scale: 0.98 }] }]}>
            <LinearGradient colors={['#FFE45C', '#FFC928', '#F5A900']} style={[StyleSheet.absoluteFill, { borderRadius: 32 }]} />
            <View style={s.playDisc}><Icon name="play" size={34} color="#fff" style={{ marginLeft: 3 }} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.playText}>Play</Text>
              <Text style={s.playSub}>Next up: level {g.level}</Text>
            </View>
            <Icon name="chevron-right" size={30} color="#7A4B00" />
            <Shimmer width={380} />
          </Pressable>
        </FadeIn>

        <FadeIn delay={780} y={20} style={{ width: '100%', maxWidth: 400, marginTop: 14 }}>
          <Pressable onPress={() => go('daily')} style={({ pressed }) => [s.daily, pressed && { opacity: 0.9, transform: [{ scale: 0.985 }] }]}>
            <LinearGradient colors={dailyDone ? ['#22C55E', '#15A34A'] : ['#F43F8E', '#FF7A45']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 26 }]} />
            <View style={s.dailyIcon}><Icon name={dailyDone ? 'check-bold' : 'calendar-star'} size={30} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.dailyTitle}>Daily Challenge</Text>
              <Text style={s.dailySub}>{dailyDone ? 'Done today. Come back tomorrow' : 'A fresh puzzle every day'}</Text>
            </View>
            {!dailyDone && (
              <View style={s.reward}><Art name="coin" size={20} /><Text style={s.rewardText}>+{DAILY_REWARD}</Text></View>
            )}
          </Pressable>
        </FadeIn>

        <FadeIn delay={1200} y={6} style={s.more}>
          <Text style={s.moreText}>More ways to play</Text>
          <Float range={3} period={1400}><Icon name="chevron-down" size={24} color="#DDE3FF" /></Float>
        </FadeIn>
        </View>

        <View style={s.lower}>
          <FadeIn y={16}>
            <Pressable onPress={() => go('map')} style={({ pressed }) => [s.mapCard, pressed && { opacity: 0.9 }]}>
              <View style={[s.bigIcon, { backgroundColor: '#EC4899' }]}><Icon name="map-marker-path" size={28} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.mapTitle}>Level Map</Text>
                <Text style={s.mapSub}>Level {g.level} · {stars} stars</Text>
                <View style={s.track}><View style={[s.trackFill, { width: `${((g.level - 1) % 10) * 10}%` }]} /></View>
                <Text style={s.mapChest}>{10 - ((g.level - 1) % 10)} levels to the next chest</Text>
              </View>
              <Icon name="chevron-right" size={26} color="#9CA3AF" />
            </Pressable>
          </FadeIn>
          <View style={s.grid}>
            <CardIn i={0}><Tile icon="image-search-outline" a="#FBBF24" b="#F59E0B" title="Arrows" sub="Picture clues" onPress={() => go('arrow')} /></CardIn>
            <CardIn i={1}><Tile icon="sword-cross" a="#A78BFA" b="#7C3AED" title="Word Battle" sub="Play the bot" onPress={() => go('battle')} /></CardIn>
            <CardIn i={2}><Tile icon="book-open-page-variant" a="#38BDF8" b="#0284C7" title="Word Book" sub={`${Object.keys(g.book).length} saved`} onPress={() => go('book')} /></CardIn>
            <CardIn i={3}><Tile icon="trophy-award" a="#4ADE80" b="#16A34A" title="Awards" sub={`Rank: ${rankOf(g).rank.name}`} onPress={() => go('stats')} /></CardIn>
          </View>
          <FadeIn y={12} style={s.badges}>
            <View style={s.badge}><Icon name="wifi-off" size={15} color="#fff" /><Text style={s.badgeText}>Works offline</Text></View>
            <View style={s.badge}><Icon name="shield-check" size={15} color="#fff" /><Text style={s.badgeText}>No ads</Text></View>
            <View style={s.badge}><Icon name="puzzle" size={15} color="#fff" /><Text style={s.badgeText}>1000+ puzzles</Text></View>
          </FadeIn>
        </View>
      </ScrollView>
    </View>
  );
}

const CardIn = ({ i, children }: { i: number; children: React.ReactNode }) => (
  <FadeIn delay={850 + i * 80} y={18} style={{ flexBasis: '47%', flexGrow: 1 }}>{children}</FadeIn>
);

function Tile({ icon, a, b, title, sub, onPress }: { icon: any; a: string; b: string; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.tile2, pressed && { transform: [{ scale: 0.97 }] }]}>
      <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
      <Icon name={icon} size={64} color="rgba(255,255,255,0.22)" style={{ position: 'absolute', right: -6, bottom: -8 }} />
      <View style={s.tileIcon}><Icon name={icon} size={24} color="#fff" /></View>
      <Text style={s.tile2Title} numberOfLines={1}>{title}</Text>
      <Text style={s.tile2Sub} numberOfLines={1}>{sub}</Text>
    </Pressable>
  );
}

function Card({ icon, color, title, sub, onPress }: { icon: any; color: string; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}>
      <View style={[s.cardIcon, { backgroundColor: color }]}><Icon name={icon} size={24} color="#fff" /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.cardTitle} numberOfLines={1}>{title}</Text>
        <Text style={s.cardSub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  lower: { width: '100%', maxWidth: 440, paddingTop: 6 },
  mapCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 24, padding: 14,
    shadowColor: '#10136B', shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  bigIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  mapTitle: { fontFamily: F.black, fontSize: 19, color: '#1F2640', lineHeight: 26 },
  mapSub: { fontFamily: F.bold, fontSize: 13.5, color: '#6B7280' },
  track: { height: 8, borderRadius: 4, backgroundColor: '#E8EBF5', marginTop: 8, overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: 4, backgroundColor: '#F5B301' },
  mapChest: { fontFamily: F.regular, fontSize: 12, color: '#8A92A6', marginTop: 4 },
  tile2: { height: 112, borderRadius: 24, padding: 14, justifyContent: 'flex-end', overflow: 'hidden',
    shadowColor: '#10136B', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  tileIcon: { position: 'absolute', top: 12, left: 14, width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  tile2Title: { fontFamily: F.black, fontSize: 17, color: '#fff', lineHeight: 24 },
  tile2Sub: { fontFamily: F.bold, fontSize: 12.5, color: 'rgba(255,255,255,0.85)' },
  playDisc: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#F08C00', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: '#C77200' },
  dailyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  rewardText: { fontFamily: F.heavy, fontSize: 16, color: '#fff' },
  wrap: { alignItems: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', maxWidth: 440, width: '100%', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: '#fff', fontFamily: F.heavy, fontSize: 15 },
  title1: { fontFamily: F.black, fontSize: 52, color: '#FFE14D', marginTop: 18, lineHeight: 71, paddingHorizontal: 6, transform: [{ rotate: '-4deg' }],
    textShadowColor: 'rgba(20,20,90,0.45)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 0 },
  title2: { fontFamily: F.black, fontSize: 40, color: '#fff', lineHeight: 55, marginTop: -4, paddingHorizontal: 6, transform: [{ rotate: '-4deg' }],
    textShadowColor: 'rgba(20,20,90,0.45)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 0 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: F.bold, color: '#fff', fontSize: 12.5 },
  tag: { fontFamily: F.bold, color: '#DDE3FF', fontSize: 16, marginTop: 6 },
  tile: { position: 'absolute', backgroundColor: '#FFFFFF', borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 4, borderBottomColor: '#C9CFEA', shadowColor: '#0B1060', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  goldTile: { backgroundColor: '#FFCB2E', borderBottomColor: '#D99A00' },
  tileText: { fontFamily: F.black, fontSize: 28, color: '#1F2A6B', lineHeight: 39 },
  spark: { color: '#FFE14D', fontSize: 28 },
  play: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 92, width: '100%', paddingHorizontal: 16, borderRadius: 32,
    overflow: 'hidden', borderBottomWidth: 5, borderBottomColor: '#C98300', shadowColor: '#10136B', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 7 },
  playText: { fontFamily: F.black, fontSize: 34, color: '#5A3500', lineHeight: 47 },
  playSub: { fontFamily: F.heavy, fontSize: 14, color: '#7A4B00' },
  daily: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 26, padding: 14, overflow: 'hidden', shadowColor: '#10136B', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  more: { alignItems: 'center', opacity: 0.9, marginTop: 16, marginBottom: 6 },
  moreText: { fontFamily: F.bold, fontSize: 13, color: '#DDE3FF' },
  dailyTitle: { fontFamily: F.black, fontSize: 20, color: '#fff', lineHeight: 28 },
  dailySub: { fontFamily: F.bold, fontSize: 14, color: '#FFE4F1' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14, maxWidth: 440, width: '100%' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 20, padding: 10, height: 68,
    shadowColor: '#10136B', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: F.heavy, fontSize: 15, color: '#1F2640', lineHeight: 21 },
  cardSub: { fontFamily: F.regular, fontSize: 12, color: '#6B7280' },
  trophy: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, backgroundColor: '#FFD94A', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10,
    transform: [{ rotate: '-3deg' }] },
  trophyText: { fontFamily: F.heavy, fontSize: 17, color: '#3B2A00' },
});
