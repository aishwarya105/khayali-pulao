import { Settings, SynthesisResult } from '../types';
import { synthesizeWithAnthropic } from './anthropic';
import { synthesizeLocally } from './local';

export interface SynthesizeOutcome extends SynthesisResult {
  /** Set when we intended to use Anthropic but had to fall back locally. */
  fallbackReason?: string;
}

/**
 * Turn a raw thought stream into structured items + a partner reply.
 * Uses Anthropic when an API key is configured, and always falls back to the
 * on-device engine so capture never fails.
 */
export async function synthesize(
  rawText: string,
  settings: Settings,
): Promise<SynthesizeOutcome> {
  const text = rawText.trim();
  if (!text) {
    return { items: [], partnerReply: '', source: 'local' };
  }

  if (settings.apiKey) {
    try {
      return await synthesizeWithAnthropic(text, settings.apiKey, settings.model);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error';
      return { ...synthesizeLocally(text), fallbackReason: reason };
    }
  }

  return synthesizeLocally(text);
}
