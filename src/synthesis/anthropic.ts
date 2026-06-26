import { DraftItem, ItemType, SynthesisResult } from '../types';

const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const VALID_TYPES: ItemType[] = ['note', 'todo', 'event', 'insight'];

const SYSTEM_PROMPT = `You are Khayali Pulao, a warm, sharp thought partner inside a voice-first journaling app.
The user speaks or types a free-form stream of thoughts throughout their day: books they want to read,
skills to learn, messages to send, work tasks, feelings, half-formed ideas — anything.

Your job, every time, is two things:

1. SYNTHESIZE the raw stream into a list of clean, atomic items. Each item is one of:
   - "todo": a concrete action the user intends to take.
   - "event": something time-sensitive or worth scheduling / making time for.
   - "insight": a reflection, feeling, value, or pattern about who they are or want to be.
   - "note": anything else worth keeping (an idea, a reference, a book/course to remember).
   Split compound thoughts into separate items. Don't invent items the user didn't imply.
   Write a short, specific title (max ~9 words) and keep the user's own meaning in the body.
   Add 1-3 lowercase tags (e.g. work, health, learning, relationships, book).
   For todos set priority (low|medium|high). For events set durationMinutes (a sensible guess)
   and suggestedDate as null unless the user clearly named a day/time.

2. RESPOND as a thought partner in "partnerReply": 2-4 warm, concrete sentences. React to what
   actually matters in what they said. Where it fits, suggest a specific book, course, video, or a
   small next step — but be selective, not a firehose. If they're taking on too much, gently say so
   and help them whittle it down. Talk like a sharp friend, not a chatbot.

Return ONLY valid JSON, no markdown fences, matching exactly:
{
  "items": [
    {
      "type": "todo" | "event" | "insight" | "note",
      "title": string,
      "body": string,
      "tags": string[],
      "priority": "low" | "medium" | "high" | null,
      "suggestedDate": string | null,
      "durationMinutes": number | null
    }
  ],
  "partnerReply": string
}`;

function coerceType(t: unknown): ItemType {
  return VALID_TYPES.includes(t as ItemType) ? (t as ItemType) : 'note';
}

function coerceItems(raw: unknown): DraftItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((it) => it && typeof it === 'object')
    .map((it): DraftItem => {
      const o = it as Record<string, unknown>;
      return {
        type: coerceType(o.type),
        title: typeof o.title === 'string' && o.title.trim() ? o.title.trim() : 'Untitled',
        body: typeof o.body === 'string' ? o.body : '',
        tags: Array.isArray(o.tags) ? o.tags.filter((x): x is string => typeof x === 'string') : [],
        priority:
          o.priority === 'low' || o.priority === 'medium' || o.priority === 'high'
            ? o.priority
            : undefined,
        suggestedDate: typeof o.suggestedDate === 'string' ? o.suggestedDate : null,
        durationMinutes: typeof o.durationMinutes === 'number' ? o.durationMinutes : null,
      };
    });
}

/** Pull the first JSON object out of the model's text, tolerating stray prose/fences. */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in model response');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function synthesizeWithAnthropic(
  rawText: string,
  apiKey: string,
  model: string,
): Promise<SynthesisResult> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      // Allow direct calls from the browser when the app runs on web.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: rawText }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = (data.content ?? [])
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('\n');

  const parsed = extractJson(text) as Record<string, unknown>;
  const items = coerceItems(parsed.items);
  const partnerReply =
    typeof parsed.partnerReply === 'string' && parsed.partnerReply.trim()
      ? parsed.partnerReply.trim()
      : 'Captured. Tell me more whenever you like.';

  if (items.length === 0) {
    throw new Error('Model returned no items');
  }

  return { items, partnerReply, source: 'anthropic' };
}
