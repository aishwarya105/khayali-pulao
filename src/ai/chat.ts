import { ChatMessage, ProfileFact, Settings, SynthItem } from '../types';
import { callClaude, ClaudeMessage } from './client';
import { chatLocally } from './local';

const MAX_HISTORY = 12;

function contextBlock(profile: ProfileFact[], items: SynthItem[]): string {
  const profileLines = profile.length
    ? profile.slice(0, 30).map((f) => `- (${f.category}) ${f.text}`).join('\n')
    : '- (nothing recorded yet)';

  const openTodos = items.filter((i) => i.type === 'todo' && !i.done).slice(0, 12);
  const recentInsights = items.filter((i) => i.type === 'insight').slice(0, 8);

  const todoLines = openTodos.length
    ? openTodos.map((i) => `- ${i.title}`).join('\n')
    : '- (none)';
  const insightLines = recentInsights.length
    ? recentInsights.map((i) => `- ${i.title}`).join('\n')
    : '- (none)';

  return `Here is what you know about the person you're talking with.

PROFILE:
${profileLines}

THEIR OPEN TO-DOS:
${todoLines}

RECENT REFLECTIONS:
${insightLines}`;
}

const SYSTEM = `You are Khayali Pulao — a warm, candid thought partner and brainstorming companion.
You're not a generic assistant; you're more like a sharp friend who knows this person and wants them
to think clearly and live well. Be concrete and brief (a few sentences, not an essay). Ask a good
question when it helps them go deeper. Draw on what you know about them. When they're spiralling or
overcommitting, gently help them focus. Suggest a specific book, course, video, or next step only when
it genuinely fits — don't firehose them.`;

export async function chat(
  userText: string,
  history: ChatMessage[],
  settings: Settings,
  profile: ProfileFact[],
  items: SynthItem[],
): Promise<{ text: string; source: 'anthropic' | 'local' }> {
  const text = userText.trim();
  if (!text) return { text: '', source: 'local' };

  if (settings.apiKey) {
    try {
      const recent = history.slice(-MAX_HISTORY);
      const messages: ClaudeMessage[] = [
        { role: 'user', content: contextBlock(profile, items) + '\n\nAcknowledge silently and just talk to me.' },
        { role: 'assistant', content: 'Got it — I have your context. What’s on your mind?' },
        ...recent.map((m): ClaudeMessage => ({ role: m.role, content: m.text })),
        { role: 'user', content: text },
      ];
      const reply = await callClaude({
        apiKey: settings.apiKey,
        model: settings.model,
        system: SYSTEM,
        messages,
        maxTokens: 900,
      });
      return { text: reply || 'Tell me more.', source: 'anthropic' };
    } catch {
      return { text: chatLocally(text, profile), source: 'local' };
    }
  }
  return { text: chatLocally(text, profile), source: 'local' };
}
