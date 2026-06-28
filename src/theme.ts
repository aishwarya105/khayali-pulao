import { Platform, TextStyle } from 'react-native';

import { ItemType } from './types';

// Bold editorial: a bright paper canvas, heavy high-contrast ink, one electric
// accent, flat surfaces with crisp hairlines and confident color blocks. Big,
// tight display type drives the hierarchy — magazine-forward, not soft.

export const colors = {
  bg: '#FAF8F2', // bright warm paper
  surface: '#FFFFFF',
  surfaceAlt: '#F1EEE4', // inputs, chips
  block: '#15140F', // ink color-block (hero / emphasis fills)
  border: '#E4E0D4', // hairline
  borderStrong: '#15140F', // editorial rule / emphasized border
  text: '#15140F', // near-black ink
  textOnBlock: '#FAF8F2', // text on ink blocks
  textDim: '#5C584E',
  textFaint: '#9A9486',
  accent: '#2F43E6', // electric cobalt
  accentText: '#FFFFFF',
  accentOnBlock: '#AEB7FF', // lighter cobalt for use on ink blocks
  accentSoft: '#E4E7FB', // tinted accent surface
  danger: '#D11A2A',
  success: '#0E8A4F',
  warning: '#C97A00',
};

// Heavy, tight display type for headlines (system grotesque, max weight).
export const display: TextStyle = {
  fontWeight: '900',
  letterSpacing: -0.8,
  color: colors.text,
};

// Wide-tracked uppercase eyebrow/label.
export const eyebrow: TextStyle = {
  fontWeight: '800',
  fontSize: 11,
  letterSpacing: 1.4,
  textTransform: 'uppercase',
};

export const typeMeta: Record<ItemType, { label: string; emoji: string; color: string }> = {
  todo: { label: 'To-do', emoji: '○', color: '#2F43E6' },
  event: { label: 'Schedule', emoji: '◷', color: '#C97A00' },
  insight: { label: 'Insight', emoji: '✦', color: '#7A3FB0' },
  note: { label: 'Note', emoji: '•', color: '#0E8A4F' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
};

// Editorial cards are flat — emphasis comes from borders and ink blocks, not
// soft shadows. A whisper of lift keeps them off the canvas.
export const cardShadow = Platform.select({
  ios: { shadowColor: '#15140F', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  android: { elevation: 1 },
  default: { shadowColor: '#15140F', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
}) as object;
