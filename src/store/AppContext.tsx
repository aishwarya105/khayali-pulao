import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { capture as aiCapture } from '../ai/capture';
import { chat as aiChat } from '../ai/chat';
import { review as aiReview } from '../ai/coach';
import { settingsStore } from '../settings';
import { storage } from '../storage';
import {
  CaptureResult,
  ChatMessage,
  DraftFact,
  DraftSuggestion,
  LoadReview,
  ProfileFact,
  Settings,
  Suggestion,
  SuggestionStatus,
  CapturedThought,
  SynthItem,
} from '../types';
import { makeId } from '../util';

interface AppState {
  ready: boolean;
  thoughts: CapturedThought[];
  items: SynthItem[];
  profile: ProfileFact[];
  suggestions: Suggestion[];
  chatLog: ChatMessage[];
  settings: Settings;

  // capture
  capture: (rawText: string) => Promise<{ result: CaptureResult; created: SynthItem[] }>;

  // items
  toggleTodo: (id: string) => void;
  deleteItem: (id: string) => void;
  scheduleItem: (id: string, iso: string | null) => void;

  // suggestions
  setSuggestionStatus: (id: string, status: SuggestionStatus) => void;

  // profile
  deleteFact: (id: string) => void;

  // chat
  sendChat: (text: string) => Promise<void>;
  chatPending: boolean;
  clearChat: () => void;

  // coach
  runReview: () => Promise<LoadReview>;
  loadReview: LoadReview | null;
  reviewPending: boolean;

