import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ChatBubble } from '../components/ChatBubble';
import { useApp } from '../store/AppContext';
import { colors, spacing } from '../theme';

const STARTERS = [
  'Help me think through something',
  'I feel stuck on…',
  'What should I focus on this week?',
  'I have an idea I want to develop',
];

export function PartnerScreen() {
  const { chatLog, sendChat, chatPending, clearChat, profile } = useApp();
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [chatLog.length, chatPending]);

  function onSend() {
    const t = text.trim();
    if (!t || chatPending) return;
    setText('');
    void sendChat(t);
  }

  const empty = chatLog.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Partner</Text>
          <Text style={styles.subtitle}>
            {profile.length ? `Knows ${profile.length} thing${profile.length === 1 ? '' : 's'} about you` : 'Brainstorm together'}
          </Text>
        </View>
        {!empty ? (
          <Pressable onPress={clearChat} hitSlop={8}>
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.thread} keyboardShouldPersistTaps="handled">
        {empty ? (
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Think out loud with me.</Text>
            <Text style={styles.introBody}>
              I know what you’ve been capturing and what matters to you. Bring me a knotty decision, a
              half-formed idea, or just whatever’s loud in your head.
            </Text>
            <View style={styles.starters}>
              {STARTERS.map((s) => (
                <Pressable key={s} style={styles.starter} onPress={() => setText(s)}>
                  <Text style={styles.starterText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          chatLog.map((m) => <ChatBubble key={m.id} message={m} />)
        )}
        {chatPending ? (
          <View style={styles.typing}>
            <ActivityIndicator color={colors.textDim} size="small" />
            <Text style={styles.typingText}>thinking…</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Say anything…"
          placeholderTextColor={colors.textFaint}
          value={text}
          onChangeText={setText}
          multiline
          onSubmitEditing={onSend}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={onSend}
          disabled={!text.trim() || chatPending}
          style={[styles.send, (!text.trim() || chatPending) && styles.sendDisabled]}
        >
          <Text style={styles.sendText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  clear: { color: colors.textFaint, fontSize: 14, fontWeight: '600' },
  thread: { padding: spacing.xl, paddingTop: spacing.sm, flexGrow: 1 },
  intro: { paddingTop: spacing.xl },
  introTitle: { color: colors.text, fontSize: 19, fontWeight: '700', marginBottom: spacing.sm },
  introBody: { color: colors.textDim, fontSize: 15, lineHeight: 22, marginBottom: spacing.xl },
  starters: { gap: spacing.sm },
  starter: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  starterText: { color: colors.text, fontSize: 15 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  typingText: { color: colors.textDim, fontSize: 13, fontStyle: 'italic' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: colors.bg, fontSize: 22, fontWeight: '800', lineHeight: 24 },
});
