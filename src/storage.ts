import AsyncStorage from '@react-native-async-storage/async-storage';

import { CapturedThought, ChatMessage, ProfileFact, Suggestion, SynthItem } from './types';

const KEYS = {
  thoughts: 'kp.thoughts.v1',
  items: 'kp.items.v1',
  profile: 'kp.profile.v1',
  suggestions: 'kp.suggestions.v1',
  chat: 'kp.chat.v1',
} as const;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): Promise<void> {
  return AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  loadThoughts: () => readJson<CapturedThought[]>(KEYS.thoughts, []),
  saveThoughts: (v: CapturedThought[]) => writeJson(KEYS.thoughts, v),

  loadItems: () => readJson<SynthItem[]>(KEYS.items, []),
  saveItems: (v: SynthItem[]) => writeJson(KEYS.items, v),

  loadProfile: () => readJson<ProfileFact[]>(KEYS.profile, []),
  saveProfile: (v: ProfileFact[]) => writeJson(KEYS.profile, v),

  loadSuggestions: () => readJson<Suggestion[]>(KEYS.suggestions, []),
  saveSuggestions: (v: Suggestion[]) => writeJson(KEYS.suggestions, v),

  loadChat: () => readJson<ChatMessage[]>(KEYS.chat, []),
  saveChat: (v: ChatMessage[]) => writeJson(KEYS.chat, v),

  clearAll: () => AsyncStorage.multiRemove(Object.values(KEYS)),
};
