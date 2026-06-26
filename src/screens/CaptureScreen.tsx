import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ItemCard } from '../components/ItemCard';
import { useApp } from '../store/AppContext';
import { colors, spacing, typeMeta } from '../theme';
import { SynthItem } from '../types';
import { useVoiceCapture } from '../voice/useVoiceCapture';

const PROMPTS = [
  'What’s on your mind?',
  'Say anything — a book, a task, a feeling…',
  'Dump the thoughts. I’ll sort them.',
  'Speak freely. I’m listening.',
];

export function CaptureScreen() {
  const { capture } = useApp();
  const voice = useVoiceCapture();

  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<SynthItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const prompt = useRef(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]).current;

  // Mirror the live voice transcript into the text box.
  useEffect(() => {
    if (voice.listening && voice.transcript) setText(voice.transcript);
  }, [voice.listening, voice.transcript]);

  const recentItems = justAdded;

  async function onSynthesize() {
    const raw = text.trim();
    if (!raw || busy) return;
    if (voice.listening) voice.stop();
    setBusy(true);
    setReply(null);
    setNotice(null);
    try {
      const { outcome, created } = await capture(raw);
      setReply(outcome.partnerReply);
      setJustAdded(created);
      if (outcome.source === 'local' && outcome.fallbackReason) {
        setNotice(`Used on-device synthesis (API: ${outcome.fallbackReason}).`);
      } else if (outcome.source === 'local') {
        setNotice('Used on-device synthesis. Add a Claude API key in Settings for deeper replies.');
      }
      setText('');
      voice.reset();
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    } catch {
      setNotice('Something went wrong synthesizing that thought.');
    } finally {
      setBusy(false);
    }
  }

  function onMicPress() {
    if (voice.listening) voice.stop();
    else voice.start();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>Khayali Pulao</Text>
        <Text style={styles.tagline}>Your thought partner. Speak freely.</Text>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder={prompt}
            placeholderTextColor={colors.textFaint}
            multiline
            value={text}
            onChangeText={setText}
            editable={!busy}
            textAlignVertical="top"
          />
          <View style={styles.inputBar}>
            <Pressable
              onPress={onMicPress}
              disabled={!voice.supported || busy}
              style={[
                styles.mic,
                voice.listening && styles.micActive,
                !voice.supported && styles.micDisabled,
              ]}
            >
              <Text style={styles.micIcon}>{voice.listening ? '■' : '🎙'}</Text>
              <Text style={styles.micLabel}>
                {voice.listening ? 'Listening…' : voice.supported ? 'Hold the thought — talk' : 'Type below'}
              </Text>
            </Pressable>

            <Pressable
              onPress={onSynthesize}
              disabled={busy || !text.trim()}
              style={[styles.submit, (busy || !text.trim()) && styles.submitDisabled]}
            >
              {busy ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.submitText}>Synthesize ↗</Text>
              )}
            </Pressable>
          </View>
        </View>

        {!voice.supported ? (
          <Text style={styles.hint}>
            Voice-to-text runs in the browser build. On a phone, type your thought — everything
            else works the same.
          </Text>
        ) : null}
        {voice.error ? <Text style={styles.error}>Mic: {voice.error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        {reply ? (
          <Animated.View style={[styles.replyCard, { opacity: fade }]}>
            <Text style={styles.replyLabel}>Thought partner</Text>
            <Text style={styles.replyText}>{reply}</Text>
          </Animated.View>
        ) : null}

        {recentItems.length ? (
          <Animated.View style={{ opacity: fade }}>
            <Text style={styles.sectionLabel}>
              Pulled {recentItems.length} thing{recentItems.length === 1 ? '' : 's'} out
            </Text>
            {recentItems.map((it) => (
              <ItemCard key={it.id} item={it} onToggle={() => undefined} onDelete={() => undefined} />
            ))}
          </Animated.View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>However it comes out is fine.</Text>
            <Text style={styles.emptyBody}>
              Books to read, people to text, work to do, things you’re feeling — say it all in one
              breath. I’ll split it into{' '}
              {Object.values(typeMeta)
                .map((m) => m.label.toLowerCase())
                .join(', ')}{' '}
              and reflect it back.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl * 2 },
  brand: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: colors.textDim, fontSize: 15, marginTop: spacing.xs, marginBottom: spacing.xl },
  inputWrap: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  input: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 24,
    minHeight: 130,
    padding: spacing.sm,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  mic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    flex: 1,
  },
  micActive: { backgroundColor: colors.accentSoft },
  micDisabled: { opacity: 0.6 },
  micIcon: { fontSize: 15 },
  micLabel: { color: colors.textDim, fontSize: 13, fontWeight: '500' },
  submit: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: colors.bg, fontWeight: '800', fontSize: 15 },
  hint: { color: colors.textFaint, fontSize: 13, lineHeight: 19, marginTop: spacing.md },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing.md },
  notice: { color: colors.textDim, fontSize: 13, marginTop: spacing.md, fontStyle: 'italic' },
  replyCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: 16,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  replyLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  replyText: { color: colors.text, fontSize: 16, lineHeight: 23 },
  sectionLabel: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  empty: { marginTop: spacing.xxl, alignItems: 'center', paddingHorizontal: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: spacing.sm },
  emptyBody: { color: colors.textDim, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
