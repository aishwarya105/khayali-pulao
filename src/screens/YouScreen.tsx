import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SuggestionCard } from '../components/SuggestionCard';
import { useApp } from '../store/AppContext';
import { SettingsScreen } from './SettingsScreen';
import { colors, display, eyebrow, spacing } from '../theme';
import { FactCategory } from '../types';

type Pane = 'about' | 'suggestions' | 'settings';

const CATEGORY_ORDER: FactCategory[] = ['goal', 'focus', 'interest', 'value', 'person', 'pattern', 'preference'];
const CATEGORY_LABEL: Record<FactCategory, string> = {
  goal: 'Goals',
  focus: 'Current focus',
  interest: 'Interests',
  value: 'Values',
  person: 'People who matter',
  pattern: 'Patterns',
  preference: 'Preferences',
};

export function YouScreen() {
  const { profile, suggestions, setSuggestionStatus, deleteFact } = useApp();
  const [pane, setPane] = useState<Pane>('about');

  const grouped = useMemo(() => {
    const map = new Map<FactCategory, typeof profile>();
    for (const f of profile) {
      const arr = map.get(f.category) ?? [];
      arr.push(f);
      map.set(f.category, arr);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      facts: (map.get(c) ?? []).sort((a, b) => b.evidence - a.evidence),
    }));
  }, [profile]);

  const liveSuggestions = suggestions.filter((s) => s.status !== 'dismissed');
  const savedCount = suggestions.filter((s) => s.status === 'saved').length;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>You</Text>
        <Text style={styles.subtitle}>
          {profile.length} thing{profile.length === 1 ? '' : 's'} learned · {liveSuggestions.length} suggestion
          {liveSuggestions.length === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={styles.segment}>
        {(['about', 'suggestions', 'settings'] as Pane[]).map((p) => (
          <Pressable key={p} style={[styles.segBtn, pane === p && styles.segBtnActive]} onPress={() => setPane(p)}>
            <Text style={[styles.segText, pane === p && styles.segTextActive]}>
              {p === 'about' ? 'About you' : p === 'suggestions' ? 'Library' : 'Settings'}
            </Text>
          </Pressable>
        ))}
      </View>

      {pane === 'settings' ? (
        <SettingsScreen embedded />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {pane === 'about' ? (
            profile.length ? (
              grouped.map((g) => (
                <View key={g.category} style={styles.group}>
                  <Text style={styles.groupLabel}>{CATEGORY_LABEL[g.category]}</Text>
                  {g.facts.map((f) => (
                    <View key={f.id} style={styles.factRow}>
                      <Text style={styles.factText}>{f.text}</Text>
                      <View style={styles.factMeta}>
                        {f.evidence > 1 ? <Text style={styles.evidence}>×{f.evidence}</Text> : null}
                        <Pressable onPress={() => deleteFact(f.id)} hitSlop={8}>
                          <Text style={styles.factDelete}>✕</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>I’m still getting to know you.</Text>
                <Text style={styles.emptyBody}>
                  As you capture thoughts, I’ll remember your goals, interests, values, and the people
                  who matter — and it’ll show up here. The more you share, the sharper I get.
                </Text>
              </View>
            )
          ) : null}

          {pane === 'suggestions' ? (
            liveSuggestions.length ? (
              <>
                {savedCount ? <Text style={styles.note}>★ {savedCount} saved</Text> : null}
                {[...liveSuggestions]
                  .sort((a, b) => (a.status === 'saved' ? -1 : 0) - (b.status === 'saved' ? -1 : 0))
                  .map((s) => (
                    <SuggestionCard key={s.id} suggestion={s} onSetStatus={setSuggestionStatus} />
                  ))}
              </>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No suggestions yet.</Text>
                <Text style={styles.emptyBody}>
                  Mention a book you want to read, a skill to learn, or something you’re curious about,
                  and I’ll line up real books, courses, and videos here.
                </Text>
              </View>
            )
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { ...display, fontSize: 34, textTransform: 'uppercase' },
  subtitle: { color: colors.textDim, fontSize: 14, marginTop: 2 },
  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: 8, alignItems: 'center' },
  segBtnActive: { backgroundColor: colors.block },
  segText: { ...eyebrow, fontSize: 11, color: colors.textDim },
  segTextActive: { color: colors.textOnBlock },
  scroll: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl * 2 },
  group: { marginBottom: spacing.xl },
  groupLabel: { ...eyebrow, color: colors.textFaint, marginBottom: spacing.sm },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  factText: { color: colors.text, fontSize: 15, lineHeight: 21, flex: 1 },
  factMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginLeft: spacing.md },
  evidence: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  factDelete: { color: colors.textFaint, fontSize: 14 },
  note: { color: colors.warning, fontSize: 13, fontWeight: '600', marginBottom: spacing.md },
  empty: { marginTop: spacing.xxl, alignItems: 'center', paddingHorizontal: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: spacing.sm },
  emptyBody: { color: colors.textDim, fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
