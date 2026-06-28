import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { searchUrl, suggestionMeta } from '../ai/suggestions';
import { cardShadow, colors, spacing } from '../theme';
import { Suggestion, SuggestionStatus } from '../types';

interface Props {
  suggestion: Suggestion;
  onSetStatus?: (id: string, status: SuggestionStatus) => void;
  compact?: boolean;
}

export function SuggestionCard({ suggestion, onSetStatus, compact }: Props) {
  const meta = suggestionMeta[suggestion.kind];
  const saved = suggestion.status === 'saved';

  function open() {
    void Linking.openURL(searchUrl(suggestion));
  }

  return (
    <View style={[styles.card, { borderColor: meta.color + '55' }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.kind, { color: meta.color }]}>
          {meta.emoji} {meta.label}
        </Text>
        {onSetStatus ? (
          <View style={styles.actions}>
            <Pressable onPress={() => onSetStatus(suggestion.id, saved ? 'new' : 'saved')} hitSlop={6}>
              <Text style={[styles.action, saved && styles.actionActive]}>{saved ? '★' : '☆'}</Text>
            </Pressable>
            <Pressable onPress={() => onSetStatus(suggestion.id, 'dismissed')} hitSlop={6}>
              <Text style={styles.action}>✕</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Text style={styles.title}>{suggestion.title}</Text>
      {suggestion.creator ? <Text style={styles.creator}>{suggestion.creator}</Text> : null}
      {!compact ? <Text style={styles.reason}>{suggestion.reason}</Text> : null}

      <Pressable style={styles.open} onPress={open}>
        <Text style={[styles.openText, { color: meta.color }]}>Find it ↗</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...cardShadow,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kind: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  actions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  action: { color: colors.textFaint, fontSize: 16, fontWeight: '700' },
  actionActive: { color: colors.warning },
  title: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: spacing.sm },
  creator: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  reason: { color: colors.textDim, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  open: { marginTop: spacing.md, alignSelf: 'flex-start' },
  openText: { fontSize: 14, fontWeight: '700' },
});
