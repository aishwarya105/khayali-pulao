import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../theme';
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
  bubble: { maxWidth: '88%', borderRadius: 6, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  mine: { backgroundColor: colors.block, borderBottomRightRadius: 2 },
  theirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 2, borderWidth: 1, borderColor: colors.border },
  text: { fontSize: 15, lineHeight: 23 },
  textMine: { color: colors.textOnBlock, fontWeight: '500' },
  textTheirs: { color: colors.text, fontFamily: fonts.serif, fontSize: 16, lineHeight: 25 },
});
