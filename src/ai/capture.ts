import {
  CaptureResult,
  DraftFact,
  DraftItem,
  DraftSuggestion,
  FactCategory,
  ItemType,
  Priority,
  ProfileFact,
  Settings,
  SuggestionKind,
} from '../types';
import { asString, asStringArray, callClaude, extractJsonObject } from './client';
import { captureLocally } from './local';

const ITEM_TYPES: ItemType[] = ['note', 'todo', 'event', 'insight'];
const FACT_CATEGORIES: FactCategory[] = [
  'goal', 'interest', 'value', 'person', 'focus', 'pattern', 'preference',
];
const SUGGESTION_KINDS: SuggestionKind[] = ['book', 'course', 'video', 'article', 'practice'];

function profileBlock(profile: ProfileFact[]): string {
  if (!profile.length) return 'You know nothing about this person yet.';
  const lines = profile
    .slice(0, 40)
    .map((f) => `- (${f.category}) ${f.text}`)
    .join('\n');
  return `What you already know about this person:\n${lines}`;
}

function systemPrompt(profile: ProfileFact[]): string {
  return `You are Khayali Pulao — a warm, sharp thought partner that lives in a voice-first journaling app.
Throughout the day the user dumps free-form thoughts: books to read, skills to learn, messages to send,
work tasks, feelings, half-formed ideas — anything.

${profileBlock(profile)}

Every time the user shares, do FOUR things and return them as one JSON object:

1. "items": split the dump into clean, atomic items. Each item is one of:
   - "todo": a concrete action the user intends to take.
   - "event": something time-sensitive or worth scheduling / making time for.
   - "insight": a reflection, feeling, value, or pattern about who they are or want to be.
   - "note": anything else worth keeping (an idea, a reference, a book/course to remember).
   Don't invent items they didn't imply. Title ≤ 9 words. Keep their meaning in "body".
   Add 1-3 lowercase tags. For todos set "priority" (low|medium|high). For events set
   "durationMinutes" (a sensible guess) and "suggestedDate" (ISO 8601) only if they named a day/time, else null.

2. "partnerReply": 2-4 warm, concrete sentences reacting to what actually matters. Talk like a sharp
   friend, not a chatbot. If they're taking on too much, gently say so and help them whittle it down.
   Reference what you know about them when it's genuinely relevant.

3. "profileUpdates": durable facts worth remembering long-term — goals, interests, values, important
   people, current focus, behavioural patterns, preferences. Category is one of
   goal|interest|value|person|focus|pattern|preference. ONLY include real, lasting signal — usually 0-3.
   Skip transient to-dos. Don't repeat facts you already know unless meaningfully refined.

4. "suggestions": specific resources that fit this person right now — real books (with author),
   courses, YouTube-style videos (with channel/creator), articles, or a practice to try. Be selective:
   0-3, only when genuinely useful. For each give "kind" (book|course|video|article|practice),
   "title", "creator" (author/channel, optional), a one-line "reason" tied to them, and a "query"
   (a good search string the app will turn into a link). Do NOT invent URLs.

Return ONLY valid JSON, no markdown fences:
{
  "items": [{"type","title","body","tags":[],"priority":null,"suggestedDate":null,"durationMinutes":null}],
  "partnerReply": "",
  "profileUpdates": [{"category","text"}],
  "suggestions": [{"kind","title","creator":null,"reason","query"}]
}`;
}

function coerceItems(raw: unknown): DraftItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((it): it is Record<string, unknown> => !!it && typeof it === 'object')
    .map((o) => {
      const type = (ITEM_TYPES.includes(o.type as ItemType) ? o.type : 'note') as ItemType;
      const priority = (['low', 'medium', 'high'] as Priority[]).includes(o.priority as Priority)
        ? (o.priority as Priority)
        : undefined;
      return {
        type,
        title: asString(o.title, 'Untitled'),
        body: asString(o.body),
        tags: asStringArray(o.tags),
        priority,
        suggestedDate: typeof o.suggestedDate === 'string' ? o.suggestedDate : null,
        durationMinutes: typeof o.durationMinutes === 'number' ? o.durationMinutes : null,
      } satisfies DraftItem;
    });
}

function coerceFacts(raw: unknown): DraftFact[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
    .map((o) => ({
      category: (FACT_CATEGORIES.includes(o.category as FactCategory)
        ? o.category
        : 'focus') as FactCategory,
      text: asString(o.text),
    }))
    .filter((f) => f.text.length > 0);
}

function coerceSuggestions(raw: unknown): DraftSuggestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .map((o) => ({
      kind: (SUGGESTION_KINDS.includes(o.kind as SuggestionKind)
        ? o.kind
        : 'article') as SuggestionKind,
      title: asString(o.title),
      creator: asString(o.creator) || undefined,
      reason: asString(o.reason),
      query: asString(o.query) || asString(o.title),
    }))
    .filter((s) => s.title.length > 0 && s.query.length > 0);
}

async function captureWithClaude(
  rawText: string,
  settings: Settings,
  profile: ProfileFact[],
): Promise<CaptureResult> {
  const text = await callClaude({
    apiKey: settings.apiKey as string,
    model: settings.model,
    system: systemPrompt(profile),
    messages: [{ role: 'user', content: rawText }],
    maxTokens: 2000,
  });

  const parsed = extractJsonObject(text);
  const items = coerceItems(parsed.items);
  if (items.length === 0) throw new Error('Model returned no items');

  return {
    items,
    partnerReply: asString(parsed.partnerReply, 'Captured. Tell me more whenever you like.'),
    profileUpdates: coerceFacts(parsed.profileUpdates),
    suggestions: coerceSuggestions(parsed.suggestions),
    source: 'anthropic',
  };
}

/** Turn a raw thought stream into items + reply + profile updates + suggestions,
 *  using Claude when configured and always degrading to on-device capture. */
export async function capture(
  rawText: string,
  settings: Settings,
  profile: ProfileFact[],
): Promise<CaptureResult> {
  const text = rawText.trim();
  if (!text) {
    return { items: [], partnerReply: '', profileUpdates: [], suggestions: [], source: 'local' };
  }
  if (settings.apiKey) {
    try {
      return await captureWithClaude(text, settings, profile);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error';
      return { ...captureLocally(text), fallbackReason: reason };
    }
  }
  return captureLocally(text);
}
