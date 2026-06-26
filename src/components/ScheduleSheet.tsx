import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { addItemToCalendar, calendarSupported } from '../calendar';
import { formatSlot, SLOT_OPTIONS } from '../schedule';
import { colors, spacing } from '../theme';
import { SynthItem } from '../types';

interface Props {
  item: SynthItem | null;
  onClose: () => void;
  onSchedule: (id: string, iso: string | null) => void;
}

export function ScheduleSheet({ item, onClose, onSchedule }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const visible = !!item;

  function pick(iso: string) {
    if (!item) return;
    onSchedule(item.id, iso);
    setStatus(`Set for ${formatSlot(iso)}.`);
  }

  async function addToDevice() {
    if (!item?.scheduledFor) {
      setStatus('Pick a time first.');
      return;
    }
    setStatus('Adding to your calendar…');
    const res = await addItemToCalendar({ ...item });
    setStatus(res.ok ? 'Added to your device calendar ✓' : res.reason ?? 'Could not add.');
  }

  function close() {
    setStatus(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Make time for it</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {item?.title}
          </Text>

          <View style={styles.slots}>
            {SLOT_OPTIONS.map((opt) => {
              const iso = opt.resolve().toISOString();
              const active = item?.scheduledFor
                ? formatSlot(item.scheduledFor) === formatSlot(iso)
                : false;
              return (
                <Pressable
                  key={opt.key}
                  style={[styles.slot, active && styles.slotActive]}
                  onPress={() => pick(iso)}
                >
                  <Text style={[styles.slotLabel, active && styles.slotLabelActive]}>{opt.label}</Text>
                  <Text style={styles.slotTime}>{formatSlot(iso)}</Text>
                </Pressable>
              );
            })}
          </View>

          {item?.scheduledFor ? (
            <View style={styles.scheduledRow}>
              <Text style={styles.scheduledText}>Scheduled · {formatSlot(item.scheduledFor)}</Text>
              <Pressable onPress={() => item && onSchedule(item.id, null)}>
                <Text style={styles.clear}>Clear</Text>
              </Pressable>
            </View>
          ) : null}

          {calendarSupported() ? (
            <Pressable style={styles.deviceBtn} onPress={addToDevice}>
              <Text style={styles.deviceBtnText}>＋ Add to device calendar</Text>
            </Pressable>
          ) : null}

          {status ? <Text style={styles.status}>{status}</Text> : null}

          <Pressable style={styles.done} onPress={close}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: 14, marginTop: 2, marginBottom: spacing.lg },
  slots: { gap: spacing.sm },
  slot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  slotLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  slotLabelActive: { color: colors.accent },
  slotTime: { color: colors.textFaint, fontSize: 13 },
  scheduledRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  scheduledText: { color: colors.success, fontSize: 14, fontWeight: '600' },
  clear: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  deviceBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  deviceBtnText: { color: colors.textDim, fontWeight: '600', fontSize: 14 },
  status: { color: colors.textDim, fontSize: 13, marginTop: spacing.md, textAlign: 'center' },
  done: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneText: { color: colors.bg, fontWeight: '800', fontSize: 15 },
});
