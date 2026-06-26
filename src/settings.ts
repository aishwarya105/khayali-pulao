import { Platform } from 'react-native';

import { Settings } from './types';

// API keys are sensitive, so on native we use expo-secure-store (Keychain /
// Keystore). expo-secure-store is unavailable on web, so we fall back to
// localStorage there. Non-secret settings (model) live in AsyncStorage-like
// storage via the same secure layer for simplicity.

export const DEFAULT_MODEL = 'claude-sonnet-4-6';

const API_KEY = 'kp_api_key';
const MODEL_KEY = 'kp_model';

type SecureLike = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

function webStore(): SecureLike {
  return {
    async getItemAsync(key) {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    async setItemAsync(key, value) {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        /* ignore */
      }
    },
    async deleteItemAsync(key) {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

function nativeStore(): SecureLike {
  // Lazy require so web bundles don't pull in the native module.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SecureStore = require('expo-secure-store');
  return {
    getItemAsync: SecureStore.getItemAsync,
    setItemAsync: SecureStore.setItemAsync,
    deleteItemAsync: SecureStore.deleteItemAsync,
  };
}

const store: SecureLike = Platform.OS === 'web' ? webStore() : nativeStore();

export const settingsStore = {
  async load(): Promise<Settings> {
    const [apiKey, model] = await Promise.all([
      store.getItemAsync(API_KEY),
      store.getItemAsync(MODEL_KEY),
    ]);
    return { apiKey: apiKey || null, model: model || DEFAULT_MODEL };
  },

  async setApiKey(key: string | null): Promise<void> {
    if (key && key.trim()) {
      await store.setItemAsync(API_KEY, key.trim());
    } else {
      await store.deleteItemAsync(API_KEY);
    }
  },

  async setModel(model: string): Promise<void> {
    await store.setItemAsync(MODEL_KEY, model || DEFAULT_MODEL);
  },
};
