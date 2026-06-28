import { Platform } from 'react-native';

import { ItemType } from './types';

// Light, warm, editorial — inspired by Claude's aesthetic: a paper-cream
// canvas, soft clay/coral accent, calm ink text, and a serif for display type.

export const colors = {
  bg: '#F7F4EE', // warm paper
  surface: '#FFFFFF', // cards sit a touch brighter than the canvas
  surfaceAlt: '#F0ECE2', // inputs, chips
  border: '#E6E1D6', // soft warm hairline
  text: '#26241F', // warm near-black ink
  textDim: '#6F6A60', // secondary
  textFaint: '#A29B8D', // tertiary / metadata
  accent: '#C96442', // Claude clay / coral
  accentText: '#FFFFFF', // text on accent
  accentSoft: '#F4E5DD', // tinted coral surface
  danger: '#BC4B3C',
  success: '#4F8A5B',
  warning: '#C0883C',
};

export const fonts = {
  // Editorial serif for headings; system sans elsewhere.
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }) as string,
};

export const typeMeta: Record<ItemType, { label: string; emoji: string; color: string }> = {
  todo: { label: 'To-do', emoji: '○', color: '#C96442' },
  event: { label: 'Schedule', emoji: '◷', color: '#C0883C' },
  insight: { label: 'Insight', emoji: '✦', color: '#7A6CB5' },
  note: { label: 'Note', emoji: '•', color: '#4F8A5B' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// A gentle, consistent card shadow (subtle on iOS/web, light elevation on Android).
export const cardShadow = Platform.select({
  ios: {
    shadowColor: '#3A2E22',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 1 },
  default: {
    shadowColor: '#3A2E22',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
}) as object;
