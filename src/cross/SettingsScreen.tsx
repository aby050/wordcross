import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Constants from 'expo-constants';
import { resetProgress, updateGame, useGame } from './store';
import { F } from '../ui';
import { FadeIn } from './motion';

export const PRIVACY_URL = 'https://rvastudio.in/wordcross/privacy';
export const SUPPORT_EMAIL = 'work@rvastudio.in';

export default function SettingsScreen({ onBack, onTutorial }: { onBack: () => void; onTutorial: () => void }) {
  const g = useGame();
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#4F6BFF', '#2F3FD6']} style={StyleSheet.absoluteFill} />
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Back"><Icon name="arrow-left" size={26} color="#fff" /></Pressable>
        <Text style={s.title}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={s.wrap}>
        <FadeIn y={20} style={s.card}>
          <Row icon="volume-high" label="Sound effects">
            <Switch value={!g.muted} onValueChange={(v) => updateGame({ muted: !v })} trackColor={{ true: '#22C55E' }} />
          </Row>
          <Row icon="vibrate" label="Vibration">
            <Switch value={g.haptics} onValueChange={(v) => updateGame({ haptics: v })} trackColor={{ true: '#22C55E' }} />
          </Row>
          <Row icon="keyboard-outline" label="Full keyboard (harder)" last>
            <Switch value={g.input === 'keyboard'} onValueChange={(v) => updateGame({ input: v ? 'keyboard' : 'letters' })} trackColor={{ true: '#22C55E' }} />
          </Row>
        </FadeIn>

        <FadeIn delay={80} y={20} style={s.card}>
          <Link icon="help-circle-outline" label="How to play" onPress={onTutorial} />
          <Link icon="shield-check-outline" label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_URL)} />
          <Link icon="email-outline" label="Contact support" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=WordCross`)} last />
        </FadeIn>

        <FadeIn delay={160} y={20} style={s.card}>
          {!confirm ? (
            <Pressable onPress={() => { setConfirm(true); setDone(false); }} style={s.row} accessibilityRole="button">
              <Icon name="restore" size={22} color="#E5484D" />
              <Text style={[s.label, { color: '#E5484D' }]}>{done ? 'Progress reset' : 'Reset progress'}</Text>
            </Pressable>
          ) : (
            <View style={{ padding: 14, gap: 10 }}>
              <Text style={s.warn}>This clears your level, coins and statistics. Themes and settings stay. It can't be undone.</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => setConfirm(false)} style={[s.btn, { backgroundColor: '#EEF1F6' }]}><Text style={[s.btnText, { color: '#3A4257' }]}>Keep progress</Text></Pressable>
                <Pressable onPress={() => { resetProgress(); setConfirm(false); setDone(true); }} style={[s.btn, { backgroundColor: '#E5484D' }]}>
                  <Text style={s.btnText}>Reset</Text>
                </Pressable>
              </View>
            </View>
          )}
        </FadeIn>

        <Text style={s.version}>WordCross {Constants.expoConfig?.version ?? ''} · RVA Studio</Text>
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, children, last }: { icon: any; label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[s.row, !last && s.divider]}>
      <Icon name={icon} size={22} color="#3A4257" />
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

function Link({ icon, label, onPress, last }: { icon: any; label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[s.row, !last && s.divider]} accessibilityRole="button">
      <Icon name={icon} size={22} color="#3A4257" />
      <Text style={s.label}>{label}</Text>
      <Icon name="chevron-right" size={22} color="#A4ACBC" />
    </Pressable>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10 },
  title: { fontFamily: F.heavy, fontSize: 22, color: '#fff' },
  wrap: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 440, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 56 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#EEF1F6' },
  label: { flex: 1, fontFamily: F.bold, fontSize: 16, color: '#1F2640' },
  warn: { fontFamily: F.regular, fontSize: 14, color: '#3A4257' },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  btnText: { fontFamily: F.heavy, fontSize: 15, color: '#fff' },
  version: { fontFamily: F.regular, fontSize: 13, color: '#DDE3FF', marginTop: 6 },
});
