import { ItemType } from './types';

export const colors = {
  bg: '#0E1116',
  surface: '#171C24',
  surfaceAlt: '#1F2630',
  border: '#2A323D',
  text: '#ECF1F8',
  textDim: '#9AA7B6',
  textFaint: '#64707E',
  accent: '#7C9EFF',
  accentSoft: '#2A3550',
  danger: '#FF6B6B',
  success: '#4ADE9B',
  warning: '#F5A623',
};

export const typeMeta: Record<ItemType, { label: string; emoji: string; color: string }> = {
  todo: { label: 'To-do', emoji: '✓', color: '#7C9EFF' },
  event: { label: 'Schedule', emoji: '◷', color: '#F5A623' },
  insight: { label: 'Insight', emoji: '✦', color: '#C792EA' },
  note: { label: 'Note', emoji: '•', color: '#4ADE9B' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};
