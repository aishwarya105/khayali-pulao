// Dependency-free, on-device intelligence. Keeps the whole app working with no
// API key and no network, and is the automatic fallback when an Anthropic call
// fails. It is intentionally simple — the Claude-backed path is far richer.

import {
  CaptureResult,
  DraftFact,
  DraftItem,
  DraftSuggestion,
  ItemType,
  LoadLevel,
  LoadReview,
  Priority,
  ProfileFact,
  SynthItem,
} from '../types';

const TODO_CUES = [
  'need to', 'have to', 'i should', 'must ', 'todo', 'to-do', 'remember to', 'remind me',
  'buy ', 'send ', 'email ', 'call ', 'text ', 'message ', 'finish ', 'fix ', 'book a',
  'sign up', 'apply ', 'pay ', 'start ', 'set up',
];
const EVENT_CUES = [
  'schedule', 'block time', 'make time', 'set aside', 'appointment', 'meeting', 'tomorrow',
  'tonight', 'next week', 'this weekend', 'on monday', 'on tuesday', 'on wednesday',
  'on thursday', 'on friday', 'on saturday', 'on sunday',
];
const INSIGHT_CUES = [
  'i feel', 'i realize', 'i realised', 'i realized', 'i think', 'i wonder', 'i keep',
  'i always', 'i never', 'lately', 'i want to become', 'i want to be', 'my goal', "i'm scared",
  "i'm anxious", 'i love', 'i hate',
];
const LEARN_CUES = ['read', 'book', 'learn', 'course', 'study', 'watch', 'tutorial', 'practice', 'skill'];

