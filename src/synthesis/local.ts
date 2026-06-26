import { DraftItem, ItemType, Priority, SynthesisResult } from '../types';

// A dependency-free, on-device synthesizer. It is intentionally simple — its job
// is to keep the app fully functional with no API key, and to be a sane fallback
// when the network or Anthropic API is unavailable. The Anthropic-backed engine
// produces much richer results.

const TODO_CUES = [
  'need to',
  'have to',
  'i should',
  'must ',
  'todo',
  'to-do',
  'remember to',
  'remind me',
  'buy ',
  'send ',
  'email ',
  'call ',
  'text ',
  'message ',
  'finish ',
  'fix ',
  'book a',
  'sign up',
  'apply ',
  'pay ',
];

const EVENT_CUES = [
  'schedule',
  'block time',
  'make time',
  'set aside',
  'appointment',
  'meeting',
  'tomorrow',
  'tonight',
  'next week',
  'this weekend',
  'on monday',
  'on tuesday',
  'on wednesday',
  'on thursday',
  'on friday',
  'on saturday',
  'on sunday',
  ' at ', // "at 5pm"
];

const INSIGHT_CUES = [
  'i feel',
  'i realize',
  'i realised',
  'i realized',
  'i think',
  'i wonder',
  'i keep',
  'i always',
  'i never',
  'lately',
  'i want to become',
  'i want to be',
  'my goal',
];

const LEARN_CUES = ['read', 'book', 'learn', 'course', 'study', 'watch', 'tutorial', 'practice'];

const TIME_RE =
  /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(today|tonight|tomorrow|next week|this weekend|mon(day)?|tue(sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?|sun(day)?)\b/i;

function splitThoughts(raw: string): string[] {
  // Break the free-form dump into atomic thoughts on sentence boundaries,
  // newlines and a few common conjunctions people use when speaking.
  return raw
    .replace(/\b(and then|also,|, also|, and then)\b/gi, '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function has(text: string, cues: string[]): boolean {
  const t = text.toLowerCase();
  return cues.some((c) => t.includes(c));
}

function classify(text: string): ItemType {
  if (has(text, EVENT_CUES) && TIME_RE.test(text)) return 'event';
  if (has(text, TODO_CUES)) return 'todo';
  if (has(text, INSIGHT_CUES)) return 'insight';
  if (has(text, EVENT_CUES)) return 'event';
  return 'note';
}

function priorityOf(text: string): Priority {
  const t = text.toLowerCase();
  if (/\b(urgent|asap|today|right now|important|deadline)\b/.test(t)) return 'high';
  if (/\b(someday|eventually|maybe|at some point|one day)\b/.test(t)) return 'low';
  return 'medium';
}

function titleOf(text: string): string {
  const clean = text.replace(/^(i\s+)?(need to|have to|want to|should|must)\s+/i, '');
  const words = clean.split(/\s+/).slice(0, 9).join(' ');
  const t = words.charAt(0).toUpperCase() + words.slice(1);
  return text.length > words.length ? `${t}…` : t;
}

function tagsOf(text: string): string[] {
  const tags = new Set<string>();
  const t = text.toLowerCase();
  if (has(text, LEARN_CUES)) tags.add('learning');
  if (/\bwork|project|deadline|boss|meeting|client\b/.test(t)) tags.add('work');
  if (/\bfriend|family|mom|dad|partner|call|text|message\b/.test(t)) tags.add('relationships');
  if (/\bgym|run|workout|health|sleep|eat|doctor\b/.test(t)) tags.add('health');
  if (/\bbook|read|novel\b/.test(t)) tags.add('book');
  return [...tags];
}

function draftFrom(text: string): DraftItem {
  const type = classify(text);
  return {
    type,
    title: titleOf(text),
    body: text,
    tags: tagsOf(text),
    priority: type === 'todo' ? priorityOf(text) : undefined,
    suggestedDate: type === 'event' ? null : undefined,
    durationMinutes: type === 'event' ? 30 : undefined,
  };
}

function replyFor(items: DraftItem[]): string {
  const todos = items.filter((i) => i.type === 'todo').length;
  const events = items.filter((i) => i.type === 'event').length;
  const insights = items.filter((i) => i.type === 'insight').length;

  const parts: string[] = [];
  parts.push(`Got it — I pulled ${items.length} thing${items.length === 1 ? '' : 's'} out of that.`);
  if (todos) parts.push(`${todos} look${todos === 1 ? 's' : ''} like ${todos === 1 ? 'a to-do' : 'to-dos'}.`);
  if (events) parts.push(`${events} ${events === 1 ? 'is' : 'are'} time-sensitive — want me to find a slot?`);
  if (insights)
    parts.push(`And I noticed ${insights === 1 ? 'a reflection' : 'some reflections'} worth sitting with.`);
  parts.push('Add a Claude API key in Settings and I can go deeper — suggest books, courses, and help you whittle it down.');
  return parts.join(' ');
}

export function synthesizeLocally(rawText: string): SynthesisResult {
  const chunks = splitThoughts(rawText);
  const items = (chunks.length ? chunks : [rawText]).map(draftFrom);
  return {
    items,
    partnerReply: replyFor(items),
    source: 'local',
  };
}
