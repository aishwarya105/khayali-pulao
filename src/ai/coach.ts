import { LoadLevel, LoadReview, ProfileFact, Settings, SynthItem } from '../types';
import { asString, asStringArray, callClaude, extractJsonObject } from './client';
import { reviewLocally } from './local';

const LOAD_LEVELS: LoadLevel[] = ['light', 'balanced', 'heavy', 'overloaded'];

function loadSnapshot(items: SynthItem[], profile: ProfileFact[]): string {
  const open = items.filter((i) => i.type === 'todo' && !i.done);
  const scheduled = items.filter((i) => i.scheduledFor);
  const events = items.filter((i) => i.type === 'event' && !i.scheduledFor);

  const todoLines = open.length
    ? open.map((i) => `- [${i.priority ?? 'medium'}] ${i.title}`).join('\n')
    : '- (none)';
  const schedLines = scheduled.length
    ? scheduled.map((i) => `- ${i.title} @ ${i.scheduledFor}`).join('\n')
    : '- (none)';
  const goalLines = profile.filter((f) => f.category === 'goal' || f.category === 'focus').slice(0, 8);

  return `OPEN TO-DOS (${open.length}):
${todoLines}

ALREADY SCHEDULED (${scheduled.length}):
${schedLines}

UNSCHEDULED EVENTS (${events.length}): ${events.map((e) => e.title).join('; ') || '(none)'}

THEIR GOALS / FOCUS:
${goalLines.length ? goalLines.map((g) => `- ${g.text}`).join('\n') : '- (unknown)'}`;
}

const SYSTEM = `You are Khayali Pulao acting as a kind but honest accountability coach.
Look at everything on this person's plate and give a grounded read on their load. Your job is to
protect their focus and well-being: celebrate real momentum, and when they're overcommitted, say so
plainly and help them whittle down to what actually matters. Be specific to THEIR items and goals.

Return ONLY valid JSON, no fences:
{
  "summary": "2-3 sentences on where they stand",
  "loadLevel": "light" | "balanced" | "heavy" | "overloaded",
  "focus": ["up to 3 things genuinely worth their attention now"],
  "consider": [{"title":"item to drop/defer","why":"one line"}],
  "encouragement": "one warm, real sentence"
}`;

export async function review(
  items: SynthItem[],
  settings: Settings,
  profile: ProfileFact[],
  generatedAt: string,
): Promise<LoadReview> {
  if (!settings.apiKey) return reviewLocally(items, generatedAt);

  try {
    const text = await callClaude({
      apiKey: settings.apiKey,
      model: settings.model,
      system: SYSTEM,
      messages: [{ role: 'user', content: loadSnapshot(items, profile) }],
      maxTokens: 900,
    });
    const parsed = extractJsonObject(text);
    const loadLevel = (LOAD_LEVELS.includes(parsed.loadLevel as LoadLevel)
      ? parsed.loadLevel
      : 'balanced') as LoadLevel;
    const consider = Array.isArray(parsed.consider)
      ? parsed.consider
          .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
          .map((c) => ({ title: asString(c.title), why: asString(c.why) }))
          .filter((c) => c.title.length > 0)
      : [];

    return {
      summary: asString(parsed.summary, 'Here is where things stand.'),
      loadLevel,
      focus: asStringArray(parsed.focus).slice(0, 3),
      consider: consider.slice(0, 4),
      encouragement: asString(parsed.encouragement, 'One real thing today is enough.'),
      generatedAt,
      source: 'anthropic',
    };
  } catch {
    return reviewLocally(items, generatedAt);
  }
}