const TIME_RE =
  /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(today|tonight|tomorrow|next week|this weekend|mon(day)?|tue(sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?|sun(day)?)\b/i;

function has(text: string, cues: string[]): boolean {
  const t = text.toLowerCase();
  return cues.some((c) => t.includes(c));
}

function splitThoughts(raw: string): string[] {
  return raw
    .replace(/\b(and then|also,|, also|, and then)\b/gi, '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
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
  return clean.length > words.length ? `${t}…` : t;
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
    suggestedDate: null,
    durationMinutes: type === 'event' ? 30 : undefined,
  };
}

function factsFrom(chunks: string[]): DraftFact[] {
  const facts: DraftFact[] = [];
  for (const c of chunks) {
    const t = c.toLowerCase();
    if (/\bmy goal|i want to (become|be|learn|build|start)|i'?m trying to\b/.test(t)) {
      facts.push({ category: 'goal', text: c });
    } else if (/\bi love|i'?m into|i enjoy|i'?m interested in|fascinated by\b/.test(t)) {
      facts.push({ category: 'interest', text: c });
    } else if (/\bi value|matters to me|i care about|important to me\b/.test(t)) {
      facts.push({ category: 'value', text: c });
    }
  }
  return facts.slice(0, 2);
}

function suggestionsFrom(chunks: string[]): DraftSuggestion[] {
  const out: DraftSuggestion[] = [];
  for (const c of chunks) {
    const t = c.toLowerCase();
    if (/\bbook|read|novel\b/.test(t)) {
      out.push({
        kind: 'book',
        title: `Books on “${shorten(c)}”`,
        reason: 'You mentioned wanting to read around this.',
        query: `best books about ${keywords(c)}`,
      });
    } else if (/\blearn|course|study|skill\b/.test(t)) {
      out.push({
        kind: 'course',
        title: `Courses on “${shorten(c)}”`,
        reason: 'A structured course could give this momentum.',
        query: `online course ${keywords(c)}`,
      });
    } else if (/\bwatch|video|youtube|tutorial\b/.test(t)) {
      out.push({
        kind: 'video',
        title: `Videos on “${shorten(c)}”`,
        reason: 'A short video is a low-friction first step.',
        query: `${keywords(c)} explained`,
      });
    }
  }
  return out.slice(0, 3);
}

function keywords(text: string): string {
  return text
    .toLowerCase()
    .replace(/^(i\s+)?(want to|need to|should|would like to)\s+/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .slice(0, 6)
    .join(' ');
}
const STOP = new Set(['the', 'and', 'for', 'about', 'some', 'more', 'really', 'maybe', 'learn', 'read', 'watch']);

function shorten(text: string, n = 32): string {
  return text.length > n ? `${text.slice(0, n).trim()}…` : text;
}

function replyFor(items: DraftItem[]): string {
  const todos = items.filter((i) => i.type === 'todo').length;
  const events = items.filter((i) => i.type === 'event').length;
  const insights = items.filter((i) => i.type === 'insight').length;
  const parts: string[] = [`Got it — I pulled ${items.length} thing${items.length === 1 ? '' : 's'} out of that.`];
  if (todos) parts.push(`${todos} look${todos === 1 ? 's like a to-do' : ' like to-dos'}.`);
  if (events) parts.push(`${events} ${events === 1 ? 'is' : 'are'} time-sensitive — schedule ${events === 1 ? 'it' : 'them'} from the item.`);
  if (insights) parts.push(`And I noted ${insights === 1 ? 'a reflection' : 'some reflections'} worth sitting with.`);
  parts.push('Add a Claude API key in Settings and I can go deeper — learn about you and suggest real books, courses, and videos.');
  return parts.join(' ');
}

export function captureLocally(rawText: string): CaptureResult {
  const chunks = splitThoughts(rawText);
  const used = chunks.length ? chunks : [rawText];
  const items = used.map(draftFrom);
  return {
    items,
    partnerReply: replyFor(items),
    profileUpdates: factsFrom(used),
    suggestions: suggestionsFrom(used),
    source: 'local',
  };
}

// ── Chat fallback ─────────────────────────────────────────────────────────────

export function chatLocally(userText: string, profile: ProfileFact[]): string {
  const known = profile.length
    ? ` I remember you care about ${profile.slice(0, 2).map((f) => f.text.toLowerCase()).join(' and ')}.`
    : '';
  return (
    `Here's what I'm hearing: "${shorten(userText, 80)}".${known} ` +
    `I'm running on-device right now, so I'll keep it simple — what feels like the real question underneath this? ` +
    `Add a Claude API key in Settings and I can properly brainstorm with you.`
  );
}

// ── Coach fallback ────────────────────────────────────────────────────────────

export function reviewLocally(items: SynthItem[], generatedAt: string): LoadReview {
  const openTodos = items.filter((i) => i.type === 'todo' && !i.done);
  const highPriority = openTodos.filter((i) => i.priority === 'high');
  const upcoming = items.filter((i) => i.scheduledFor);

  let loadLevel: LoadLevel = 'light';
  if (openTodos.length > 18) loadLevel = 'overloaded';
  else if (openTodos.length > 10) loadLevel = 'heavy';
  else if (openTodos.length > 4) loadLevel = 'balanced';

  const focus = (highPriority.length ? highPriority : openTodos).slice(0, 3).map((i) => i.title);
  const consider = openTodos
    .filter((i) => i.priority === 'low')
    .slice(0, 3)
    .map((i) => ({ title: i.title, why: 'Marked low priority — safe to defer.' }));

  const summary =
    loadLevel === 'overloaded' || loadLevel === 'heavy'
      ? `You've got ${openTodos.length} open to-dos${upcoming.length ? ` and ${upcoming.length} scheduled` : ''}. That's a lot to hold — let's narrow it.`
      : `You've got ${openTodos.length} open to-do${openTodos.length === 1 ? '' : 's'}${upcoming.length ? ` and ${upcoming.length} scheduled` : ''}. Manageable.`;

  return {
    summary,
    loadLevel,
    focus,
    consider,
    encouragement:
      loadLevel === 'overloaded'
        ? 'You can do a lot — just not all at once. Pick the three that matter.'
        : 'Steady pace. Knock out one real thing today.',
    generatedAt,
    source: 'local',
  };
}
