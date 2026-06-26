import AsyncStorage from '@react-native-async-storage/async-storage';

import { CapturedThought, SynthItem } from './types';

const THOUGHTS_KEY = 'kp.thoughts.v1';
const ITEMS_KEY = 'kp.items.v1';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  loadThoughts: () => readJson<CapturedThought[]>(THOUGHTS_KEY, []),
  saveThoughts: (thoughts: CapturedThought[]) => writeJson(THOUGHTS_KEY, thoughts),

  loadItems: () => readJson<SynthItem[]>(ITEMS_KEY, []),
  saveItems: (items: SynthItem[]) => writeJson(ITEMS_KEY, items),

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([THOUGHTS_KEY, ITEMS_KEY]);
  },
};
