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
import { claimDailyBonus, DAILY_BONUS, ready, updateGame, useGame } from './src/cross/store';
import SettingsScreen from './src/cross/SettingsScreen';
import Tutorial from './src/cross/Tutorial';
import { Toast } from './src/ui';
import { ScreenIn } from './src/cross/motion';

type Screen =
  | { kind: 'home' } | { kind: 'play'; level: number } | { kind: 'themes' } | { kind: 'stats' } | { kind: 'settings' }
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

  const dark = screen.kind === 'home' || screen.kind === 'themes' || screen.kind === 'stats' || screen.kind === 'play' || screen.kind === 'settings';

  return (
    <SafeAreaView style={[s.root, { backgroundColor: dark ? '#2F3FD6' : '#fff' }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />

      <ScreenIn key={`${screen.kind}-${'level' in screen ? screen.level : ''}-${'id' in screen ? screen.id : ''}`}>
      {screen.kind === 'home' && <HomeScreen go={(n) => setScreen(
        n === 'play' ? { kind: 'play', level: game.level } : n === 'arrow' ? { kind: 'arrowMenu' }
          : n === 'battle' ? { kind: 'battle', id: Date.now() } : { kind: n })} />}
      {screen.kind === 'play' && <CrosswordScreen key={screen.level} level={screen.level} onBack={home}
        onNext={() => setScreen({ kind: 'play', level: screen.level + 1 })} />}
      {screen.kind === 'themes' && <ThemesScreen onBack={home} />}
      {screen.kind === 'stats' && <StatsScreen onBack={home} />}
      {screen.kind === 'settings' && <SettingsScreen onBack={home} onTutorial={() => setTutorial(true)} />}

      {(screen.kind === 'arrowMenu' || screen.kind === 'arrow' || screen.kind === 'battle') && (
        <View style={s.header}>
          <Pressable onPress={screen.kind === 'arrow' ? arrowMenu : home} hitSlop={12}><Icon name="arrow-left" size={26} color={C.ink} /></Pressable>
          <Text style={s.title}>{screen.kind === 'arrow' ? `Arrow Puzzle ${screen.level + 1}` : screen.kind === 'battle' ? 'Word Battle' : 'Arrow Puzzles'}</Text>
          <Pressable onPress={() => updateGame({ muted: !game.muted })} hitSlop={12}>
            <Icon name={game.muted ? 'volume-off' : 'volume-high'} size={24} color={C.ink} />
          </Pressable>
        </View>
      )}
      {screen.kind === 'arrowMenu' && (
        <ScrollView contentContainerStyle={s.menu}>
          <LinearGradient colors={['#E6F1FF', '#FFFFFF']} style={StyleSheet.absoluteFill} />
          <Text style={s.section}>Picture clue puzzles · ★ {total}/{PUZZLES.length * 3}</Text>
          <View style={s.levels}>
            {PUZZLES.map((p, i) => (
              isUnlocked(stars, i) ? (
                <Pressable key={i} style={s.level} onPress={() => setScreen({ kind: 'arrow', level: i })}>
                  <Text style={s.levelNum}>{i + 1}</Text>
                  <Text style={s.levelStars}>
                    {stars[i] ? [1, 2, 3].map((k) => (k <= stars[i] ? '★' : '☆')).join('') : `${p.answers.length}×${p.answers.length}`}
                  </Text>
                </Pressable>
              ) : (
                <View key={i} style={[s.level, s.locked]}>
                  <Icon name="lock" size={20} color="#A4ACBC" />
                  <Text style={s.levelSub}>{i + 1}</Text>
                </View>
              )
            ))}
          </View>
        </ScrollView>
      )}
      {screen.kind === 'arrow' && <ArrowGame key={`${screen.level}-${screen.id ?? 0}`} level={screen.level}
        onRetry={() => setScreen({ kind: 'arrow', level: screen.level, id: Date.now() })} puzzle={PUZZLES[screen.level]} onExit={arrowMenu}
        onNext={screen.level + 1 < PUZZLES.length ? () => setScreen({ kind: 'arrow', level: screen.level + 1 }) : undefined} />}
      {screen.kind === 'battle' && <WordGame key={screen.id} onExit={home} />}
      </ScreenIn>
      {showTutorial && <Tutorial onDone={closeTutorial} />}
      <Toast text={toast} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, userSelect: 'none', paddingTop: Platform.OS === 'android' ? 32 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  title: { fontSize: 22, fontFamily: F.heavy, color: C.ink },
  menu: { alignItems: 'center', padding: 24, paddingBottom: 48, gap: 12, flexGrow: 1 },
  section: { alignSelf: 'stretch', maxWidth: 420, fontSize: 18, fontFamily: F.heavy, color: C.ink },
  levels: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', maxWidth: 420, alignSelf: 'stretch' },
  level: { width: 64, height: 64, borderRadius: 18, backgroundColor: C.tile, borderWidth: 1.5, borderColor: C.tileEdge, alignItems: 'center', justifyContent: 'center' },
  levelNum: { fontSize: 28, fontFamily: F.heavy, color: '#2B2F3A', lineHeight: 34 },
  levelStars: { fontSize: 12, color: '#E0A10E', letterSpacing: 1 },
  locked: { backgroundColor: '#EEF1F6', borderColor: '#DDE2EA' },
  levelSub: { fontSize: 11, color: '#7A6440', fontFamily: F.bold },
});
