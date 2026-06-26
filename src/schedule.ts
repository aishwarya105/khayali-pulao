// Lightweight scheduling helpers — concrete time-slot suggestions that work the
// same on every platform without a heavy date-picker dependency.

export interface SlotOption {
  key: string;
  label: string;
  /** Returns a fresh Date each call so "today" is always relative to now. */
  resolve: () => Date;
}

function at(base: Date, hours: number, minutes = 0): Date {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function nextWeekday(target: number): Date {
  // target: 0=Sun … 6=Sat. Next occurrence strictly after today.
  const d = new Date();
  const delta = ((target - d.getDay() + 7) % 7) || 7;
  d.setDate(d.getDate() + delta);
  return d;
}

export const SLOT_OPTIONS: SlotOption[] = [
  { key: 'this-evening', label: 'This evening', resolve: () => at(new Date(), 19) },
  { key: 'tomorrow-am', label: 'Tomorrow morning', resolve: () => at(addDays(1), 9) },
  { key: 'tomorrow-pm', label: 'Tomorrow evening', resolve: () => at(addDays(1), 19) },
  { key: 'this-weekend', label: 'This weekend', resolve: () => at(nextWeekday(6), 10) },
  { key: 'next-week', label: 'Next week', resolve: () => at(addDays(7), 10) },
];

export function formatSlot(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${time}`;
}

export function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
}

export function isPast(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}
