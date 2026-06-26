import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { settingsStore } from '../settings';
import { storage } from '../storage';
import { synthesize, SynthesizeOutcome } from '../synthesis/engine';
import { CapturedThought, Settings, SynthItem } from '../types';
import { makeId } from '../util';

interface AppState {
  ready: boolean;
  thoughts: CapturedThought[];
  items: SynthItem[];
  settings: Settings;

  capture: (rawText: string) => Promise<{ outcome: SynthesizeOutcome; created: SynthItem[] }>;
  toggleTodo: (id: string) => void;
  deleteItem: (id: string) => void;
  setApiKey: (key: string | null) => Promise<void>;
  setModel: (model: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [thoughts, setThoughts] = useState<CapturedThought[]>([]);
  const [items, setItems] = useState<SynthItem[]>([]);
  const [settings, setSettings] = useState<Settings>({ apiKey: null, model: '' });

  // Hydrate from storage on first mount.
  useEffect(() => {
    let alive = true;
    (async () => {
      const [t, i, s] = await Promise.all([
        storage.loadThoughts(),
        storage.loadItems(),
        settingsStore.load(),
      ]);
      if (!alive) return;
      setThoughts(t);
      setItems(i);
      setSettings(s);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persistThoughts = useCallback((next: CapturedThought[]) => {
    setThoughts(next);
    void storage.saveThoughts(next);
  }, []);

  const persistItems = useCallback((next: SynthItem[]) => {
    setItems(next);
    void storage.saveItems(next);
  }, []);

  const capture = useCallback(
    async (rawText: string): Promise<{ outcome: SynthesizeOutcome; created: SynthItem[] }> => {
      const outcome = await synthesize(rawText, settings);
      if (outcome.items.length === 0) return { outcome, created: [] };

      const now = new Date().toISOString();
      const thought: CapturedThought = { id: makeId('th'), rawText: rawText.trim(), createdAt: now };
      const created: SynthItem[] = outcome.items.map((d) => ({
        id: makeId('it'),
        thoughtId: thought.id,
        createdAt: now,
        done: d.type === 'todo' ? false : undefined,
        ...d,
      }));

      persistThoughts([thought, ...thoughts]);
      persistItems([...created, ...items]);
      return { outcome, created };
    },
    [settings, thoughts, items, persistThoughts, persistItems],
  );

  const toggleTodo = useCallback(
    (id: string) => {
      persistItems(
        items.map((it) => (it.id === id ? { ...it, done: !it.done } : it)),
      );
    },
    [items, persistItems],
  );

  const deleteItem = useCallback(
    (id: string) => {
      persistItems(items.filter((it) => it.id !== id));
    },
    [items, persistItems],
  );

  const setApiKey = useCallback(async (key: string | null) => {
    await settingsStore.setApiKey(key);
    setSettings((s) => ({ ...s, apiKey: key && key.trim() ? key.trim() : null }));
  }, []);

  const setModel = useCallback(async (model: string) => {
    await settingsStore.setModel(model);
    setSettings((s) => ({ ...s, model }));
  }, []);

  const clearAll = useCallback(async () => {
    await storage.clearAll();
    setThoughts([]);
    setItems([]);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      thoughts,
      items,
      settings,
      capture,
      toggleTodo,
      deleteItem,
      setApiKey,
      setModel,
      clearAll,
    }),
    [ready, thoughts, items, settings, capture, toggleTodo, deleteItem, setApiKey, setModel, clearAll],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
