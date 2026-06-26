import { Platform } from 'react-native';

import { SynthItem } from './types';

// Optional device-calendar export. expo-calendar is a native module, so it is
// lazily required and every entry point degrades gracefully (web, missing
// permission, Expo Go limitations) rather than crashing the app.

type CalendarModule = typeof import('expo-calendar');

function load(): CalendarModule | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-calendar') as CalendarModule;
  } catch {
    return null;
  }
}

export function calendarSupported(): boolean {
  return load() !== null;
}

async function getWritableCalendarId(Cal: CalendarModule): Promise<string | null> {
  const calendars = await Cal.getCalendarsAsync(Cal.EntityTypes.EVENT);
  const writable = calendars.filter((c) => c.allowsModifications);
  const primary =
    writable.find((c) => (c as { isPrimary?: boolean }).isPrimary) ??
    writable.find((c) => c.source?.name === 'Default') ??
    writable[0];
  return primary?.id ?? null;
}

export interface CalendarResult {
  ok: boolean;
  reason?: string;
}

/** Add a scheduled item to the device calendar. Requires item.scheduledFor. */
export async function addItemToCalendar(item: SynthItem): Promise<CalendarResult> {
  const Cal = load();
  if (!Cal) return { ok: false, reason: 'Calendar isn’t available on this platform.' };
  if (!item.scheduledFor) return { ok: false, reason: 'Give it a time first.' };

  try {
    const { status } = await Cal.requestCalendarPermissionsAsync();
    if (status !== 'granted') return { ok: false, reason: 'Calendar permission denied.' };

    const calendarId = await getWritableCalendarId(Cal);
    if (!calendarId) return { ok: false, reason: 'No writable calendar found.' };

    const start = new Date(item.scheduledFor);
    const end = new Date(start.getTime() + (item.durationMinutes ?? 30) * 60000);

    await Cal.createEventAsync(calendarId, {
      title: item.title,
      notes: item.body,
      startDate: start,
      endDate: end,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'Could not add event.' };
  }
}
