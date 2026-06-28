import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ItemCard } from '../components/ItemCard';
import { ScheduleSheet } from '../components/ScheduleSheet';
import { formatSlot, isToday } from '../schedule';
import { useApp } from '../store/AppContext';
import { cardShadow, colors, display, eyebrow, spacing } from '../theme';
import { LoadLevel, SynthItem } from '../types';

const loadMeta: Record<LoadLevel, { label: string; color: string }> = {
  light: { label: 'Light load', color: colors.success },
  balanced: { label: 'Balanced', color: colors.accent },
  heavy: { label: 'Heavy load', color: colors.warning },
  overloaded: { label: 'Overloaded', color: colors.danger },
};

export function TodayScreen() {
  const { items, toggleTodo, deleteItem, scheduleItem, runReview, loadReview, reviewPending } = useApp();
  const [scheduleTarget, setScheduleTarget] = useState<SynthItem | null>(null);

  const { todayItems, upcoming } = useMemo(() => {
    const scheduled = items
      .filter((i) => i.scheduledFor)
      .sort((a, b) => (a.scheduledFor! < b.scheduledFor! ? -1 : 1));
    return {
      todayItems: scheduled.filter((i) => isToday(i.scheduledFor)),
      upcoming: scheduled.filter((i) => !isToday(i.scheduledFor) && i.scheduledFor! > new Date().toISOString()),
    };
  }, [items]);

  const liveTarget = scheduleTarget ? items.find((i) => i.id === scheduleTarget.id) ?? null : null;
  const greeting = getGreeting();
  const lm = loadReview ? loadMeta[loadReview.loadLevel] : null;

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        {/* Accountability / load check */}
        <View style={styles.coachCard}>
          <View style={styles.coachHeader}>
            <Text style={styles.coachTitle}>Load check</Text>
            <Pressable
              style={styles.coachBtn}
              onPress={() => void runReview()}
              disabled={reviewPending}
            >
              {reviewPending ? (
                <ActivityIndicator color={colors.accentText} size="small" />
              ) : (
                <Text style={styles.coachBtnText}>{loadReview ? 'Refresh' : 'Check my load'}</Text>
              )}
            </Pressable>
          </View>

          {loadReview ? (
            <>
              {lm ? (
                <View style={styles.loadPill}>
                  <View style={[styles.loadDot, { backgroundColor: lm.color }]} />
                  <Text style={[styles.loadLabel, { color: lm.color }]}>{lm.label}</Text>
                </View>
              ) : null}
              <Text style={styles.coachSummary}>{loadReview.summary}</Text>

              {loadReview.focus.length ? (
                <View style={styles.coachBlock}>
                  <Text style={styles.coachBlockLabel}>Worth your focus</Text>
                  {loadReview.focus.map((f, i) => (
                    <Text key={i} style={styles.focusItem}>
                      • {f}
                    </Text>
                  ))}
                </View>
              ) : null}

              {loadReview.consider.length ? (
                <View style={styles.coachBlock}>
                  <Text style={styles.coachBlockLabel}>Consider letting go</Text>
                  {loadReview.consider.map((c, i) => (
                    <Text key={i} style={styles.considerItem}>
                      • {c.title} — <Text style={styles.considerWhy}>{c.why}</Text>
                    </Text>
                  ))}
                </View>
              ) : null}

              <Text style={styles.encouragement}>{loadReview.encouragement}</Text>
            </>
          ) : (
            <Text style={styles.coachEmpty}>
              When you’re juggling a lot, I’ll read everything on your plate and help you focus on
              what matters — and call it out when you’re taking on too much.
            </Text>
          )}
        </View>

        {/* Today's agenda */}
        <Text style={styles.sectionLabel}>On the calendar today</Text>
        {todayItems.length ? (
          todayItems.map((it) => (
            <View key={it.id} style={styles.agendaRow}>
              <Text style={styles.agendaTime}>{formatSlot(it.scheduledFor!).split('·')[1]?.trim()}</Text>
              <View style={styles.agendaCard}>
                <ItemCard
                  item={it}
                  onToggle={toggleTodo}
                  onDelete={deleteItem}
                  onSchedule={setScheduleTarget}
                />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            Nothing scheduled for today. Open any to-do or event and “Make time for it.”
          </Text>
        )}

        {upcoming.length ? (
          <>
            <Text style={styles.sectionLabel}>Coming up</Text>
            {upcoming.slice(0, 8).map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                onToggle={toggleTodo}
                onDelete={deleteItem}
                onSchedule={setScheduleTarget}
              />
            ))}
          </>
        ) : null}
      </ScrollView>

      <ScheduleSheet item={liveTarget} onClose={() => setScheduleTarget(null)} onSchedule={scheduleItem} />
    </View>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  if (h < 22) return 'Good evening.';
  return 'Winding down.';
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl * 2 },
  greeting: { ...display, fontSize: 36, lineHeight: 38 },
  date: { color: colors.textDim, fontSize: 15, marginTop: 2, marginBottom: spacing.xl },
  coachCard: {
    backgroundColor: colors.surface,
    borderRadius: 3,
    borderTopWidth: 2,
    borderTopColor: colors.borderStrong,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing.xl,
    ...cardShadow,
  },
  coachHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  coachTitle: { ...display, fontSize: 20 },
  coachBtn: {
    backgroundColor: colors.block,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 3,
    minWidth: 110,
    alignItems: 'center',
  },
  coachBtnText: { color: colors.accentText, fontWeight: '800', fontSize: 13 },
  coachEmpty: { color: colors.textDim, fontSize: 14, lineHeight: 21, marginTop: spacing.md },
  loadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
  },
  loadDot: { width: 9, height: 9, borderRadius: 5 },
  loadLabel: { ...eyebrow, fontSize: 12 },
  coachSummary: { color: colors.text, fontSize: 16, lineHeight: 24, marginTop: spacing.md, fontWeight: '500' },
  coachBlock: { marginTop: spacing.lg },
  coachBlockLabel: { ...eyebrow, color: colors.textFaint, marginBottom: spacing.sm },
  focusItem: { color: colors.text, fontSize: 14, lineHeight: 22 },
  considerItem: { color: colors.textDim, fontSize: 14, lineHeight: 22 },
  considerWhy: { fontStyle: 'italic', color: colors.textFaint },
  encouragement: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.lg,
    lineHeight: 22,
  },
  sectionLabel: { ...eyebrow, color: colors.textFaint, marginTop: spacing.xxl, marginBottom: spacing.md },
  agendaRow: { flexDirection: 'row', gap: spacing.sm },
  agendaTime: { ...eyebrow, color: colors.accent, fontSize: 11, width: 58, paddingTop: spacing.lg },
  agendaCard: { flex: 1 },
  emptyText: { color: colors.textDim, fontSize: 14, lineHeight: 21 },
});