  // settings / data
  setApiKey: (key: string | null) => Promise<void>;
  setModel: (model: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

/** Merge freshly-extracted facts into the profile, reinforcing near-duplicates
 *  rather than piling up repeats. */
function mergeFacts(existing: ProfileFact[], drafts: DraftFact[], now: string): ProfileFact[] {
  const next = [...existing];
  for (const d of drafts) {
    const dn = norm(d.text);
    if (!dn) continue;
    const hit = next.find(
      (f) =>
        f.category === d.category &&
        (norm(f.text) === dn || norm(f.text).includes(dn) || dn.includes(norm(f.text))),
    );
    if (hit) {
      hit.evidence += 1;
      hit.updatedAt = now;
      // Prefer the longer phrasing — usually the more complete one.
      if (d.text.length > hit.text.length) hit.text = d.text;
    } else {
      next.push({
        id: makeId('fact'),
        category: d.category,
        text: d.text,
        createdAt: now,
        updatedAt: now,
        evidence: 1,
      });
    }
  }
  return next;
}

function makeSuggestions(drafts: DraftSuggestion[], thoughtId: string, now: string): Suggestion[] {
  return drafts.map((d) => ({
    id: makeId('sug'),
    kind: d.kind,
    title: d.title,
    creator: d.creator,
    reason: d.reason,
    query: d.query,
    status: 'new' as SuggestionStatus,
    createdAt: now,
    sourceThoughtId: thoughtId,
  }));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [thoughts, setThoughts] = useState<CapturedThought[]>([]);
  const [items, setItems] = useState<SynthItem[]>([]);
  const [profile, setProfile] = useState<ProfileFact[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<Settings>({ apiKey: null, model: '' });
  const [chatPending, setChatPending] = useState(false);
  const [loadReview, setLoadReview] = useState<LoadReview | null>(null);
  const [reviewPending, setReviewPending] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [t, i, p, s, c, st] = await Promise.all([
        storage.loadThoughts(),
        storage.loadItems(),
        storage.loadProfile(),
        storage.loadSuggestions(),
        storage.loadChat(),
        settingsStore.load(),
      ]);
      if (!alive) return;
      setThoughts(t);
      setItems(i);
      setProfile(p);
      setSuggestions(s);
      setChatLog(c);
      setSettings(st);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persistItems = useCallback((next: SynthItem[]) => {
    setItems(next);
    void storage.saveItems(next);
  }, []);
  const persistProfile = useCallback((next: ProfileFact[]) => {
    setProfile(next);
    void storage.saveProfile(next);
  }, []);
  const persistSuggestions = useCallback((next: Suggestion[]) => {
    setSuggestions(next);
    void storage.saveSuggestions(next);
  }, []);
  const persistChat = useCallback((next: ChatMessage[]) => {
    setChatLog(next);
    void storage.saveChat(next);
  }, []);

  const capture = useCallback(
    async (rawText: string) => {
      const result = await aiCapture(rawText, settings, profile);
      if (result.items.length === 0) return { result, created: [] };

      const now = new Date().toISOString();
      const thought: CapturedThought = { id: makeId('th'), rawText: rawText.trim(), createdAt: now };
      const created: SynthItem[] = result.items.map((d) => ({
        id: makeId('it'),
        thoughtId: thought.id,
        createdAt: now,
        done: d.type === 'todo' ? false : undefined,
        scheduledFor: null,
        ...d,
      }));

      const nextThoughts = [thought, ...thoughts];
      setThoughts(nextThoughts);
      void storage.saveThoughts(nextThoughts);
      persistItems([...created, ...items]);
      if (result.profileUpdates.length) persistProfile(mergeFacts(profile, result.profileUpdates, now));
      if (result.suggestions.length)
        persistSuggestions([...makeSuggestions(result.suggestions, thought.id, now), ...suggestions]);

      return { result, created };
    },
    [settings, profile, thoughts, items, suggestions, persistItems, persistProfile, persistSuggestions],
  );

  const toggleTodo = useCallback(
    (id: string) => persistItems(items.map((it) => (it.id === id ? { ...it, done: !it.done } : it))),
    [items, persistItems],
  );
  const deleteItem = useCallback(
    (id: string) => persistItems(items.filter((it) => it.id !== id)),
    [items, persistItems],
  );
  const scheduleItem = useCallback(
    (id: string, iso: string | null) =>
      persistItems(items.map((it) => (it.id === id ? { ...it, scheduledFor: iso } : it))),
    [items, persistItems],
  );

  const setSuggestionStatus = useCallback(
    (id: string, status: SuggestionStatus) =>
      persistSuggestions(suggestions.map((s) => (s.id === id ? { ...s, status } : s))),
    [suggestions, persistSuggestions],
  );

  const deleteFact = useCallback(
    (id: string) => persistProfile(profile.filter((f) => f.id !== id)),
    [profile, persistProfile],
  );

  const sendChat = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || chatPending) return;
      const now = new Date().toISOString();
      const userMsg: ChatMessage = { id: makeId('msg'), role: 'user', text: clean, createdAt: now };
      const withUser = [...chatLog, userMsg];
      persistChat(withUser);
      setChatPending(true);
      try {
        const { text: replyText } = await aiChat(clean, chatLog, settings, profile, items);
        const reply: ChatMessage = {
          id: makeId('msg'),
          role: 'assistant',
          text: replyText || '…',
          createdAt: new Date().toISOString(),
        };
        persistChat([...withUser, reply]);
      } finally {
        setChatPending(false);
      }
    },
    [chatLog, chatPending, settings, profile, items, persistChat],
  );

  const clearChat = useCallback(() => persistChat([]), [persistChat]);

  const runReview = useCallback(async () => {
    setReviewPending(true);
    try {
      const r = await aiReview(items, settings, profile, new Date().toISOString());
      setLoadReview(r);
      return r;
    } finally {
      setReviewPending(false);
    }
  }, [items, settings, profile]);

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
    setProfile([]);
    setSuggestions([]);
    setChatLog([]);
    setLoadReview(null);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      thoughts,
      items,
      profile,
      suggestions,
      chatLog,
      settings,
      capture,
      toggleTodo,
      deleteItem,
      scheduleItem,
      setSuggestionStatus,
      deleteFact,
      sendChat,
      chatPending,
      clearChat,
      runReview,
      loadReview,
      reviewPending,
      setApiKey,
      setModel,
      clearAll,
    }),
    [
      ready, thoughts, items, profile, suggestions, chatLog, settings, capture, toggleTodo,
      deleteItem, scheduleItem, setSuggestionStatus, deleteFact, sendChat, chatPending, clearChat,
      runReview, loadReview, reviewPending, setApiKey, setModel, clearAll,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
