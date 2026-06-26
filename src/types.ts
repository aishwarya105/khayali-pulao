// Core domain model for Khayali Pulao — a voice-first thought-capture app.
//
// The flow is: the user speaks/types freely (a `CapturedThought`), the synthesis
// engine breaks that raw stream into one or more structured `SynthItem`s and
// replies as a thought partner (`SynthesisResult`).

export type ItemType = 'note' | 'todo' | 'event' | 'insight';

export type Priority = 'low' | 'medium' | 'high';

/** A raw, unstructured thought exactly as the user dumped it. */
export interface CapturedThought {
  id: string;
  rawText: string;
  createdAt: string; // ISO timestamp
}

/** A single structured item distilled from a thought. */
export interface SynthItem {
  id: string;
  thoughtId: string;
  type: ItemType;
  title: string;
  body: string;
  tags: string[];
  createdAt: string; // ISO timestamp

  // todo-specific
  done?: boolean;
  priority?: Priority;

  // event-specific
  suggestedDate?: string | null; // ISO date (or date-time) when relevant
  durationMinutes?: number | null;
}

/** The shape a synthesizer must return before items are persisted. */
export interface DraftItem {
  type: ItemType;
  title: string;
  body: string;
  tags: string[];
  priority?: Priority;
  suggestedDate?: string | null;
  durationMinutes?: number | null;
}

export interface SynthesisResult {
  items: DraftItem[];
  /** The thought-partner's conversational reply to what was just shared. */
  partnerReply: string;
  source: 'anthropic' | 'local';
}

export interface Settings {
  apiKey: string | null;
  model: string;
}
