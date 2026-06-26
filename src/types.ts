// Core domain model for Khayali Pulao — a voice-first thought partner.
//
// The flow is: the user speaks/types freely (a `CapturedThought`); the AI layer
// breaks that raw stream into structured `SynthItem`s, replies as a thought
// partner, learns durable facts about the user (`ProfileFact`s), and surfaces
// `Suggestion`s. The user can also brainstorm conversationally (`ChatMessage`s)
// and get an accountability `LoadReview`.

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

  // event-specific / scheduling — any item can be given a time block.
  suggestedDate?: string | null; // AI's hint at when this belongs
  durationMinutes?: number | null;
  scheduledFor?: string | null; // ISO datetime the user committed to
}

/** The shape the synthesizer returns per item before it is persisted. */
export interface DraftItem {
  type: ItemType;
  title: string;
  body: string;
  tags: string[];
  priority?: Priority;
  suggestedDate?: string | null;
  durationMinutes?: number | null;
}

// ── Profile: what the app has learned about the user ──────────────────────────

export type FactCategory =
  | 'goal'
  | 'interest'
  | 'value'
  | 'person'
  | 'focus'
  | 'pattern'
  | 'preference';

export interface ProfileFact {
  id: string;
  category: FactCategory;
  text: string;
  createdAt: string;
  updatedAt: string;
  /** How many separate thoughts have reinforced this fact. */
  evidence: number;
}

export interface DraftFact {
  category: FactCategory;
  text: string;
}

// ── Suggestions: books / courses / videos / things to try ─────────────────────

export type SuggestionKind = 'book' | 'course' | 'video' | 'article' | 'practice';

export type SuggestionStatus = 'new' | 'saved' | 'dismissed';

export interface Suggestion {
  id: string;
  kind: SuggestionKind;
  title: string;
  creator?: string; // author / channel / instructor
  reason: string; // why it fits this person right now
  query: string; // search query the app turns into a link
  status: SuggestionStatus;
  createdAt: string;
  sourceThoughtId?: string;
}

export interface DraftSuggestion {
  kind: SuggestionKind;
  title: string;
  creator?: string;
  reason: string;
  query: string;
}

// ── Conversation: the brainstorming / thought-partner thread ──────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
}

// ── Accountability: the load / focus review ───────────────────────────────────

export type LoadLevel = 'light' | 'balanced' | 'heavy' | 'overloaded';

export interface LoadReview {
  summary: string;
  loadLevel: LoadLevel;
  focus: string[]; // a few things genuinely worth the user's attention
  consider: { title: string; why: string }[]; // candidates to drop / defer
  encouragement: string;
  generatedAt: string;
  source: 'anthropic' | 'local';
}

// ── AI capture result ─────────────────────────────────────────────────────────

export interface CaptureResult {
  items: DraftItem[];
  /** The thought-partner's conversational reply to what was just shared. */
  partnerReply: string;
  /** Durable facts the app should remember about the user. */
  profileUpdates: DraftFact[];
  /** Resources worth surfacing based on this thought. */
  suggestions: DraftSuggestion[];
  source: 'anthropic' | 'local';
  /** Set when Anthropic was intended but we fell back on-device. */
  fallbackReason?: string;
}

export interface Settings {
  apiKey: string | null;
  model: string;
}
