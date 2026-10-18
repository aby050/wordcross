import { useEffect, useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useFonts } from 'expo-font';
import { Baloo2_500Medium } from '@expo-google-fonts/baloo-2/500Medium';
import { Baloo2_700Bold } from '@expo-google-fonts/baloo-2/700Bold';
import { Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2/800ExtraBold';
import ArrowGame from './src/ArrowGame';
import WordGame from './src/WordGame';
import { PUZZLES } from './src/arrowPuzzles';
import { C, F } from './src/ui';
import { setHaptics, setMuted } from './src/sound';
import { isUnlocked, useStars } from './src/progress';
import HomeScreen from './src/cross/HomeScreen';
import CrosswordScreen from './src/cross/CrosswordScreen';
import ThemesScreen from './src/cross/ThemesScreen';
import StatsScreen from './src/cross/StatsScreen';
import WordBookScreen from './src/cross/WordBookScreen';
import { claimDailyBonus, dailyLevel, DAILY_BONUS, ready, updateGame, useGame } from './src/cross/store';
import SettingsScreen from './src/cross/SettingsScreen';
import Tutorial from './src/cross/Tutorial';
import { Toast } from './src/ui';
import { ScreenIn } from './src/cross/motion';

type Screen =
  | { kind: 'home' } | { kind: 'play'; level: number; daily?: boolean } | { kind: 'themes' } | { kind: 'stats' } | { kind: 'book' } | { kind: 'settings' }
  | { kind: 'arrowMenu' } | { kind: 'arrow'; level: number; id?: number } | { kind: 'battle'; id: number };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  const [fontsLoaded] = useFonts({ Baloo2_500Medium, Baloo2_700Bold, Baloo2_800ExtraBold, ...Icon.font });
  const game = useGame();
  const stars = useStars();
  const total = Object.values(stars).reduce((a, b) => a + b, 0);
  const home = () => setScreen({ kind: 'home' });
  const arrowMenu = () => setScreen({ kind: 'arrowMenu' });
  useEffect(() => { setMuted(game.muted); }, [game.muted]);
  useEffect(() => { setHaptics(game.haptics); }, [game.haptics]);
  const [loaded, setLoaded] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    ready.then(() => {
      setLoaded(true);
      if (claimDailyBonus()) { setToast(`Daily bonus: +${DAILY_BONUS} coins`); setTimeout(() => setToast(null), 2600); }
    });
  }, []);
  const showTutorial = tutorial || (loaded && !game.seenTutorial && screen.kind === 'home');
  const closeTutorial = () => { setTutorial(false); updateGame({ seenTutorial: true }); };

  if (!fontsLoaded) return <View style={[s.root, { backgroundColor: '#2F3FD6' }]} />;

  const dark = screen.kind === 'home' || screen.kind === 'themes' || screen.kind === 'stats' || screen.kind === 'book' || screen.kind === 'play' || screen.kind === 'settings'
    || screen.kind === 'arrowMenu' || screen.kind === 'arrow' || screen.kind === 'battle';

  return (
    <SafeAreaView style={[s.root, { backgroundColor: dark ? '#2F3FD6' : '#fff' }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />

      <ScreenIn key={`${screen.kind}-${'level' in screen ? screen.level : ''}-${'id' in screen ? screen.id : ''}`}>
      {screen.kind === 'home' && <HomeScreen go={(n) => setScreen(
        n === 'play' ? { kind: 'play', level: game.level } : n === 'daily' ? { kind: 'play', level: dailyLevel(), daily: true } : n === 'arrow' ? { kind: 'arrowMenu' }
          : n === 'battle' ? { kind: 'battle', id: Date.now() } : { kind: n })} />}
      {screen.kind === 'play' && <CrosswordScreen key={`${screen.level}${screen.daily}`} level={screen.level} daily={screen.daily} onBack={home}
        onNext={() => (screen.daily ? home() : setScreen({ kind: 'play', level: screen.level + 1 }))} />}
      {screen.kind === 'themes' && <ThemesScreen onBack={home} />}
      {screen.kind === 'stats' && <StatsScreen onBack={home} />}
      {screen.kind === 'book' && <WordBookScreen onBack={home} />}
      {screen.kind === 'settings' && <SettingsScreen onBack={home} onTutorial={() => setTutorial(true)} />}

      {(screen.kind === 'arrowMenu' || screen.kind === 'arrow' || screen.kind === 'battle') && (
        <View style={s.header}>
          <Pressable onPress={screen.kind === 'arrow' ? arrowMenu : home} hitSlop={12}><Icon name="arrow-left" size={26} color="#fff" /></Pressable>
          <Text style={s.title}>{screen.kind === 'arrow' ? `Arrow Puzzle ${screen.level + 1}` : screen.kind === 'battle' ? 'Word Battle' : 'Arrow Puzzles'}</Text>
          <Pressable onPress={() => updateGame({ muted: !game.muted })} hitSlop={12}>
            <Icon name={game.muted ? 'volume-off' : 'volume-high'} size={24} color="#fff" />
          </Pressable>
        </View>
      )}
      {screen.kind === 'arrowMenu' && (
        <View style={s.sheet}>
        <ScrollView contentContainerStyle={s.menu}>
          <View style={s.progress}>
            <Icon name="star-circle" size={40} color="#F5B301" />
            <View style={{ flex: 1 }}>
              <Text style={s.progressTitle}>{total} of {PUZZLES.length * 3} stars</Text>
              <View style={s.bar}><View style={[s.barFill, { width: `${Math.round((total / (PUZZLES.length * 3)) * 100)}%` }]} /></View>
              <Text style={s.progressSub}>Solve picture-clue grids. Fewer hints, more stars.</Text>
            </View>
          </View>
          <View style={s.levels}>
            {PUZZLES.map((p, i) => (
              isUnlocked(stars, i) ? (
                <Pressable key={i} style={({ pressed }) => [s.level, stars[i] ? s.levelDone : null, pressed && { transform: [{ scale: 0.96 }] }]} onPress={() => setScreen({ kind: 'arrow', level: i })}>
                  <Text style={s.levelNum}>{i + 1}</Text>
                  <View style={{ flexDirection: 'row' }}>
                    {[1, 2, 3].map((k) => <Icon key={k} name={k <= (stars[i] ?? 0) ? 'star' : 'star-outline'} size={14} color={k <= (stars[i] ?? 0) ? '#F5B301' : '#C9CFDD'} />)}
                  </View>
                </Pressable>
              ) : (
                <View key={i} style={[s.level, s.locked]}>
                  <Icon name="lock" size={22} color="#A4ACBC" />
                  <Text style={s.levelSub}>{i + 1}</Text>
                </View>
              )
            ))}
          </View>
        </ScrollView>
        </View>
      )}
      {screen.kind === 'arrow' && <View style={s.sheet}><ArrowGame key={`${screen.level}-${screen.id ?? 0}`} level={screen.level}
        onRetry={() => setScreen({ kind: 'arrow', level: screen.level, id: Date.now() })} puzzle={PUZZLES[screen.level]} onExit={arrowMenu}
        onNext={screen.level + 1 < PUZZLES.length ? () => setScreen({ kind: 'arrow', level: screen.level + 1 }) : undefined} /></View>}
      {screen.kind === 'battle' && <View style={s.sheet}><WordGame key={screen.id} onExit={home} /></View>}
      </ScreenIn>
      {showTutorial && <Tutorial onDone={closeTutorial} />}
      <Toast text={toast} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, userSelect: 'none', paddingTop: Platform.OS === 'android' ? 32 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  title: { fontSize: 22, fontFamily: F.heavy, color: '#fff' },
  sheet: { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' },
  menu: { alignItems: 'center', padding: 24, paddingBottom: 48, gap: 12, flexGrow: 1 },
  section: { alignSelf: 'stretch', maxWidth: 420, fontSize: 18, fontFamily: F.heavy, color: C.ink },
  levels: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', maxWidth: 420, alignSelf: 'stretch', justifyContent: 'center' },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, padding: 14, alignSelf: 'stretch', maxWidth: 420,
    shadowColor: '#10136B', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  progressTitle: { fontFamily: F.heavy, fontSize: 17, color: '#1F2640' },
  progressSub: { fontFamily: F.regular, fontSize: 13, color: '#6B7280', marginTop: 4 },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#E8ECF5', overflow: 'hidden', marginTop: 4 },
  barFill: { height: 8, borderRadius: 4, backgroundColor: '#F5B301' },
  level: { width: 72, height: 76, borderRadius: 20, backgroundColor: '#fff', borderWidth: 2, borderColor: '#E3E8F2', borderBottomWidth: 4, alignItems: 'center', justifyContent: 'center', gap: 2 },
  levelDone: { borderColor: '#FFD66B', backgroundColor: '#FFFBEF' },
  levelNum: { fontSize: 26, fontFamily: F.heavy, color: '#2B2F3A', lineHeight: 34 },
  levelStars: { fontSize: 12, color: '#E0A10E', letterSpacing: 1 },
  locked: { backgroundColor: '#EEF1F6', borderColor: '#DDE2EA' },
  levelSub: { fontSize: 11, color: '#7A6440', fontFamily: F.bold },
});
