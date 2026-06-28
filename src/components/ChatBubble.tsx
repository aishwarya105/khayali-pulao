import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme';
import { ChatMessage } from '../types';

export function ChatBubble({ message }: { message: ChatMessage }) {
  const mine = message.role === 'user';
  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text style={[styles.text, mine ? styles.textMine : styles.textTheirs]}>{message.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.md, flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '85%', borderRadius: 16, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  mine: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  text: { fontSize: 15, lineHeight: 22 },
  textMine: { color: colors.accentText, fontWeight: '500' },
  textTheirs: { color: colors.text },
});
