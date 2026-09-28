import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const SOURCES = {
  pickup: require('../assets/sounds/pickup.wav'),
  place: require('../assets/sounds/place.wav'),
  word: require('../assets/sounds/word.wav'),
  wrong: require('../assets/sounds/wrong.wav'),
  bot: require('../assets/sounds/bot.wav'),
  win: require('../assets/sounds/win.wav'),
};
export type Sfx = keyof typeof SOURCES;

const HAPTIC: Partial<Record<Sfx, () => Promise<void>>> = {
  pickup: () => Haptics.selectionAsync(),
  place: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  word: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  wrong: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  win: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
};

const players: Partial<Record<Sfx, AudioPlayer>> = {};
let muted = false;
let ready = false;

function init() {
  if (ready) return;
  ready = true;
  // Play even with the iOS silent switch off? No — respect it, like most casual games.
  setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
}

export function play(name: Sfx) {
  if (Platform.OS !== 'web') HAPTIC[name]?.().catch(() => {});
  if (muted) return;
  try {
    init();
    const p = (players[name] ??= createAudioPlayer(SOURCES[name]));
    p.seekTo(0);
    p.play();
  } catch {
    // Audio is decoration; never let it break a move.
  }
}

export const isMuted = () => muted;
export const setMuted = (m: boolean) => { muted = m; };
