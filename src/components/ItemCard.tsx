import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typeMeta } from '../theme';
import { SynthItem } from '../types';
import { relativeTime } from '../util';

interface Props {
  item: SynthItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const priorityColor: Record<string, string> = {
  high: colors.danger,
  medium: colors.accent,
  low: colors.textFaint,
};

export function ItemCard({ item, onToggle, onDelete }: Props) {
  const meta = typeMeta[item.type];
  const isTodo = item.type === 'todo';
  const done = !!item.done;

  return (
    <View style={[styles.card, { borderLeftColor: meta.color }]}>
      <View style={styles.headerRow}>
        <View style={styles.typeRow}>
          {isTodo ? (
            <Pressable
              onPress={() => onToggle(item.id)}
              hitSlop={8}
              style={[styles.check, done && styles.checkDone]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
            >
              {done ? <Text style={styles.checkMark}>✓</Text> : null}
            </Pressable>
          ) : (
            <Text style={[styles.typeEmoji, { color: meta.color }]}>{meta.emoji}</Text>
          )}
          <Text style={[styles.typeLabel, { color: meta.color }]}>{meta.label}</Text>
          {item.priority && isTodo ? (
            <Text style={[styles.priority, { color: priorityColor[item.priority] }]}>
              {item.priority}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={() => onDelete(item.id)} hitSlop={8}>
          <Text style={styles.delete}>✕</Text>
        </Pressable>
      </View>

      <Text style={[styles.title, done && styles.struck]}>{item.title}</Text>
      {item.body && item.body !== item.title ? (
        <Text style={[styles.body, done && styles.struck]} numberOfLines={4}>
          {item.body}
        </Text>
      ) : null}

      {item.type === 'event' && (item.suggestedDate || item.durationMinutes) ? (
        <Text style={styles.meta}>
          {item.suggestedDate ? new Date(item.suggestedDate).toLocaleString() : 'No time set'}
          {item.durationMinutes ? ` · ${item.durationMinutes} min` : ''}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <View style={styles.tags}>
          {item.tags.slice(0, 4).map((t) => (
            <Text key={t} style={styles.tag}>
              #{t}
            </Text>
          ))}
        </View>
        <Text style={styles.time}>{relativeTime(item.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderLeftWidth: 3,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typeEmoji: { fontSize: 14, fontWeight: '700' },
  typeLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  priority: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginLeft: spacing.xs,
  },
  delete: { color: colors.textFaint, fontSize: 14, fontWeight: '600' },
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.accent },
  checkMark: { color: colors.bg, fontSize: 13, fontWeight: '900', lineHeight: 16 },
  title: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 2 },
  body: { color: colors.textDim, fontSize: 14, lineHeight: 20, marginTop: 2 },
  struck: { textDecorationLine: 'line-through', color: colors.textFaint },
  meta: { color: colors.textDim, fontSize: 13, marginTop: spacing.sm },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, flex: 1 },
  tag: { color: colors.textFaint, fontSize: 12 },
  time: { color: colors.textFaint, fontSize: 12 },
});
