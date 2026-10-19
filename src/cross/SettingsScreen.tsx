import { ReactNode, useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Constants from 'expo-constants';
import { resetProgress, updateGame, useGame } from './store';
import { themeById } from './themes';
import { F } from '../ui';
import { FadeIn } from './motion';
import { ScreenHeader, SectionLabel, Toggle } from './chrome';

export const PRIVACY_URL = 'https://rvastudio.in/wordcross/privacy';
export const SUPPORT_EMAIL = 'work@rvastudio.in';
const STORE_URL = Platform.OS === 'android'
  ? 'https://play.google.com/store/apps/details?id=com.abhay.wordcross'
  : 'https://apps.apple.com/app/id6817191231';

export default function SettingsScreen({ onBack, onTutorial, onThemes }: { onBack: () => void; onTutorial: () => void; onThemes: () => void }) {
  const g = useGame();
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const version = Constants.expoConfig?.version ?? '';

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Settings" onBack={onBack} />
      <ScrollView contentContainerStyle={s.wrap} showsVerticalScrollIndicator={false}>
        <FadeIn y={14} style={s.block}>
          <SectionLabel>Gameplay</SectionLabel>
          <View style={s.card}>
            <Row icon="volume-high" tint="#FF5A5F" label="Sound effects">
              <Toggle label="Sound effects" value={!g.muted} onChange={(v) => updateGame({ muted: !v })} />
            </Row>
            <Row icon="vibrate" tint="#8B5CF6" label="Vibration">
              <Toggle label="Vibration" value={g.haptics} onChange={(v) => updateGame({ haptics: v })} />
            </Row>
            <View style={s.inputBlock}>
              <View style={s.inputHead}>
                <IconTile icon="gesture-tap" tint="#0EA5E9" />
                <Text style={s.label}>Answer with</Text>
              </View>
              <View style={s.segment} accessibilityRole="radiogroup">
                <Segment icon="view-grid-outline" label="Letter tiles" on={g.input !== 'keyboard'} onPress={() => updateGame({ input: 'letters' })} />
                <Segment icon="keyboard-outline" label="Keyboard" on={g.input === 'keyboard'} onPress={() => updateGame({ input: 'keyboard' })} />
              </View>
              <Text style={s.hint}>
                {g.input === 'keyboard' ? 'Type any letter. Harder, with no letters to pick from.' : 'Pick from the letters each word needs. Best for relaxed play.'}
              </Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={60} y={14} style={s.block}>
          <SectionLabel>Appearance</SectionLabel>
          <View style={s.card}>
            <Row icon="palette" tint="#F59E0B" label="Theme" detail={themeById(g.theme).name} onPress={onThemes} last />
          </View>
        </FadeIn>

        <FadeIn delay={120} y={14} style={s.block}>
          <SectionLabel>Help & feedback</SectionLabel>
          <View style={s.card}>
            <Row icon="help-circle" tint="#3B82F6" label="How to play" onPress={onTutorial} />
            <Row icon="star" tint="#FBBF24" label="Rate WordCross" onPress={() => Linking.openURL(STORE_URL)} external />
            <Row icon="share-variant" tint="#22C55E" label="Share with a friend"
              onPress={() => Share.share({ message: `I'm hooked on WordCross, a calm daily crossword. ${STORE_URL}` }).catch(() => {})} />
            <Row icon="email" tint="#14B8A6" label="Contact support" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=WordCross ${version}`)} external />
            <Row icon="shield-check" tint="#64748B" label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_URL)} external last />
          </View>
        </FadeIn>

        <FadeIn delay={180} y={14} style={s.block}>
          <SectionLabel>Data</SectionLabel>
          <View style={s.card}>
            <Row icon="restore" tint="#EF4444" label="Reset progress" danger detail={done ? 'Done' : undefined}
              onPress={() => { setDone(false); setConfirm(true); }} last />
          </View>
        </FadeIn>

        <View style={s.about}>
          <Image source={require('../../assets/icon.png')} style={s.appIcon} />
          <Text style={s.appName}>WordCross</Text>
          <Text style={s.meta}>Version {version} · RVA Studio</Text>
          <Text style={s.credit}>3D icons: Microsoft Fluent Emoji (MIT)</Text>
        </View>
      </ScrollView>

      {confirm && (
        <View style={s.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirm(false)} accessibilityLabel="Cancel" />
          <FadeIn y={20} duration={260} style={s.dialog}>
            <View style={s.dialogIcon}><Icon name="alert" size={28} color="#EF4444" /></View>
            <Text style={s.dialogTitle}>Reset all progress?</Text>
            <Text style={s.dialogBody}>Your level, coins, stars and statistics will be cleared. Your theme and settings stay. This can't be undone.</Text>
            <View style={s.dialogRow}>
              <Pressable onPress={() => setConfirm(false)} style={({ pressed }) => [s.btn, s.btnGhost, pressed && { opacity: 0.8 }]}>
                <Text style={[s.btnText, { color: '#1F2640' }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={() => { resetProgress(); setConfirm(false); setDone(true); }} style={({ pressed }) => [s.btn, s.btnDanger, pressed && { opacity: 0.85 }]}>
                <Text style={s.btnText}>Reset</Text>
              </Pressable>
            </View>
          </FadeIn>
        </View>
      )}
    </View>
  );
}

function IconTile({ icon, tint }: { icon: any; tint: string }) {
  return <View style={[s.iconTile, { backgroundColor: tint }]}><Icon name={icon} size={18} color="#fff" /></View>;
}

function Row({ icon, tint, label, detail, children, onPress, last, external, danger }: {
  icon: any; tint: string; label: string; detail?: string; children?: ReactNode; onPress?: () => void; last?: boolean; external?: boolean; danger?: boolean;
}) {
  const body = (
    <>
      <IconTile icon={icon} tint={tint} />
      <View style={[s.rowMain, !last && s.divider]}>
        <Text style={[s.label, danger && { color: '#E5484D' }]} numberOfLines={1}>{label}</Text>
        {detail && <Text style={s.detail}>{detail}</Text>}
        {children}
        {onPress && <Icon name={external ? 'open-in-new' : 'chevron-right'} size={external ? 17 : 22} color="#B4BBCB" />}
      </View>
    </>
  );
  if (!onPress) return <View style={s.row}>{body}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [s.row, pressed && { backgroundColor: '#F1F3F8' }]}>{body}</Pressable>
  );
}

function Segment({ icon, label, on, onPress }: { icon: any; label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={label}
      style={[s.segBtn, on && s.segOn]}>
      <Icon name={icon} size={17} color={on ? '#1F2640' : '#7A8399'} />
      <Text style={[s.segText, on && { color: '#1F2640' }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40, gap: 22 },
  block: { width: '100%', maxWidth: 480 },
  card: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#06082A', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 14, minHeight: 56 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', marginLeft: 12, paddingRight: 14, paddingVertical: 12 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DCE1EA' },
  iconTile: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontFamily: F.bold, fontSize: 16, color: '#1F2640' },
  detail: { fontFamily: F.bold, fontSize: 15, color: '#7A8399' },
  inputBlock: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 16, gap: 12 },
  inputHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  segment: { flexDirection: 'row', backgroundColor: '#EEF1F6', borderRadius: 12, padding: 3 },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10 },
  segOn: { backgroundColor: '#fff', shadowColor: '#06082A', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  segText: { fontFamily: F.heavy, fontSize: 14, color: '#7A8399' },
  hint: { fontFamily: F.regular, fontSize: 13.5, lineHeight: 19, color: '#6B7280' },
  about: { alignItems: 'center', gap: 2, marginTop: 4 },
  appIcon: { width: 60, height: 60, borderRadius: 14, marginBottom: 8 },
  appName: { fontFamily: F.black, fontSize: 17, color: '#fff' },
  meta: { fontFamily: F.bold, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  credit: { fontFamily: F.regular, fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginTop: 6 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,8,30,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 24, padding: 22, alignItems: 'center' },
  dialogIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dialogTitle: { fontFamily: F.black, fontSize: 20, color: '#1F2640', textAlign: 'center' },
  dialogBody: { fontFamily: F.regular, fontSize: 14.5, lineHeight: 21, color: '#5B6478', textAlign: 'center', marginTop: 6 },
  dialogRow: { flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' },
  btn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: '#EEF1F6' },
  btnDanger: { backgroundColor: '#E5484D' },
  btnText: { fontFamily: F.heavy, fontSize: 16, color: '#fff' },
});
