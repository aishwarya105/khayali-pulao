import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ItemCard } from '../components/ItemCard';
import { useApp } from '../store/AppContext';
import { colors, spacing, typeMeta } from '../theme';
import { ItemType } from '../types';

type Filter = 'all' | ItemType | 'open';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open to-dos' },
  { key: 'todo', label: typeMeta.todo.label },
  { key: 'event', label: typeMeta.event.label },
  { key: 'insight', label: typeMeta.insight.label },
  { key: 'note', label: typeMeta.note.label },
];

export function InboxScreen() {
  const { items, toggleTodo, deleteItem } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    switch (filter) {
      case 'all':
        return items;
      case 'open':
        return items.filter((i) => i.type === 'todo' && !i.done);
      default:
        return items.filter((i) => i.type === filter);
    }
  }, [items, filter]);

  const openTodos = items.filter((i) => i.type === 'todo' && !i.done).length;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        <Text style={styles.subtitle}>
          {items.length} item{items.length === 1 ? '' : 's'}
          {openTodos ? ` · ${openTodos} open to-do${openTodos === 1 ? '' : 's'}` : ''}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.chip, filter === f.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length ? (
          filtered.map((it) => (
            <ItemCard key={it.id} item={it} onToggle={toggleTodo} onDelete={deleteItem} />
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {items.length
                ? 'Nothing here under this filter.'
                : 'Nothing captured yet. Head to Capture and speak your mind.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: 14, marginTop: 2 },
  filters: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingVertical: spacing.md },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.bg },
  list: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl * 2 },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { color: colors.textDim, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
