import { Platform, TextStyle } from 'react-native';

import { ItemType } from './types';

// New York Times newspaper aesthetic: a clean white page, near-black serif
// headlines, Franklin-Gothic-style uppercase kickers, thin hairline rules, and
// the restrained NYT link-blue used sparingly. Buttons are black; surfaces are
// flat and separated by rules, not shadows.

export const colors = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F7F7', // input / chip fill
  block: '#121212', // black buttons / emphasis
  border: '#E2E2E2', // light hairline
  borderStrong: '#121212', // black editorial rule
  text: '#121212', // near-black ink
  textOnBlock: '#FFFFFF',
  textDim: '#5A5A5A',
  textFaint: '#9A9A9A',
  accent: '#326891', // NYT link blue
  accentText: '#FFFFFF',
  accentOnBlock: '#9DB7CC',
  accentSoft: '#EAF0F4',
  danger: '#A81817', // NYT-ish serious red
  success: '#1A7F4B',
  warning: '#9E6B1F',
};

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }) as string;

export const fonts = { serif: SERIF };

// Serif headline type — the newspaper voice.
export const display: TextStyle = {
  fontFamily: SERIF,
  fontWeight: '700',
  letterSpacing: -0.2,
  color: colors.text,
};

// Franklin-Gothic-style kicker: uppercase, tracked, sans.
export const eyebrow: TextStyle = {
  fontWeight: '700',
  fontSize: 11,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
};

// Monochrome kickers — NYT differentiates sections by the word, not color.
export const typeMeta: Record<ItemType, { label: string; emoji: string; color: string }> = {
  todo: { label: 'To-do', emoji: '○', color: '#121212' },
  event: { label: 'Schedule', emoji: '◷', color: '#121212' },
  insight: { label: 'Insight', emoji: '✦', color: '#121212' },
  note: { label: 'Note', emoji: '•', color: '#121212' },
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
  sm: 2,
  md: 3,
  lg: 4,
};

// Newspaper surfaces are flat — rules and hairlines carry the structure.
export const cardShadow = {} as object;
