import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DEFAULT_MODEL } from '../settings';
import { useApp } from '../store/AppContext';
import { colors, fonts, spacing } from '../theme';

const MODEL_OPTIONS = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6 — balanced (recommended)' },
  { id: 'claude-opus-4-8', label: 'Opus 4.8 — deepest reasoning' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 — fastest, cheapest' },
];

export function SettingsScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const { settings, setApiKey, setModel, clearAll, items, thoughts } = useApp();
  const [draftKey, setDraftKey] = useState('');
  const [saved, setSaved] = useState(false);

  const hasKey = !!settings.apiKey;

  async function onSaveKey() {
    await setApiKey(draftKey);
    setDraftKey('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function onRemoveKey() {
    await setApiKey(null);
  }

  function confirmClear() {
    const run = () => void clearAll();
    if (Platform.OS === 'web') {
      // Alert.alert has no buttons on web; use a basic confirm.
      // eslint-disable-next-line no-alert
      if (globalThis.confirm?.('Delete all captured thoughts and items? This cannot be undone.')) {
        run();
      }
      return;
    }
    Alert.alert('Clear all data?', 'This deletes every thought and item on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: run },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {embedded ? null : <Text style={styles.title}>Settings</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Claude API key</Text>
        <Text style={styles.help}>
          Stored only on this device ({Platform.OS === 'web' ? 'browser storage' : 'secure keychain'}
          ). With a key, your thoughts are synthesized by Claude for far richer routing and replies.
          Without one, everything still works using on-device synthesis.
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: hasKey ? colors.success : colors.textFaint }]} />
          <Text style={styles.statusText}>
            {hasKey ? 'Key configured — using Claude' : 'No key — using on-device synthesis'}
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="sk-ant-…"
          placeholderTextColor={colors.textFaint}
          value={draftKey}
          onChangeText={setDraftKey}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <View style={styles.row}>
          <Pressable
            style={[styles.btn, !draftKey.trim() && styles.btnDisabled]}
            disabled={!draftKey.trim()}
            onPress={onSaveKey}
          >
            <Text style={styles.btnText}>{saved ? 'Saved ✓' : 'Save key'}</Text>
          </Pressable>
          {hasKey ? (
            <Pressable style={styles.btnGhost} onPress={onRemoveKey}>
              <Text style={styles.btnGhostText}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model</Text>
        <Text style={styles.help}>Used when a key is set. Default: {DEFAULT_MODEL}.</Text>
        {MODEL_OPTIONS.map((m) => {
          const active = settings.model === m.id;
          return (
            <Pressable
              key={m.id}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => void setModel(m.id)}
            >
              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={styles.optionText}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <Text style={styles.help}>
          {thoughts.length} thought{thoughts.length === 1 ? '' : 's'} · {items.length} item
          {items.length === 1 ? '' : 's'} stored on this device.
        </Text>
        <Pressable style={styles.btnDanger} onPress={confirmClear}>
          <Text style={styles.btnDangerText}>Clear all data</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>Khayali Pulao · everything stays on your device.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl * 2 },
  title: { color: colors.text, fontSize: 28, fontWeight: '600', marginBottom: spacing.lg, fontFamily: fonts.serif },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: spacing.sm },
  help: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  dot: { width: 9, height: 9, borderRadius: 5 },
  statusText: { color: colors.textDim, fontSize: 13 },
  input: {
    backgroundColor: colors.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: colors.accentText, fontWeight: '700' },
  btnGhost: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnGhostText: { color: colors.textDim, fontWeight: '600' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: { borderColor: colors.accent },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.accent },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  optionText: { color: colors.text, fontSize: 14, flex: 1 },
  btnDanger: {
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDangerText: { color: colors.danger, fontWeight: '700' },
  footer: { color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: spacing.md },
});
